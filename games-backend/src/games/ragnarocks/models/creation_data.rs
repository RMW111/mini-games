use crate::games::ragnarocks::models::color::PlayerColor;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Copy, Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum BoardSize {
    Small,
    Large,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CreationData {
    pub board_size: BoardSize,
    pub color: PlayerColor,
    #[serde(default)]
    pub vs_ai: bool,
}
