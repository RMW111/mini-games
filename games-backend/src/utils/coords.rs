use crate::models::grid_position::GridPosition;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Copy, Clone, PartialEq, Eq, Debug, Hash)]
pub struct Coords(pub usize, pub usize);

impl From<GridPosition> for Coords {
    fn from(value: GridPosition) -> Self {
        Self(value.row, value.col)
    }
}

impl From<Coords> for GridPosition {
    fn from(value: Coords) -> Self {
        Self {
            row: value.0,
            col: value.1,
        }
    }
}
