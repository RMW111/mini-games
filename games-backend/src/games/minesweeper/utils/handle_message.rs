use crate::features::sessions::models::handler_data::HandlerData;
use crate::features::sessions::models::session_connections::LiveSession;
use crate::features::sessions::models::ws_messages::{ServerMessage, SessionMessage};
use crate::features::sessions::utils::process_game_action::process_game_action;
use crate::games::minesweeper::models::cell_state::CellState;
use crate::games::minesweeper::models::messages::MinesweeperClientMessage;
use crate::games::minesweeper::state::MinesweeperState;
use crate::models::grid_position::GridPosition;
use crate::models::session::SessionStatus;
use uuid::Uuid;

pub async fn handle_minesweeper_message(
    message: MinesweeperClientMessage,
    live_session: &mut LiveSession,
    handler_data: HandlerData,
) {
    let user_id = handler_data.user.id.clone();

    let messages_to_broadcast = match message {
        MinesweeperClientMessage::CellClick(payload) => {
            cell_click_action(live_session, payload, user_id)
        }
        MinesweeperClientMessage::CellFlag(payload) => {
            cell_flag_action(live_session, payload, user_id)
        }
        MinesweeperClientMessage::NumClick(payload) => {
            num_click_action(live_session, payload, user_id)
        }
    };

    process_game_action(live_session, handler_data.pool, messages_to_broadcast).await;
}

fn num_click_action(
    live_session: &mut LiveSession,
    payload: GridPosition,
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
    payload: GridPosition,
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
    payload: GridPosition,
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
