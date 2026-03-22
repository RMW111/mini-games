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
use crate::models::user::User;
use crate::utils::coords::Coords;
use sqlx::PgPool;

struct GoHandler<'a> {
    live_session: &'a mut LiveSession,
    pool: PgPool,
    user_color: StoneColor,
    game_state: GoState,
}

impl<'a> GoHandler<'a> {
    pub fn new(live_session: &'a mut LiveSession, user: User, pool: PgPool) -> Self {
        let game_state: GoState =
            serde_json::from_value(live_session.session_state.game_state.clone()).unwrap();

        let creator = live_session
            .participants
            .iter()
            .find(|&p| p.role == ParticipantRole::Creator)
            .expect("There must be creator in a game");

        let creator_color = game_state.creator_color();

        let user_color: StoneColor = if user.id == creator.user_id {
            creator_color
        } else {
            get_opposite_color(creator_color)
        };

        Self {
            live_session,
            pool,
            user_color,
            game_state,
        }
    }

    pub async fn handle(&mut self, message: GoClientMessage) {
        match message {
            GoClientMessage::PlaceStone(coords) => self.handle_place_stone(coords).await,
            GoClientMessage::Pass => self.handle_pass().await,
            GoClientMessage::CancelScoring => self.handle_cancel_scoring().await,
            GoClientMessage::Resign => self.handle_resign().await,
            GoClientMessage::ToggleEaten(coords) => self.handle_toggle_eaten(coords).await,
            GoClientMessage::ApproveScore => self.handle_approve_score().await,
        }
    }

    async fn handle_place_stone(&mut self, coords: Coords) {
        if let Ok(_) = self.game_state.try_place_stone(self.user_color, coords) {
            self.commit_state_change(None).await;
        }
    }

    async fn handle_pass(&mut self) {
        if let Ok(_) = self.game_state.try_pass(self.user_color) {
            self.commit_state_change(None).await;
        }
    }

    async fn handle_cancel_scoring(&mut self) {
        if self.live_session.participants.len() == 1 {
            return;
        }
        if let Ok(_) = self.game_state.try_cancel_scoring_mode() {
            let game_message = GameMessage::Go(GoServerMessage::ScoringCanceled);
            let message = ServerMessage::Game(game_message);
            self.commit_state_change(Some(vec![message])).await;
        }
    }

    async fn handle_resign(&mut self) {
        self.game_state.resign(self.user_color);
        let game_message = GameMessage::Go(GoServerMessage::Resigned(self.user_color));
        let message = ServerMessage::Game(game_message);
        self.live_session.session_state.status = SessionStatus::Completed;
        self.commit_state_change(Some(vec![message])).await;
    }

    async fn handle_toggle_eaten(&mut self, coords: Coords) {
        if let Ok(_) = self.game_state.try_toggle_eaten(coords) {
            self.commit_state_change(None).await;
        }
    }

    async fn handle_approve_score(&mut self) {
        if let Ok(game_over) = self.game_state.try_approve_score(self.user_color) {
            if game_over {
                self.live_session.session_state.status = SessionStatus::Completed;
            }

            self.commit_state_change(None).await;
        }
    }

    async fn commit_state_change(&mut self, messages_to_broadcast: Option<Vec<ServerMessage>>) {
        let updated_state = serde_json::to_value(&self.game_state).unwrap();
        self.live_session.session_state.game_state = updated_state.clone();

        let mut to_broadcast = vec![];
        if let Some(message) = messages_to_broadcast {
            to_broadcast.extend(message);
        } else {
            let state_update_message = SessionMessage::GameStateUpdate(updated_state);
            let message = ServerMessage::Session(state_update_message);
            to_broadcast.push(message);
        }

        if self.live_session.session_state.status == SessionStatus::Completed {
            let status_update_message = SessionMessage::StatusUpdate(SessionStatus::Completed);
            to_broadcast.push(ServerMessage::Session(status_update_message));
        }

        process_game_action(self.live_session, self.pool.clone(), to_broadcast).await;
    }
}

pub async fn handle_go_message(
    message: GoClientMessage,
    live_session: &mut LiveSession,
    handler_data: HandlerData,
) {
    let mut handler = GoHandler::new(live_session, handler_data.user, handler_data.pool);
    handler.handle(message).await;
}
