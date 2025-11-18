use crate::features::sessions::handlers::create_session::create_session;
use crate::features::sessions::handlers::delete_session::delete_session;
use crate::features::sessions::handlers::join_session::join_session;
use crate::utils::add_auth_layer::add_auth_layer;
use axum::Router;
use axum::routing::post;
use sqlx::PgPool;

pub fn session_routes(pool: &PgPool) -> Router {
    Router::new()
        .route("/new", add_auth_layer(post(create_session), pool))
        .route(
            "/{session_id}/join",
            add_auth_layer(post(join_session), pool),
        )
        .route(
            "/{session_id}/delete",
            add_auth_layer(post(delete_session), pool),
        )
}
