use serde::{Deserialize, Serialize};
use crate::games::minesweeper::models::cell_state::CellState;

#[derive(Serialize, Deserialize, Clone, Debug, Copy)]
#[serde(rename_all = "camelCase")]
pub struct Cell {
    pub state: CellState,
    pub has_mine: bool,
    pub mines_around: u8,
}

impl Default for Cell {
    fn default() -> Self {
        Self {
            state: CellState::Closed,
            mines_around: 0,
            has_mine: false,
        }
    }
}

impl Cell {
    pub fn toggle_flagged(&mut self) {
        match self.state {
            CellState::Closed => self.state = CellState::Flagged,
            CellState::Flagged => self.state = CellState::Closed,
            _ => {}
        }
    }

    pub fn open_cell(&mut self) {
        self.state = if self.has_mine {
            CellState::Exploded
        } else {
            CellState::Opened
        };
    }
}
