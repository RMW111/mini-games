use crate::models::validated_json::ValidatedJson;
use argon2::password_hash::SaltString;
use argon2::password_hash::rand_core::OsRng;
use argon2::{Argon2, PasswordHasher};
use axum::Json;
use serde_json::Value;
use crate::app_state::DatabaseConnection;
use crate::features::auth::dtos::register::RegisterDTO;
use crate::models::app_error::AppError;
use crate::utils::get_message::get_message;

pub async fn register(
    DatabaseConnection(pool): DatabaseConnection,
    ValidatedJson(payload): ValidatedJson<RegisterDTO>,
) -> Result<Json<Value>, AppError> {
    let salt = SaltString::generate(&mut OsRng);
    let password_hash = Argon2::default()
        .hash_password(payload.password.as_bytes(), &salt)
        .map_err(|_| AppError::Internal("Hashing error".to_string()))?
        .to_string();

    sqlx::query!(
        r#"INSERT INTO users (email, password_hash) VALUES ($1, $2)"#,
        payload.email,
        password_hash,
    )
    .execute(&pool)
    .await?;

    Ok(get_message("User registered successfully"))
}
