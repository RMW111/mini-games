use crate::features::games::dtos::game::GameDTO;
use axum::Json;
use axum::response::IntoResponse;
use crate::app_state::DatabaseConnection;
use crate::models::app_error::AppError;

pub async fn get_games_list(DatabaseConnection(pool): DatabaseConnection) -> Result<impl IntoResponse, AppError> {
    let games = sqlx::query_as!(
        GameDTO,
        "SELECT id, slug, name, description FROM games ORDER BY name"
    )
    .fetch_all(&pool)
    .await?;

    Ok(Json(games))
}
