use axum::Json;
use serde_json::{json, Value};

pub fn get_message(text: &str) -> Json<Value> {
    Json(json!({"message": text}))
}
