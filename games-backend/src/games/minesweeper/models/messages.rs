use crate::models::grid_position::GridPosition;
use serde::Deserialize;

#[derive(Deserialize, Debug)]
#[serde(tag = "type", content = "payload", rename_all = "camelCase")]
pub enum MinesweeperClientMessage {
    CellClick(GridPosition),
    NumClick(GridPosition),
    CellFlag(GridPosition),
}
