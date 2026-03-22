"""Run random vs random games and print statistics."""

import time
from ragnarocks.game import GameState
from ragnarocks.agents.random_agent import RandomAgent


def play_game(board_size: str = "small") -> tuple[int, int, int, int]:
    """Play one game. Returns (winner, white_score, red_score, num_moves)."""
    state = GameState(board_size)
    agent = RandomAgent()
    moves = 0

    while not state.is_terminal():
        action = agent.choose_action(state)
        state = state.step(action)
        moves += 1

    return state.winner, state.white_score, state.red_score, moves


def main():
    n_games = 100
    board_size = "small"

    print(f"Playing {n_games} random vs random games on {board_size} board...\n")
    start = time.time()

    white_wins = 0
    red_wins = 0
    total_moves = 0
    total_white_score = 0
    total_red_score = 0

    for i in range(n_games):
        winner, ws, rs, moves = play_game(board_size)
        if winner == 1:
            white_wins += 1
        else:
            red_wins += 1
        total_moves += moves
        total_white_score += ws
        total_red_score += rs

        if (i + 1) % 10 == 0:
            print(f"  {i + 1}/{n_games} games completed...")

    elapsed = time.time() - start

    print(f"\n{'='*40}")
    print(f"Results ({n_games} games, {board_size} board)")
    print(f"{'='*40}")
    print(f"White wins:      {white_wins} ({white_wins/n_games*100:.1f}%)")
    print(f"Red wins:        {red_wins} ({red_wins/n_games*100:.1f}%)")
    print(f"Avg moves/game:  {total_moves/n_games:.1f}")
    print(f"Avg white score: {total_white_score/n_games:.1f}")
    print(f"Avg red score:   {total_red_score/n_games:.1f}")
    print(f"Time:            {elapsed:.2f}s ({elapsed/n_games*1000:.0f}ms/game)")


if __name__ == "__main__":
    main()
