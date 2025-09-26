use serde::{Deserialize, Serialize};
use crate::games::minesweeper::models::board::Board;

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct MinesweeperState {
    pub board: Board,
}
