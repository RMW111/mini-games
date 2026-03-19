use crate::features::sessions::models::handler_data::HandlerData;
use crate::features::sessions::models::session_connections::LiveSession;
use crate::features::sessions::models::ws_messages::{ServerMessage, SessionMessage};
use crate::features::sessions::utils::process_game_action::process_game_action;
use crate::games::ragnarocks::models::color::PlayerColor;
use crate::games::ragnarocks::models::messages::RagnarocksClientMessage;
use crate::games::ragnarocks::state::RagnarocksState;
use crate::models::participant::ParticipantRole;
use crate::models::session::SessionStatus;
use crate::models::user::User;
use sqlx::PgPool;

struct RagnarocksHandler<'a> {
    live_session: &'a mut LiveSession,
    pool: PgPool,
    player_color: PlayerColor,
    game_state: RagnarocksState,
}

impl<'a> RagnarocksHandler<'a> {
    pub fn new(live_session: &'a mut LiveSession, user: User, pool: PgPool) -> Self {
        let game_state: RagnarocksState =
            serde_json::from_value(live_session.session_state.game_state.clone()).unwrap();

        let creator = live_session
            .participants
            .iter()
            .find(|&p| p.role == ParticipantRole::Creator)
            .expect("There must be a creator in a game");

        let player_color = if user.id == creator.user_id {
            game_state.creator_color()
        } else {
            crate::games::ragnarocks::models::color::get_opposite_color(game_state.creator_color())
        };

        Self {
            live_session,
            pool,
            player_color,
            game_state,
        }
    }

    pub async fn handle(&mut self, message: RagnarocksClientMessage) {
        match message {
            RagnarocksClientMessage::MoveViking { from, to } => {
                if self
                    .game_state
                    .try_move_viking(self.player_color, from, to)
                    .is_ok()
                {
                    self.commit_state_change().await;
                }
            }
            RagnarocksClientMessage::PlaceRunestone(coords) => {
                if self
                    .game_state
                    .try_place_runestone(self.player_color, coords)
                    .is_ok()
                {
                    self.commit_state_change().await;
                }
            }
            RagnarocksClientMessage::Skip => {
                if self.game_state.try_skip(self.player_color).is_ok() {
                    self.commit_state_change().await;
                }
            }
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

pub async fn handle_ragnarocks_message(
    message: RagnarocksClientMessage,
    live_session: &mut LiveSession,
    handler_data: HandlerData,
) {
    let mut handler =
        RagnarocksHandler::new(live_session, handler_data.user, handler_data.pool);
    handler.handle(message).await;
}
