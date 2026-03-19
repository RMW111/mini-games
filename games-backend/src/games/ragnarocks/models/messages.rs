use crate::utils::coords::Coords;
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Debug)]
#[serde(tag = "type", content = "payload", rename_all = "camelCase")]
pub enum RagnarocksClientMessage {
    MoveViking { from: Coords, to: Coords },
    PlaceRunestone(Coords),
    Skip,
}

#[derive(Serialize, Debug, Clone)]
#[serde(tag = "type", content = "payload", rename_all = "camelCase")]
pub enum RagnarocksServerMessage {}
