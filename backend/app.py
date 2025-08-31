from flask import Flask, request, jsonify
from flask_cors import CORS
import importlib
import uuid

from ultimate_ttt_engine import UltimateTTT  # your game logic

app = Flask(__name__)
CORS(app)

# Store games per game_id
games = {}

BOT_MODULES = {
    "Very Easy": "very_easy",
    "Easy": "easy",
    "Medium": "medium",
    "Hard": "hard",
    "Ultimate": "ultimate",
}

def load_bot(difficulty):
    module_name = BOT_MODULES.get(difficulty, "random_bot")
    return importlib.import_module(module_name)


@app.route("/")
def home():
    return jsonify({"message": "Backend is running!"})


@app.route("/start", methods=["POST"])
def start_game():
    data = request.get_json()
    mode = data.get("mode")
    difficulty = data.get("difficulty", "Medium")
    player_role = data.get("playerRole", "Player 1")
    player1_name = data.get("player1Name", "Player 1")
    player2_name = data.get("player2Name", "Player 2")

    game_id = str(uuid.uuid4())
    game = UltimateTTT()

    session_data = {
        "mode": mode,
        "game": game,
        "player1Name": player1_name,
        "player2Name": player2_name
    }

    if mode == "Player vs Bot":
        bot_module = load_bot(difficulty)
        human_player = 1 if player_role == "Player 1" else 2
        session_data["bot_module"] = bot_module
        session_data["human_player"] = human_player

    elif mode == "Bot vs Bot":
        bot_module1 = load_bot(difficulty)
        bot_module2 = load_bot(difficulty)
        session_data["bot1"] = bot_module1
        session_data["bot2"] = bot_module2

    games[game_id] = session_data

    return jsonify({
        "success": True,
        "game_id": game_id,
        "mode": mode,
        "board": game.board,
        "mainboard": game.mainboard,
        "currentPlayer": game.curr_player,
        "winner": game.get_winner(),
    })


@app.route("/move", methods=["POST"])
def move():
    data = request.get_json()
    game_id = data.get("game_id")
    r, c = data.get("row"), data.get("col")

    session = games.get(game_id)
    if not session:
        return jsonify({"success": False, "error": "Invalid game ID"}), 400

    game = session["game"]
    mode = session["mode"]

    # Attempt human move
    success = game.move(r, c)
    if not success:
        return jsonify({"success": False, "error": "Invalid move"}), 400

    winner = game.get_winner()

    # PvB: Bot automatically plays if human move succeeded and game not over
    if mode == "Player vs Bot" and winner is None:
        bot_module = session.get("bot_module")
        human_player = session.get("human_player")
        bot_player = 3 - human_player
        prev_move = game.last

        try:
            bot_move = bot_module.play(game.board, prev_move, bot_player)
            if bot_move and game.move(*bot_move):
                winner = game.get_winner()
        except Exception as e:
            return jsonify({"success": False, "error": f"Bot crashed: {str(e)}"}), 500

    return jsonify({
        "success": True,
        "board": game.board,
        "mainboard": game.mainboard,
        "currentPlayer": game.curr_player,
        "winner": winner,
        "lastMove": game.last,  # useful for frontend activeMiniBoard
    })


@app.route("/state", methods=["GET"])
def get_state():
    game_id = request.args.get("game_id")
    session = games.get(game_id)

    if not session:
        return jsonify({"success": False, "error": "Invalid game ID"}), 400

    game = session["game"]

    return jsonify({
        "success": True,
        "board": game.board,
        "mainboard": game.mainboard,
        "currentPlayer": game.curr_player,
        "winner": game.get_winner(),
        "lastMove": game.last
    })


if __name__ == "__main__":
    app.run(debug=True)
