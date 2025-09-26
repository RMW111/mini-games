use crate::features::auth::constants::{ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE};
use crate::features::auth::handlers::login::generate_auth_cookies;
use crate::features::auth::utils::generate_auth_tokens::generate_auth_tokens;
use crate::features::auth::utils::hash_text::hash_text;
use crate::features::auth::utils::jwt::validate_jwt;
use crate::models::app_error::AppError;
use crate::models::user::User;
use axum::body::Body;
use axum::extract::State;
use axum::http::header::SET_COOKIE;
use axum::http::{Request};
use axum::middleware::Next;
use axum::response::IntoResponse;
use axum_extra::extract::CookieJar;
use sqlx::PgPool;
use uuid::Uuid;

async fn fetch_user_from_db(pool: &PgPool, user_id_str: &str) -> Result<User, AppError> {
    let user_id = user_id_str
        .parse::<Uuid>()
        .map_err(|_| AppError::Unauthorized("Invalid user ID format in token".into()))?;

    let user = sqlx::query_as!(User, "SELECT id, email FROM users WHERE id = $1", user_id)
        .fetch_optional(pool)
        .await?
        .ok_or_else(|| AppError::NotFound("User from token not found".into()))?;

    Ok(user)
}

pub async fn require_auth(
    State(pool): State<PgPool>,
    jar: CookieJar,
    mut req: Request<Body>,
    next: Next,
) -> Result<impl IntoResponse, AppError> {
    if let Some(cookie) = jar.get(ACCESS_TOKEN_COOKIE) {
        if let Ok(claims) = validate_jwt(cookie.value()) {
            let user = fetch_user_from_db(&pool, &claims.sub).await?;
            req.extensions_mut().insert(user);
            return Ok(next.run(req).await);
        }
    }

    let refresh_token = match jar.get(REFRESH_TOKEN_COOKIE) {
        Some(c) => c.value().to_owned(),
        None => {
            return Err(AppError::Unauthorized("No access/refresh token".into()));
        }
    };

    let Ok(claims) = validate_jwt(&refresh_token) else {
        return Err(AppError::Unauthorized("Invalid or expired token".into()));
    };

    let user_id = claims.sub.clone();
    let refresh_token_hash = hash_text(&refresh_token);

    let token_exists = sqlx::query_scalar!(
        "SELECT EXISTS(SELECT 1 FROM refresh_tokens WHERE user_id = $1 AND token_hash = $2)",
        user_id.parse::<Uuid>().unwrap(),
        refresh_token_hash,
    )
    .fetch_one(&pool)
    .await?
    .unwrap_or(false);

    if !token_exists {
        return Err(AppError::Unauthorized("Invalid refresh token".into()));
    }

    let (new_access, new_refresh) = generate_auth_tokens(user_id.clone());

    sqlx::query!(
        r#"
        UPDATE refresh_tokens
        SET token_hash = $1, created_at = now()
        WHERE user_id = $2 AND token_hash = $3
        "#,
        hash_text(&new_refresh),
        user_id.parse::<uuid::Uuid>().unwrap(),
        refresh_token_hash,
    )
    .execute(&pool)
    .await?;

    let new_jar = generate_auth_cookies(jar, &new_access, &new_refresh);

    let user = fetch_user_from_db(&pool, &claims.sub).await?;
    req.extensions_mut().insert(user);
    let mut response = next.run(req).await;

    for cookie in new_jar.iter() {
        response
            .headers_mut()
            .append(SET_COOKIE, cookie.to_string().parse().unwrap());
    }

    Ok(response)
}
