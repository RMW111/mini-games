use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;

#[derive(Serialize, Deserialize, Debug, Default)]
#[serde(rename_all = "camelCase")]
pub struct StatInfo {
    pub cells_opened: i32,
    pub exploded: bool,
}

pub type MinesweeperStats = HashMap<Uuid, StatInfo>;
