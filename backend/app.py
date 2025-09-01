from flask import Flask, request, jsonify
from flask_cors import CORS
import importlib
import uuid
import os
import importlib.util
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

UPLOAD_FOLDER = "uploaded_bots"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER


def load_bot_from_file(filepath):
    """Dynamically load a bot from a Python file."""
    spec = importlib.util.spec_from_file_location("custom_bot", filepath)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def load_bot(difficulty):
    module_name = BOT_MODULES.get(difficulty, "medium")
    return importlib.import_module(module_name)


@app.route("/")
def home():
    return jsonify({"message": "Backend is running!"})


@app.route("/start", methods=["POST"])
def start_game():
    """Start a new game session."""
    if request.content_type and request.content_type.startswith("multipart/form-data"):
        data = request.form
    else:
        data = request.get_json() or {}

    mode = data.get("mode")
    difficulty = data.get("difficulty", "Medium")
    player_role = data.get("playerRole", "Player 1")
    player1_name = data.get("player1Name", "Player 1")
    player2_name = data.get("player2Name", "Player 2")

    game_id = str(uuid.uuid4())
    game = UltimateTTT()

    session_data = {
        "mode": mode,
        "difficulty": difficulty,
        "playerRole": player_role,
        "game": game,
        "player1Name": player1_name,
        "player2Name": player2_name,
    }

    # Player vs Bot
    if mode == "Player vs Bot":
        bot_module = load_bot(difficulty)
        human_player = 1 if player_role == "Player 1" else 2
        session_data["bot_module"] = bot_module
        session_data["human_player"] = human_player

    # Bot vs Bot
    elif mode == "Bot vs Bot":
        uploaded_file = request.files.get("botFile")
        if not uploaded_file:
            return jsonify({"success": False, "error": "No bot uploaded"}), 400

        filepath = os.path.join(app.config["UPLOAD_FOLDER"], uploaded_file.filename)
        uploaded_file.save(filepath)
        bot1 = load_bot_from_file(filepath)

        bot2_module = BOT_MODULES.get(difficulty, "medium")
        bot2 = importlib.import_module(bot2_module)

        session_data["bot1"] = bot1
        session_data["bot2"] = bot2

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


@app.route("/bot-vs-bot-move", methods=["POST"])
def bot_vs_bot_move():
    """Play out a Bot vs Bot game automatically."""
    data = request.get_json()
    game_id = data.get("game_id")

    session = games.get(game_id)
    if not session:
        return jsonify({"success": False, "error": "Invalid game ID"}), 400

    game = session["game"]
    bot1 = session.get("bot1")
    bot2 = session.get("bot2")

    if not bot1 or not bot2:
        return jsonify({"success": False, "error": "Bots not loaded"}), 400

    winner = game.get_winner()
    move_history = []
    prev_move = game.last

    while winner is None:
        current_bot = bot1 if game.curr_player == 1 else bot2

        try:
            move = current_bot.play(game.board, prev_move, game.curr_player)
        except Exception as e:
            return jsonify({"success": False, "error": f"Bot crashed: {str(e)}"}), 500

        if not move or not game.move(*move):
            return jsonify({"success": False, "error": "Invalid move by bot"}), 500

        move_history.append({"player": game.curr_player, "move": move})
        prev_move = move
        winner = game.get_winner()

    session["move_history"] = move_history

    return jsonify({
        "success": True,
        "board": game.board,
        "mainboard": game.mainboard,
        "currentPlayer": game.curr_player,
        "winner": winner,
        "lastMove": game.last,
        "move_history": move_history
    })


@app.route("/move", methods=["POST"])
def move():
    """Handle a player's move (and bot's if PvB)."""
    data = request.get_json()
    game_id = data.get("game_id")
    r, c = data.get("row"), data.get("col")

    session = games.get(game_id)
    if not session:
        return jsonify({"success": False, "error": "Invalid game ID"}), 400

    game = session["game"]
    mode = session["mode"]

    success = game.move(r, c)
    if not success:
        return jsonify({"success": False, "error": "Invalid move"}), 400

    winner = game.get_winner()

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
        "winner": game.get_winner(),
        "lastMove": game.last,
    })


@app.route("/state", methods=["GET"])
def get_state():
    """Get the current game state."""
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


@app.route("/restart", methods=["POST"])
def restart_game():
    """Restart a game with the same settings."""
    data = request.json
    game_id = data.get("game_id")

    if not game_id or game_id not in games:
        return jsonify({"success": False, "error": "Invalid game ID"}), 400

    old_session = games[game_id]
    mode = old_session["mode"]
    difficulty = old_session.get("difficulty", "Medium")
    player1_name = old_session["player1Name"]
    player2_name = old_session["player2Name"]
    player_role = old_session.get("playerRole")

    new_game = UltimateTTT()

    new_session = {
        "mode": mode,
        "difficulty": difficulty,
        "playerRole": player_role,
        "game": new_game,
        "player1Name": player1_name,
        "player2Name": player2_name,
    }

    if mode == "Player vs Bot":
        new_session["bot_module"] = old_session.get("bot_module")
        new_session["human_player"] = old_session.get("human_player")
    elif mode == "Bot vs Bot":
        new_session["bot1"] = old_session.get("bot1")
        new_session["bot2"] = old_session.get("bot2")

    games[game_id] = new_session

    return jsonify({
        "success": True,
        "board": new_game.board,
        "mainboard": new_game.mainboard,
        "currentPlayer": new_game.curr_player,
        "winner": None,
        "lastMove": None,
        "game_id": game_id
    })


if __name__ == "__main__":
    app.run(debug=True)
