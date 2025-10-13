use crate::db::create_pg_pool;
use tokio::net::TcpListener;

mod app;
mod app_state;
mod db;
mod features;
mod games;
mod models;
mod utils;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .init();

    #[cfg(debug_assertions)]
    dotenvy::dotenv().ok();

    let pull = create_pg_pool().await;
    let app = app::create_app(pull);
    let addr = "127.0.0.1:8080";
    let listener = TcpListener::bind(addr).await.unwrap();
    println!("Сервер запущен на http://{addr}");
    axum::serve(listener, app).await.unwrap()
}
