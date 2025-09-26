use serde::{Deserialize, Serialize};
use sqlx::Type;

#[derive(Debug, Serialize, Deserialize, Type, PartialEq, Eq, Clone, Copy)]
#[sqlx(type_name = "participant_role", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum ParticipantRole {
    Creator,
    Player,
    Spectator,
}
