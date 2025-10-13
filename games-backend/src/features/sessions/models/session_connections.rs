use crate::features::sessions::dtos::participant::ParticipantDTO;
use crate::models::session::Session;
use axum::extract::ws::{Message, WebSocket};
use futures::stream::SplitSink;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use uuid::Uuid;

type WsSender = SplitSink<WebSocket, Message>;

pub struct ConnectionInfo {
    pub sender: WsSender,
    pub user_id: Uuid,
}

pub struct LiveSession {
    pub session_state: Session,
    pub participants: Vec<ParticipantDTO>,
    pub connections: HashMap<Uuid, ConnectionInfo>,
}

pub type SessionConnections = Arc<Mutex<HashMap<Uuid, Arc<Mutex<LiveSession>>>>>;
