use sqlx::PgPool;

pub struct HandlerData {
    pub pool: PgPool,
    // pub connection_id: Uuid,
    // pub user: User,
}
