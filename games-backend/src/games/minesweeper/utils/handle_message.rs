use crate::features::sessions::models::handler_data::HandlerData;
use crate::features::sessions::models::session_connections::LiveSession;
use crate::features::sessions::models::ws_messages::{ServerMessage, SessionMessage};
use crate::features::sessions::utils::broadcast_to_session::broadcast_to_session;
use crate::games::minesweeper::models::cell_state::CellState;
use crate::games::minesweeper::models::messages::{CellPosition, MinesweeperClientMessage};
use crate::games::minesweeper::state::MinesweeperState;
use crate::models::session::SessionStatus;
use uuid::Uuid;

pub async fn handle_minesweeper_message(
    message: MinesweeperClientMessage,
    live_session: &mut LiveSession,
    handler_data: HandlerData,
) {
    let user_id = handler_data.user.id.clone();

    match message {
        MinesweeperClientMessage::CellClick(payload) => {
            process_minesweeper_action(live_session, handler_data, |live_session| {
                cell_click_action(live_session, payload, user_id)
            })
            .await
        }
        MinesweeperClientMessage::CellFlag(payload) => {
            process_minesweeper_action(live_session, handler_data, |live_session| {
                cell_flag_action(live_session, payload, user_id)
            })
            .await
        }
        MinesweeperClientMessage::NumClick(payload) => {
            process_minesweeper_action(live_session, handler_data, |live_session| {
                num_click_action(live_session, payload, user_id)
            })
            .await
        }
    };
}

fn num_click_action(
    live_session: &mut LiveSession,
    payload: CellPosition,
    user_id: Uuid,
) -> Vec<ServerMessage> {
    let mut messages_to_broadcast = vec![];

    let mut game_state: MinesweeperState =
        match serde_json::from_value(live_session.session_state.game_state.clone()) {
            Ok(s) => s,
            Err(_) => return messages_to_broadcast,
        };

    let stat = game_state.stats.entry(user_id).or_default();
    let click_result = game_state
        .board
        .on_num_click(payload.row, payload.col, stat);

    let completed = game_state.board.check_game_completed();

    if let Some(game_over) = click_result {
        let new_state_json = serde_json::to_value(game_state).unwrap();
        live_session.session_state.game_state = new_state_json.clone();

        if game_over || completed {
            live_session.session_state.status = SessionStatus::Completed;
            let status_update_message = SessionMessage::StatusUpdate(SessionStatus::Completed);
            messages_to_broadcast.push(ServerMessage::Session(status_update_message));
        }

        let message = SessionMessage::GameStateUpdate(new_state_json);
        messages_to_broadcast.push(ServerMessage::Session(message));
    }

    messages_to_broadcast
}

fn cell_flag_action(
    live_session: &mut LiveSession,
    payload: CellPosition,
    user_id: Uuid,
) -> Vec<ServerMessage> {
    let mut messages_to_broadcast = vec![];
    let mut game_state: MinesweeperState =
        match serde_json::from_value(live_session.session_state.game_state.clone()) {
            Ok(s) => s,
            Err(_) => return messages_to_broadcast,
        };

    let cell = game_state.board.grid[payload.row][payload.col];

    if cell.state == CellState::Opened || cell.state == CellState::Exploded {
        return messages_to_broadcast;
    }

    game_state
        .board
        .toggle_flagged(payload.row, payload.col, user_id);

    let new_state_json = serde_json::to_value(game_state).unwrap();
    live_session.session_state.game_state = new_state_json.clone();
    let message = SessionMessage::GameStateUpdate(new_state_json);
    messages_to_broadcast.push(ServerMessage::Session(message));

    messages_to_broadcast
}

fn cell_click_action(
    live_session: &mut LiveSession,
    payload: CellPosition,
    user_id: Uuid,
) -> Vec<ServerMessage> {
    let mut messages_to_broadcast = vec![];

    let mut game_state: MinesweeperState =
        match serde_json::from_value(live_session.session_state.game_state.clone()) {
            Ok(s) => s,
            Err(_) => return messages_to_broadcast,
        };

    let cell = game_state.board.grid[payload.row][payload.col];

    if cell.state != CellState::Closed {
        return messages_to_broadcast;
    }
    let stat = game_state.stats.entry(user_id).or_default();
    game_state
        .board
        .on_cell_click(payload.row, payload.col, stat);

    let completed = game_state.board.check_game_completed();

    if cell.has_mine || completed {
        live_session.session_state.status = SessionStatus::Completed;
        let status_update_message = SessionMessage::StatusUpdate(SessionStatus::Completed);
        messages_to_broadcast.push(ServerMessage::Session(status_update_message));
    }

    live_session.session_state.game_state = serde_json::to_value(game_state).unwrap();
    let message = SessionMessage::GameStateUpdate(live_session.session_state.game_state.clone());
    messages_to_broadcast.push(ServerMessage::Session(message));
    messages_to_broadcast
}

pub async fn process_minesweeper_action<F>(
    live_session: &mut LiveSession,
    handler_data: HandlerData,
    action: F,
) where
    F: FnOnce(&mut LiveSession) -> Vec<ServerMessage>,
{
    let messages_to_broadcast = action(live_session);

    let session_id = live_session.session_state.id;
    let new_game_state = live_session.session_state.game_state.clone();
    let new_status = live_session.session_state.status.clone();
    let pool_clone = handler_data.pool.clone();

    tokio::spawn(async move {
        if let Err(e) = sqlx::query!(
            "UPDATE game_sessions SET game_state = $1, status = $2 WHERE id = $3",
            new_game_state,
            new_status as _,
            session_id,
        )
        .execute(&pool_clone)
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
