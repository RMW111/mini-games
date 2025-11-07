use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::{FromRow, Type};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Type, PartialEq, Eq, Clone, Copy)]
#[sqlx(type_name = "session_status", rename_all = "snake_case")]
#[serde(rename_all = "camelCase")]
pub enum SessionStatus {
    Pending,
    InProgress,
    Completed,
}

#[derive(Debug, FromRow, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Session {
    pub id: Uuid,
    pub game_id: Uuid,
    pub status: SessionStatus,
    pub game_state: Value,
    pub created_at: DateTime<Utc>,
}
