use crate::games::go::constants::adjacent_positions::ADJACENT_POSITIONS;
use crate::games::go::models::board::Board;
use crate::games::go::models::color::StoneColor;
use crate::games::go::models::creation_data::CreationData;
use crate::games::go::models::game_mode::Mode;
use crate::games::go::utils::get_opposite_color::get_opposite_color;
use crate::utils::coords::Coords;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Score {
    white_territory: Vec<Coords>,
    white_captured: u32,
    white_dead_stones: Vec<Coords>,
    black_territory: Vec<Coords>,
    black_captured: u32,
    black_dead_stones: Vec<Coords>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub enum WinningReason {
    Resignation,
    Score,
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
    mode: Mode,
    won: Option<StoneColor>,
    winning_reason: Option<WinningReason>,
    black_approved_score: bool,
    white_approved_score: bool,
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
            mode: Mode::Playing,
            won: None,
            winning_reason: None,
            black_approved_score: false,
            white_approved_score: false,
            score: Score {
                white_territory: vec![],
                white_captured: 0,
                white_dead_stones: vec![],
                black_territory: vec![],
                black_captured: 0,
                black_dead_stones: vec![],
            },
        }
    }

    pub fn creator_color(&self) -> StoneColor {
        self.creator_color
    }

    pub fn try_place_stone(&mut self, player_color: StoneColor, coords: Coords) -> Result<(), ()> {
        if self.mode != Mode::Playing {
            return Err(());
        } else if coords.0 >= self.board.size() || coords.1 >= self.board.size() {
            return Err(());
        } else if player_color != self.current_turn {
            return Err(());
        } else if let Some(_stone) = self.board.get_stone(coords) {
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
        if self.mode != Mode::Playing {
            return Err(());
        } else if player_color != self.current_turn {
            return Err(());
        }

        if self.last_move_was_pass {
            self.mode = Mode::Scoring;
            self.calculate_territories();
        }

        self.last_move_was_pass = true;
        self.change_turn();

        Ok(())
    }

    pub fn try_cancel_scoring_mode(&mut self) -> Result<(), ()> {
        if self.mode != Mode::Scoring {
            return Err(());
        }

        self.mode = Mode::Playing;
        self.black_approved_score = false;
        self.white_approved_score = false;

        Ok(())
    }

    pub fn resign(&mut self, player_color: StoneColor) {
        self.won = Some(get_opposite_color(player_color));
        self.winning_reason = Some(WinningReason::Resignation);
    }

    pub fn try_toggle_eaten(&mut self, coords: Coords) -> Result<(), ()> {
        if self.mode != Mode::Scoring {
            return Err(());
        }

        if let Some((group, _, color)) = self.board.get_group(coords) {
            let dead_stones = if color == StoneColor::Black {
                &mut self.score.black_dead_stones
            } else {
                &mut self.score.white_dead_stones
            };

            if dead_stones.contains(&group[0]) {
                dead_stones.retain(|c| !group.contains(c));
            } else {
                dead_stones.extend(group);
            }

            self.calculate_territories();
            self.white_approved_score = false;
            self.black_approved_score = false;

            return Ok(());
        }

        Err(())
    }

    pub fn try_approve_score(&mut self, player_color: StoneColor) -> Result<bool, ()> {
        if self.mode != Mode::Scoring {
            return Err(());
        }
        if player_color == StoneColor::Black && self.black_approved_score {
            return Err(());
        } else if player_color == StoneColor::White && self.white_approved_score {
            return Err(());
        }

        if player_color == StoneColor::Black {
            self.black_approved_score = true;
        } else {
            self.white_approved_score = true;
        }

        if self.black_approved_score && self.white_approved_score {
            self.winning_reason = Some(WinningReason::Score);

            let black_total_score = self.calculate_score(StoneColor::Black) as f64;
            let white_total_score = 6.5 + self.calculate_score(StoneColor::White) as f64;

            if black_total_score > white_total_score {
                self.won = Some(StoneColor::Black);
            } else {
                self.won = Some(StoneColor::White);
            }
        }

        Ok(self.winning_reason.is_some())
    }

    fn calculate_score(&self, color: StoneColor) -> u32 {
        let mut result = 0;

        if color == StoneColor::Black {
            result += self.score.white_captured;
            result += self.score.black_territory.len() as u32;
            result += self.score.white_dead_stones.len() as u32;
        } else {
            result += self.score.black_captured;
            result += self.score.white_territory.len() as u32;
            result += self.score.black_dead_stones.len() as u32;
        }

        result
    }

    fn calculate_territories(&mut self) {
        let mut seen_territory = vec![];
        let mut black_territory = HashSet::new();
        let mut white_territory = HashSet::new();

        for row_i in 0..self.board.size() {
            for col_i in 0..self.board[row_i].len() {
                let coords = Coords(row_i, col_i);

                if seen_territory.contains(&coords) {
                    continue;
                }

                let mut all_dead_stones = self.score.black_dead_stones.clone();
                all_dead_stones.extend(self.score.white_dead_stones.clone());

                if let Some((territory, color_opt)) =
                    self.board.get_territory(coords, all_dead_stones)
                {
                    seen_territory.extend(&territory);

                    if let Some(color) = color_opt {
                        if color == StoneColor::Black {
                            black_territory.extend(territory);
                        } else {
                            white_territory.extend(territory);
                        }
                    }
                }
            }
        }

        self.score.white_territory = white_territory.into_iter().collect();
        self.score.black_territory = black_territory.into_iter().collect();
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

        let mut unique_stones_coords = HashSet::new();

        enemy_dead_groups.iter().for_each(|group| {
            group.0.iter().for_each(|coords| {
                unique_stones_coords.insert(coords);
                self.board.remove_stone(*coords);
            });
        });

        let stones_captured = unique_stones_coords.len() as u32;
        if player_color == StoneColor::Black {
            self.score.white_captured += stones_captured;
        } else {
            self.score.black_captured += stones_captured;
        }

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
