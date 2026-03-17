use crate::features::sessions::models::handler_data::HandlerData;
use crate::features::sessions::models::session_connections::LiveSession;
use crate::features::sessions::models::ws_messages::{ServerMessage, SessionMessage};
use crate::features::sessions::utils::process_game_action::process_game_action;
use crate::games::tic_tac_toe::models::cell::CellValue;
use crate::games::tic_tac_toe::models::messages::TicTacToeClientMessage;
use crate::games::tic_tac_toe::state::TicTacToeState;
use crate::models::participant::ParticipantRole;
use crate::models::session::SessionStatus;
use crate::models::user::User;
use sqlx::PgPool;

struct TicTacToeHandler<'a> {
    live_session: &'a mut LiveSession,
    pool: PgPool,
    user_mark: CellValue,
    game_state: TicTacToeState,
}

impl<'a> TicTacToeHandler<'a> {
    pub fn new(live_session: &'a mut LiveSession, user: User, pool: PgPool) -> Self {
        let game_state: TicTacToeState =
            serde_json::from_value(live_session.session_state.game_state.clone()).unwrap();

        let creator = live_session
            .participants
            .iter()
            .find(|&p| p.role == ParticipantRole::Creator)
            .expect("There must be a creator in a game");

        let user_mark = if user.id == creator.user_id {
            CellValue::X
        } else {
            CellValue::O
        };

        Self {
            live_session,
            pool,
            user_mark,
            game_state,
        }
    }

    pub async fn handle(&mut self, message: TicTacToeClientMessage) {
        match message {
            TicTacToeClientMessage::MakeMove(coords) => {
                self.handle_make_move(coords.0, coords.1).await
            }
        }
    }

    async fn handle_make_move(&mut self, row: usize, col: usize) {
        if self.game_state.try_make_move(self.user_mark, row, col).is_ok() {
            self.commit_state_change().await;
        }
    }

    async fn commit_state_change(&mut self) {
        let updated_state = serde_json::to_value(&self.game_state).unwrap();
        self.live_session.session_state.game_state = updated_state.clone();

        let state_update = SessionMessage::GameStateUpdate(updated_state);
        let mut to_broadcast = vec![ServerMessage::Session(state_update)];

        if self.game_state.is_game_over() {
            self.live_session.session_state.status = SessionStatus::Completed;
            to_broadcast.push(ServerMessage::Session(SessionMessage::StatusUpdate(
                SessionStatus::Completed,
            )));
        }

        process_game_action(self.live_session, self.pool.clone(), to_broadcast).await;
    }
}

pub async fn handle_tic_tac_toe_message(
    message: TicTacToeClientMessage,
    live_session: &mut LiveSession,
    handler_data: HandlerData,
) {
    let mut handler = TicTacToeHandler::new(live_session, handler_data.user, handler_data.pool);
    handler.handle(message).await;
}
