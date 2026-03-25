"""Board state → tensor encoding and action ↔ index mapping.

The hex board is embedded into a rectangular grid (rows × max_cols).
Padded cells are marked as invalid.

Board tensor channels (6 total):
  0: current player's vikings
  1: opponent's vikings
  2: runestones
  3: empty cells
  4: valid cell mask (1 = real cell, 0 = padding)
  5: phase indicator (1 = move phase, 0 = place phase)

Action encoding (flat integer index):
  Move phase:  from_pos * grid_size + to_pos  (includes stay-in-place)
  Place phase: grid_size² + pos
  Skip:        grid_size² + grid_size
"""

from __future__ import annotations

import numpy as np
try:
    from ragnarocks_engine import GameState, PHASE_MOVE, SKIP, WHITE_VIKING, RED_VIKING, RUNESTONE, EMPTY, WHITE
    _USE_RUST = True
except ImportError:
    from ragnarocks.game import GameState, PHASE_MOVE, SKIP
    from ragnarocks.constants import WHITE_VIKING, RED_VIKING, RUNESTONE, EMPTY, WHITE
    _USE_RUST = False


class BoardEncoder:
    def __init__(self, row_sizes: tuple[int, ...]):
        self.row_sizes = row_sizes
        self.num_rows = len(row_sizes)
        self.max_cols = max(row_sizes)
        self.grid_size = self.num_rows * self.max_cols

        # Precompute valid cell mask and coordinate mappings
        self.valid_mask = np.zeros((self.num_rows, self.max_cols), dtype=np.float32)
        self._cell_to_flat: dict[tuple[int, int], int] = {}
        self._flat_to_cell: dict[int, tuple[int, int]] = {}

        for r in range(self.num_rows):
            for c in range(row_sizes[r]):
                self.valid_mask[r, c] = 1.0
                flat = r * self.max_cols + c
                self._cell_to_flat[(r, c)] = flat
                self._flat_to_cell[flat] = (r, c)

        # Action space sizes
        self.num_move_actions = self.grid_size * self.grid_size
        self.num_place_actions = self.grid_size
        self.num_skip = 1
        self.total_actions = self.num_move_actions + self.num_place_actions + self.num_skip
        self.skip_action_idx = self.total_actions - 1

    def cell_to_flat(self, row: int, col: int) -> int:
        return row * self.max_cols + col

    def flat_to_cell(self, flat: int) -> tuple[int, int]:
        return flat // self.max_cols, flat % self.max_cols

    def encode_state(self, state) -> np.ndarray:
        """Encode game state as a (6, num_rows, max_cols) float32 tensor."""
        board = state.board
        current = state.current_player()
        is_white = current == WHITE

        tensor = np.zeros((6, self.num_rows, self.max_cols), dtype=np.float32)

        # board is list[list[int]] from Rust, or Board object from Python
        if isinstance(board, list):
            rows = board
        else:
            rows = [[board.get(r, c) for c in range(board.row_size(r))]
                    for r in range(board.row_count)]

        for r in range(len(rows)):
            row = rows[r]
            for c in range(len(row)):
                cell = row[c]
                if cell == WHITE_VIKING:
                    ch = 0 if is_white else 1
                    tensor[ch, r, c] = 1.0
                elif cell == RED_VIKING:
                    ch = 0 if not is_white else 1
                    tensor[ch, r, c] = 1.0
                elif cell == RUNESTONE:
                    tensor[2, r, c] = 1.0
                elif cell == EMPTY:
                    tensor[3, r, c] = 1.0

        tensor[4] = self.valid_mask
        if state.phase == PHASE_MOVE:
            tensor[5] = self.valid_mask  # all valid cells = 1

        return tensor

    def action_to_index(self, action, phase: str) -> int:
        """Convert a game action to a flat index."""
        if action == SKIP:
            return self.skip_action_idx

        if phase == PHASE_MOVE:
            fr, fc, tr, tc = action
            from_flat = self.cell_to_flat(fr, fc)
            to_flat = self.cell_to_flat(tr, tc)
            return from_flat * self.grid_size + to_flat
        else:
            r, c = action
            return self.num_move_actions + self.cell_to_flat(r, c)

    def index_to_action(self, idx: int, phase: str):
        """Convert a flat index back to a game action."""
        if idx == self.skip_action_idx:
            return SKIP

        if phase == PHASE_MOVE:
            from_flat = idx // self.grid_size
            to_flat = idx % self.grid_size
            fr, fc = self.flat_to_cell(from_flat)
            tr, tc = self.flat_to_cell(to_flat)
            return (fr, fc, tr, tc)
        else:
            flat = idx - self.num_move_actions
            r, c = self.flat_to_cell(flat)
            return (r, c)

    def legal_action_mask(self, state: GameState) -> np.ndarray:
        """Return a binary mask over the action space (1 = legal)."""
        mask = np.zeros(self.total_actions, dtype=np.float32)
        for action in state.legal_actions():
            idx = self.action_to_index(action, state.phase)
            mask[idx] = 1.0
        return mask
