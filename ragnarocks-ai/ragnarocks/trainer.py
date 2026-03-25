"""Self-play data generation and neural network training."""

from __future__ import annotations

import numpy as np
import torch
import torch.nn.functional as F
from torch.utils.data import DataLoader, TensorDataset

try:
    from ragnarocks_engine import GameState, WHITE, SMALL_ROW_SIZES, LARGE_ROW_SIZES
except ImportError:
    from ragnarocks.game import GameState
    from ragnarocks.constants import WHITE, SMALL_ROW_SIZES, LARGE_ROW_SIZES
from ragnarocks.encoding import BoardEncoder
from ragnarocks.network import RagnarocksNet
from ragnarocks.mcts import MCTS


class TrainingExample:
    __slots__ = ["state_tensor", "policy_target", "value_target"]

    def __init__(self, state_tensor: np.ndarray, policy_target: np.ndarray, value_target: float):
        self.state_tensor = state_tensor
        self.policy_target = policy_target
        self.value_target = value_target


class Trainer:
    def __init__(
        self,
        board_size: str = "small",
        num_simulations: int = 50,
        num_self_play_games: int = 20,
        num_epochs: int = 5,
        batch_size: int = 32,
        lr: float = 1e-3,
        device: str = "cpu",
        num_res_blocks: int = 5,
        hidden_channels: int = 64,
    ):
        self.board_size = board_size
        self.num_simulations = num_simulations
        self.num_self_play_games = num_self_play_games
        self.num_epochs = num_epochs
        self.batch_size = batch_size
        self.lr = lr
        self.device = device

        row_sizes = SMALL_ROW_SIZES if board_size == "small" else LARGE_ROW_SIZES
        self.encoder = BoardEncoder(row_sizes)

        self.network = RagnarocksNet(
            in_channels=6,
            num_rows=self.encoder.num_rows,
            max_cols=self.encoder.max_cols,
            total_actions=self.encoder.total_actions,
            num_res_blocks=num_res_blocks,
            hidden_channels=hidden_channels,
        ).to(device)

        self.optimizer = torch.optim.Adam(self.network.parameters(), lr=lr, weight_decay=1e-4)

    def self_play_game(self, temperature: float = 1.0) -> list[TrainingExample]:
        """Play one game using MCTS, collecting training examples."""
        mcts = MCTS(
            self.network, self.encoder,
            num_simulations=self.num_simulations,
            device=self.device,
        )

        state = GameState(self.board_size)
        examples: list[tuple[np.ndarray, np.ndarray, int]] = []

        while not state.is_terminal():
            # Run MCTS
            actions, visit_probs = mcts.search(state)

            # Build full policy target vector
            policy_target = np.zeros(self.encoder.total_actions, dtype=np.float32)
            for action, prob in zip(actions, visit_probs):
                idx = self.encoder.action_to_index(action, state.phase)
                policy_target[idx] = prob

            # Store (state_tensor, policy_target, current_player)
            state_tensor = self.encoder.encode_state(state)
            examples.append((state_tensor, policy_target, state.current_player()))

            # Choose action based on visit counts with temperature
            if temperature < 0.01:
                best = np.argmax(visit_probs)
            else:
                adjusted = visit_probs ** (1.0 / temperature)
                adjusted /= adjusted.sum()
                best = np.random.choice(len(actions), p=adjusted)

            state = state.step(actions[best])

        # Assign value targets based on game outcome
        winner = state.winner
        training_examples = []
        for state_tensor, policy_target, player in examples:
            if winner == player:
                value = 1.0
            else:
                value = -1.0
            training_examples.append(TrainingExample(state_tensor, policy_target, value))

        return training_examples

    def train_on_examples(self, examples: list[TrainingExample]) -> dict[str, float]:
        """Train the network on collected examples. Returns loss stats."""
        if not examples:
            return {"total": 0.0, "policy": 0.0, "value": 0.0}

        states = torch.tensor(
            np.array([e.state_tensor for e in examples]),
            dtype=torch.float32, device=self.device,
        )
        policy_targets = torch.tensor(
            np.array([e.policy_target for e in examples]),
            dtype=torch.float32, device=self.device,
        )
        value_targets = torch.tensor(
            np.array([e.value_target for e in examples]),
            dtype=torch.float32, device=self.device,
        ).unsqueeze(1)

        dataset = TensorDataset(states, policy_targets, value_targets)
        loader = DataLoader(dataset, batch_size=self.batch_size, shuffle=True)

        self.network.train()
        total_loss = 0.0
        total_policy_loss = 0.0
        total_value_loss = 0.0
        num_batches = 0

        for epoch in range(self.num_epochs):
            for batch_states, batch_policies, batch_values in loader:
                policy_logits, pred_values = self.network(batch_states)

                # Policy loss: cross-entropy with the MCTS visit distribution
                log_probs = F.log_softmax(policy_logits, dim=1)
                policy_loss = -torch.sum(batch_policies * log_probs, dim=1).mean()

                # Value loss: MSE
                value_loss = F.mse_loss(pred_values, batch_values)

                loss = policy_loss + value_loss

                self.optimizer.zero_grad()
                loss.backward()
                self.optimizer.step()

                total_loss += loss.item()
                total_policy_loss += policy_loss.item()
                total_value_loss += value_loss.item()
                num_batches += 1

        n = max(num_batches, 1)
        return {
            "total": total_loss / n,
            "policy": total_policy_loss / n,
            "value": total_value_loss / n,
        }

    def run_iteration(self, iteration: int, total_iterations: int = 0,
                      elapsed_so_far: float = 0.0) -> dict:
        """Run one training iteration: self-play → train."""
        import time
        iter_start = time.time()

        progress = f"[{iteration}/{total_iterations}]" if total_iterations else f"[{iteration}]"
        eta = ""
        if iteration > 1 and total_iterations > 0 and elapsed_so_far > 0:
            avg_per_iter = elapsed_so_far / (iteration - 1)
            remaining = avg_per_iter * (total_iterations - iteration + 1)
            mins, secs = divmod(int(remaining), 60)
            hours, mins = divmod(mins, 60)
            if hours:
                eta = f" | ETA: {hours}h {mins}m"
            else:
                eta = f" | ETA: {mins}m {secs}s"

        print(f"\n{'='*50}")
        print(f"Iteration {progress}{eta}")
        print(f"{'='*50}")

        # Self-play
        self.network.eval()
        all_examples: list[TrainingExample] = []
        for g in range(self.num_self_play_games):
            temp = 1.0 if iteration < 10 else 0.5
            examples = self.self_play_game(temperature=temp)
            all_examples.extend(examples)
            print(f"  Self-play game {g + 1}/{self.num_self_play_games}: "
                  f"{len(examples)} examples")

        print(f"  Total examples: {len(all_examples)}")

        # Train
        losses = self.train_on_examples(all_examples)

        iter_time = time.time() - iter_start
        mins, secs = divmod(int(iter_time), 60)
        print(f"  Loss — total: {losses['total']:.4f}, "
              f"policy: {losses['policy']:.4f}, "
              f"value: {losses['value']:.4f}")
        print(f"  Iteration time: {mins}m {secs}s")

        return losses

    def save(self, path: str) -> None:
        torch.save({
            "network": self.network.state_dict(),
            "optimizer": self.optimizer.state_dict(),
        }, path)
        print(f"Model saved to {path}")

    def load(self, path: str) -> None:
        checkpoint = torch.load(path, map_location=self.device, weights_only=True)
        self.network.load_state_dict(checkpoint["network"])
        self.optimizer.load_state_dict(checkpoint["optimizer"])
        print(f"Model loaded from {path}")
