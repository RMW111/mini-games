use axum::{extract::Extension, Json};
use serde_json::json;
use crate::models::user::User;

pub async fn me(Extension(user): Extension<User>) -> Json<serde_json::Value> {
    Json(json!(user))
}
