use crate::features::sessions::models::session_connections::LiveSession;
use crate::features::sessions::models::ws_messages::ServerMessage;
use crate::features::sessions::utils::broadcast_to_session::broadcast_to_session;
use sqlx::PgPool;

pub async fn process_game_action(
    live_session: &mut LiveSession,
    pool: PgPool,
    messages_to_broadcast: Vec<ServerMessage>,
) {
    let session_id = live_session.session_state.id;
    let new_game_state = live_session.session_state.game_state.clone();
    let new_status = live_session.session_state.status.clone();

    tokio::spawn(async move {
        if let Err(e) = sqlx::query!(
            "UPDATE game_sessions SET game_state = $1, status = $2 WHERE id = $3",
            new_game_state,
            new_status as _,
            session_id,
        )
        .execute(&pool)
        .await
        {
            eprintln!(
                "Failed to save updated session state for {}: {}",
                session_id, e
            );
        }
    });

    for message in messages_to_broadcast {
        broadcast_to_session(live_session, &message, None).await;
    }
}
