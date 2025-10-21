use crate::games::minesweeper::constants::adjacent_positions::ADJACENT_POSITIONS;
use crate::games::minesweeper::models::cell::Cell;
use crate::games::minesweeper::models::cell_state::CellState;
use rand::seq::SliceRandom;
use rand::thread_rng;
use serde::{Deserialize, Serialize};

type Grid = Vec<Vec<Cell>>;

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Board {
    pub grid: Grid,
    pub mines_count: usize,
    pub initialized: bool,
}

impl Board {
    pub fn new(rows: usize, columns: usize, mines_count: usize) -> Board {
        if mines_count >= rows * columns {
            panic!("Количество мин должно быть меньше доступных клеток!");
        }
        Self {
            mines_count,
            grid: vec![vec![Cell::default(); columns]; rows],
            initialized: false,
        }
    }

    pub fn on_cell_click(&mut self, row: usize, col: usize) {
        if !self.initialized {
            self.initialize(row, col);
        }

        if let Some(cell) = self.get_cell_mut(row, col) {
            if cell.state == CellState::Opened || cell.state == CellState::Flagged {
                return;
            }

            cell.open_cell();

            if cell.has_mine {
                self.reveal_closed_mines();
            } else if cell.mines_around == 0 {
                self.reveal_area(row, col);
            }
        }
    }

    pub fn toggle_flagged(&mut self, row_index: usize, col_index: usize) {
        self.grid[row_index][col_index].toggle_flagged();
    }

    pub fn on_num_click(&mut self, row: usize, col: usize) -> Option<()> {
        if let Some(cell) = self.grid.get(row).and_then(|row| row.get(col)) {
            if cell.state != CellState::Opened || cell.mines_around < 1 {
                return None;
            }

            let coords = get_adjacent_coords(&self.grid, row, col);

            let mut adjacent_closed_coords = vec![];
            let mut adjacent_flagged_coords = vec![];
            let mut has_mine_in_closed_cells = false;
            for coords in coords {
                let cell = self
                    .grid
                    .get(coords.0)
                    .and_then(|row| row.get(coords.1))
                    .unwrap();
                if cell.state == CellState::Closed {
                    adjacent_closed_coords.push(coords);
                    if cell.has_mine {
                        has_mine_in_closed_cells = true;
                    }
                } else if cell.state == CellState::Flagged {
                    adjacent_flagged_coords.push(coords);
                }
            }

            if cell.mines_around as usize != adjacent_flagged_coords.len() {
                return None;
            }
            if adjacent_closed_coords.is_empty() {
                return None;
            }

            for (row, col) in adjacent_closed_coords {
                let cell_to_open = self.get_cell_mut(row, col).unwrap();
                cell_to_open.state = CellState::Opened;
            }

            if has_mine_in_closed_cells {
                self.reveal_closed_mines();
            }

            return Some(());
        }

        None
    }

    fn initialize(&mut self, row: usize, col: usize) {
        fill_with_mines(&mut self.grid, self.mines_count, (row, col));
        fill_with_numbers(&mut self.grid);
        self.initialized = true;
        self.on_cell_click(row, col);
    }

    fn reveal_closed_mines(&mut self) {
        self.grid
            .iter_mut()
            .flatten()
            .filter(|cell| cell.has_mine && cell.state == CellState::Closed)
            .for_each(|cell| cell.state = CellState::Opened);
    }

    fn get_cell_mut(&mut self, row_index: usize, col_index: usize) -> Option<&mut Cell> {
        self.grid.get_mut(row_index)?.get_mut(col_index)
    }

    fn reveal_area(&mut self, start_row: usize, start_col: usize) {
        let mut to_check = vec![(start_row, start_col)];

        while let Some((row, col)) = to_check.pop() {
            for (row_i, col_i) in get_adjacent_coords(&self.grid, row, col) {
                let cell = self.get_cell_mut(row_i, col_i).unwrap();
                if cell.state == CellState::Closed {
                    cell.open_cell();
                    if cell.mines_around == 0 {
                        to_check.push((row_i, col_i));
                    }
                }
            }
        }
    }
}

fn get_adjacent_coords(grid: &Grid, row: usize, col: usize) -> Vec<(usize, usize)> {
    let mut result = vec![];

    for (offset_x, offset_y) in ADJACENT_POSITIONS {
        let row_i_opt = row.checked_add_signed(offset_x);
        let col_i_opt = col.checked_add_signed(offset_y);

        if let (Some(row_i), Some(col_i)) = (row_i_opt, col_i_opt) {
            let cell_option = grid.get(row_i).and_then(|row| row.get(col_i));
            if let Some(_) = cell_option {
                result.push((row_i, col_i));
            }
        }
    }

    result
}

fn fill_with_mines(grid: &mut Grid, mines_count: usize, except: (usize, usize)) {
    let mut positions: Vec<(usize, usize)> = vec![];

    for row in 0..grid.len() {
        for col in 0..grid[0].len() {
            let (except_row, except_col) = except;
            if row == except_row && col == except_col {
                continue;
            }
            positions.push((row, col));
        }
    }

    let mut renge = thread_rng();
    positions.shuffle(&mut renge);

    for i in 0..mines_count {
        let (row_index, col_index) = positions[i];
        grid[row_index][col_index].has_mine = true;
    }
}

fn calculate_mines_around(grid: &Grid, row_index: usize, col_index: usize) -> u8 {
    let mines_around = ADJACENT_POSITIONS
        .iter()
        .filter_map(|(offset_x, offset_y)| {
            let row_i = row_index.checked_add_signed(*offset_x)?;
            let col_i = col_index.checked_add_signed(*offset_y)?;
            let has_mine = grid.get(row_i)?.get(col_i)?.has_mine;
            has_mine.then_some(())
        })
        .count();

    mines_around as u8
}

fn fill_with_numbers(grid: &mut Grid) {
    for row_index in 0..grid.len() {
        for col_index in 0..grid[0].len() {
            if !grid[row_index][col_index].has_mine {
                grid[row_index][col_index].mines_around =
                    calculate_mines_around(grid, row_index, col_index);
            }
        }
    }
}
