use crate::models::game_slug::GameSlug;
use crate::models::session::SessionStatus;

pub fn get_initial_session_status(slug: GameSlug) -> SessionStatus {
    match slug {
        GameSlug::Minesweeper => SessionStatus::InProgress,
        GameSlug::Go => SessionStatus::Pending,
    }
}
