use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Copy, Clone, PartialEq, Eq, Hash)]
#[serde(try_from = "u8", into = "u8")]
#[repr(u8)]
pub enum PlayerColor {
    White = 1,
    Red = 2,
}

impl TryFrom<u8> for PlayerColor {
    type Error = String;

    fn try_from(value: u8) -> Result<Self, Self::Error> {
        match value {
            1 => Ok(Self::White),
            2 => Ok(Self::Red),
            _ => Err(format!("Invalid color: {value}")),
        }
    }
}

impl From<PlayerColor> for u8 {
    fn from(value: PlayerColor) -> Self {
        value as u8
    }
}

pub fn get_opposite_color(color: PlayerColor) -> PlayerColor {
    match color {
        PlayerColor::White => PlayerColor::Red,
        PlayerColor::Red => PlayerColor::White,
    }
}
