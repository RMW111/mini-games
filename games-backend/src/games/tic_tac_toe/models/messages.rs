use crate::utils::coords::Coords;
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Debug)]
#[serde(tag = "type", content = "payload", rename_all = "camelCase")]
pub enum TicTacToeClientMessage {
    MakeMove(Coords),
}

#[derive(Serialize, Debug, Clone)]
#[serde(tag = "type", content = "payload", rename_all = "camelCase")]
pub enum TicTacToeServerMessage {}
