use crate::app_state::DatabaseConnection;
use crate::features::auth::constants::{ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE};
use crate::features::auth::dtos::login::LoginDTO;
use crate::features::auth::utils::generate_auth_tokens::generate_auth_tokens;
use crate::features::auth::utils::hash_text::hash_text;
use crate::models::app_error::AppError;
use crate::models::validated_json::ValidatedJson;
use crate::utils::get_env_var::get_env_var;
use argon2::{Argon2, PasswordHash, PasswordVerifier};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum_extra::extract::CookieJar;
use axum_extra::extract::cookie::{Cookie, SameSite};
use time::Duration;

pub async fn login(
    DatabaseConnection(pool): DatabaseConnection,
    jar: CookieJar,
    ValidatedJson(payload): ValidatedJson<LoginDTO>,
) -> Result<impl IntoResponse, AppError> {
    let user = sqlx::query!(
        "SELECT id, password_hash FROM users WHERE email = $1",
        payload.email,
    )
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::Unauthorized("Invalid credentials".into()))?;

    let parsed_hash = PasswordHash::new(&user.password_hash)
        .map_err(|_| AppError::Internal("Invalid hash format".to_string()))?;

    let password_invalid = Argon2::default()
        .verify_password(payload.password.as_bytes(), &parsed_hash)
        .is_err();

    if password_invalid {
        return Err(AppError::Unauthorized("Invalid credentials".into()));
    }

    let (access_token, refresh_token) = generate_auth_tokens(user.id.to_string());
    let refresh_token_hash = hash_text(&refresh_token);

    sqlx::query!(
        r#"
        INSERT INTO refresh_tokens (user_id, token_hash)
        VALUES ($1, $2)
        ON CONFLICT (user_id) DO UPDATE
        SET token_hash = EXCLUDED.token_hash, created_at = now()
        "#,
        user.id,
        refresh_token_hash
    )
    .execute(&pool)
    .await?;

    let auth_cookies = generate_auth_cookies(jar, &access_token, &refresh_token);
    Ok((auth_cookies, StatusCode::OK))
}

pub fn generate_auth_cookies(jar: CookieJar, access_token: &str, refresh_token: &str) -> CookieJar {
    let access_minutes = get_env_var("ACCESS_TOKEN_EXP_MIN").parse().unwrap();
    let refresh_minutes = get_env_var("REFRESH_TOKEN_EXP_MIN").parse().unwrap();

    #[cfg(debug_assertions)]
    let secure = false;

    #[cfg(not(debug_assertions))]
    let secure = true;

    jar.add(
        Cookie::build((ACCESS_TOKEN_COOKIE, access_token.to_string()))
            .http_only(true)
            .secure(secure)
            .same_site(SameSite::Lax)
            .path("/")
            .max_age(Duration::minutes(access_minutes))
            .build(),
    )
    .add(
        Cookie::build((REFRESH_TOKEN_COOKIE, refresh_token.to_string()))
            .http_only(true)
            .secure(secure)
            .same_site(SameSite::Lax)
            .path("/")
            .max_age(Duration::minutes(refresh_minutes))
            .build(),
    )
}
