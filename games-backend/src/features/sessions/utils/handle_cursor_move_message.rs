use crate::features::sessions::models::handler_data::HandlerData;
use crate::features::sessions::models::session_connections::LiveSession;
use crate::features::sessions::models::ws_messages::{CursorMessage, ServerMessage};
use crate::features::sessions::utils::broadcast_to_session::broadcast_to_session;
use crate::models::cursor::MovePayload;
use crate::models::position::Position;

pub async fn handle_cursor_move_message(
    position: Position,
    live_session: &mut LiveSession,
    handler_data: HandlerData,
) {
    let cursor_msg = CursorMessage::Move(MovePayload {
        user_id: handler_data.user.id,
        pos: position,
    });
    let ws_msg = ServerMessage::Cursor(cursor_msg);
    broadcast_to_session(live_session, &ws_msg, Some(handler_data.user.id)).await;
}
