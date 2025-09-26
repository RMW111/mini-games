use crate::models::error_response::ErrorResponse;
use axum::Json;
use axum::http::StatusCode;
use std::collections::HashMap;

pub fn get_error_response(status: StatusCode, message: &str) -> (StatusCode, Json<ErrorResponse>) {
    let errors = HashMap::from([("error".to_string(), vec![message.to_string()])]);
    (status, Json(ErrorResponse { errors }))
}
