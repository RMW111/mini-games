use serde::Deserialize;
use crate::games::minesweeper::models::messages::MinesweeperClientMessage;

#[derive(Deserialize, Debug)]
#[serde(tag = "type", content = "payload", rename_all = "camelCase")]
pub enum GameClientMessage {
    Minesweeper(MinesweeperClientMessage),
}

#[derive(Deserialize, Debug)]
#[serde(tag = "type", content = "payload", rename_all = "camelCase")]
pub enum ClientMessage {
    Game(GameClientMessage),
}
