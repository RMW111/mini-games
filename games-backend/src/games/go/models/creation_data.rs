use crate::games::go::models::color::StoneColor;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CreationData {
    pub board_size: u8,
    pub color: StoneColor,
}
