from ragnarocks.game import GameState, PHASE_MOVE, PHASE_PLACE, SKIP
from ragnarocks.constants import (
    EMPTY, WHITE_VIKING, RED_VIKING, RUNESTONE, WHITE, RED,
)


class TestInitialState:
    def test_small_board_setup(self):
        gs = GameState("small")
        assert gs.current_turn == WHITE
        assert gs.phase == PHASE_MOVE
        assert not gs.is_terminal()

        # White vikings at row 0: cols 1, 2, 3
        assert gs.board.get(0, 1) == WHITE_VIKING
        assert gs.board.get(0, 2) == WHITE_VIKING
        assert gs.board.get(0, 3) == WHITE_VIKING

        # Red vikings at row 9: cols 3, 4, 5
        assert gs.board.get(9, 3) == RED_VIKING
        assert gs.board.get(9, 4) == RED_VIKING
        assert gs.board.get(9, 5) == RED_VIKING

    def test_large_board_setup(self):
        gs = GameState("large")
        assert gs.board.row_count == 14
        # 5 white vikings on row 0
        for c in range(1, 6):
            assert gs.board.get(0, c) == WHITE_VIKING
        # 5 red vikings on row 13
        for c in range(3, 8):
            assert gs.board.get(13, c) == RED_VIKING


class TestLegalActions:
    def test_initial_has_move_actions(self):
        gs = GameState("small")
        actions = gs.legal_actions()
        assert len(actions) > 0
        assert SKIP not in actions
        # All actions should be move tuples (fr, fc, tr, tc)
        for a in actions:
            assert len(a) == 4

    def test_place_phase_actions(self):
        gs = GameState("small")
        # Pick first legal move
        actions = gs.legal_actions()
        move = actions[0]
        gs2 = gs.step(move)
        assert gs2.phase == PHASE_PLACE
        place_actions = gs2.legal_actions()
        assert len(place_actions) > 0
        # All should be (row, col) tuples
        for a in place_actions:
            assert len(a) == 2


class TestGameFlow:
    def test_full_turn_cycle(self):
        gs = GameState("small")
        assert gs.current_turn == WHITE
        assert gs.phase == PHASE_MOVE

        # White moves
        move = gs.legal_actions()[0]
        gs2 = gs.step(move)
        assert gs2.current_turn == WHITE
        assert gs2.phase == PHASE_PLACE

        # White places runestone
        place = gs2.legal_actions()[0]
        gs3 = gs2.step(place)
        assert gs3.current_turn == RED
        assert gs3.phase == PHASE_MOVE

    def test_runestone_placed_on_board(self):
        gs = GameState("small")
        move = gs.legal_actions()[0]
        gs2 = gs.step(move)
        place_pos = gs2.legal_actions()[0]
        gs3 = gs2.step(place_pos)
        r, c = place_pos
        assert gs3.board.get(r, c) == RUNESTONE

    def test_step_is_immutable(self):
        gs = GameState("small")
        move = gs.legal_actions()[0]
        gs2 = gs.step(move)
        # Original should be unchanged
        assert gs.phase == PHASE_MOVE
        assert gs.current_turn == WHITE


class TestSkip:
    def _make_skip_state(self) -> GameState:
        """Create a state where current player must skip."""
        gs = GameState("small")
        # Fill most of the board with runestones, leave vikings trapped
        for row in range(gs.board.row_count):
            for col in range(gs.board.row_size(row)):
                cell = gs.board.get(row, col)
                if cell == EMPTY:
                    gs.board.set(row, col, RUNESTONE)
        return gs

    def test_skip_when_no_moves(self):
        gs = self._make_skip_state()
        actions = gs.legal_actions()
        assert actions == [SKIP]

    def test_double_skip_ends_game(self):
        gs = self._make_skip_state()
        gs2 = gs.step(SKIP)
        assert not gs2.is_terminal()
        assert gs2.current_turn == RED

        # Red also can't move (board is full of runestones)
        actions2 = gs2.legal_actions()
        assert actions2 == [SKIP]
        gs3 = gs2.step(SKIP)
        assert gs3.is_terminal()
        assert gs3.winner is not None


class TestRewards:
    def test_ongoing_game_no_reward(self):
        gs = GameState("small")
        assert gs.rewards() == (0.0, 0.0)

    def test_terminal_rewards(self):
        gs = GameState("small")
        # Force game over
        gs.winner = WHITE
        wr, rr = gs.rewards()
        assert wr == 1.0
        assert rr == -1.0

        gs.winner = RED
        wr, rr = gs.rewards()
        assert wr == -1.0
        assert rr == 1.0
