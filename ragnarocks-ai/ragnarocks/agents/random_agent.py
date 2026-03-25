import random

try:
    from ragnarocks_engine import GameState
except ImportError:
    from ragnarocks.game import GameState


class RandomAgent:
    def choose_action(self, state: GameState):
        actions = state.legal_actions()
        return random.choice(actions)
