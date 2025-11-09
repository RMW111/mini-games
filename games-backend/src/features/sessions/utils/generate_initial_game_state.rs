use crate::games::go::utils::create_initial_state::create_initial_state as create_initial_go_state;
use crate::games::minesweeper::utils::create_initial_state::create_initial_state as create_initial_minesweeper_state;
use crate::models::app_error::AppError;
use crate::models::game_slug::GameSlug;
use serde_json::Value;
use sqlx::types::JsonValue;

pub fn generate_initial_game_state(
    slug: &GameSlug,
    creation_data: Option<Value>,
) -> Result<JsonValue, AppError> {
    match slug {
        GameSlug::Minesweeper => {
            let state = create_initial_minesweeper_state();
            Ok(serde_json::to_value(state).unwrap())
        }
        GameSlug::Go => {
            let state = create_initial_go_state(creation_data)?;
            Ok(serde_json::to_value(state).unwrap())
        }
    }
}
