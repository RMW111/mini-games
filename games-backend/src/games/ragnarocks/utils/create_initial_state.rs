use crate::games::ragnarocks::models::creation_data::CreationData;
use crate::games::ragnarocks::state::RagnarocksState;
use crate::models::app_error::AppError;
use serde_json::{Value, from_value};

pub fn create_initial_state(creation_data: Option<Value>) -> Result<RagnarocksState, AppError> {
    if let Some(data) = creation_data {
        let data: CreationData = match from_value(data) {
            Ok(data) => data,
            Err(_) => return Err(AppError::BadRequest("creation_data is invalid".into())),
        };

        return Ok(RagnarocksState::new(data));
    }

    Err(AppError::BadRequest("There are no creation_data".into()))
}
