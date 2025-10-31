use crate::games::minesweeper::models::cell_state::CellState;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Serialize, Deserialize, Clone, Debug, Copy)]
#[serde(rename_all = "camelCase")]
pub struct Cell {
    pub state: CellState,
    pub has_mine: bool,
    pub mines_around: u8,
    pub flagged_by: Option<Uuid>,
}

impl Default for Cell {
    fn default() -> Self {
        Self {
            state: CellState::Closed,
            mines_around: 0,
            has_mine: false,
            flagged_by: None,
        }
    }
}

impl Cell {
    pub fn toggle_flagged(&mut self, user_id: Uuid) {
        match self.state {
            CellState::Closed => {
                self.state = CellState::Flagged;
                self.flagged_by = Some(user_id);
            }
            CellState::Flagged => {
                if let Some(flagged_by) = self.flagged_by {
                    if user_id == flagged_by {
                        self.state = CellState::Closed;
                        self.flagged_by = None;
                    }
                }
            }
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
