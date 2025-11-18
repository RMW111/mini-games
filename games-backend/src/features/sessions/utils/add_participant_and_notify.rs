use crate::features::sessions::dtos::participant::ParticipantDTO;
use crate::features::sessions::models::session_connections::SessionConnections;
use crate::features::sessions::models::ws_messages::{ServerMessage, SessionMessage};
use crate::features::sessions::utils::broadcast_to_session::broadcast_to_session;
use crate::features::sessions::utils::try_join_session_db::{
    JoinSessionError, try_join_session_db,
};
use crate::models::participant::ParticipantRole;
use crate::models::user::User;
use sqlx::PgPool;
use uuid::Uuid;

pub async fn add_participant_and_notify(
    pool: &PgPool,
    connections: &SessionConnections,
    session_id: Uuid,
    user: &User,
) -> Result<(), JoinSessionError> {
    let was_newly_joined = try_join_session_db(pool, session_id, user.id).await?;

    if was_newly_joined {
        let live_session_arc = {
            let conns_map = connections.lock().await;
            conns_map.get(&session_id).cloned()
        };

        if let Some(session_arc) = live_session_arc {
            let mut live_session = session_arc.lock().await;

            let new_participant = ParticipantDTO {
                email: user.email.clone(),
                user_id: user.id,
                role: ParticipantRole::Player,
                avatar_url: user.avatar_url.clone(),
            };

            live_session.participants.push(new_participant.clone());

            let message = ServerMessage::Session(SessionMessage::UserJoined {
                participant: new_participant,
            });

            broadcast_to_session(&mut live_session, &message, None).await;
        }
    }

    Ok(())
}
