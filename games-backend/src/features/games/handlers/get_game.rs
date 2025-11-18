use crate::app_state::DatabaseConnection;
use crate::features::games::dtos::game::GameDTO;
use crate::models::app_error::AppError;
use axum::Json;
use axum::extract::Path;
use axum::response::IntoResponse;

pub async fn get_game(
    DatabaseConnection(pool): DatabaseConnection,
    Path(slug): Path<String>,
) -> Result<impl IntoResponse, AppError> {
    let game = sqlx::query_as!(
        GameDTO,
        "SELECT id, slug, name, description, max_players FROM games WHERE slug = $1",
        slug
    )
    .fetch_one(&pool)
    .await?;

    Ok(Json(game))
}
