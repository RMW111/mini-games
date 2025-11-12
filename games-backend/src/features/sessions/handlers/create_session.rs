use crate::app_state::DatabaseConnection;
use crate::features::sessions::dtos::create_session::CreateSessionDTO;
use crate::features::sessions::dtos::created_session::CreatedSessionDTO;
use crate::features::sessions::utils::generate_initial_game_state::generate_initial_game_state;
use crate::models::app_error::AppError;
use crate::models::user::User;
use crate::models::validated_json::ValidatedJson;
use axum::Json;
use axum::http::StatusCode;
use axum::response::IntoResponse;

pub async fn create_session(
    DatabaseConnection(pool): DatabaseConnection,
    user: User,
    ValidatedJson(payload): ValidatedJson<CreateSessionDTO>,
) -> Result<impl IntoResponse, AppError> {
    let game_id = sqlx::query_scalar!(
        "SELECT id FROM games WHERE slug = $1",
        payload.slug.to_string()
    )
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Game with slug '{}' not found", payload.slug)))?;

    let mut tx = pool.begin().await?;

    let initial_state = generate_initial_game_state(&payload.slug, payload.creation_data)?;

    let session_id = sqlx::query_scalar!(
        r#"
        INSERT INTO game_sessions (game_id, game_state, status)
        VALUES ($1, $2, 'in_progress')
        RETURNING id
        "#,
        game_id,
        initial_state,
    )
    .fetch_one(&mut *tx)
    .await
    .expect("Failed to get session ID after insert");

    sqlx::query!(
        r#"
        INSERT INTO session_participants (session_id, user_id, role)
        VALUES ($1, $2, 'creator')
        "#,
        session_id,
        user.id,
    )
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;

    let response_body = CreatedSessionDTO { session_id };
    Ok((StatusCode::CREATED, Json(response_body)))
}
