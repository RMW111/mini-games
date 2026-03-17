use crate::games::go::models::messages::GoClientMessage;
use crate::games::minesweeper::models::messages::MinesweeperClientMessage;
use crate::games::tic_tac_toe::models::messages::TicTacToeClientMessage;
use crate::models::position::Position;
use serde::Deserialize;

#[derive(Deserialize, Debug)]
#[serde(tag = "type", content = "payload", rename_all = "camelCase")]
pub enum GameClientMessage {
    Minesweeper(MinesweeperClientMessage),
    Go(GoClientMessage),
    TicTacToe(TicTacToeClientMessage),
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
