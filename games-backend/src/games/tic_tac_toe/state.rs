use crate::games::tic_tac_toe::models::cell::CellValue;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct TicTacToeState {
    pub board: [[CellValue; 3]; 3],
    pub current_turn: CellValue,
    pub winner: Option<CellValue>,
    pub is_draw: bool,
}

impl TicTacToeState {
    pub fn new() -> Self {
        Self {
            board: [[CellValue::Empty; 3]; 3],
            current_turn: CellValue::X,
            winner: None,
            is_draw: false,
        }
    }

    pub fn is_game_over(&self) -> bool {
        self.winner.is_some() || self.is_draw
    }

    pub fn try_make_move(&mut self, mark: CellValue, row: usize, col: usize) -> Result<(), ()> {
        if self.is_game_over() {
            return Err(());
        }
        if self.current_turn != mark {
            return Err(());
        }
        if row >= 3 || col >= 3 {
            return Err(());
        }
        if self.board[row][col] != CellValue::Empty {
            return Err(());
        }

        self.board[row][col] = mark;

        if let Some(winner) = self.check_winner() {
            self.winner = Some(winner);
        } else if self.check_draw() {
            self.is_draw = true;
        } else {
            self.current_turn = match mark {
                CellValue::X => CellValue::O,
                CellValue::O => CellValue::X,
                CellValue::Empty => return Err(()),
            };
        }

        Ok(())
    }

    fn check_winner(&self) -> Option<CellValue> {
        let b = &self.board;

        for row in b.iter() {
            if row[0] != CellValue::Empty && row[0] == row[1] && row[1] == row[2] {
                return Some(row[0]);
            }
        }

        for col in 0..3 {
            if b[0][col] != CellValue::Empty && b[0][col] == b[1][col] && b[1][col] == b[2][col] {
                return Some(b[0][col]);
            }
        }

        if b[0][0] != CellValue::Empty && b[0][0] == b[1][1] && b[1][1] == b[2][2] {
            return Some(b[0][0]);
        }
        if b[0][2] != CellValue::Empty && b[0][2] == b[1][1] && b[1][1] == b[2][0] {
            return Some(b[0][2]);
        }

        None
    }

    fn check_draw(&self) -> bool {
        self.board
            .iter()
            .all(|row| row.iter().all(|cell| *cell != CellValue::Empty))
    }
}
