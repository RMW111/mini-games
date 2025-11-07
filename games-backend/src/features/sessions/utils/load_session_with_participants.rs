use crate::features::sessions::dtos::participant::ParticipantDTO;
use crate::models::session::Session;
use sqlx::PgPool;
use uuid::Uuid;

pub async fn load_session_with_participants(
    pool: &PgPool,
    session_id: Uuid,
) -> Result<(Session, Vec<ParticipantDTO>), sqlx::Error> {
    let session = sqlx::query_as!(
        Session,
        r#"SELECT id, game_id, status as "status: _", game_state, created_at FROM game_sessions WHERE id = $1"#,
        session_id
    )
        .fetch_one(pool)
        .await?;

    let participants = sqlx::query_as!(
        ParticipantDTO,
        r#"
        SELECT p.user_id, u.email, p.role as "role: _"
        FROM session_participants p
        JOIN users u ON p.user_id = u.id
        WHERE p.session_id = $1 ORDER BY p.joined_at
        "#,
        session_id
    )
    .fetch_all(pool)
    .await?;

    Ok((session, participants))
}
