use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use serde_json::json;
use sqlx::PgPool;
use thiserror::Error;
use uuid::Uuid;

#[derive(Debug, Error)]
pub enum JoinSessionError {
    #[error("The session is full.")]
    SessionFull,

    #[error("The session was not found.")]
    SessionNotFound,

    #[error("A database error occurred.")]
    DatabaseError(#[from] sqlx::Error),
}

impl IntoResponse for JoinSessionError {
    fn into_response(self) -> Response {
        let (status, error_message) = match self {
            JoinSessionError::SessionFull => (StatusCode::CONFLICT, self.to_string()),
            JoinSessionError::SessionNotFound => (StatusCode::NOT_FOUND, self.to_string()),
            JoinSessionError::DatabaseError(_) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "An unexpected database error occurred".to_string(),
            ),
        };

        let body = axum::Json(json!({ "error": error_message }));
        (status, body).into_response()
    }
}

type UserJoined = bool;

pub async fn try_join_session_db(
    pool: &PgPool,
    session_id: Uuid,
    user_id: Uuid,
) -> Result<UserJoined, JoinSessionError> {
    let mut tx = pool.begin().await?;

    let session_info = sqlx::query!(
        r#"
        SELECT
            g.max_players,
            (
                SELECT COUNT(*)
                FROM session_participants sp
                WHERE sp.session_id = gs.id AND sp.role IN ('creator', 'player')
            ) as "current_players_count!"
        FROM game_sessions gs
        JOIN games g ON gs.game_id = g.id
        WHERE gs.id = $1
        "#,
        session_id
    )
    .fetch_optional(&mut *tx)
    .await?;

    let session_info = session_info.ok_or(JoinSessionError::SessionNotFound)?;

    let result = sqlx::query!(
        r#"
        INSERT INTO session_participants (session_id, user_id, role)
        VALUES ($1, $2, 'player')
        ON CONFLICT (session_id, user_id) DO NOTHING
        "#,
        session_id,
        user_id
    )
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;

    let user_joined = result.rows_affected() > 0;

    if let Some(max_players) = session_info.max_players {
        let current_players = session_info.current_players_count as i32;
        if user_joined && current_players >= max_players {
            return Err(JoinSessionError::SessionFull);
        }
    }

    Ok(user_joined)
}
