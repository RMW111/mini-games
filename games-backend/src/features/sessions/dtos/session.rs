use serde::Serialize;
use uuid::Uuid;
use serde_json::Value;
use crate::features::sessions::dtos::participant::ParticipantDTO;
use crate::models::session::SessionStatus;

#[derive(Serialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SessionDTO {
    pub id: Uuid,
    pub status: SessionStatus,
    pub game_state: Value,
    pub participants: Vec<ParticipantDTO>,
}
