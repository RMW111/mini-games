use crate::models::game_slug::GameSlug;
use serde::Deserialize;
use serde_json::Value;
use validator::Validate;

#[derive(Deserialize, Validate)]
#[serde(rename_all = "camelCase")]
pub struct CreateSessionDTO {
    pub slug: GameSlug,
    pub creation_data: Option<Value>,
}
