use crate::app_state::{DatabaseConnection, WsConnections};
use crate::models::app_error::AppError;
use crate::models::user::User;
use axum::extract::Path;
use axum::extract::ws::{CloseFrame, Message};
use futures::SinkExt;
use uuid::Uuid;

pub async fn delete_session(
    DatabaseConnection(pool): DatabaseConnection,
    WsConnections(connections): WsConnections,
    user: User,
    Path(session_id): Path<Uuid>,
) -> Result<(), AppError> {
    let is_creator = sqlx::query_scalar!(
        r#"
        SELECT EXISTS(
            SELECT 1 FROM session_participants
            WHERE session_id = $1
              AND user_id = $2
              AND role = 'creator'
        )
        "#,
        session_id,
        user.id
    )
    .fetch_one(&pool)
    .await?
    .unwrap_or(false);

    if !is_creator {
        return Err(AppError::Unauthorized(
            "Only the session creator can delete this session".to_string(),
        ));
    }

    let mut tx = pool.begin().await?;

    let delete_result = sqlx::query!("DELETE FROM game_sessions WHERE id = $1", session_id)
        .execute(&mut *tx)
        .await?;

    if delete_result.rows_affected() == 0 {
        return Err(AppError::NotFound("Session not found".to_string()));
    }

    tx.commit().await?;

    let mut conns_map = connections.lock().await;

    if let Some(session_arc) = conns_map.remove(&session_id) {
        let mut live_session = session_arc.lock().await;

        let connection_count = live_session.connections.len();
        let close_frame = CloseFrame {
            code: 1000,
            reason: "Session has been deleted by the creator".into(),
        };

        let connections_to_close: Vec<_> = live_session.connections.drain().collect();

        for (conn_id, mut connection_info) in connections_to_close {
            println!(
                "Closing connection {} for user {} in session {}",
                conn_id, connection_info.user_id, session_id
            );

            let _ = connection_info
                .sender
                .send(Message::Close(Some(close_frame.clone())))
                .await;
        }

        println!(
            "Session {} deleted by user {}. Removed from memory and closed {} connections.",
            session_id, user.id, connection_count
        );
    } else {
        println!(
            "Session {} deleted by user {} but was not active in memory.",
            session_id, user.id
        );
    }

    Ok(())
}
