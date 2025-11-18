use crate::app_state::{DatabaseConnection, WsConnections};
use crate::features::sessions::utils::add_participant_and_notify::add_participant_and_notify;
use crate::features::sessions::utils::try_join_session_db::JoinSessionError;
use crate::models::user::User;
use axum::extract::Path;
use axum::http::StatusCode;
use axum::response::IntoResponse;
use uuid::Uuid;

pub async fn join_session(
    DatabaseConnection(pool): DatabaseConnection,
    WsConnections(connections): WsConnections,
    user: User,
    Path(session_id): Path<Uuid>,
) -> Result<impl IntoResponse, JoinSessionError> {
    add_participant_and_notify(&pool, &connections, session_id, &user)
        .await
        .map(|_| StatusCode::OK)
        .map_err(|e| e.into())
}
