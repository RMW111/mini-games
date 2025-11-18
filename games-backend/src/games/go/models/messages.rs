use crate::games::go::models::color::StoneColor;
use crate::utils::coords::Coords;
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Debug)]
#[serde(tag = "type", content = "payload", rename_all = "camelCase")]
pub enum GoClientMessage {
    PlaceStone(Coords),
    Pass,
    CancelScoring,
    Resign,
    ToggleEaten(Coords),
    ApproveScore,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(tag = "type", content = "payload", rename_all = "camelCase")]
pub enum GoServerMessage {
    ScoringCanceled,
    Resigned(StoneColor),
}
