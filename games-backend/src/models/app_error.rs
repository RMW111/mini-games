use crate::utils::get_error_response::get_error_response;
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use sqlx::Error;

#[derive(Debug)]
pub enum AppError {
    Unauthorized(String),
    NotFound(String),
    DatabaseError(Error),
    Conflict(String),
    Internal(String),
    Forbidden(String),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        match self {
            Self::DatabaseError(db_error) => {
                eprintln!("Database error: {:?}", db_error);
                get_error_response(StatusCode::INTERNAL_SERVER_ERROR, "Database error")
            },
            Self::Internal(message) => {
                eprintln!("Internal Server Error: {}", message);
                get_error_response(StatusCode::INTERNAL_SERVER_ERROR, "An internal error occurred")
            },
            Self::Forbidden(message) => {
                eprintln!("Access forbidden: {}", message);
                get_error_response(StatusCode::FORBIDDEN, &message)
            },
            Self::NotFound(message) => get_error_response(StatusCode::NOT_FOUND, &message),
            Self::Conflict(message) => get_error_response(StatusCode::CONFLICT, &message),
            Self::Unauthorized(message) => get_error_response(StatusCode::UNAUTHORIZED, &message)
        }
        .into_response()
    }
}

impl From<Error> for AppError {
    fn from(error: Error) -> Self {
        if let Some(db_error) = error.as_database_error() {
            if db_error.is_unique_violation() {
                return Self::Conflict("Email already exists".to_string());
            }
        }

        match error {
            Error::RowNotFound => Self::NotFound("Resource not found".to_string()),
            _ => Self::DatabaseError(error)
        }
    }
}
