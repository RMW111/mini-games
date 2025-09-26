use crate::games::minesweeper::models::board::Board;
use crate::games::minesweeper::state::MinesweeperState;

pub fn create_initial_state() -> MinesweeperState {
    const ROWS: usize = 16;
    const COLS: usize = 30;
    const MINES: usize = 99;

    let board = Board::new(ROWS, COLS, MINES);
    MinesweeperState { board }
}
