use std::time::Duration;
use sqlx::PgPool;
use sqlx::postgres::PgPoolOptions;

pub async fn create_pg_pull() -> PgPool {
    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be in .env");

    PgPoolOptions::new()
        .max_connections(10) // Установите максимальное количество соединений
        .min_connections(1)  // Поддерживать минимум 1 соединение активным
        .acquire_timeout(Duration::from_secs(8)) // Таймаут на получение соединения из пула
        .max_lifetime(Duration::from_secs(1800)) // Пересоздавать соединение каждые 30 минут (ВАЖНО!)
        .idle_timeout(Duration::from_secs(600)) // Закрывать неиспользуемые соединения через 10 минут (ВАЖНО!)
        .test_before_acquire(true) // Проверять соединение перед использованием (немного медленнее, но очень надежно)
        .connect(&database_url)
        .await
        .expect("Failed to create Postgres pull")

}
