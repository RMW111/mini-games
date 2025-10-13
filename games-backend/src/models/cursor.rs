use crate::models::position::Position;
use serde::Serialize;
use uuid::Uuid;

#[derive(Serialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct MovePayload {
    pub user_id: Uuid,
    pub pos: Position,
}
