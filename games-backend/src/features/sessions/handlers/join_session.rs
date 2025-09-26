use crate::app_state::{DatabaseConnection, WsConnections};
use crate::models::app_error::AppError;
use crate::models::user::User;
use axum::extract::Path;
use axum::http::StatusCode;
use axum::response::IntoResponse;
use uuid::Uuid;
use crate::features::sessions::dtos::participant::ParticipantDTO;
use crate::features::sessions::models::ws_messages::{ServerMessage, SessionMessage};
use crate::features::sessions::utils::broadcast_to_session::broadcast_to_session;
use crate::models::participant::ParticipantRole;

pub async fn join_session(
    DatabaseConnection(pool): DatabaseConnection,
    WsConnections(connections): WsConnections,
    user: User,
    Path(session_id): Path<Uuid>,
) -> Result<impl IntoResponse, AppError> {
    let result = sqlx::query!(
        r#"
        INSERT INTO session_participants (session_id, user_id, role)
        VALUES ($1, $2, 'player')
        ON CONFLICT (session_id, user_id) DO NOTHING
        "#,
        session_id,
        user.id
    )
    .execute(&pool)
    .await?;

    if result.rows_affected() > 0 {
        let live_session_arc = {
            let conns_map = connections.lock().await;
            conns_map.get(&session_id).cloned()
        };

        if let Some(session_arc) = live_session_arc {
            let mut live_session = session_arc.lock().await;

            let new_participant = ParticipantDTO {
                email: user.email,
                user_id: user.id,
                role: ParticipantRole::Player,
            };

            live_session.participants.push(new_participant.clone());

            let message = ServerMessage::Session(SessionMessage::UserJoined {
                participant: new_participant,
            });

            broadcast_to_session(&mut live_session, &message).await;
        }
    }

    Ok(StatusCode::OK)
}
