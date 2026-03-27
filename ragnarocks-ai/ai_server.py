"""AI server for Ragnarocks — accepts game state, returns AI move.

Usage:
    pip install fastapi uvicorn
    python ai_server.py --checkpoint checkpoints/model_iter_95.pt
"""

import argparse
import torch
import numpy as np
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ragnarocks.encoding import BoardEncoder
from ragnarocks.network import RagnarocksNet
from ragnarocks.mcts import MCTS
from ragnarocks.constants import SMALL_ROW_SIZES, WHITE, RED, EMPTY, WHITE_VIKING, RED_VIKING, RUNESTONE

try:
    from ragnarocks_engine import GameState
    _USE_RUST = True
except ImportError:
    from ragnarocks.game import GameState
    _USE_RUST = False


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state — set in main()
mcts_engine: MCTS | None = None
encoder: BoardEncoder | None = None


class GameStateRequest(BaseModel):
    board: list[list[int]]
    currentTurn: int  # 1=White, 2=Red
    phase: str  # "moveViking" or "placeRunestone"
    activeViking: list[int] | None = None
    lastSkip: bool = False
    whiteScore: int = 0
    redScore: int = 0


class MoveResponse(BaseModel):
    type: str  # "moveViking", "placeRunestone", "skip"
    from_pos: list[int] | None = None  # [row, col]
    to: list[int] | None = None  # [row, col]
    coords: list[int] | None = None  # [row, col] for placeRunestone


def reconstruct_game_state(req: GameStateRequest) -> GameState:
    """Reconstruct a GameState from the request data."""
    if _USE_RUST:
        # Create fresh state and overwrite board
        state = GameState("small")
        # We can't easily modify the Rust state, so use Python fallback
        from ragnarocks.game import GameState as PyGameState

    from ragnarocks.game import GameState as PyGameState
    from ragnarocks.board import Board

    row_sizes = tuple(len(row) for row in req.board)
    board = Board(row_sizes)
    for r, row in enumerate(req.board):
        for c, cell in enumerate(row):
            board.set(r, c, cell)

    # Map camelCase phase names from frontend to Python constants
    phase_map = {"moveViking": "move_viking", "placeRunestone": "place_runestone"}

    state = PyGameState.__new__(PyGameState)
    state.board = board
    state.current_turn = req.currentTurn
    state.phase = phase_map.get(req.phase, req.phase)
    state.active_viking = tuple(req.activeViking) if req.activeViking else None
    state.previous_viking_pos = None
    state.last_skip = req.lastSkip
    state.winner = None
    state.white_score = req.whiteScore
    state.red_score = req.redScore

    return state


@app.post("/move")
def get_ai_move(req: GameStateRequest) -> MoveResponse:
    state = reconstruct_game_state(req)
    actions, visit_probs = mcts_engine.search(state)
    best_idx = visit_probs.argmax()
    action = actions[best_idx]

    # Log AI decision for debugging
    top_indices = visit_probs.argsort()[::-1][:5]
    top_actions = [(actions[i], f"{visit_probs[i]:.3f}") for i in top_indices if visit_probs[i] > 0]
    print(f"[AI] phase={state.phase}, turn={state.current_turn}, "
          f"best={action} ({visit_probs[best_idx]:.3f}), top={top_actions}")

    if action == "skip":
        return MoveResponse(type="skip")
    elif state.phase == "move_viking":
        fr, fc, tr, tc = action
        return MoveResponse(
            type="moveViking",
            from_pos=[int(fr), int(fc)],
            to=[int(tr), int(tc)],
        )
    else:
        r, c = action
        return MoveResponse(
            type="placeRunestone",
            coords=[int(r), int(c)],
        )


@app.get("/health")
def health():
    return {"status": "ok", "engine": "rust" if _USE_RUST else "python"}


def main():
    parser = argparse.ArgumentParser(description="Ragnarocks AI Server")
    parser.add_argument("--checkpoint", required=True, help="Path to model checkpoint")
    parser.add_argument("--simulations", type=int, default=50,
                        help="MCTS simulations per move (default: 50)")
    parser.add_argument("--port", type=int, default=8001,
                        help="Server port (default: 8001)")
    args = parser.parse_args()

    global mcts_engine, encoder

    encoder = BoardEncoder(SMALL_ROW_SIZES)

    # Load model
    checkpoint = torch.load(args.checkpoint, map_location="cpu", weights_only=True)
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

    print(f"Model loaded: {num_res_blocks} blocks, {hidden_channels} channels")
    print(f"MCTS simulations: {args.simulations}")
    print(f"Engine: {'Rust' if _USE_RUST else 'Python'}")

    mcts_engine = MCTS(network, encoder, num_simulations=args.simulations)

    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=args.port)


if __name__ == "__main__":
    main()
