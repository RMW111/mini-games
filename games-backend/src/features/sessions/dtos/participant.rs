use serde::{Deserialize, Serialize};
use uuid::Uuid;
use crate::models::participant::ParticipantRole;

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ParticipantDTO {
    pub user_id: Uuid,
    pub email: String,
    pub role: ParticipantRole,
}
