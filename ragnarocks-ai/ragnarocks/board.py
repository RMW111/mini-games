from __future__ import annotations

import copy
from ragnarocks.constants import (
    EMPTY, WHITE_VIKING, RED_VIKING, RUNESTONE, WHITE, RED,
)


def _compute_left_offset(row_sizes: tuple[int, ...], row: int) -> int:
    max_len = max(row_sizes)
    pivot = row_sizes.index(max_len)
    return pivot - row if row <= pivot else row - pivot


class Board:
    def __init__(self, row_sizes: tuple[int, ...]):
        self.row_sizes = row_sizes
        self._cells: list[list[int]] = [
            [EMPTY] * size for size in row_sizes
        ]
        self._left_offsets = [
            _compute_left_offset(row_sizes, i) for i in range(len(row_sizes))
        ]

    def clone(self) -> Board:
        new = Board.__new__(Board)
        new.row_sizes = self.row_sizes
        new._cells = [row[:] for row in self._cells]
        new._left_offsets = self._left_offsets
        return new

    @property
    def row_count(self) -> int:
        return len(self._cells)

    def row_size(self, row: int) -> int:
        return len(self._cells[row])

    def is_valid(self, row: int, col: int) -> bool:
        return 0 <= row < self.row_count and 0 <= col < self.row_size(row)

    def get(self, row: int, col: int) -> int:
        return self._cells[row][col]

    def set(self, row: int, col: int, value: int) -> None:
        self._cells[row][col] = value

    # ── hex geometry ──

    def get_neighbors(self, row: int, col: int) -> list[tuple[int, int]]:
        result: list[tuple[int, int]] = []

        # East
        if col + 1 < self.row_size(row):
            result.append((row, col + 1))
        # West
        if col > 0:
            result.append((row, col - 1))

        # Vertical neighbors (NE, NW, SE, SW)
        for d_row in (-1, 1):
            nr = row + d_row
            if nr < 0 or nr >= self.row_count:
                continue
            shift_diff = self._left_offsets[nr] - self._left_offsets[row]
            if shift_diff == -1:
                nc1, nc2 = col, col + 1
            else:
                nc1, nc2 = col - 1, col

            adj_size = self.row_size(nr)
            if 0 <= nc1 < adj_size:
                result.append((nr, nc1))
            if 0 <= nc2 < adj_size:
                result.append((nr, nc2))

        return result

    def step(self, row: int, col: int, direction: int) -> tuple[int, int] | None:
        """One step in the given direction. Returns None if off-board.
        Directions: 0=E, 1=W, 2=NE, 3=NW, 4=SE, 5=SW
        """
        if direction == 0:  # E
            nr, nc = row, col + 1
        elif direction == 1:  # W
            nr, nc = row, col - 1
        elif direction == 2:  # NE
            nr = row - 1
            if nr < 0:
                return None
            shift = self._left_offsets[nr] - self._left_offsets[row]
            nc = col + 1 if shift == -1 else col
        elif direction == 3:  # NW
            nr = row - 1
            if nr < 0:
                return None
            shift = self._left_offsets[nr] - self._left_offsets[row]
            nc = col if shift == -1 else col - 1
        elif direction == 4:  # SE
            nr = row + 1
            if nr >= self.row_count:
                return None
            shift = self._left_offsets[nr] - self._left_offsets[row]
            nc = col + 1 if shift == -1 else col
        elif direction == 5:  # SW
            nr = row + 1
            if nr >= self.row_count:
                return None
            shift = self._left_offsets[nr] - self._left_offsets[row]
            nc = col if shift == -1 else col - 1
        else:
            return None

        if not self.is_valid(nr, nc):
            return None
        return (nr, nc)

    def cast_line(self, row: int, col: int, direction: int) -> list[tuple[int, int]]:
        """All empty cells in a straight line until hitting an obstacle or edge."""
        result: list[tuple[int, int]] = []
        cr, cc = row, col
        while True:
            nxt = self.step(cr, cc, direction)
            if nxt is None:
                break
            nr, nc = nxt
            if self.get(nr, nc) != EMPTY:
                break
            result.append((nr, nc))
            cr, cc = nr, nc
        return result

    def get_reachable_cells(self, row: int, col: int) -> list[tuple[int, int]]:
        """All empty cells reachable in a straight line in all 6 directions."""
        result: list[tuple[int, int]] = []
        for d in range(6):
            result.extend(self.cast_line(row, col, d))
        return result

    def can_reach_in_line(self, fr: int, fc: int, tr: int, tc: int) -> bool:
        for d in range(6):
            if (tr, tc) in self.cast_line(fr, fc, d):
                return True
        return False

    # ── regions & scoring ──

    def find_regions(self) -> list[tuple[list[tuple[int, int]], set[int]]]:
        """Flood-fill to find all regions separated by runestones.
        Returns list of (cells, set of player colors in region).
        """
        visited: set[tuple[int, int]] = set()
        regions: list[tuple[list[tuple[int, int]], set[int]]] = []

        for row in range(self.row_count):
            for col in range(self.row_size(row)):
                if (row, col) in visited:
                    continue
                if self.get(row, col) == RUNESTONE:
                    visited.add((row, col))
                    continue

                region_cells: list[tuple[int, int]] = []
                colors: set[int] = set()
                stack = [(row, col)]

                while stack:
                    r, c = stack.pop()
                    if (r, c) in visited:
                        continue
                    cell = self.get(r, c)
                    if cell == RUNESTONE:
                        continue

                    visited.add((r, c))
                    region_cells.append((r, c))

                    if cell == WHITE_VIKING:
                        colors.add(WHITE)
                    elif cell == RED_VIKING:
                        colors.add(RED)

                    for nb in self.get_neighbors(r, c):
                        if nb not in visited:
                            stack.append(nb)

                regions.append((region_cells, colors))

        return regions

    def is_viking_nomadic(self, row: int, col: int) -> bool:
        """A viking is nomadic if its region contains enemy vikings."""
        cell = self.get(row, col)
        if cell not in (WHITE_VIKING, RED_VIKING):
            return False

        my_color = cell
        visited: set[tuple[int, int]] = set()
        stack = [(row, col)]

        while stack:
            r, c = stack.pop()
            if (r, c) in visited:
                continue
            v = self.get(r, c)
            if v == RUNESTONE:
                continue
            visited.add((r, c))

            if v in (WHITE_VIKING, RED_VIKING) and v != my_color:
                return True

            for nb in self.get_neighbors(r, c):
                if nb not in visited:
                    stack.append(nb)

        return False

    def find_nomadic_vikings(self, color: int) -> list[tuple[int, int]]:
        target = WHITE_VIKING if color == WHITE else RED_VIKING
        result: list[tuple[int, int]] = []
        for row in range(self.row_count):
            for col in range(self.row_size(row)):
                if self.get(row, col) == target and self.is_viking_nomadic(row, col):
                    result.append((row, col))
        return result

    def can_player_move(self, color: int) -> bool:
        """Check if a player has at least one valid compound move
        (move viking + place runestone)."""
        viking_val = WHITE_VIKING if color == WHITE else RED_VIKING
        nomadic = self.find_nomadic_vikings(color)

        for vr, vc in nomadic:
            # Stay in place: can place runestone from current position?
            if self.get_reachable_cells(vr, vc):
                return True

            # Move to a reachable cell, then check if runestone can be placed
            for tr, tc in self.get_reachable_cells(vr, vc):
                temp = self.clone()
                temp.set(vr, vc, EMPTY)
                temp.set(tr, tc, viking_val)
                if temp.get_reachable_cells(tr, tc):
                    return True

        return False

    def calculate_scores(self) -> tuple[int, int]:
        """Returns (white_score, red_score). A conquered region (only one
        player's vikings) scores = number of cells in region."""
        regions = self.find_regions()
        white_score = 0
        red_score = 0

        for cells, colors in regions:
            if len(colors) == 1:
                c = next(iter(colors))
                if c == WHITE:
                    white_score += len(cells)
                else:
                    red_score += len(cells)

        return white_score, red_score
