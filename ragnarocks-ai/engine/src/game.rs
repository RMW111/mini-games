use crate::board::*;

pub const PHASE_MOVE: u8 = 0;
pub const PHASE_PLACE: u8 = 1;

/// Action types for the flat representation used by Python.
/// Move: (from_row, from_col, to_row, to_col) — represented as 4 i32s
/// Place: (row, col) — represented as 2 i32s
/// Skip: sentinel value
#[derive(Clone, Debug, PartialEq)]
pub enum Action {
    Move(usize, usize, usize, usize),
    Place(usize, usize),
    Skip,
}

#[derive(Clone)]
pub struct GameState {
    pub board: Board,
    pub current_turn: u8,
    pub phase: u8,
    pub active_viking: Option<(usize, usize)>,
    pub previous_viking_pos: Option<(usize, usize)>,
    pub last_skip: bool,
    pub winner: Option<u8>,
    pub white_score: u32,
    pub red_score: u32,
    pub board_size: String,
}

impl GameState {
    pub fn new(board_size: &str) -> Self {
        let (row_sizes, white_pos, red_pos) = if board_size == "small" {
            (SMALL_ROW_SIZES, SMALL_WHITE_VIKINGS, SMALL_RED_VIKINGS)
        } else {
            (LARGE_ROW_SIZES, LARGE_WHITE_VIKINGS, LARGE_RED_VIKINGS)
        };

        let mut board = Board::new(row_sizes);
        for &(r, c) in white_pos {
            board.set(r, c, WHITE_VIKING);
        }
        for &(r, c) in red_pos {
            board.set(r, c, RED_VIKING);
        }

        GameState {
            board,
            current_turn: WHITE,
            phase: PHASE_MOVE,
            active_viking: None,
            previous_viking_pos: None,
            last_skip: false,
            winner: None,
            white_score: 0,
            red_score: 0,
            board_size: board_size.to_string(),
        }
    }

    #[inline]
    pub fn is_terminal(&self) -> bool {
        self.winner.is_some()
    }

    #[inline]
    pub fn current_player(&self) -> u8 {
        self.current_turn
    }

    fn opposite(color: u8) -> u8 {
        if color == WHITE { RED } else { WHITE }
    }

    fn viking_value(color: u8) -> u8 {
        if color == WHITE { WHITE_VIKING } else { RED_VIKING }
    }

    pub fn legal_actions(&self) -> Vec<Action> {
        if self.is_terminal() {
            return Vec::new();
        }
        if self.phase == PHASE_MOVE {
            self.legal_move_actions()
        } else {
            self.legal_place_actions()
        }
    }

    fn legal_move_actions(&self) -> Vec<Action> {
        let viking_val = Self::viking_value(self.current_turn);
        let nomadic = self.board.find_nomadic_vikings(self.current_turn);
        let mut actions = Vec::new();

        for (vr, vc) in nomadic {
            let reachable = self.board.get_reachable_cells(vr, vc);
            // Stay in place
            if !reachable.is_empty() {
                actions.push(Action::Move(vr, vc, vr, vc));
            }
            // Move to each reachable cell
            for (tr, tc) in &reachable {
                let mut temp = self.board.clone();
                temp.set(vr, vc, EMPTY);
                temp.set(*tr, *tc, viking_val);
                if !temp.get_reachable_cells(*tr, *tc).is_empty() {
                    actions.push(Action::Move(vr, vc, *tr, *tc));
                }
            }
        }

        if actions.is_empty() {
            vec![Action::Skip]
        } else {
            actions
        }
    }

    fn legal_place_actions(&self) -> Vec<Action> {
        match self.active_viking {
            None => Vec::new(),
            Some((vr, vc)) => {
                self.board.get_reachable_cells(vr, vc)
                    .into_iter()
                    .map(|(r, c)| Action::Place(r, c))
                    .collect()
            }
        }
    }

    pub fn step(&self, action: &Action) -> GameState {
        let mut new = self.clone();
        new.apply(action);
        new
    }

    fn apply(&mut self, action: &Action) {
        match action {
            Action::Skip => self.apply_skip(),
            Action::Move(fr, fc, tr, tc) => self.apply_move(*fr, *fc, *tr, *tc),
            Action::Place(r, c) => self.apply_place(*r, *c),
        }
    }

    fn apply_move(&mut self, fr: usize, fc: usize, tr: usize, tc: usize) {
        let viking_val = Self::viking_value(self.current_turn);

        if fr == tr && fc == tc {
            self.phase = PHASE_PLACE;
            self.active_viking = Some((fr, fc));
            self.previous_viking_pos = Some((fr, fc));
            self.last_skip = false;
            return;
        }

        self.board.set(fr, fc, EMPTY);
        self.board.set(tr, tc, viking_val);
        self.phase = PHASE_PLACE;
        self.active_viking = Some((tr, tc));
        self.previous_viking_pos = Some((fr, fc));
        self.last_skip = false;
    }

    fn apply_place(&mut self, row: usize, col: usize) {
        self.board.set(row, col, RUNESTONE);

        let (ws, rs) = self.board.calculate_scores();
        self.white_score = ws;
        self.red_score = rs;

        self.active_viking = None;
        self.previous_viking_pos = None;
        self.phase = PHASE_MOVE;
        self.current_turn = Self::opposite(self.current_turn);
    }

    fn apply_skip(&mut self) {
        if self.last_skip {
            let (ws, rs) = self.board.calculate_scores();
            self.white_score = ws;
            self.red_score = rs;

            if ws >= rs {
                self.winner = Some(WHITE);
            } else {
                self.winner = Some(RED);
            }
        } else {
            self.last_skip = true;
            self.current_turn = Self::opposite(self.current_turn);
        }
    }

    pub fn rewards(&self) -> (f64, f64) {
        if !self.is_terminal() {
            return (0.0, 0.0);
        }
        if self.winner == Some(WHITE) {
            (1.0, -1.0)
        } else {
            (-1.0, 1.0)
        }
    }

    /// Get board cells as a flat list of rows (for Python encoding).
    pub fn get_board_cells(&self) -> &Vec<Vec<u8>> {
        &self.board.cells
    }
}
