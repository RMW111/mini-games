use std::collections::HashMap;
use std::sync::Arc;
use futures::stream::SplitSink;
use axum::extract::ws::{Message, WebSocket};
use tokio::sync::Mutex;
use uuid::Uuid;
use crate::features::sessions::dtos::participant::ParticipantDTO;
use crate::models::session::Session;

type WsSender = SplitSink<WebSocket, Message>;

pub struct LiveSession {
    pub session_state: Session,
    pub participants: Vec<ParticipantDTO>,
    pub connections: HashMap<Uuid, WsSender>,
}

pub type SessionConnections = Arc<Mutex<HashMap<Uuid, Arc<Mutex<LiveSession>>>>>;
