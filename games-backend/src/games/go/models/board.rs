use crate::games::go::constants::adjacent_positions::ADJACENT_POSITIONS;
use crate::games::go::models::color::StoneColor;
use crate::utils::coords::Coords;
use serde::{Deserialize, Serialize};
use std::ops::Index;

#[derive(Debug, Serialize, Deserialize)]
pub struct Board(Vec<Vec<u8>>);

pub const EMPTY_SPOT: u8 = 0;

impl Index<usize> for Board {
    type Output = Vec<u8>;

    fn index(&self, index: usize) -> &Self::Output {
        &self.0[index]
    }
}

impl Board {
    pub fn new(size: usize) -> Self {
        Self(vec![vec![0; size]; size])
    }

    pub fn size(&self) -> usize {
        self.0.len()
    }

    pub fn place_stone(&mut self, color: StoneColor, coords: Coords) {
        self.0[coords.0][coords.1] = color as u8;
    }

    pub fn remove_stone(&mut self, coords: Coords) {
        self.0[coords.0][coords.1] = 0;
    }

    pub fn get_stone(&self, pos: Coords) -> Option<StoneColor> {
        self.0
            .get(pos.0)
            .and_then(|row| row.get(pos.1))
            .and_then(|&stone| {
                if stone == EMPTY_SPOT {
                    None
                } else {
                    StoneColor::try_from(stone).ok()
                }
            })
    }

    pub fn get_group(&self, coords: Coords) -> Option<(Vec<Coords>, bool, StoneColor)> {
        if let Some(group_color) = self.get_stone(coords) {
            let mut group = vec![];
            let mut coords_to_check = vec![coords];
            let mut has_liberty = false;

            while !coords_to_check.is_empty() {
                let coords = coords_to_check.pop().unwrap();

                if coords.0 >= self.size() || coords.1 >= self.size() {
                    continue;
                }

                if let Some(stone_color) = self.get_stone(coords) {
                    if stone_color == group_color {
                        group.push(coords);

                        for (offset_row, offset_col) in ADJACENT_POSITIONS {
                            let row_i_opt = coords.0.checked_add_signed(offset_row);
                            let col_i_opt = coords.1.checked_add_signed(offset_col);

                            if let (Some(row_i), Some(col_i)) = (row_i_opt, col_i_opt) {
                                let to_check = Coords(row_i, col_i);
                                if !group.contains(&to_check) {
                                    coords_to_check.push(to_check);
                                }
                            }
                        }
                    }
                } else {
                    has_liberty = true;
                }
            }

            return Some((group, has_liberty, group_color));
        }

        None
    }

    pub fn get_territory(
        &self,
        coords: Coords,
        dead_stones: Vec<Coords>,
    ) -> Option<(Vec<Coords>, Option<StoneColor>)> {
        if let None = self.get_stone(coords) {
            let mut territory = vec![];
            let mut coords_to_check = vec![coords];
            let mut black_stones_around: usize = 0;
            let mut white_stones_around: usize = 0;

            while !coords_to_check.is_empty() {
                let coords = coords_to_check.pop().unwrap();

                if coords.0 >= self.size() || coords.1 >= self.size() {
                    continue;
                }

                let dead_stone = dead_stones.contains(&coords);

                if let (Some(stone_color), false) = (self.get_stone(coords), dead_stone) {
                    if stone_color == StoneColor::Black {
                        black_stones_around += 1;
                    } else {
                        white_stones_around += 1;
                    }
                } else {
                    territory.push(coords);

                    for (offset_row, offset_col) in ADJACENT_POSITIONS {
                        let row_i_opt = coords.0.checked_add_signed(offset_row);
                        let col_i_opt = coords.1.checked_add_signed(offset_col);

                        if let (Some(row_i), Some(col_i)) = (row_i_opt, col_i_opt) {
                            let to_check = Coords(row_i, col_i);
                            if !territory.contains(&to_check) {
                                coords_to_check.push(to_check);
                            }
                        }
                    }
                }
            }

            let mut who_owns_territory = None;
            if black_stones_around == 0 && white_stones_around > 0 {
                who_owns_territory = Some(StoneColor::White);
            } else if white_stones_around == 0 && black_stones_around > 0 {
                who_owns_territory = Some(StoneColor::Black);
            }

            return Some((territory, who_owns_territory));
        }

        None
    }
}
