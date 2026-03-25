use std::collections::HashSet;

pub const EMPTY: u8 = 0;
pub const WHITE_VIKING: u8 = 1;
pub const RED_VIKING: u8 = 2;
pub const RUNESTONE: u8 = 3;

pub const WHITE: u8 = 1;
pub const RED: u8 = 2;

pub const SMALL_ROW_SIZES: &[usize] = &[5, 6, 7, 8, 9, 10, 11, 11, 10, 9];
pub const LARGE_ROW_SIZES: &[usize] = &[7, 8, 9, 10, 11, 12, 13, 14, 15, 15, 14, 13, 12, 11];

pub const SMALL_WHITE_VIKINGS: &[(usize, usize)] = &[(0, 1), (0, 2), (0, 3)];
pub const SMALL_RED_VIKINGS: &[(usize, usize)] = &[(9, 3), (9, 4), (9, 5)];

pub const LARGE_WHITE_VIKINGS: &[(usize, usize)] = &[(0, 1), (0, 2), (0, 3), (0, 4), (0, 5)];
pub const LARGE_RED_VIKINGS: &[(usize, usize)] = &[(13, 3), (13, 4), (13, 5), (13, 6), (13, 7)];

fn compute_left_offset(row_sizes: &[usize], row: usize) -> i32 {
    let max_len = *row_sizes.iter().max().unwrap();
    let pivot = row_sizes.iter().position(|&s| s == max_len).unwrap();
    if row <= pivot {
        pivot as i32 - row as i32
    } else {
        row as i32 - pivot as i32
    }
}

#[derive(Clone)]
pub struct Board {
    pub row_sizes: Vec<usize>,
    pub cells: Vec<Vec<u8>>,
    left_offsets: Vec<i32>,
}

impl Board {
    pub fn new(row_sizes: &[usize]) -> Self {
        let cells = row_sizes.iter().map(|&s| vec![EMPTY; s]).collect();
        let left_offsets = (0..row_sizes.len())
            .map(|i| compute_left_offset(row_sizes, i))
            .collect();
        Board {
            row_sizes: row_sizes.to_vec(),
            cells,
            left_offsets,
        }
    }

    #[inline]
    pub fn row_count(&self) -> usize {
        self.cells.len()
    }

    #[inline]
    pub fn row_size(&self, row: usize) -> usize {
        self.cells[row].len()
    }

    #[inline]
    pub fn is_valid(&self, row: usize, col: usize) -> bool {
        row < self.row_count() && col < self.row_size(row)
    }

    #[inline]
    pub fn get(&self, row: usize, col: usize) -> u8 {
        self.cells[row][col]
    }

    #[inline]
    pub fn set(&mut self, row: usize, col: usize, value: u8) {
        self.cells[row][col] = value;
    }

    pub fn get_neighbors(&self, row: usize, col: usize) -> Vec<(usize, usize)> {
        let mut result = Vec::with_capacity(6);

        // East
        if col + 1 < self.row_size(row) {
            result.push((row, col + 1));
        }
        // West
        if col > 0 {
            result.push((row, col - 1));
        }

        // Vertical neighbors
        for d_row in [-1i32, 1] {
            let nr = row as i32 + d_row;
            if nr < 0 || nr as usize >= self.row_count() {
                continue;
            }
            let nr = nr as usize;
            let shift_diff = self.left_offsets[nr] - self.left_offsets[row];
            let (nc1, nc2) = if shift_diff == -1 {
                (col as i32, col as i32 + 1)
            } else {
                (col as i32 - 1, col as i32)
            };

            let adj_size = self.row_size(nr) as i32;
            if nc1 >= 0 && nc1 < adj_size {
                result.push((nr, nc1 as usize));
            }
            if nc2 >= 0 && nc2 < adj_size {
                result.push((nr, nc2 as usize));
            }
        }

        result
    }

    pub fn step_direction(&self, row: usize, col: usize, direction: u8) -> Option<(usize, usize)> {
        match direction {
            0 => {
                // E
                let nc = col + 1;
                if nc < self.row_size(row) { Some((row, nc)) } else { None }
            }
            1 => {
                // W
                if col == 0 { return None; }
                Some((row, col - 1))
            }
            2 => {
                // NE
                if row == 0 { return None; }
                let nr = row - 1;
                let shift = self.left_offsets[nr] - self.left_offsets[row];
                let nc = if shift == -1 { col as i32 + 1 } else { col as i32 };
                if nc >= 0 && (nc as usize) < self.row_size(nr) {
                    Some((nr, nc as usize))
                } else {
                    None
                }
            }
            3 => {
                // NW
                if row == 0 { return None; }
                let nr = row - 1;
                let shift = self.left_offsets[nr] - self.left_offsets[row];
                let nc = if shift == -1 { col as i32 } else { col as i32 - 1 };
                if nc >= 0 && (nc as usize) < self.row_size(nr) {
                    Some((nr, nc as usize))
                } else {
                    None
                }
            }
            4 => {
                // SE
                let nr = row + 1;
                if nr >= self.row_count() { return None; }
                let shift = self.left_offsets[nr] - self.left_offsets[row];
                let nc = if shift == -1 { col as i32 + 1 } else { col as i32 };
                if nc >= 0 && (nc as usize) < self.row_size(nr) {
                    Some((nr, nc as usize))
                } else {
                    None
                }
            }
            5 => {
                // SW
                let nr = row + 1;
                if nr >= self.row_count() { return None; }
                let shift = self.left_offsets[nr] - self.left_offsets[row];
                let nc = if shift == -1 { col as i32 } else { col as i32 - 1 };
                if nc >= 0 && (nc as usize) < self.row_size(nr) {
                    Some((nr, nc as usize))
                } else {
                    None
                }
            }
            _ => None,
        }
    }

    pub fn cast_line(&self, row: usize, col: usize, direction: u8) -> Vec<(usize, usize)> {
        let mut result = Vec::new();
        let (mut cr, mut cc) = (row, col);
        loop {
            match self.step_direction(cr, cc, direction) {
                None => break,
                Some((nr, nc)) => {
                    if self.get(nr, nc) != EMPTY {
                        break;
                    }
                    result.push((nr, nc));
                    cr = nr;
                    cc = nc;
                }
            }
        }
        result
    }

    pub fn get_reachable_cells(&self, row: usize, col: usize) -> Vec<(usize, usize)> {
        let mut result = Vec::new();
        for d in 0..6 {
            result.extend(self.cast_line(row, col, d));
        }
        result
    }

    pub fn is_viking_nomadic(&self, row: usize, col: usize) -> bool {
        let my_val = self.get(row, col);
        if my_val != WHITE_VIKING && my_val != RED_VIKING {
            return false;
        }

        let mut visited = HashSet::new();
        let mut stack = vec![(row, col)];

        while let Some((r, c)) = stack.pop() {
            if !visited.insert((r, c)) {
                continue;
            }
            let v = self.get(r, c);
            if v == RUNESTONE {
                continue;
            }
            if (v == WHITE_VIKING || v == RED_VIKING) && v != my_val {
                return true;
            }
            for nb in self.get_neighbors(r, c) {
                if !visited.contains(&nb) {
                    stack.push(nb);
                }
            }
        }
        false
    }

    pub fn find_nomadic_vikings(&self, color: u8) -> Vec<(usize, usize)> {
        let target = if color == WHITE { WHITE_VIKING } else { RED_VIKING };
        let mut result = Vec::new();
        for row in 0..self.row_count() {
            for col in 0..self.row_size(row) {
                if self.get(row, col) == target && self.is_viking_nomadic(row, col) {
                    result.push((row, col));
                }
            }
        }
        result
    }

    pub fn find_regions(&self) -> Vec<(Vec<(usize, usize)>, HashSet<u8>)> {
        let mut visited = HashSet::new();
        let mut regions = Vec::new();

        for row in 0..self.row_count() {
            for col in 0..self.row_size(row) {
                if visited.contains(&(row, col)) {
                    continue;
                }
                if self.get(row, col) == RUNESTONE {
                    visited.insert((row, col));
                    continue;
                }

                let mut region_cells = Vec::new();
                let mut colors = HashSet::new();
                let mut stack = vec![(row, col)];

                while let Some((r, c)) = stack.pop() {
                    if !visited.insert((r, c)) {
                        continue;
                    }
                    let cell = self.get(r, c);
                    if cell == RUNESTONE {
                        continue;
                    }
                    region_cells.push((r, c));
                    if cell == WHITE_VIKING {
                        colors.insert(WHITE);
                    } else if cell == RED_VIKING {
                        colors.insert(RED);
                    }
                    for nb in self.get_neighbors(r, c) {
                        if !visited.contains(&nb) {
                            stack.push(nb);
                        }
                    }
                }
                regions.push((region_cells, colors));
            }
        }
        regions
    }

    pub fn calculate_scores(&self) -> (u32, u32) {
        let regions = self.find_regions();
        let mut white_score = 0u32;
        let mut red_score = 0u32;

        for (cells, colors) in &regions {
            if colors.len() == 1 {
                let c = *colors.iter().next().unwrap();
                if c == WHITE {
                    white_score += cells.len() as u32;
                } else {
                    red_score += cells.len() as u32;
                }
            }
        }
        (white_score, red_score)
    }

    pub fn can_player_move(&self, color: u8) -> bool {
        let viking_val = if color == WHITE { WHITE_VIKING } else { RED_VIKING };
        let nomadic = self.find_nomadic_vikings(color);

        for (vr, vc) in nomadic {
            let reachable = self.get_reachable_cells(vr, vc);
            // Stay in place: can place runestone from current pos?
            if !reachable.is_empty() {
                return true;
            }
            // Move to a reachable cell, then check if runestone can be placed
            for (tr, tc) in &reachable {
                let mut temp = self.clone();
                temp.set(vr, vc, EMPTY);
                temp.set(*tr, *tc, viking_val);
                if !temp.get_reachable_cells(*tr, *tc).is_empty() {
                    return true;
                }
            }
        }
        false
    }
}
