#this is bot returns random moves

from ultimate_ttt_engine import UltimateTTT
import random

def play(game_board, prev_move, player):
    temp = UltimateTTT()
    temp.board = [row[:] for row in game_board]
    temp.last = prev_move
    temp.current_player = player

    valid_moves = temp.get_valid_moves()
    if not valid_moves:
        print("DEBUG: No valid moves available!")
        return None
    return random.choice(valid_moves)
