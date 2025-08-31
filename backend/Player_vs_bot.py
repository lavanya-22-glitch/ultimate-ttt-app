# Here you can play with against your own bot

import importlib
from ultimate_ttt_engine import UltimateTTT

bot = importlib.import_module("easy") #change with your bot's file name

def run_game():
    game = UltimateTTT()
    prev_move = None
    human_player = int(input("Do you want to be Player 1 or 2? "))
    bot_player = 3 - human_player

    player = 1
    while True:
        game.print_board()
        print(f"Player {player}'s turn")

        if player == human_player:
            while True:
                try:
                    move = tuple(map(int, input("Enter your move (i j): ").split()))
                    if len(move) != 2:
                        raise ValueError
                    if not game.move(*move):
                        print("Invalid move. Try again.")
                        continue
                    break
                except:
                    print("Invalid input. Please enter two integers separated by a space.")
        else:
            try:
                move = bot.play(game.board, prev_move, bot_player)
            except Exception as e:
                print(f"Bot crashed or returned an invalid move: {e}")
                print("Bot loses!")
                return
            if not game.move(*move):
                print(f"Invalid move by Bot. Bot loses!")
                return

        prev_move = move
        winner = game.get_winner()
        if winner:
            game.print_board()
            if winner == 3:
                print("Draw!")
            else:
                print(f"Player {winner} wins!")
            return

        player = 3 - player

if __name__ == '__main__':
    run_game()
