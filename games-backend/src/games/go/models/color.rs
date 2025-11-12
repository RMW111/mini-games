use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Copy, Clone, PartialEq, Eq)]
#[serde(try_from = "u8", into = "u8")]
#[repr(u8)]
pub enum StoneColor {
    Black = 1,
    White = 2,
}

impl TryFrom<u8> for StoneColor {
    type Error = String;

    fn try_from(value: u8) -> Result<Self, Self::Error> {
        match value {
            1 => Ok(Self::Black),
            2 => Ok(Self::White),
            _ => Err(format!("Invalid color: {value}")),
        }
    }
}

impl From<StoneColor> for u8 {
    fn from(value: StoneColor) -> Self {
        value as u8
    }
}
