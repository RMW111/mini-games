use serde::Deserialize;

#[derive(Deserialize, Debug, Clone, Copy)]
#[serde(rename_all = "camelCase")]
pub struct GridPosition {
    pub row: usize,
    pub col: usize,
}
