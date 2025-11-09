use crate::games::go::models::color::StoneColor;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct GoState {
    pub creator_color: StoneColor,
    pub board: Vec<Vec<u8>>,
}
