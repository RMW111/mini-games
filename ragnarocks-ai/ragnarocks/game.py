from __future__ import annotations

from ragnarocks.board import Board
from ragnarocks.constants import (
    EMPTY, WHITE_VIKING, RED_VIKING, RUNESTONE,
    WHITE, RED,
    SMALL_ROW_SIZES, LARGE_ROW_SIZES,
    SMALL_WHITE_VIKINGS, SMALL_RED_VIKINGS,
    LARGE_WHITE_VIKINGS, LARGE_RED_VIKINGS,
)

PHASE_MOVE = "move_viking"
PHASE_PLACE = "place_runestone"

# Skip action sentinel
SKIP = "skip"


class GameState:
    def __init__(self, board_size: str = "small"):
        if board_size == "small":
            row_sizes = SMALL_ROW_SIZES
            white_positions = SMALL_WHITE_VIKINGS
            red_positions = SMALL_RED_VIKINGS
        else:
            row_sizes = LARGE_ROW_SIZES
            white_positions = LARGE_WHITE_VIKINGS
            red_positions = LARGE_RED_VIKINGS

        self.board = Board(row_sizes)
        for r, c in white_positions:
            self.board.set(r, c, WHITE_VIKING)
        for r, c in red_positions:
            self.board.set(r, c, RED_VIKING)

        self.current_turn: int = WHITE
        self.phase: str = PHASE_MOVE
        self.active_viking: tuple[int, int] | None = None
        self.previous_viking_pos: tuple[int, int] | None = None
        self.last_skip: bool = False
        self.winner: int | None = None
        self.white_score: int = 0
        self.red_score: int = 0

    def clone(self) -> GameState:
        new = GameState.__new__(GameState)
        new.board = self.board.clone()
        new.current_turn = self.current_turn
        new.phase = self.phase
        new.active_viking = self.active_viking
        new.previous_viking_pos = self.previous_viking_pos
        new.last_skip = self.last_skip
        new.winner = self.winner
        new.white_score = self.white_score
        new.red_score = self.red_score
        return new

    def is_terminal(self) -> bool:
        return self.winner is not None

    def current_player(self) -> int:
        return self.current_turn

    def _opposite(self, color: int) -> int:
        return RED if color == WHITE else WHITE

    def _viking_value(self, color: int) -> int:
        return WHITE_VIKING if color == WHITE else RED_VIKING

    def legal_actions(self) -> list:
        """Return all valid actions for the current player and phase.

        Move phase: list of (from_r, from_c, to_r, to_c) tuples.
            (from == to means stay in place)
            If no moves possible, returns [SKIP].
        Place phase: list of (row, col) tuples for runestone placement.
        """
        if self.is_terminal():
            return []

        if self.phase == PHASE_MOVE:
            return self._legal_move_actions()
        else:
            return self._legal_place_actions()

    def _legal_move_actions(self) -> list:
        viking_val = self._viking_value(self.current_turn)
        nomadic = self.board.find_nomadic_vikings(self.current_turn)
        actions: list = []

        for vr, vc in nomadic:
            # Stay in place: valid if runestone can be placed from current pos
            reachable = self.board.get_reachable_cells(vr, vc)
            if reachable:
                actions.append((vr, vc, vr, vc))

            # Move to each reachable cell, but only if runestone can be
            # placed from the new position
            for tr, tc in reachable:
                temp = self.board.clone()
                temp.set(vr, vc, EMPTY)
                temp.set(tr, tc, viking_val)
                if temp.get_reachable_cells(tr, tc):
                    actions.append((vr, vc, tr, tc))

        if not actions:
            return [SKIP]

        return actions

    def _legal_place_actions(self) -> list:
        if self.active_viking is None:
            return []
        vr, vc = self.active_viking
        return self.board.get_reachable_cells(vr, vc)

    def step(self, action) -> GameState:
        """Apply an action and return a new GameState."""
        new = self.clone()
        new._apply(action)
        return new

    def _apply(self, action) -> None:
        if self.is_terminal():
            raise ValueError("Game is already over")

        if self.phase == PHASE_MOVE:
            if action == SKIP:
                self._apply_skip()
            else:
                fr, fc, tr, tc = action
                self._apply_move(fr, fc, tr, tc)
        else:
            r, c = action
            self._apply_place(r, c)

    def _apply_move(self, fr: int, fc: int, tr: int, tc: int) -> None:
        viking_val = self._viking_value(self.current_turn)

        if fr == tr and fc == tc:
            # Stay in place
            self.phase = PHASE_PLACE
            self.active_viking = (fr, fc)
            self.previous_viking_pos = (fr, fc)
            self.last_skip = False
            return

        # Move viking
        self.board.set(fr, fc, EMPTY)
        self.board.set(tr, tc, viking_val)
        self.phase = PHASE_PLACE
        self.active_viking = (tr, tc)
        self.previous_viking_pos = (fr, fc)
        self.last_skip = False

    def _apply_place(self, row: int, col: int) -> None:
        self.board.set(row, col, RUNESTONE)

        ws, rs = self.board.calculate_scores()
        self.white_score = ws
        self.red_score = rs

        self.active_viking = None
        self.previous_viking_pos = None
        self.phase = PHASE_MOVE
        self.current_turn = self._opposite(self.current_turn)

    def _apply_skip(self) -> None:
        if self.last_skip:
            # Both players skipped — game over
            ws, rs = self.board.calculate_scores()
            self.white_score = ws
            self.red_score = rs

            if ws > rs:
                self.winner = WHITE
            elif rs > ws:
                self.winner = RED
            else:
                self.winner = WHITE  # tie goes to White
        else:
            self.last_skip = True
            self.current_turn = self._opposite(self.current_turn)

    def rewards(self) -> tuple[float, float]:
        """Returns (white_reward, red_reward). 0 if game not over."""
        if not self.is_terminal():
            return 0.0, 0.0
        if self.winner == WHITE:
            return 1.0, -1.0
        else:
            return -1.0, 1.0
