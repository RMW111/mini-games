use axum::middleware;
use axum::routing::{MethodRouter};
use sqlx::PgPool;
use crate::features::auth::require_auth::require_auth;

pub fn add_auth_layer(router: MethodRouter, pull: &PgPool) -> MethodRouter {
    router.route_layer(middleware::from_fn_with_state(pull.clone(), require_auth))
}
