use serde::Serialize;
use crate::features::sessions::dtos::participant::ParticipantDTO;
use crate::features::sessions::dtos::session::SessionDTO;
use crate::models::session::SessionStatus;

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
pub enum ServerMessage {
    Session(SessionMessage),
    // Game(GameMessage),
}
