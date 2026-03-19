use crate::games::ragnarocks::models::color::PlayerColor;

pub const EMPTY: u8 = 0;
pub const WHITE_VIKING: u8 = 1;
pub const RED_VIKING: u8 = 2;
pub const RUNESTONE: u8 = 3;

pub fn viking_value(color: PlayerColor) -> u8 {
    color as u8
}

pub fn is_viking(cell: u8) -> bool {
    cell == WHITE_VIKING || cell == RED_VIKING
}

pub fn is_occupied(cell: u8) -> bool {
    cell != EMPTY
}

pub fn viking_color(cell: u8) -> Option<PlayerColor> {
    match cell {
        WHITE_VIKING => Some(PlayerColor::White),
        RED_VIKING => Some(PlayerColor::Red),
        _ => None,
    }
}
