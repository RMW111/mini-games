use crate::models::app_error::AppError;
use sqlx::types::JsonValue;
use crate::games::minesweeper::utils::create_initial_state::create_initial_state;

pub fn generate_initial_game_state(slug: &str) -> Result<JsonValue, AppError> {
    match slug {
        "minesweeper" => {
            let initial_board = create_initial_state();
            Ok(serde_json::to_value(initial_board).unwrap())
        },
        _ => Err(AppError::Internal(format!(
            "No initial state generator found for game '{slug}'"
        ))),
    }
}
