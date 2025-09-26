use uuid::Uuid;
use serde::Serialize;
use sqlx::FromRow;

#[derive(Serialize, FromRow)]
pub struct GameDTO {
    pub id: Uuid,
    pub slug: String,
    pub name: String,
    pub description: Option<String>,
}
