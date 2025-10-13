use crate::features::sessions::dtos::participant::ParticipantDTO;
use crate::features::sessions::dtos::session::SessionDTO;
use crate::models::cursor::MovePayload;
use crate::models::session::SessionStatus;
use serde::Serialize;

#[derive(Serialize, Debug, Clone)]
#[serde(tag = "type", content = "payload", rename_all = "camelCase")]
pub enum SessionMessage {
    FullSessionState(SessionDTO),
    GameStateUpdate(serde_json::Value),
    StatusUpdate(SessionStatus),
    UserJoined { participant: ParticipantDTO },
    // Error { message: String },
}

// #[derive(Serialize, Debug, Clone)]
// #[serde(tag = "game", content = "payload", rename_all = "camelCase")]
// pub enum GameMessage {
//     Minesweeper(MinesweeperMessage),
//     // Chess(ChessMessage),
// }

#[derive(Serialize, Debug, Clone)]
#[serde(tag = "type", content = "payload", rename_all = "camelCase")]
pub enum CursorMessage {
    Move(MovePayload),
}

#[derive(Serialize, Debug, Clone)]
#[serde(tag = "type", content = "payload", rename_all = "camelCase")]
pub enum ServerMessage {
    Session(SessionMessage),
    Cursor(CursorMessage),
    // Game(GameMessage),
}
