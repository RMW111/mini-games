use axum::extract::{FromRequest, Request};
use validator::Validate;
use axum::http::StatusCode;
use axum::Json;
use std::collections::HashMap;
use crate::models::error_response::ErrorResponse;
use crate::utils::validation_error_response::validation_error_response;

pub struct ValidatedJson<T>(pub T);

impl<S, T> FromRequest<S> for ValidatedJson<T>
where
    S: Send + Sync,
    T: Validate + serde::de::DeserializeOwned,
{
    type Rejection = (StatusCode, Json<ErrorResponse>);

    async fn from_request(req: Request, state: &S) -> Result<Self, Self::Rejection> {
        let Json(data) = Json::<T>::from_request(req, state).await.map_err(|err| {
            let mut errors = HashMap::new();
            errors.insert("json".to_string(), vec![format!("{}", err)]);
            (StatusCode::BAD_REQUEST, Json(ErrorResponse { errors }))
        })?;

        if let Err(errors) = data.validate() {
            return Err(validation_error_response(errors));
        }

        Ok(Self(data))
    }
}
