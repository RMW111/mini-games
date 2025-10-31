use serde::Deserialize;

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CellPosition {
    pub row: usize,
    pub col: usize,
}

#[derive(Deserialize, Debug)]
#[serde(tag = "type", content = "payload", rename_all = "camelCase")]
pub enum MinesweeperClientMessage {
    CellClick(CellPosition),
    NumClick(CellPosition),
    CellFlag(CellPosition),
}
