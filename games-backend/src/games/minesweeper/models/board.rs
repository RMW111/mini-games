use serde::{Deserialize, Serialize};
use crate::games::minesweeper::constants::adjacent_positions::ADJACENT_POSITIONS;
use crate::games::minesweeper::models::cell::Cell;
use crate::games::minesweeper::models::cell_state::CellState;
use rand::thread_rng;
use rand::seq::SliceRandom;

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
            for (offset_x, offset_y) in ADJACENT_POSITIONS {
                let row_i_opt = row.checked_add_signed(offset_x);
                let col_i_opt = col.checked_add_signed(offset_y);

                if let (Some(row_i), Some(col_i)) = (row_i_opt, col_i_opt) {
                    let cell_option = self.grid.get_mut(row_i).and_then(|row| row.get_mut(col_i));
                    if let Some(cell) = cell_option {
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
    }
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
