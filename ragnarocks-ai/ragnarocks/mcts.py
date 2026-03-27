"""Monte Carlo Tree Search with neural network guidance (AlphaZero-style)."""

from __future__ import annotations

import math
import numpy as np
import torch
try:
    from ragnarocks_engine import GameState
except ImportError:
    from ragnarocks.game import GameState
from ragnarocks.encoding import BoardEncoder
from ragnarocks.network import RagnarocksNet


class MCTSNode:
    __slots__ = [
        "state", "parent", "action", "children",
        "visit_count", "total_value", "prior",
    ]

    def __init__(
        self,
        state: GameState,
        parent: MCTSNode | None = None,
        action=None,
        prior: float = 0.0,
    ):
        self.state = state
        self.parent = parent
        self.action = action
        self.children: list[MCTSNode] = []
        self.visit_count: int = 0
        self.total_value: float = 0.0
        self.prior = prior

    @property
    def q_value(self) -> float:
        if self.visit_count == 0:
            return 0.0
        return self.total_value / self.visit_count

    def is_expanded(self) -> bool:
        return len(self.children) > 0

    def ucb_score(self, c_puct: float = 1.5) -> float:
        parent_visits = self.parent.visit_count if self.parent else 1
        exploration = c_puct * self.prior * math.sqrt(parent_visits) / (1 + self.visit_count)
        return self.q_value + exploration

    def best_child(self, c_puct: float = 1.5) -> MCTSNode:
        return max(self.children, key=lambda ch: ch.ucb_score(c_puct))


class MCTS:
    def __init__(
        self,
        network: RagnarocksNet,
        encoder: BoardEncoder,
        num_simulations: int = 50,
        c_puct: float = 1.5,
        device: str = "cpu",
    ):
        self.network = network
        self.encoder = encoder
        self.num_simulations = num_simulations
        self.c_puct = c_puct
        self.device = device

    @torch.no_grad()
    def _evaluate(self, state: GameState) -> tuple[np.ndarray, float]:
        """Run the network on a state. Returns (action_probs, value)."""
        tensor = self.encoder.encode_state(state)
        x = torch.tensor(tensor, dtype=torch.float32, device=self.device).unsqueeze(0)
        policy_logits, value = self.network(x)

        # Mask illegal actions and compute probabilities
        mask = self.encoder.legal_action_mask(state)
        logits = policy_logits.squeeze(0).cpu().numpy()

        # Set illegal actions to very negative so softmax zeroes them
        logits[mask == 0] = -1e9
        # Stable softmax
        logits -= logits.max()
        exp = np.exp(logits)
        probs = exp / exp.sum()

        return probs, value.item()

    def _expand(self, node: MCTSNode) -> float:
        """Expand a leaf node: evaluate with network, create children."""
        if node.state.is_terminal():
            # Return reward from the perspective of the node's player
            wr, rr = node.state.rewards()
            return wr if node.state.current_player() == 1 else rr

        probs, value = self._evaluate(node.state)
        legal_actions = node.state.legal_actions()

        for action in legal_actions:
            idx = self.encoder.action_to_index(action, node.state.phase)
            child_state = node.state.step(action)
            child = MCTSNode(child_state, parent=node, action=action, prior=probs[idx])
            node.children.append(child)

        return value

    def _select(self, node: MCTSNode) -> MCTSNode:
        """Select a leaf node by following UCB scores."""
        while node.is_expanded() and not node.state.is_terminal():
            node = node.best_child(self.c_puct)
        return node

    def _backpropagate(self, node: MCTSNode, value: float) -> None:
        """Propagate the value up the tree, flipping sign when the player changes.

        In this game each turn has two phases (move viking, place runestone) by
        the SAME player.  We must only negate the value when transitioning
        between different players, not between phases of the same player.
        """
        current = node
        while current is not None:
            current.visit_count += 1
            current.total_value += value
            if (current.parent is not None
                    and current.parent.state.current_player()
                    != current.state.current_player()):
                value = -value
            current = current.parent

    def search(self, state: GameState) -> tuple[list, np.ndarray]:
        """Run MCTS from the given state.

        Returns:
            actions: list of legal actions
            visit_counts: normalized visit count distribution (same order as actions)
        """
        root = MCTSNode(state)

        # Expand root
        self._expand(root)

        for _ in range(self.num_simulations):
            leaf = self._select(root)
            value = self._expand(leaf)
            self._backpropagate(leaf, value)

        # Collect visit counts for root's children
        actions = []
        visit_counts = []
        for child in root.children:
            actions.append(child.action)
            visit_counts.append(child.visit_count)

        visit_counts = np.array(visit_counts, dtype=np.float32)
        if visit_counts.sum() > 0:
            visit_counts /= visit_counts.sum()

        return actions, visit_counts
