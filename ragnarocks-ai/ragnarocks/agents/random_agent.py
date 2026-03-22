import random
from ragnarocks.game import GameState


class RandomAgent:
    def choose_action(self, state: GameState):
        actions = state.legal_actions()
        return random.choice(actions)
