use crate::features::auth::constants::{ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE};
use crate::features::auth::utils::hash_text::hash_text;
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum_extra::extract::cookie::Cookie;
use axum_extra::extract::CookieJar;
use crate::app_state::DatabaseConnection;

pub async fn logout(
    DatabaseConnection(pool): DatabaseConnection,
    jar: CookieJar,
) -> impl IntoResponse {
    if let Some(cookie) = jar.get(REFRESH_TOKEN_COOKIE) {
        let refresh_token_hash = hash_text(cookie.value());
        let _ = sqlx::query!(
            "DELETE FROM refresh_tokens WHERE token_hash = $1",
            refresh_token_hash
        )
        .execute(&pool)
        .await;
    }

    let cleared_jar = jar
        .remove(Cookie::build((ACCESS_TOKEN_COOKIE, "")).path("/").build())
        .remove(Cookie::build((REFRESH_TOKEN_COOKIE, "")).path("/").build());

    (cleared_jar, StatusCode::OK)
}
