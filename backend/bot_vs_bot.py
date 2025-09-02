# This file is to run a game  bot v/s bot 


import importlib
from ultimate_ttt_engine import UltimateTTT

bot1 = importlib.import_module("random_bot") #change with your bot's file name
bot2 = importlib.import_module("random_bot")

def run():
    game = UltimateTTT()
    prev_move = None
    player = 1
    while True:
        game.print_board()
        if player == 1:
            try:
                move = bot1.play(game.board, prev_move, 1)
            except Exception as e:
                print(f"Bot crashed or returned an invalid move: {e}")
                print("Bot loses!")
                return

        else:
            try:
                move = bot2.play(game.board, prev_move, 2)
            except Exception as e:
                print(f"Bot crashed or returned an invalid move: {e}")
                print("Bot loses!")
                return

        if not game.move(*move):
            print(f"Invalid move by Player {player} at {move}. Player {3 - player} wins!")
            return 3 - player

        prev_move = move
        player = 3 - player
        winner = game.get_winner()
        if winner and winner != 3 :
            game.print_board()
            print(f"Player {winner} wins!")
            return

        if all(game.board[i][j] != 0 for i in range(9) for j in range(9)):
            print("Draw!")
            return

    return 0

if __name__ == '__main__':
    run()