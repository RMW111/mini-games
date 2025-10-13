use serde::Deserialize;
use crate::games::minesweeper::models::messages::MinesweeperClientMessage;
use crate::models::position::Position;

#[derive(Deserialize, Debug)]
#[serde(tag = "type", content = "payload", rename_all = "camelCase")]
pub enum GameClientMessage {
    Minesweeper(MinesweeperClientMessage),
}

#[derive(Deserialize, Debug)]
#[serde(tag = "type", content = "payload", rename_all = "camelCase")]
pub enum CursorClientMessage {
    Move(Position),
}

#[derive(Deserialize, Debug)]
#[serde(tag = "type", content = "payload", rename_all = "camelCase")]
pub enum ClientMessage {
    Game(GameClientMessage),
    Cursor(CursorClientMessage),
}
