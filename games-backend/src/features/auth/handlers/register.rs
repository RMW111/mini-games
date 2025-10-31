use crate::app_state::DatabaseConnection;
use crate::features::auth::dtos::register::RegisterDTO;
use crate::models::app_error::AppError;
use crate::models::http::HTTPClient;
use crate::models::validated_json::ValidatedJson;
use crate::utils::get_message::get_message;
use argon2::password_hash::SaltString;
use argon2::password_hash::rand_core::OsRng;
use argon2::{Argon2, PasswordHasher};
use axum::{Extension, Json};
use serde_json::Value;

pub async fn register(
    DatabaseConnection(pool): DatabaseConnection,
    Extension(http_client): Extension<HTTPClient>,
    ValidatedJson(payload): ValidatedJson<RegisterDTO>,
) -> Result<Json<Value>, AppError> {
    let salt = SaltString::generate(&mut OsRng);
    let password_hash = Argon2::default()
        .hash_password(payload.password.as_bytes(), &salt)
        .map_err(|_| AppError::Internal("Hashing error".to_string()))?
        .to_string();

    let image_res = http_client
        .get("https://loremflickr.com/300/300")
        .send()
        .await
        .map_err(|e| AppError::Internal(format!("Request failed: {}", e)))?;

    sqlx::query!(
        r#"INSERT INTO users (email, password_hash, avatar_url) VALUES ($1, $2, $3)"#,
        payload.email,
        password_hash,
        image_res.url().to_string()
    )
    .execute(&pool)
    .await?;

    Ok(get_message("User registered successfully"))
}
