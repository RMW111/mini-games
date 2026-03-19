use crate::games::ragnarocks::models::board::Board;
use crate::games::ragnarocks::models::cell::{self, EMPTY, RUNESTONE};
use crate::games::ragnarocks::models::color::{get_opposite_color, PlayerColor};
use crate::utils::coords::Coords;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum TurnPhase {
    MoveViking,
    PlaceRunestone,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct RagnarocksState {
    creator_color: PlayerColor,
    current_turn: PlayerColor,
    board: Board,
    last_skip: bool,
    won: Option<PlayerColor>,
    white_score: u32,
    red_score: u32,
    phase: TurnPhase,
    active_viking: Option<Coords>,
}

impl RagnarocksState {
    pub fn new() -> Self {
        let mut board = Board::new();

        // Place White Vikings on row 0 (5 cells), middle 3: cols 1, 2, 3
        board.set(Coords(0, 1), cell::WHITE_VIKING);
        board.set(Coords(0, 2), cell::WHITE_VIKING);
        board.set(Coords(0, 3), cell::WHITE_VIKING);

        // Place Red Vikings on row 9 (9 cells), middle 3: cols 3, 4, 5
        board.set(Coords(9, 3), cell::RED_VIKING);
        board.set(Coords(9, 4), cell::RED_VIKING);
        board.set(Coords(9, 5), cell::RED_VIKING);

        Self {
            creator_color: PlayerColor::White,
            current_turn: PlayerColor::White,
            board,
            last_skip: false,
            won: None,
            white_score: 0,
            red_score: 0,
            phase: TurnPhase::MoveViking,
            active_viking: None,
        }
    }

    pub fn creator_color(&self) -> PlayerColor {
        self.creator_color
    }

    pub fn is_game_over(&self) -> bool {
        self.won.is_some()
    }

    pub fn try_move_viking(
        &mut self,
        player_color: PlayerColor,
        from: Coords,
        to: Coords,
    ) -> Result<(), ()> {
        if self.is_game_over() {
            return Err(());
        }
        if player_color != self.current_turn {
            return Err(());
        }
        if self.phase != TurnPhase::MoveViking {
            return Err(());
        }
        if !self.board.is_valid(from) || !self.board.is_valid(to) {
            return Err(());
        }

        // Check the source cell has the player's viking
        let expected = cell::viking_value(player_color);
        if self.board.get(from) != expected {
            return Err(());
        }

        // Check the viking is nomadic (not in a conquered region)
        if !self.board.is_viking_nomadic(from) {
            return Err(());
        }

        // Check the target is empty
        if self.board.get(to) != EMPTY {
            return Err(());
        }

        // Check the target is reachable in a straight line
        if !self.board.can_reach_in_line(from, to) {
            return Err(());
        }

        // Move the viking
        self.board.set(from, EMPTY);
        self.board.set(to, expected);

        // Check if the viking can place a runestone from the new position
        let reachable = self.board.get_reachable_cells(to);
        if reachable.is_empty() {
            // Can't place runestone — invalid move, revert
            self.board.set(to, EMPTY);
            self.board.set(from, expected);
            return Err(());
        }

        self.phase = TurnPhase::PlaceRunestone;
        self.active_viking = Some(to);
        self.last_skip = false;

        Ok(())
    }

    pub fn try_place_runestone(
        &mut self,
        player_color: PlayerColor,
        coords: Coords,
    ) -> Result<(), ()> {
        if self.is_game_over() {
            return Err(());
        }
        if player_color != self.current_turn {
            return Err(());
        }
        if self.phase != TurnPhase::PlaceRunestone {
            return Err(());
        }

        let viking_pos = match self.active_viking {
            Some(pos) => pos,
            None => return Err(()),
        };

        if !self.board.is_valid(coords) {
            return Err(());
        }
        if self.board.get(coords) != EMPTY {
            return Err(());
        }

        // Check coords is reachable in a straight line from the active viking
        if !self.board.can_reach_in_line(viking_pos, coords) {
            return Err(());
        }

        // Place the runestone
        self.board.set(coords, RUNESTONE);

        // Update scores
        let (white_score, red_score) = self.board.calculate_scores();
        self.white_score = white_score;
        self.red_score = red_score;

        // Switch turn
        self.active_viking = None;
        self.phase = TurnPhase::MoveViking;
        self.current_turn = get_opposite_color(self.current_turn);

        // Check if next player can move; if not, they will need to skip
        // (handled by the skip action)

        Ok(())
    }

    pub fn try_skip(&mut self, player_color: PlayerColor) -> Result<(), ()> {
        if self.is_game_over() {
            return Err(());
        }
        if player_color != self.current_turn {
            return Err(());
        }
        if self.phase != TurnPhase::MoveViking {
            return Err(());
        }

        // Verify the player actually can't move
        if self.board.can_player_move(player_color) {
            return Err(());
        }

        if self.last_skip {
            // Both players skipped — game over
            let (white_score, red_score) = self.board.calculate_scores();
            self.white_score = white_score;
            self.red_score = red_score;

            if white_score > red_score {
                self.won = Some(PlayerColor::White);
            } else if red_score > white_score {
                self.won = Some(PlayerColor::Red);
            } else {
                // Tie — second player (Red) wins? Or just pick one.
                // Per standard rules, we'll say the player with more territory wins.
                // On exact tie, we can let white win (first player disadvantage offset).
                self.won = Some(PlayerColor::White);
            }
        } else {
            self.last_skip = true;
            self.current_turn = get_opposite_color(self.current_turn);
        }

        Ok(())
    }
}
