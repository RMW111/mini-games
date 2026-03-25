"""Evaluate a trained model against a random agent.

Usage:
    python evaluate.py checkpoints/model_final.pt
    python evaluate.py checkpoints/model_iter_50.pt --games 200
    python evaluate.py checkpoints/model_iter_50.pt --simulations 100
"""

import argparse
import time
try:
    from ragnarocks_engine import GameState, WHITE, RED, SMALL_ROW_SIZES
except ImportError:
    from ragnarocks.game import GameState
    from ragnarocks.constants import WHITE, RED, SMALL_ROW_SIZES
from ragnarocks.encoding import BoardEncoder
from ragnarocks.network import RagnarocksNet
from ragnarocks.mcts import MCTS
from ragnarocks.agents.random_agent import RandomAgent
import torch


class TrainedAgent:
    def __init__(self, network: RagnarocksNet, encoder: BoardEncoder,
                 num_simulations: int = 50):
        self.mcts = MCTS(network, encoder, num_simulations=num_simulations)

    def choose_action(self, state: GameState):
        actions, visit_probs = self.mcts.search(state)
        best = visit_probs.argmax()
        return actions[best]


def play_game(agent_white, agent_red, board_size: str = "small") -> dict:
    """Play one game. Returns result dict."""
    state = GameState(board_size)
    moves = 0

    while not state.is_terminal():
        if state.current_player() == WHITE:
            action = agent_white.choose_action(state)
        else:
            action = agent_red.choose_action(state)
        state = state.step(action)
        moves += 1

    return {
        "winner": state.winner,
        "white_score": state.white_score,
        "red_score": state.red_score,
        "moves": moves,
    }


def main():
    parser = argparse.ArgumentParser(description="Evaluate trained model vs random agent")
    parser.add_argument("checkpoint", help="Path to model checkpoint")
    parser.add_argument("--games", type=int, default=100,
                        help="Number of games to play (default: 100)")
    parser.add_argument("--simulations", type=int, default=50,
                        help="MCTS simulations per move (default: 50)")
    parser.add_argument("--board-size", choices=["small", "large"], default="small")
    args = parser.parse_args()

    # Load model
    encoder = BoardEncoder(SMALL_ROW_SIZES)
    checkpoint = torch.load(args.checkpoint, map_location="cpu", weights_only=True)

    # Auto-detect network size from checkpoint
    state_dict = checkpoint["network"]
    hidden_channels = state_dict["conv_in.weight"].shape[0]
    num_res_blocks = sum(1 for k in state_dict if k.startswith("res_blocks.") and k.endswith(".conv1.weight"))

    network = RagnarocksNet(
        num_rows=encoder.num_rows,
        max_cols=encoder.max_cols,
        total_actions=encoder.total_actions,
        num_res_blocks=num_res_blocks,
        hidden_channels=hidden_channels,
    )
    network.load_state_dict(state_dict)
    network.eval()

    trained = TrainedAgent(network, encoder, num_simulations=args.simulations)
    random_agent = RandomAgent()

    half = args.games // 2

    print(f"Evaluating model: {args.checkpoint}")
    print(f"  Games:     {args.games} ({half} as White, {half} as Red)")
    print(f"  MCTS sims: {args.simulations}")
    print()

    model_wins = 0
    random_wins = 0
    model_total_score = 0
    random_total_score = 0

    start = time.time()

    # Model plays as White
    print("Model as White:")
    for i in range(half):
        result = play_game(trained, random_agent, args.board_size)
        if result["winner"] == WHITE:
            model_wins += 1
        else:
            random_wins += 1
        model_total_score += result["white_score"]
        random_total_score += result["red_score"]

        elapsed = time.time() - start
        avg = elapsed / (i + 1)
        remaining = avg * (args.games - i - 1)
        mins, secs = divmod(int(remaining), 60)
        print(f"  Game {i+1}/{half} — "
              f"{'Model wins' if result['winner'] == WHITE else 'Random wins'} "
              f"({result['white_score']}:{result['red_score']}) "
              f"| ETA: {mins}m {secs}s")

    white_wins = model_wins

    # Model plays as Red
    print("\nModel as Red:")
    for i in range(half):
        result = play_game(random_agent, trained, args.board_size)
        if result["winner"] == RED:
            model_wins += 1
        else:
            random_wins += 1
        model_total_score += result["red_score"]
        random_total_score += result["white_score"]

        elapsed = time.time() - start
        done = half + i + 1
        avg = elapsed / done
        remaining = avg * (args.games - done)
        mins, secs = divmod(int(remaining), 60)
        print(f"  Game {i+1}/{half} — "
              f"{'Model wins' if result['winner'] == RED else 'Random wins'} "
              f"({result['white_score']}:{result['red_score']}) "
              f"| ETA: {mins}m {secs}s")

    red_wins = model_wins - white_wins
    total_time = time.time() - start
    mins, secs = divmod(int(total_time), 60)

    print(f"\n{'='*50}")
    print(f"Results ({args.games} games)")
    print(f"{'='*50}")
    print(f"Model wins:     {model_wins}/{args.games} ({model_wins/args.games*100:.1f}%)")
    print(f"  as White:     {white_wins}/{half}")
    print(f"  as Red:       {red_wins}/{half}")
    print(f"Random wins:    {random_wins}/{args.games} ({random_wins/args.games*100:.1f}%)")
    print(f"Avg model score:  {model_total_score/args.games:.1f}")
    print(f"Avg random score: {random_total_score/args.games:.1f}")
    print(f"Time: {mins}m {secs}s")


if __name__ == "__main__":
    main()
