"""Main training script for Ragnarocks AI.

Usage:
    python train.py                          # default: 20 iterations, small board
    python train.py --iterations 50          # more iterations
    python train.py --board-size large       # train on large board
    python train.py --simulations 100        # more MCTS simulations (slower, stronger)
"""

import argparse
import os
import time
import torch
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
    parser.add_argument("--res-blocks", type=int, default=5,
                        help="Number of residual blocks (default: 5)")
    parser.add_argument("--channels", type=int, default=64,
                        help="Hidden channels in ResNet (default: 64)")
    parser.add_argument("--save-dir", default="checkpoints",
                        help="Directory for model checkpoints (default: checkpoints)")
    parser.add_argument("--resume", type=str, default=None,
                        help="Path to checkpoint to resume from")
    parser.add_argument("--start-iter", type=int, default=None,
                        help="Starting iteration number when resuming (auto-detected from filename if omitted)")
    args = parser.parse_args()

    os.makedirs(args.save_dir, exist_ok=True)

    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"  Device:         {device}")

    trainer = Trainer(
        board_size=args.board_size,
        num_simulations=args.simulations,
        num_self_play_games=args.games_per_iter,
        lr=args.lr,
        device=device,
        num_res_blocks=args.res_blocks,
        hidden_channels=args.channels,
    )

    start_iter = 1
    if args.resume:
        trainer.load(args.resume)
        if args.start_iter is not None:
            start_iter = args.start_iter
        else:
            # Try to auto-detect from filename like "model_iter_35.pt"
            import re
            m = re.search(r'model_iter_(\d+)', args.resume)
            if m:
                start_iter = int(m.group(1)) + 1

    end_iter = args.iterations
    if start_iter > end_iter:
        print(f"Already at iteration {start_iter - 1}, nothing to do.")
        return

    remaining = end_iter - start_iter + 1
    print(f"Training Ragnarocks AI")
    print(f"  Board size:     {args.board_size}")
    print(f"  Iterations:     {start_iter} to {end_iter} ({remaining} remaining)")
    print(f"  Games/iter:     {args.games_per_iter}")
    print(f"  MCTS sims:      {args.simulations}")
    print(f"  Network:        {args.res_blocks} blocks, {args.channels} channels")
    print(f"  Learning rate:  {args.lr}")

    start_time = time.time()

    for i in range(start_iter, end_iter + 1):
        elapsed = time.time() - start_time
        trainer.run_iteration(i, total_iterations=end_iter, elapsed_so_far=elapsed)

        path = os.path.join(args.save_dir, f"model_iter_{i}.pt")
        trainer.save(path)

    # Save final model
    total_time = time.time() - start_time
    mins, secs = divmod(int(total_time), 60)
    hours, mins = divmod(mins, 60)

    final_path = os.path.join(args.save_dir, "model_final.pt")
    trainer.save(final_path)

    if hours:
        print(f"\nTraining complete! Total time: {hours}h {mins}m {secs}s")
    else:
        print(f"\nTraining complete! Total time: {mins}m {secs}s")


if __name__ == "__main__":
    main()
