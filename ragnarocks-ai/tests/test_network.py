import torch
from ragnarocks.network import RagnarocksNet
from ragnarocks.encoding import BoardEncoder
from ragnarocks.game import GameState
from ragnarocks.constants import SMALL_ROW_SIZES


class TestNetwork:
    def test_forward_shape(self):
        enc = BoardEncoder(SMALL_ROW_SIZES)
        net = RagnarocksNet(
            num_rows=enc.num_rows,
            max_cols=enc.max_cols,
            total_actions=enc.total_actions,
        )
        state = GameState("small")
        tensor = enc.encode_state(state)
        x = torch.tensor(tensor).unsqueeze(0)

        policy, value = net(x)
        assert policy.shape == (1, enc.total_actions)
        assert value.shape == (1, 1)

    def test_value_in_range(self):
        enc = BoardEncoder(SMALL_ROW_SIZES)
        net = RagnarocksNet(
            num_rows=enc.num_rows,
            max_cols=enc.max_cols,
            total_actions=enc.total_actions,
        )
        state = GameState("small")
        tensor = enc.encode_state(state)
        x = torch.tensor(tensor).unsqueeze(0)

        _, value = net(x)
        assert -1.0 <= value.item() <= 1.0

    def test_batch_forward(self):
        enc = BoardEncoder(SMALL_ROW_SIZES)
        net = RagnarocksNet(
            num_rows=enc.num_rows,
            max_cols=enc.max_cols,
            total_actions=enc.total_actions,
        )
        state = GameState("small")
        tensor = enc.encode_state(state)
        batch = torch.tensor(tensor).unsqueeze(0).repeat(4, 1, 1, 1)

        policy, value = net(batch)
        assert policy.shape == (4, enc.total_actions)
        assert value.shape == (4, 1)
