use crate::games::go::models::color::StoneColor;

pub fn get_opposite_color(color: StoneColor) -> StoneColor {
    if color == StoneColor::White {
        StoneColor::Black
    } else {
        StoneColor::White
    }
}
