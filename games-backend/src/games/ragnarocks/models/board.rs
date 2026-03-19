use crate::games::ragnarocks::models::cell::{
    self, EMPTY, RUNESTONE, is_occupied, viking_color,
};
use crate::games::ragnarocks::models::color::PlayerColor;
use crate::utils::coords::Coords;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;

/// Row sizes for the Ragnarocks board (10 rows, 86 total hexes).
/// Row 0 = 5 cells (White start), Row 9 = 9 cells (Red start).
pub const ROW_SIZES: [usize; 10] = [5, 6, 7, 8, 9, 10, 11, 11, 10, 9];

/// The 6 hex directions for pointy-top hexagons.
/// Each direction is represented as a function that computes the neighbor
/// given the current (row, col) position, returning None if out of bounds.
///
/// Board layout (pointy-top, each row shifts left relative to previous for rows 1-6,
/// then row 7 shifts right relative to row 6, and rows 8-9 continue shifting right):
///
/// ```text
///       [0][1][2][3][4]              (Row 0: 5)
///      [0][1][2][3][4][5]            (Row 1: 6)
///     [0][1][2][3][4][5][6]          (Row 2: 7)
///    [0][1][2][3][4][5][6][7]        (Row 3: 8)
///   [0][1][2][3][4][5][6][7][8]      (Row 4: 9)
///  [0][1][2][3][4][5][6][7][8][9]    (Row 5: 10)
/// [0][1][2][3][4][5][6][7][8][9][10] (Row 6: 11)
///  [0][1][2][3][4][5][6][7][8][9][10](Row 7: 11)
///   [0][1][2][3][4][5][6][7][8][9]   (Row 8: 10)
///    [0][1][2][3][4][5][6][7][8]     (Row 9: 9)
/// ```
///
/// To determine neighbors we need to understand the pixel-offset of each row.
/// Let's define the "left offset" of each row in half-hex units relative to Row 6 (the leftmost):
///   Row 0: offset 6 (shifted right by 6 half-hexes relative to row 6)
///   Row 1: offset 5
///   Row 2: offset 4
///   Row 3: offset 3
///   Row 4: offset 2
///   Row 5: offset 1
///   Row 6: offset 0
///   Row 7: offset 1
///   Row 8: offset 2
///   Row 9: offset 3
///
/// For pointy-top hexagons where each successive row shifts by 0.5 hex,
/// moving to a neighbor row means the column index relationship depends on the
/// relative shift between the two rows.
///
/// If moving from row r to row r±1:
///   shift_diff = LEFT_OFFSETS[r±1] - LEFT_OFFSETS[r]
///   If shift_diff == -1 (next row extends further left):
///     NE/NW or SE/SW neighbors: col stays same or col-1
///   If shift_diff == +1 (next row is indented right):
///     NE/NW or SE/SW neighbors: col stays same or col+1

const LEFT_OFFSETS: [i32; 10] = [6, 5, 4, 3, 2, 1, 0, 1, 2, 3];

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Board(Vec<Vec<u8>>);

impl Board {
    pub fn new() -> Self {
        let rows: Vec<Vec<u8>> = ROW_SIZES.iter().map(|&size| vec![EMPTY; size]).collect();
        Self(rows)
    }

    pub fn row_count(&self) -> usize {
        self.0.len()
    }

    pub fn row_size(&self, row: usize) -> usize {
        self.0[row].len()
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
            let shift_diff = LEFT_OFFSETS[nr] - LEFT_OFFSETS[coords.0];

            // When moving to an adjacent row, each cell in the current row
            // aligns with two cells in the adjacent row.
            // If shift_diff == -1 (adjacent row extends further left):
            //   The two diagonal neighbors are at col and col+1
            // If shift_diff == +1 (adjacent row is indented right):
            //   The two diagonal neighbors are at col-1 and col

            let (nc1, nc2) = if shift_diff == -1 {
                (col, col + 1)
            } else {
                // shift_diff == +1
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
                let shift_diff = LEFT_OFFSETS[nr as usize] - LEFT_OFFSETS[pos.0];
                let nc = if shift_diff == -1 { col + 1 } else { col };
                (nr, nc)
            }
            3 => {
                // NW: row-1, column depends on shift
                let nr = row - 1;
                if nr < 0 {
                    return None;
                }
                let shift_diff = LEFT_OFFSETS[nr as usize] - LEFT_OFFSETS[pos.0];
                let nc = if shift_diff == -1 { col } else { col - 1 };
                (nr, nc)
            }
            4 => {
                // SE: row+1, column depends on shift
                let nr = row + 1;
                if nr >= self.row_count() as i32 {
                    return None;
                }
                let shift_diff = LEFT_OFFSETS[nr as usize] - LEFT_OFFSETS[pos.0];
                let nc = if shift_diff == -1 { col + 1 } else { col };
                (nr, nc)
            }
            5 => {
                // SW: row+1, column depends on shift
                let nr = row + 1;
                if nr >= self.row_count() as i32 {
                    return None;
                }
                let shift_diff = LEFT_OFFSETS[nr as usize] - LEFT_OFFSETS[pos.0];
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
    /// and then place a runestone).
    pub fn can_player_move(&self, color: PlayerColor) -> bool {
        let nomadic = self.find_nomadic_vikings(color);

        for viking_pos in &nomadic {
            let move_targets = self.get_reachable_cells(*viking_pos);
            for target in &move_targets {
                // Temporarily move viking to check if runestone can be placed
                // We need at least one reachable cell from the new position
                // (excluding the original viking position which is now empty)
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
