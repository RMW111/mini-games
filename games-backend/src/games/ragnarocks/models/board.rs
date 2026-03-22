use crate::games::ragnarocks::models::cell::{
    self, EMPTY, RUNESTONE, is_occupied, viking_color,
};
use crate::games::ragnarocks::models::color::PlayerColor;
use crate::games::ragnarocks::models::creation_data::BoardSize;
use crate::utils::coords::Coords;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;

/// Row sizes for the small board (10 rows, 86 total hexes).
pub const SMALL_ROW_SIZES: &[usize] = &[5, 6, 7, 8, 9, 10, 11, 11, 10, 9];

/// Row sizes for the large board (14 rows, 164 total hexes).
pub const LARGE_ROW_SIZES: &[usize] = &[7, 8, 9, 10, 11, 12, 13, 14, 15, 15, 14, 13, 12, 11];

pub fn row_sizes_for(board_size: BoardSize) -> &'static [usize] {
    match board_size {
        BoardSize::Small => SMALL_ROW_SIZES,
        BoardSize::Large => LARGE_ROW_SIZES,
    }
}

/// Compute the left offset for a given row based on the board structure.
/// The pivot is the first row with the maximum width; it has offset 0.
fn compute_left_offset(row_sizes: &[usize], row: usize) -> i32 {
    let max_len = row_sizes.iter().copied().max().unwrap_or(0);
    let pivot = row_sizes.iter().position(|&s| s == max_len).unwrap_or(0);
    if row <= pivot {
        (pivot - row) as i32
    } else {
        (row - pivot) as i32
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Board(Vec<Vec<u8>>);

impl Board {
    pub fn new(row_sizes: &[usize]) -> Self {
        let rows: Vec<Vec<u8>> = row_sizes.iter().map(|&size| vec![EMPTY; size]).collect();
        Self(rows)
    }

    pub fn row_count(&self) -> usize {
        self.0.len()
    }

    pub fn row_size(&self, row: usize) -> usize {
        self.0[row].len()
    }

    fn row_sizes(&self) -> Vec<usize> {
        self.0.iter().map(|r| r.len()).collect()
    }

    fn left_offset(&self, row: usize) -> i32 {
        compute_left_offset(&self.row_sizes(), row)
    }

    pub fn is_valid(&self, coords: Coords) -> bool {
        coords.0 < self.row_count() && coords.1 < self.row_size(coords.0)
    }

    pub fn get(&self, coords: Coords) -> u8 {
        self.0[coords.0][coords.1]
    }

    pub fn set(&mut self, coords: Coords, value: u8) {
        self.0[coords.0][coords.1] = value;
    }

    /// Get all valid neighbors of a hex cell.
    pub fn get_neighbors(&self, coords: Coords) -> Vec<Coords> {
        let row = coords.0 as i32;
        let col = coords.1 as i32;
        let mut result = Vec::new();

        // East (same row, col+1)
        let east = Coords(coords.0, coords.1 + 1);
        if coords.1 + 1 < self.row_size(coords.0) {
            result.push(east);
        }

        // West (same row, col-1)
        if coords.1 > 0 {
            result.push(Coords(coords.0, coords.1 - 1));
        }

        // Vertical neighbors (NE, NW, SE, SW)
        for d_row in [-1i32, 1i32] {
            let new_row = row + d_row;
            if new_row < 0 || new_row >= self.row_count() as i32 {
                continue;
            }
            let nr = new_row as usize;
            let shift_diff = self.left_offset(nr) - self.left_offset(coords.0);

            let (nc1, nc2) = if shift_diff == -1 {
                (col, col + 1)
            } else {
                (col - 1, col)
            };

            let adj_size = self.row_size(nr) as i32;
            if nc1 >= 0 && nc1 < adj_size {
                result.push(Coords(nr, nc1 as usize));
            }
            if nc2 >= 0 && nc2 < adj_size {
                result.push(Coords(nr, nc2 as usize));
            }
        }

        result
    }

    /// Get all cells reachable in a straight line from `from` in all 6 directions.
    /// Stops at the first occupied cell or board edge (does not include occupied cells).
    pub fn get_reachable_cells(&self, from: Coords) -> Vec<Coords> {
        let mut result = Vec::new();
        for dir in 0..6 {
            let cells = self.cast_line(from, dir);
            result.extend(cells);
        }
        result
    }

    /// Cast a line from `from` in the given direction (0-5).
    /// Returns all empty cells along the line until hitting an obstacle or edge.
    /// Directions: 0=E, 1=W, 2=NE, 3=NW, 4=SE, 5=SW
    pub fn cast_line(&self, from: Coords, direction: usize) -> Vec<Coords> {
        let mut result = Vec::new();
        let mut current = from;

        loop {
            match self.step(current, direction) {
                Some(next) => {
                    if is_occupied(self.get(next)) {
                        break;
                    }
                    result.push(next);
                    current = next;
                }
                None => break,
            }
        }

        result
    }

    /// Take one step from `pos` in the given direction. Returns None if off-board.
    /// Directions: 0=E, 1=W, 2=NE, 3=NW, 4=SE, 5=SW
    fn step(&self, pos: Coords, direction: usize) -> Option<Coords> {
        let row = pos.0 as i32;
        let col = pos.1 as i32;

        let (new_row, new_col) = match direction {
            0 => (row, col + 1),     // E
            1 => (row, col - 1),     // W
            2 => {
                // NE: row-1, column depends on shift
                let nr = row - 1;
                if nr < 0 {
                    return None;
                }
                let shift_diff = self.left_offset(nr as usize) - self.left_offset(pos.0);
                let nc = if shift_diff == -1 { col + 1 } else { col };
                (nr, nc)
            }
            3 => {
                // NW: row-1, column depends on shift
                let nr = row - 1;
                if nr < 0 {
                    return None;
                }
                let shift_diff = self.left_offset(nr as usize) - self.left_offset(pos.0);
                let nc = if shift_diff == -1 { col } else { col - 1 };
                (nr, nc)
            }
            4 => {
                // SE: row+1, column depends on shift
                let nr = row + 1;
                if nr >= self.row_count() as i32 {
                    return None;
                }
                let shift_diff = self.left_offset(nr as usize) - self.left_offset(pos.0);
                let nc = if shift_diff == -1 { col + 1 } else { col };
                (nr, nc)
            }
            5 => {
                // SW: row+1, column depends on shift
                let nr = row + 1;
                if nr >= self.row_count() as i32 {
                    return None;
                }
                let shift_diff = self.left_offset(nr as usize) - self.left_offset(pos.0);
                let nc = if shift_diff == -1 { col } else { col - 1 };
                (nr, nc)
            }
            _ => return None,
        };

        if new_row < 0 || new_row >= self.row_count() as i32 {
            return None;
        }
        if new_col < 0 || new_col >= self.row_size(new_row as usize) as i32 {
            return None;
        }

        Some(Coords(new_row as usize, new_col as usize))
    }

    /// Check if a cell's line of sight can reach `target` from `from`.
    pub fn can_reach_in_line(&self, from: Coords, target: Coords) -> bool {
        for dir in 0..6 {
            let cells = self.cast_line(from, dir);
            if cells.contains(&target) {
                return true;
            }
        }
        false
    }

    /// Find all regions on the board.
    /// A region is a connected set of cells not separated by runestones.
    /// Returns a list of (cells, viking_colors_in_region).
    pub fn find_regions(&self) -> Vec<(Vec<Coords>, HashSet<PlayerColor>)> {
        let mut visited = HashSet::new();
        let mut regions = Vec::new();

        for row in 0..self.row_count() {
            for col in 0..self.row_size(row) {
                let coords = Coords(row, col);
                if visited.contains(&coords) {
                    continue;
                }
                if self.get(coords) == RUNESTONE {
                    visited.insert(coords);
                    continue;
                }

                // Flood fill to find this region
                let mut region_cells = Vec::new();
                let mut colors = HashSet::new();
                let mut stack = vec![coords];

                while let Some(pos) = stack.pop() {
                    if visited.contains(&pos) {
                        continue;
                    }
                    let cell = self.get(pos);
                    if cell == RUNESTONE {
                        continue;
                    }

                    visited.insert(pos);
                    region_cells.push(pos);

                    if let Some(color) = viking_color(cell) {
                        colors.insert(color);
                    }

                    for neighbor in self.get_neighbors(pos) {
                        if !visited.contains(&neighbor) {
                            stack.push(neighbor);
                        }
                    }
                }

                regions.push((region_cells, colors));
            }
        }

        regions
    }

    /// Check if a viking at the given position is nomadic (in a contested/wild region).
    /// A viking is settled if it's in a region containing only its own color.
    pub fn is_viking_nomadic(&self, coords: Coords) -> bool {
        let cell = self.get(coords);
        let color = match viking_color(cell) {
            Some(c) => c,
            None => return false,
        };

        let mut visited = HashSet::new();
        let mut stack = vec![coords];

        while let Some(pos) = stack.pop() {
            if visited.contains(&pos) {
                continue;
            }
            let c = self.get(pos);
            if c == RUNESTONE {
                continue;
            }
            visited.insert(pos);

            // If we find an enemy viking in this region, our viking is nomadic
            if let Some(vc) = viking_color(c) {
                if vc != color {
                    return true;
                }
            }

            for neighbor in self.get_neighbors(pos) {
                if !visited.contains(&neighbor) {
                    stack.push(neighbor);
                }
            }
        }

        // Only our color or empty cells found — this is a conquered region, viking is settled
        false
    }

    /// Find all nomadic vikings of a given color.
    pub fn find_nomadic_vikings(&self, color: PlayerColor) -> Vec<Coords> {
        let target = cell::viking_value(color);
        let mut result = Vec::new();

        for row in 0..self.row_count() {
            for col in 0..self.row_size(row) {
                let coords = Coords(row, col);
                if self.get(coords) == target && self.is_viking_nomadic(coords) {
                    result.push(coords);
                }
            }
        }

        result
    }

    /// Check if a player can make any move (has a nomadic viking that can move
    /// or stay in place, and then place a runestone).
    pub fn can_player_move(&self, color: PlayerColor) -> bool {
        let nomadic = self.find_nomadic_vikings(color);

        for viking_pos in &nomadic {
            // Check "stay in place": can place runestone from current position?
            let stay_targets = self.get_reachable_cells(*viking_pos);
            if !stay_targets.is_empty() {
                return true;
            }

            // Check actual moves
            let move_targets = self.get_reachable_cells(*viking_pos);
            for target in &move_targets {
                let mut temp_board = self.clone();
                temp_board.set(*viking_pos, EMPTY);
                temp_board.set(*target, cell::viking_value(color));
                let runestone_targets = temp_board.get_reachable_cells(*target);
                if !runestone_targets.is_empty() {
                    return true;
                }
            }
        }

        false
    }

    /// Calculate scores: returns (white_score, red_score).
    /// A conquered region (only one color's vikings) scores = number of non-runestone cells.
    pub fn calculate_scores(&self) -> (u32, u32) {
        let regions = self.find_regions();
        let mut white_score: u32 = 0;
        let mut red_score: u32 = 0;

        for (cells, colors) in &regions {
            if colors.len() == 1 {
                let color = colors.iter().next().unwrap();
                let score = cells.len() as u32;
                match color {
                    PlayerColor::White => white_score += score,
                    PlayerColor::Red => red_score += score,
                }
            }
        }

        (white_score, red_score)
    }
}
