use axum::{http::{StatusCode}};
use axum::extract::FromRequestParts;
use axum::http::request::Parts;
use serde::Serialize;
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, FromRow)]
#[serde(rename_all =  "camelCase")]
pub struct User {
    pub id: Uuid,
    pub email: String,
    pub avatar_url: String,
}

impl<S> FromRequestParts<S> for User where S: Send + Sync {
    type Rejection = (StatusCode, &'static str);

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        if let Some(user) = parts.extensions.get::<User>().cloned() {
            Ok(user)
        } else {
            eprintln!("User not found in extensions, but extractor was used. Ensure require_auth middleware is applied.");
            Err((StatusCode::INTERNAL_SERVER_ERROR, "User not found"))
        }
    }
}
