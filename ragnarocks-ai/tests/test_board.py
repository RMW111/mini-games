from ragnarocks.board import Board
from ragnarocks.constants import (
    EMPTY, WHITE_VIKING, RED_VIKING, RUNESTONE, WHITE, RED,
    SMALL_ROW_SIZES, LARGE_ROW_SIZES,
)


def make_small_board() -> Board:
    return Board(SMALL_ROW_SIZES)


def make_large_board() -> Board:
    return Board(LARGE_ROW_SIZES)


class TestBoardBasics:
    def test_small_board_dimensions(self):
        b = make_small_board()
        assert b.row_count == 10
        assert b.row_size(0) == 5
        assert b.row_size(6) == 11
        assert b.row_size(9) == 9

    def test_large_board_dimensions(self):
        b = make_large_board()
        assert b.row_count == 14
        assert b.row_size(0) == 7
        assert b.row_size(8) == 15
        assert b.row_size(13) == 11

    def test_set_and_get(self):
        b = make_small_board()
        b.set(0, 0, WHITE_VIKING)
        assert b.get(0, 0) == WHITE_VIKING
        assert b.get(0, 1) == EMPTY

    def test_is_valid(self):
        b = make_small_board()
        assert b.is_valid(0, 0)
        assert b.is_valid(0, 4)
        assert not b.is_valid(0, 5)  # row 0 has only 5 cells
        assert not b.is_valid(-1, 0)
        assert not b.is_valid(10, 0)

    def test_clone(self):
        b = make_small_board()
        b.set(0, 0, RUNESTONE)
        c = b.clone()
        assert c.get(0, 0) == RUNESTONE
        c.set(0, 0, EMPTY)
        assert b.get(0, 0) == RUNESTONE  # original unchanged


class TestNeighbors:
    def test_center_cell_has_6_neighbors(self):
        b = make_small_board()
        # Row 5 (10 cells), col 5 — center-ish cell, should have 6 neighbors
        neighbors = b.get_neighbors(5, 5)
        assert len(neighbors) == 6

    def test_corner_cell_has_fewer_neighbors(self):
        b = make_small_board()
        # Row 0, col 0 — top-left corner
        neighbors = b.get_neighbors(0, 0)
        assert len(neighbors) < 6

    def test_top_left_neighbors(self):
        b = make_small_board()
        neighbors = set(b.get_neighbors(0, 0))
        # East
        assert (0, 1) in neighbors
        # SE neighbors — row 1 has offset 5, row 0 has offset 6
        # shift_diff = 5 - 6 = -1, so SE neighbors are col and col+1 = (1,0) and (1,1)
        assert (1, 0) in neighbors
        assert (1, 1) in neighbors

    def test_symmetry_of_neighbors(self):
        """If A is a neighbor of B, then B should be a neighbor of A."""
        b = make_small_board()
        for row in range(b.row_count):
            for col in range(b.row_size(row)):
                for nr, nc in b.get_neighbors(row, col):
                    assert (row, col) in b.get_neighbors(nr, nc), \
                        f"({row},{col}) is neighbor of ({nr},{nc}) but not vice versa"


class TestReachableCells:
    def test_empty_board_reachable(self):
        b = make_small_board()
        # From center of row 5, should reach cells in all 6 directions
        reachable = b.get_reachable_cells(5, 5)
        assert len(reachable) > 0

    def test_blocked_by_runestone(self):
        b = make_small_board()
        # Place runestone east of (5, 5)
        b.set(5, 6, RUNESTONE)
        reachable = b.get_reachable_cells(5, 5)
        # (5, 6) should NOT be reachable, but (5, 7) also not (blocked)
        coords = set(reachable)
        assert (5, 6) not in coords
        assert (5, 7) not in coords
        # West should still work
        assert (5, 4) in coords

    def test_can_reach_in_line(self):
        b = make_small_board()
        assert b.can_reach_in_line(5, 5, 5, 8)  # East
        assert b.can_reach_in_line(5, 5, 5, 0)  # West
        b.set(5, 3, RUNESTONE)
        assert not b.can_reach_in_line(5, 5, 5, 0)  # Blocked


class TestRegionsAndScoring:
    def test_single_region_no_runestones(self):
        b = make_small_board()
        b.set(0, 0, WHITE_VIKING)
        b.set(9, 0, RED_VIKING)
        regions = b.find_regions()
        # One big region with both colors (plus runestones are separate but there are none)
        non_empty_regions = [r for r in regions if r[1]]
        assert len(non_empty_regions) == 1
        colors = non_empty_regions[0][1]
        assert WHITE in colors and RED in colors

    def test_conquered_region_scoring(self):
        b = make_small_board()
        b.set(0, 1, WHITE_VIKING)
        # Surround row 0 with runestones to create a small conquered region
        # Row 0 has 5 cells. Block all connections to row 1.
        # Row 1 neighbors of row 0 cells: need to block row 1 cells
        for col in range(b.row_size(1)):
            b.set(1, col, RUNESTONE)
        # Now row 0 is isolated with only white viking
        ws, rs = b.calculate_scores()
        assert ws == 5  # all 5 cells in row 0
        assert rs == 0

    def test_nomadic_vs_settled(self):
        b = make_small_board()
        b.set(0, 1, WHITE_VIKING)
        b.set(9, 5, RED_VIKING)
        # No runestones — all in one region — both are nomadic
        assert b.is_viking_nomadic(0, 1)
        assert b.is_viking_nomadic(9, 5)

        # Block all row 1 — isolate row 0
        for col in range(b.row_size(1)):
            b.set(1, col, RUNESTONE)
        # White is now settled (only white in its region)
        assert not b.is_viking_nomadic(0, 1)
        # Red is still nomadic? No — red is alone too if no one else in its region
        # Actually red is also settled (only red in the remaining region)
        # Wait — there's no other color in red's region, so red is settled
        assert not b.is_viking_nomadic(9, 5)


class TestStepDirections:
    def test_east_west(self):
        b = make_small_board()
        assert b.step(5, 5, 0) == (5, 6)  # East
        assert b.step(5, 5, 1) == (5, 4)  # West
        assert b.step(5, 0, 1) is None     # West from leftmost

    def test_diagonal_directions(self):
        b = make_small_board()
        # From row 5 col 5, NE should go to row 4
        ne = b.step(5, 5, 2)
        assert ne is not None
        assert ne[0] == 4

        # NW
        nw = b.step(5, 5, 3)
        assert nw is not None
        assert nw[0] == 4

        # SE
        se = b.step(5, 5, 4)
        assert se is not None
        assert se[0] == 6

        # SW
        sw = b.step(5, 5, 5)
        assert sw is not None
        assert sw[0] == 6

    def test_step_off_top_edge(self):
        b = make_small_board()
        assert b.step(0, 2, 2) is None  # NE from row 0
        assert b.step(0, 2, 3) is None  # NW from row 0

    def test_step_off_bottom_edge(self):
        b = make_small_board()
        assert b.step(9, 4, 4) is None  # SE from last row
        assert b.step(9, 4, 5) is None  # SW from last row
