use axum::Router;
use axum::routing::post;
use crate::features::auth::handlers::login::login;
use crate::features::auth::handlers::logout::logout;
use crate::features::auth::handlers::register::register;

pub fn auth_routes() -> Router {
    Router::new()
        .route("/register", post(register))
        .route("/login", post(login))
        .route("/logout", post(logout))
}
