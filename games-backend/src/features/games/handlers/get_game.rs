use crate::features::games::dtos::game::GameDTO;
use axum::Json;
use axum::extract::{Path};
use axum::response::IntoResponse;
use crate::app_state::DatabaseConnection;
use crate::models::app_error::AppError;

pub async fn get_game(
    DatabaseConnection(pool): DatabaseConnection,
    Path(slug): Path<String>,
) -> Result<impl IntoResponse, AppError> {
    let game = sqlx::query_as!(
        GameDTO,
        "SELECT id, slug, name, description FROM games WHERE slug = $1",
        slug
    )
    .fetch_one(&pool)
    .await?;

    Ok(Json(game))
}
