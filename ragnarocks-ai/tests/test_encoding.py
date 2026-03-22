import numpy as np
from ragnarocks.game import GameState, PHASE_MOVE, PHASE_PLACE, SKIP
from ragnarocks.encoding import BoardEncoder
from ragnarocks.constants import SMALL_ROW_SIZES


def make_encoder() -> BoardEncoder:
    return BoardEncoder(SMALL_ROW_SIZES)


class TestBoardEncoder:
    def test_encode_shape(self):
        enc = make_encoder()
        state = GameState("small")
        tensor = enc.encode_state(state)
        assert tensor.shape == (6, 10, 11)

    def test_encode_has_vikings(self):
        enc = make_encoder()
        state = GameState("small")
        tensor = enc.encode_state(state)
        # White plays first, so channel 0 = current player's vikings (white)
        assert tensor[0].sum() == 3  # 3 white vikings
        assert tensor[1].sum() == 3  # 3 red vikings (opponent)

    def test_valid_mask(self):
        enc = make_encoder()
        # 86 valid cells on small board
        assert enc.valid_mask.sum() == 86

    def test_action_roundtrip_move(self):
        enc = make_encoder()
        action = (0, 1, 5, 5)
        idx = enc.action_to_index(action, PHASE_MOVE)
        restored = enc.index_to_action(idx, PHASE_MOVE)
        assert restored == action

    def test_action_roundtrip_place(self):
        enc = make_encoder()
        action = (3, 4)
        idx = enc.action_to_index(action, PHASE_PLACE)
        restored = enc.index_to_action(idx, PHASE_PLACE)
        assert restored == action

    def test_action_roundtrip_skip(self):
        enc = make_encoder()
        idx = enc.action_to_index(SKIP, PHASE_MOVE)
        assert idx == enc.skip_action_idx
        restored = enc.index_to_action(idx, PHASE_MOVE)
        assert restored == SKIP

    def test_legal_mask_initial(self):
        enc = make_encoder()
        state = GameState("small")
        mask = enc.legal_action_mask(state)
        assert mask.shape == (enc.total_actions,)
        assert mask.sum() > 0
        assert mask.sum() == len(state.legal_actions())
