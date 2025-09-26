use crate::features::sessions::models::ws_messages::ServerMessage;
use axum::extract::ws::Message;
use futures::SinkExt;
use crate::features::sessions::models::session_connections::LiveSession;

pub async fn broadcast_to_session(live_session: &mut LiveSession, message: &ServerMessage) {
    let json_message = match serde_json::to_string(message) {
        Ok(json) => json,
        Err(e) => {
            eprintln!(
                "Failed to serialize broadcast message for session {}: {}",
                live_session.session_state.id, e
            );
            return;
        }
    };

    let mut dead_connections = Vec::new();

    for (connection_id, sender) in live_session.connections.iter_mut() {
        if sender.send(Message::Text(json_message.clone().into())).await.is_err() {
            println!(
                "Client {} in session {} seems disconnected. Marking for removal.",
                connection_id, live_session.session_state.id
            );
            dead_connections.push(*connection_id);
        }
    }

    for connection_id in dead_connections {
        live_session.connections.remove(&connection_id);
    }
}
