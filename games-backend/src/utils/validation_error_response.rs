use std::collections::HashMap;
use axum::http::StatusCode;
use axum::Json;
use validator::ValidationErrors;
use crate::models::error_response::ErrorResponse;

pub fn validation_error_response(errors: ValidationErrors) -> (StatusCode, Json<ErrorResponse>) {
    let mut err_map = HashMap::new();

    for (field, errs) in errors.field_errors() {
        let messages: Vec<String> = errs
            .iter()
            .filter_map(|e| e.message.as_ref().map(|m| m.to_string()))
            .collect();
        err_map.insert(field.to_string(), messages);
    }

    (StatusCode::BAD_REQUEST, Json(ErrorResponse { errors: err_map }))
}
