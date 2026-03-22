"""Main training script for Ragnarocks AI.

Usage:
    python train.py                          # default: 20 iterations, small board
    python train.py --iterations 50          # more iterations
    python train.py --board-size large       # train on large board
    python train.py --simulations 100        # more MCTS simulations (slower, stronger)
"""

import argparse
import os
from ragnarocks.trainer import Trainer


def main():
    parser = argparse.ArgumentParser(description="Train Ragnarocks AI via self-play")
    parser.add_argument("--iterations", type=int, default=20,
                        help="Number of training iterations (default: 20)")
    parser.add_argument("--games-per-iter", type=int, default=20,
                        help="Self-play games per iteration (default: 20)")
    parser.add_argument("--simulations", type=int, default=50,
                        help="MCTS simulations per move (default: 50)")
    parser.add_argument("--board-size", choices=["small", "large"], default="small",
                        help="Board size (default: small)")
    parser.add_argument("--lr", type=float, default=1e-3,
                        help="Learning rate (default: 0.001)")
    parser.add_argument("--save-dir", default="checkpoints",
                        help="Directory for model checkpoints (default: checkpoints)")
    parser.add_argument("--resume", type=str, default=None,
                        help="Path to checkpoint to resume from")
    args = parser.parse_args()

    os.makedirs(args.save_dir, exist_ok=True)

    trainer = Trainer(
        board_size=args.board_size,
        num_simulations=args.simulations,
        num_self_play_games=args.games_per_iter,
        lr=args.lr,
    )

    if args.resume:
        trainer.load(args.resume)

    print(f"Training Ragnarocks AI")
    print(f"  Board size:     {args.board_size}")
    print(f"  Iterations:     {args.iterations}")
    print(f"  Games/iter:     {args.games_per_iter}")
    print(f"  MCTS sims:      {args.simulations}")
    print(f"  Learning rate:  {args.lr}")

    for i in range(1, args.iterations + 1):
        trainer.run_iteration(i)

        if i % 5 == 0:
            path = os.path.join(args.save_dir, f"model_iter_{i}.pt")
            trainer.save(path)

    # Save final model
    final_path = os.path.join(args.save_dir, "model_final.pt")
    trainer.save(final_path)
    print("\nTraining complete!")


if __name__ == "__main__":
    main()
