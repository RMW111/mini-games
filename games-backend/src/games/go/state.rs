use crate::games::go::constants::adjacent_positions::ADJACENT_POSITIONS;
use crate::games::go::models::board::Board;
use crate::games::go::models::color::StoneColor;
use crate::games::go::models::creation_data::CreationData;
use crate::games::go::utils::get_opposite_color::get_opposite_color;
use crate::utils::coords::Coords;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Score {
    white_captured: u32,
    black_captured: u32,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct GoState {
    creator_color: StoneColor,
    current_turn: StoneColor,
    board: Board,
    last_move_was_pass: bool,
    ko: Option<Coords>,
    last_stone_placed: Option<Coords>,
    score: Score,
}

impl GoState {
    pub fn new(data: CreationData) -> Self {
        Self {
            creator_color: data.color,
            current_turn: StoneColor::Black,
            board: Board::new(data.board_size as usize),
            last_move_was_pass: false,
            ko: None,
            last_stone_placed: None,
            score: Score {
                white_captured: 0,
                black_captured: 0,
            },
        }
    }

    pub fn creator_color(&self) -> StoneColor {
        self.creator_color
    }

    pub fn try_place_stone(&mut self, player_color: StoneColor, coords: Coords) -> Result<(), ()> {
        if coords.0 >= self.board.size() || coords.1 >= self.board.size() {
            return Err(());
        }
        if player_color != self.current_turn {
            return Err(());
        }
        if let Some(_stone) = self.board.get_stone(coords) {
            return Err(());
        }

        let result = self.place_stone(player_color, coords);
        if let Ok(_) = result {
            self.last_stone_placed = Some(coords);
            self.last_move_was_pass = false;
            self.change_turn();
        }

        result
    }

    pub fn try_pass(&mut self, player_color: StoneColor) -> Result<(), ()> {
        if player_color != self.current_turn {
            return Err(());
        }

        self.last_move_was_pass = true;
        self.change_turn();

        Ok(())
    }

    fn place_stone(&mut self, player_color: StoneColor, coords: Coords) -> Result<(), ()> {
        self.board.place_stone(player_color, coords);
        let (_group, has_liberty, _) = self.board.get_group(coords).unwrap();

        let enemy_dead_groups: Vec<_> = ADJACENT_POSITIONS
            .iter()
            .filter_map(|(offset_row, offset_col)| {
                let row = coords.0.checked_add_signed(*offset_row)?;
                let col = coords.1.checked_add_signed(*offset_col)?;
                self.board.get_group(Coords(row, col))
            })
            .filter(|(_group, has_liberty, color)| *color != player_color && !has_liberty)
            .collect();

        enemy_dead_groups.iter().for_each(|group| {
            group.0.iter().for_each(|coords| {
                self.board.remove_stone(*coords);
            });

            let stones_captured = group.0.len() as u32;
            if player_color == StoneColor::Black {
                self.score.white_captured += stones_captured;
            } else {
                self.score.black_captured += stones_captured;
            }
        });

        let first_dead_group_opt = enemy_dead_groups.get(0).map(|(group, _, _)| group);

        let mut cancel_placement = || {
            self.board.remove_stone(coords);
            return Err(());
        };

        if let Some(ko) = self.ko {
            if enemy_dead_groups.len() == 1 {
                let first_dead_group = first_dead_group_opt.unwrap();
                if coords == ko && first_dead_group.len() == 1 {
                    return cancel_placement();
                }
            }
        }

        self.ko = None;
        if enemy_dead_groups.len() == 1 {
            let first_dead_group = first_dead_group_opt.unwrap();
            if first_dead_group.len() == 1 {
                self.ko = Some(first_dead_group[0]);
            }
        }

        if has_liberty {
            return Ok(());
        }

        if enemy_dead_groups.is_empty() {
            cancel_placement()
        } else {
            Ok(())
        }
    }

    fn change_turn(&mut self) {
        self.current_turn = get_opposite_color(self.current_turn);
    }
}
