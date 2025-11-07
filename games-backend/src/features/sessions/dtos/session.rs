use crate::features::sessions::dtos::participant::ParticipantDTO;
use crate::models::session::SessionStatus;
use chrono::{DateTime, Utc};
use serde::Serialize;
use serde_json::Value;
use uuid::Uuid;

#[derive(Serialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SessionDTO {
    pub id: Uuid,
    pub status: SessionStatus,
    pub game_state: Value,
    pub participants: Vec<ParticipantDTO>,
    pub created_at: DateTime<Utc>,
}
