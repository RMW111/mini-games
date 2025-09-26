use crate::features::auth::routes::auth_routes;
use crate::features::me::me::me;
use crate::utils::add_auth_layer::add_auth_layer;
use axum::http::header::{ACCEPT, AUTHORIZATION, CONTENT_TYPE};
use axum::http::{HeaderValue, Method};
use axum::routing::get;
use axum::{Extension, Router};
use sqlx::PgPool;
use tower_http::cors::CorsLayer;
use crate::app_state::WsConnections;
use crate::features::games::routes::games_routes;
use crate::features::sessions::handlers::ws_handler::{ws_handler};
use crate::features::sessions::models::session_connections::SessionConnections;
use crate::features::sessions::routes::session_routes;

pub fn create_app(pool: PgPool) -> Router {
    let session_connections = WsConnections(SessionConnections::default());

    let cors = CorsLayer::new()
        .allow_origin("http://localhost:5173".parse::<HeaderValue>().unwrap())
        .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
        .allow_headers([CONTENT_TYPE, AUTHORIZATION, ACCEPT])
        .allow_credentials(true);

    let api_routes = Router::new()
        .nest("/auth", auth_routes())
        .nest("/games", games_routes(&pool))
        .nest("/sessions", session_routes(&pool))
        .route("/me", add_auth_layer(get(me), &pool));

    Router::new()
        .nest("/api", api_routes)

        .route("/ws/sessions/{session_id}", add_auth_layer(get(ws_handler), &pool))

        .layer(Extension(session_connections))
        .layer(Extension(pool))
        .layer(cors)
}
