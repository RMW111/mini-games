use crate::features::sessions::models::handler_data::HandlerData;
use crate::features::sessions::models::session_connections::LiveSession;
use crate::features::sessions::models::ws_messages::{GameMessage, ServerMessage, SessionMessage};
use crate::features::sessions::utils::process_game_action::process_game_action;
use crate::games::go::models::color::StoneColor;
use crate::games::go::models::messages::{GoClientMessage, GoServerMessage};
use crate::games::go::state::GoState;
use crate::games::go::utils::get_opposite_color::get_opposite_color;
use crate::models::participant::ParticipantRole;
use crate::models::session::SessionStatus;
use crate::utils::coords::Coords;
use sqlx::PgPool;

struct GoHandlerData {
    user_color: StoneColor,
    pool: PgPool,
}

pub async fn handle_go_message(
    message: GoClientMessage,
    live_session: &mut LiveSession,
    handler_data: HandlerData,
) {
    let creator = live_session
        .participants
        .iter()
        .find(|&p| p.role == ParticipantRole::Creator)
        .expect("There must be creator in a game");

    println!("message 222: {:?}", message);

    let mut game_state: GoState =
        match serde_json::from_value(live_session.session_state.game_state.clone()) {
            Ok(s) => s,
            Err(_) => return,
        };

    let creator_color = game_state.creator_color();
    let user_color: StoneColor = if handler_data.user.id == creator.user_id {
        creator_color
    } else {
        get_opposite_color(creator_color)
    };

    let go_handler_data = GoHandlerData {
        user_color,
        pool: handler_data.pool,
    };

    match message {
        GoClientMessage::PlaceStone(coords) => {
            handle_place_stone(&mut game_state, coords, live_session, go_handler_data).await
        }
        GoClientMessage::Pass => handle_pass(&mut game_state, live_session, go_handler_data).await,
        GoClientMessage::CancelScoring => {
            handle_cancel_scoring(&mut game_state, live_session, go_handler_data).await
        }
        GoClientMessage::Resign => {
            handle_resign(&mut game_state, live_session, go_handler_data).await
        }
        GoClientMessage::ToggleEaten(coords) => {
            handle_toggle_eaten(&mut game_state, coords, live_session, go_handler_data).await
        }
        GoClientMessage::ApproveScore => {
            handle_approve_score(&mut game_state, live_session, go_handler_data).await
        }
    }
}

async fn handle_place_stone(
    state: &mut GoState,
    coords: Coords,
    live_session: &mut LiveSession,
    handler_data: GoHandlerData,
) {
    // todo вынести общую логику в одно место
    if let Ok(_) = state.try_place_stone(handler_data.user_color, coords) {
        let updated_state = serde_json::to_value(state).unwrap();
        live_session.session_state.game_state = updated_state.clone();
        let game_message = SessionMessage::GameStateUpdate(updated_state);
        let message = ServerMessage::Session(game_message);
        process_game_action(live_session, handler_data.pool, vec![message]).await;
    }
}

async fn handle_toggle_eaten(
    state: &mut GoState,
    coords: Coords,
    live_session: &mut LiveSession,
    handler_data: GoHandlerData,
) {
    if let Ok(_) = state.try_toggle_eaten(coords) {
        let updated_state = serde_json::to_value(state).unwrap();
        live_session.session_state.game_state = updated_state.clone();
        let game_message = SessionMessage::GameStateUpdate(updated_state);
        let message = ServerMessage::Session(game_message);
        process_game_action(live_session, handler_data.pool, vec![message]).await;
    }
}

async fn handle_pass(
    state: &mut GoState,
    live_session: &mut LiveSession,
    handler_data: GoHandlerData,
) {
    if let Ok(_) = state.try_pass(handler_data.user_color) {
        let updated_state = serde_json::to_value(state).unwrap();
        live_session.session_state.game_state = updated_state.clone();
        let game_message = SessionMessage::GameStateUpdate(updated_state);
        let message = ServerMessage::Session(game_message);
        process_game_action(live_session, handler_data.pool, vec![message]).await;
    }
}

async fn handle_cancel_scoring(
    state: &mut GoState,
    live_session: &mut LiveSession,
    handler_data: GoHandlerData,
) {
    if live_session.participants.len() == 1 {
        return;
    }
    if let Ok(_) = state.try_cancel_scoring_mode() {
        let updated_state = serde_json::to_value(state).unwrap();
        live_session.session_state.game_state = updated_state.clone();
        let game_message = GameMessage::Go(GoServerMessage::ScoringCanceled);
        let message = ServerMessage::Game(game_message);
        process_game_action(live_session, handler_data.pool, vec![message]).await;
    }
}

async fn handle_resign(
    state: &mut GoState,
    live_session: &mut LiveSession,
    handler_data: GoHandlerData,
) {
    state.resign(handler_data.user_color);

    let updated_state = serde_json::to_value(state).unwrap();
    live_session.session_state.game_state = updated_state.clone();
    let game_message = GameMessage::Go(GoServerMessage::Resigned(handler_data.user_color));
    let message = ServerMessage::Game(game_message);

    let mut to_broadcast = vec![message];

    live_session.session_state.status = SessionStatus::Completed;
    let status_update_message = SessionMessage::StatusUpdate(SessionStatus::Completed);
    to_broadcast.push(ServerMessage::Session(status_update_message));

    process_game_action(live_session, handler_data.pool, to_broadcast).await;
}

async fn handle_approve_score(
    state: &mut GoState,
    live_session: &mut LiveSession,
    handler_data: GoHandlerData,
) {
    if let Ok(game_over) = state.try_approve_score(handler_data.user_color) {
        let updated_state = serde_json::to_value(state).unwrap();
        live_session.session_state.game_state = updated_state.clone();
        let game_message = SessionMessage::GameStateUpdate(updated_state);
        let message = ServerMessage::Session(game_message);

        let mut to_broadcast = vec![message];

        if game_over {
            live_session.session_state.status = SessionStatus::Completed;
            let status_update_message = SessionMessage::StatusUpdate(SessionStatus::Completed);
            to_broadcast.push(ServerMessage::Session(status_update_message));
        }

        process_game_action(live_session, handler_data.pool, to_broadcast).await;
    }
}
