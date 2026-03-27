use crate::features::sessions::models::handler_data::HandlerData;
use crate::features::sessions::models::session_connections::LiveSession;
use crate::features::sessions::models::ws_messages::{ServerMessage, SessionMessage};
use crate::features::sessions::utils::process_game_action::process_game_action;
use crate::games::ragnarocks::models::color::{get_opposite_color, PlayerColor};
use crate::games::ragnarocks::models::messages::RagnarocksClientMessage;
use crate::games::ragnarocks::state::{RagnarocksState, TurnPhase};
use crate::models::http::HTTPClient;
use crate::models::participant::ParticipantRole;
use crate::models::session::SessionStatus;
use crate::models::user::User;
use crate::utils::coords::Coords;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

struct RagnarocksHandler<'a> {
    live_session: &'a mut LiveSession,
    pool: PgPool,
    player_color: PlayerColor,
    game_state: RagnarocksState,
    http_client: HTTPClient,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct AiRequest {
    board: serde_json::Value,
    current_turn: u8,
    phase: String,
    active_viking: Option<[usize; 2]>,
    last_skip: bool,
    white_score: u32,
    red_score: u32,
}

#[derive(Deserialize)]
struct AiResponse {
    #[serde(rename = "type")]
    move_type: String,
    from_pos: Option<[usize; 2]>,
    to: Option<[usize; 2]>,
    coords: Option<[usize; 2]>,
}

impl<'a> RagnarocksHandler<'a> {
    pub fn new(
        live_session: &'a mut LiveSession,
        user: User,
        pool: PgPool,
        http_client: HTTPClient,
    ) -> Self {
        let game_state: RagnarocksState =
            serde_json::from_value(live_session.session_state.game_state.clone()).unwrap();

        let creator = live_session
            .participants
            .iter()
            .find(|&p| p.role == ParticipantRole::Creator)
            .expect("There must be a creator in a game");

        let is_creator = user.id == creator.user_id;
        let player_color = if is_creator {
            game_state.creator_color()
        } else {
            get_opposite_color(game_state.creator_color())
        };

        Self {
            live_session,
            pool,
            player_color,
            game_state,
            http_client,
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
                    self.maybe_trigger_ai_move().await;
                }
            }
            RagnarocksClientMessage::CancelMove => {
                if self
                    .game_state
                    .try_cancel_move(self.player_color)
                    .is_ok()
                {
                    self.commit_state_change().await;
                }
            }
            RagnarocksClientMessage::Skip => {
                if self.game_state.try_skip(self.player_color).is_ok() {
                    self.commit_state_change().await;
                    self.maybe_trigger_ai_move().await;
                }
            }
        }
    }

    async fn maybe_trigger_ai_move(&mut self) {
        if !self.game_state.vs_ai() || self.game_state.is_game_over() {
            return;
        }

        let ai_color = get_opposite_color(self.game_state.creator_color());
        if self.game_state.current_turn() != ai_color {
            return;
        }

        let ai_server_url =
            std::env::var("AI_SERVER_URL").unwrap_or_else(|_| "http://localhost:8001".to_string());

        // Phase 1: Move viking (or skip)
        let response = match self.call_ai_server(&ai_server_url).await {
            Some(r) => r,
            None => return,
        };

        if response.move_type == "skip" {
            if self.game_state.try_skip(ai_color).is_ok() {
                self.commit_state_change().await;
            }
            return;
        }

        if response.move_type == "moveViking" {
            if let (Some(from), Some(to)) = (response.from_pos, response.to) {
                let from = Coords(from[0], from[1]);
                let to = Coords(to[0], to[1]);
                if self.game_state.try_move_viking(ai_color, from, to).is_ok() {
                    self.commit_state_change().await;
                } else {
                    eprintln!("[AI] Invalid move_viking: {:?} -> {:?}", from, to);
                    return;
                }
            }
        }

        // Phase 2: Place runestone
        if self.game_state.phase() != TurnPhase::PlaceRunestone {
            return;
        }

        let response = match self.call_ai_server(&ai_server_url).await {
            Some(r) => r,
            None => return,
        };

        if response.move_type == "placeRunestone" {
            if let Some(coords) = response.coords {
                let coords = Coords(coords[0], coords[1]);
                if self
                    .game_state
                    .try_place_runestone(ai_color, coords)
                    .is_ok()
                {
                    self.commit_state_change().await;
                } else {
                    eprintln!("[AI] Invalid place_runestone: {:?}", coords);
                }
            }
        }
    }

    async fn call_ai_server(&self, ai_server_url: &str) -> Option<AiResponse> {
        let game_json = serde_json::to_value(&self.game_state).unwrap();

        let phase_str = match self.game_state.phase() {
            TurnPhase::MoveViking => "moveViking",
            TurnPhase::PlaceRunestone => "placeRunestone",
        };

        let active_viking = game_json
            .get("activeViking")
            .and_then(|v| v.as_array())
            .map(|arr| {
                [
                    arr[0].as_u64().unwrap() as usize,
                    arr[1].as_u64().unwrap() as usize,
                ]
            });

        let request = AiRequest {
            board: game_json.get("board").cloned().unwrap(),
            current_turn: game_json
                .get("currentTurn")
                .and_then(|v| v.as_u64())
                .unwrap() as u8,
            phase: phase_str.to_string(),
            active_viking,
            last_skip: game_json
                .get("lastSkip")
                .and_then(|v| v.as_bool())
                .unwrap_or(false),
            white_score: game_json
                .get("whiteScore")
                .and_then(|v| v.as_u64())
                .unwrap_or(0) as u32,
            red_score: game_json
                .get("redScore")
                .and_then(|v| v.as_u64())
                .unwrap_or(0) as u32,
        };

        match self
            .http_client
            .post(format!("{}/move", ai_server_url))
            .json(&request)
            .send()
            .await
        {
            Ok(resp) => match resp.json::<AiResponse>().await {
                Ok(ai_move) => Some(ai_move),
                Err(e) => {
                    eprintln!("[AI] Failed to parse AI response: {}", e);
                    None
                }
            },
            Err(e) => {
                eprintln!("[AI] Failed to reach AI server: {}", e);
                None
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
    let mut handler = RagnarocksHandler::new(
        live_session,
        handler_data.user,
        handler_data.pool,
        handler_data.http_client,
    );
    handler.handle(message).await;
}
