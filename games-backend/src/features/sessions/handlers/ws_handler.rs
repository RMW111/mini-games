use crate::app_state::{DatabaseConnection, WsConnections};
use crate::features::sessions::dtos::session::SessionDTO;
use crate::features::sessions::models::handler_data::HandlerData;
use crate::features::sessions::models::session_connections::{
    ConnectionInfo, LiveSession, SessionConnections,
};
use crate::features::sessions::models::ws_client_messages::{
    ClientMessage, CursorClientMessage, GameClientMessage,
};
use crate::features::sessions::models::ws_messages::{ServerMessage, SessionMessage};
use crate::features::sessions::utils::handle_cursor_move_message::handle_cursor_move_message;
use crate::features::sessions::utils::load_session_with_participants::load_session_with_participants;
use crate::games::minesweeper::utils::handle_message::handle_minesweeper_message;
use crate::models::app_error::AppError;
use crate::models::session::SessionStatus;
use crate::models::user::User;
use axum::extract::ws::{CloseFrame, Message, WebSocket};
use axum::extract::{Path, WebSocketUpgrade};
use axum::response::{IntoResponse, Response};
use bytes::Bytes;
use futures::SinkExt;
use futures::StreamExt;
use sqlx::PgPool;
use std::borrow::Cow;
use std::sync::Arc;
use tokio::sync::Mutex;
use tokio::time::Duration;
use uuid::Uuid;

pub async fn ws_handler(
    ws: WebSocketUpgrade,
    DatabaseConnection(pool): DatabaseConnection,
    WsConnections(connections): WsConnections,
    Path(session_id): Path<Uuid>,
    user: User,
) -> Response {
    let is_participant_result = sqlx::query_scalar!(
        "SELECT EXISTS(SELECT 1 FROM session_participants WHERE session_id = $1 AND user_id = $2)",
        session_id,
        user.id
    )
    .fetch_one(&pool)
    .await;

    let is_participant = match is_participant_result {
        Ok(Some(exists)) => exists,
        _ => {
            return AppError::Internal("Database error while checking participation".to_string())
                .into_response();
        }
    };

    if !is_participant {
        return AppError::Forbidden("You are not a participant in this session.".to_string())
            .into_response();
    }

    ws.on_upgrade(move |socket| handle_socket(socket, pool, connections, session_id, user))
}

async fn handle_socket(
    socket: WebSocket,
    pool: PgPool,
    connections: SessionConnections,
    session_id: Uuid,
    user: User,
) {
    let connection_id = Uuid::new_v4();
    let (mut sender, mut receiver) = socket.split();

    let live_session_arc: Arc<Mutex<LiveSession>> = {
        let mut conns_map = connections.lock().await;

        match conns_map.get(&session_id) {
            Some(session_arc) => session_arc.clone(),
            None => match load_session_with_participants(&pool, session_id).await {
                Ok((session_from_db, participants_from_db)) => {
                    let new_live_session = LiveSession {
                        session_state: session_from_db,
                        participants: participants_from_db,
                        connections: Default::default(),
                    };
                    let session_arc = Arc::new(Mutex::new(new_live_session));
                    conns_map.insert(session_id, session_arc.clone());
                    session_arc
                }
                Err(e) => {
                    eprintln!(
                        "Failed to load session {} from DB: {:?}. Closing connection.",
                        session_id, e
                    );
                    return;
                }
            },
        }
    };

    {
        let mut live_session = live_session_arc.lock().await;

        let initial_message = SessionDTO {
            id: live_session.session_state.id,
            status: live_session.session_state.status.clone(),
            game_state: live_session.session_state.game_state.clone(),
            participants: live_session.participants.clone(),
        };
        let welcome_message =
            ServerMessage::Session(SessionMessage::FullSessionState(initial_message));
        let initial_message_json = serde_json::to_string(&welcome_message).unwrap();

        if sender
            .send(Message::Text(initial_message_json.into()))
            .await
            .is_err()
        {
            return;
        }

        if live_session.session_state.status == SessionStatus::Completed {
            let close_frame = CloseFrame {
                code: 1000,
                reason: "Session has already been completed.".into(),
            };
            let _ = sender.send(Message::Close(Some(close_frame))).await;
            return;
        }

        live_session.connections.insert(
            connection_id,
            ConnectionInfo {
                sender,
                user_id: user.id,
            },
        );
        println!(
            "User '{}' successfully joined live session {}.",
            user.email, session_id
        );
    }

    let mut heartbeat_interval = tokio::time::interval(Duration::from_secs(30));

    loop {
        tokio::select! {
            _ = heartbeat_interval.tick() => {
                let mut live_session = live_session_arc.lock().await;
                if let Some(connection_info) = live_session.connections.get_mut(&connection_id) {
                    println!("Sending PING to connection {}", connection_id);

                    if connection_info.sender.send(Message::Ping(Bytes::new())).await.is_err() {
                        println!("Failed to send ping to conn_id {}, connection is likely closed.", connection_id);
                        break;
                    }
                } else {
                    break;
                }
            },
            result = receiver.next() => {
                let msg = match result {
                    Some(Ok(msg)) => msg,
                    _ => {
                        println!("Client {} disconnected.", connection_id);
                        break;
                    }
                };

                if let Message::Close(_) = msg {
                    break;
                }

                if let Message::Text(text) = msg {
                    match serde_json::from_str::<ClientMessage>(&text) {
                        Ok(message) => {
                            let mut live_session = live_session_arc.lock().await;
                            if live_session.session_state.status != SessionStatus::InProgress {
                                if let Some(connection_info) = live_session.connections.get_mut(&connection_id) {
                                    let _ = connection_info.sender.send(Message::Close(None)).await;
                                }
                                break;
                            }

                            let handler_data = HandlerData {
                                pool: pool.clone(),
                                user: user.clone(),
                                // connection_id,
                            };

                            handle_client_message(message, &mut live_session, handler_data).await;
                        }
                        Err(e) => {
                            eprintln!("Failed to parse message from user '{}': {}. Raw: '{}'", user.email, e, text);
                        }
                    }
                }
            },
        }
    }

    {
        let mut live_session = live_session_arc.lock().await;
        live_session.connections.remove(&connection_id);

        println!(
            "User '{}' (conn_id: {}) disconnected from session {}.",
            user.email, connection_id, session_id
        );

        if live_session.connections.is_empty() {
            let mut conns_map = connections.lock().await;
            conns_map.remove(&session_id);
            println!(
                "Session {} was the last one. Removed from memory.",
                session_id
            );
        }
    }
}

async fn handle_client_message(
    message: ClientMessage,
    live_session: &mut LiveSession,
    handler_data: HandlerData,
) {
    match message {
        ClientMessage::Game(game_message) => {
            handle_game_message(game_message, live_session, handler_data).await
        }
        ClientMessage::Cursor(cursor_message) => {
            handle_cursor_message(cursor_message, live_session, handler_data).await
        }
    };
}

async fn handle_game_message(
    message: GameClientMessage,
    live_session: &mut LiveSession,
    handler_data: HandlerData,
) {
    match message {
        GameClientMessage::Minesweeper(message) => {
            handle_minesweeper_message(message, live_session, handler_data).await
        }
    };
}

async fn handle_cursor_message(
    message: CursorClientMessage,
    live_session: &mut LiveSession,
    handler_data: HandlerData,
) {
    match message {
        CursorClientMessage::Move(position) => {
            handle_cursor_move_message(position, live_session, handler_data).await
        }
    };
}
