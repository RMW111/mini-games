use crate::games::go::models::creation_data::CreationData;
use crate::games::go::state::GoState;
use crate::models::app_error::AppError;
use serde_json::{Value, from_value};

pub fn create_initial_state(creation_data: Option<Value>) -> Result<GoState, AppError> {
    if let Some(data) = creation_data {
        let data: CreationData = match from_value(data) {
            Ok(data) => data,
            Err(_) => return Err(AppError::BadRequest("creation_data is invalid".into())),
        };

        let board_size = data.board_size;
        if board_size != 9 && board_size != 13 && board_size != 19 {
            return Err(AppError::BadRequest("invalid board_size".into()));
        }

        return Ok(GoState::new(data));
    }

    Err(AppError::BadRequest("There are no creation_data".into()))
}
