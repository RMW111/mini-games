use crate::features::sessions::models::session_connections::SessionConnections;
use axum::extract::{FromRequestParts};
use axum::http::StatusCode;
use axum::http::request::Parts;
use sqlx::PgPool;

#[derive(Clone)]
pub struct WsConnections(pub SessionConnections);

#[derive(Clone)]
pub struct DatabaseConnection(pub PgPool); // Наш собственный тип

impl<S> FromRequestParts<S> for WsConnections
where
    S: Send + Sync,
{
    type Rejection = (StatusCode, &'static str);

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        parts.extensions.get::<WsConnections>().cloned().ok_or((
            StatusCode::INTERNAL_SERVER_ERROR,
            "WsConnections missing in extensions",
        ))
    }
}

impl<S> FromRequestParts<S> for DatabaseConnection
where
    S: Send + Sync,
{
    type Rejection = (StatusCode, &'static str);

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        parts
            .extensions
            .get::<PgPool>()
            .cloned()
            .map(DatabaseConnection)
            .ok_or((
                StatusCode::INTERNAL_SERVER_ERROR,
                "Database pool missing in extensions",
            ))
    }
}
