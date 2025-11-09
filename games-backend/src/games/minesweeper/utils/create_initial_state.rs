use crate::games::minesweeper::models::board::Board;
use crate::games::minesweeper::state::MinesweeperState;
use std::collections::HashMap;

pub fn create_initial_state() -> MinesweeperState {
    const ROWS: usize = 16;
    const COLS: usize = 30;
    const MINES: usize = 99;

    let board = Board::new(ROWS, COLS, MINES);
    let stats = HashMap::new();
    MinesweeperState { board, stats }
}
