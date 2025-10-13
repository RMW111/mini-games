use sqlx::postgres::{PgPool, PgPoolOptions};
use std::env;
use std::time::Duration;
use tracing::error;

pub async fn create_pg_pull() -> PgPool {
    let db_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");

    let pool_options = PgPoolOptions::new()
        .max_connections(10)
        .min_connections(1)
        .acquire_timeout(Duration::from_secs(30))
        .max_lifetime(Duration::from_secs(1800))
        .idle_timeout(Duration::from_secs(600))
        .test_before_acquire(true);

    match pool_options.connect(&db_url).await {
        Ok(pool) => pool,
        Err(e) => {
            // ЛОГИРУЕМ ОШИБКУ и завершаем программу
            error!("Не удалось подключиться к Postgres: {}", e);
            std::process::exit(1);
        }
    }
}
