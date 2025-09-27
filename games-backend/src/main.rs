use tokio::net::TcpListener;
use crate::db::create_pg_pull;

mod app;
mod db;
mod models;
mod utils;
mod features;
mod app_state;
mod games;

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();
    let pull = create_pg_pull().await;
    let app = app::create_app(pull);
    let addr = "127.0.0.1:8080";
    let listener = TcpListener::bind(addr).await.unwrap();
    println!("Сервер запущен на http://{addr}");
    axum::serve(listener, app).await.unwrap()
}
