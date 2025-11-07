use crate::features::games::handlers::get_game::get_game;
use crate::features::games::handlers::get_games_list::get_games_list;
use crate::features::games::handlers::get_sessions::get_sessions;
use crate::utils::add_auth_layer::add_auth_layer;
use axum::Router;
use axum::routing::get;
use sqlx::PgPool;

pub fn games_routes(pool: &PgPool) -> Router {
    Router::new()
        .route("/", add_auth_layer(get(get_games_list), &pool))
        .route("/{game_slug}", add_auth_layer(get(get_game), &pool))
        .route(
            "/{game_slug}/sessions",
            add_auth_layer(get(get_sessions), &pool),
        )
}
