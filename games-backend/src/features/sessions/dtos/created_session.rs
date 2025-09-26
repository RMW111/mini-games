use serde::Serialize;
use uuid::Uuid;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatedSessionDTO {
    pub session_id: Uuid,
}
