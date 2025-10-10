use sqlx::PgPool;

pub async fn create_pg_pull() -> PgPool {
    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be in .env");
    PgPool::connect(&database_url)
        .await
        .expect("Failed to connect to Postgres")
}
