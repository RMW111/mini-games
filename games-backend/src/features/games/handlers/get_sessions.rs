use crate::app_state::DatabaseConnection;
use crate::features::sessions::dtos::participant::ParticipantDTO;
use crate::features::sessions::dtos::session::SessionDTO;
use crate::models::app_error::AppError;
use crate::models::session::SessionStatus;
use axum::Json;
use axum::extract::Path;
use axum::response::IntoResponse;
use axum_extra::extract::Query;
use serde::Deserialize;
use serde_json::Value;
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct GetSessionsQuery {
    #[serde(default = "default_page")]
    pub page: u32,

    #[serde(default = "default_size")]
    pub size: u32,

    pub excluded_statuses: Option<Vec<SessionStatus>>,
    pub user_id: Option<Uuid>,
}

fn default_page() -> u32 {
    1
}

fn default_size() -> u32 {
    10
}

#[derive(FromRow, Debug)]
struct SessionQueryResult {
    id: Uuid,
    status: SessionStatus,
    game_state: Value,
    participants: sqlx::types::Json<Vec<ParticipantDTO>>,
}

pub async fn get_sessions(
    DatabaseConnection(pool): DatabaseConnection,
    Path(slug): Path<String>,
    // todo спросить у нейронки как это работает что при смене типа меняется то, как работает код
    Query(query): Query<GetSessionsQuery>,
) -> Result<impl IntoResponse, AppError> {
    let page = query.page;
    let size = query.size;
    let offset = if page > 0 { (page - 1) * size } else { 0 };

    let excluded_statuses = query.excluded_statuses.unwrap_or_default();

    let sessions_result = sqlx::query_as!(
        SessionQueryResult,
        r#"
        SELECT gs.id, gs.status as "status: _", gs.game_state,
        COALESCE(
            json_agg(
                json_build_object(
                    'userId', sp.user_id,
                    'email', u.email,
                    'role', sp.role
                )
                ORDER BY sp.joined_at
            ) FILTER (WHERE sp.id IS NOT NULL),
            '[]'::json
        ) as "participants!: _"
        FROM game_sessions gs
        JOIN games g ON gs.game_id = g.id
        LEFT JOIN session_participants sp ON gs.id = sp.session_id
        LEFT JOIN users u ON sp.user_id = u.id
                WHERE
            g.slug = $1
            AND NOT (gs.status = ANY($2))
            AND (
                $3::uuid IS NULL -- Эта часть истинна, если userId не передан
                OR EXISTS (     -- Эта часть проверяется, только если userId передан
                    SELECT 1
                    FROM session_participants sp_check
                    WHERE sp_check.session_id = gs.id AND sp_check.user_id = $3
                )
            )
        GROUP BY gs.id
        ORDER BY gs.created_at DESC
        LIMIT $4
        OFFSET $5
        "#,
        slug,
        &excluded_statuses as &[SessionStatus],
        query.user_id,
        size as i64,
        offset as i64
    )
    .fetch_all(&pool)
    .await?;

    let sessions_dto: Vec<SessionDTO> = sessions_result
        .into_iter()
        .map(|s| SessionDTO {
            id: s.id,
            status: s.status,
            game_state: s.game_state,
            participants: s.participants.0,
        })
        .collect();

    Ok(Json(sessions_dto))
}
