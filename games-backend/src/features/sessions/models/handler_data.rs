use crate::models::http::HTTPClient;
use crate::models::user::User;
use sqlx::PgPool;

pub struct HandlerData {
    pub pool: PgPool,
    pub user: User,
    pub http_client: HTTPClient,
}
