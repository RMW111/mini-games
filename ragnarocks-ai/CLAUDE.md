# Ragnarocks AI

AlphaZero-style AI for the board game "Ragnarocks" (Камни Рагнарёка). Trains via self-play using MCTS + neural network.

## Project Structure

- `train.py` — CLI training script. Key args: `--iterations`, `--games-per-iter`, `--simulations`, `--resume`, `--start-iter`, `--save-dir`
- `evaluate.py` — Evaluates trained model vs random agent (half games as White, half as Red)
- `demo.py` — Runs random vs random games for statistics
- `ragnarocks/game.py` — Game environment (GameState with two-phase turns: MoveViking → PlaceRunestone)
- `ragnarocks/board.py` — Hex board logic ported from Rust backend
- `ragnarocks/encoding.py` — BoardEncoder: state → 6-channel tensor, action ↔ flat index mapping
- `ragnarocks/network.py` — RagnarocksNet: ResNet (5 blocks, 64 channels) → policy head + value head (~3M parameters)
- `ragnarocks/mcts.py` — Monte Carlo Tree Search guided by neural network
- `ragnarocks/trainer.py` — Self-play data generation and network training
- `ragnarocks/constants.py` — Board sizes, cell values, initial positions
- `ragnarocks/agents/random_agent.py` — Random agent for evaluation
- `checkpoints/` — Local model checkpoints (gitignored)
- `tests/` — pytest tests for board, game, encoding, network

## Training

Training runs on Google Colab (free GPU). Checkpoints are saved to Google Drive at `/content/drive/MyDrive/ragnarocks-checkpoints/`.

### Resume training from checkpoint
```bash
python train.py \
  --iterations 200 \
  --games-per-iter 50 \
  --simulations 100 \
  --save-dir "/content/drive/MyDrive/ragnarocks-checkpoints" \
  --resume "/content/drive/MyDrive/ragnarocks-checkpoints/model_iter_XX.pt"
```
`--iterations` is the target iteration number (not additional). Start iteration is auto-detected from checkpoint filename.

### Evaluate model
```bash
python evaluate.py checkpoints/model_iter_XX.pt --games 100
```

## Key Concepts

- **Small board**: 10 rows, 86 cells, 3 vikings per side, action space = 12211
- **Large board**: 14 rows, 164 cells, 5 vikings per side
- **State encoding**: 6 channels (my vikings, opponent vikings, runestones, empty cells, valid mask, phase)
- **Action encoding**: flat index (move: from*grid_size+to, place: offset+cell, skip: last index)
- Auto-detects GPU (`cuda`) if available, falls back to CPU

## Current Status

- Model trained ~50 iterations with weak params (20 games/iter, 50 sims) — performed poorly (8% vs random)
- Retraining with stronger params (50 games/iter, 100 sims, 200 iterations) on Google Colab
- Next step after training: connect trained bot to the game via API server
