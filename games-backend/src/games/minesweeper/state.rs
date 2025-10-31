use crate::games::minesweeper::models::board::Board;
use crate::games::minesweeper::models::stats::MinesweeperStats;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct MinesweeperState {
    pub board: Board,
    pub stats: MinesweeperStats,
}
