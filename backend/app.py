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


from werkzeug.utils import secure_filename

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

    # Player vs Bot Mode
    if mode == "Player vs Bot":
        bot_module = load_bot(difficulty)
        human_player = 1 if player_role == "Player 1" else 2
        session_data["bot_module"] = bot_module
        session_data["human_player"] = human_player

        # 🔥 Let bot make the first move if human is Player 2
        if human_player == 2:
            bot_move = bot_module.play(game.board, game.last, 1)
            if bot_move:
                game.move(*bot_move)

    # Bot vs Bot Mode
    elif mode == "Bot vs Bot":
        uploaded_file = request.files.get("botFile")
        if not uploaded_file:
            return jsonify({"success": False, "error": "No bot uploaded"}), 400

        filename = secure_filename(uploaded_file.filename)
        filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
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
        "lastMove": game.last  # 🔥 Add this
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

import random

@app.route("/bot-vs-bot-run", methods=["POST"])
def bot_vs_bot_run():
    """Run a Bot vs Bot game using uploaded bot + difficulty bot."""
    data = request.get_json()
    game_id = data.get("game_id")

    session = games.get(game_id)
    if not session:
        return jsonify({"success": False, "error": "Game not found"}), 400

    game = session["game"]
    bot1 = session.get("bot1")  # Uploaded bot
    bot2 = session.get("bot2")  # Default difficulty bot

    if not bot1 or not bot2:
        return jsonify({"success": False, "error": "Bots not loaded"}), 400

    board = game.board
    mainboard = game.mainboard
    prev_move = game.last
    winner = game.get_winner()
    move_history = []

    activeMiniBoard = None

    def get_valid_moves(board, activeMiniBoard):
        moves = []
        if activeMiniBoard is not None:
            miniRow = activeMiniBoard // 3
            miniCol = activeMiniBoard % 3
            for i in range(3):
                for j in range(3):
                    r, c = miniRow * 3 + i, miniCol * 3 + j
                    if board[r][c] == 0:
                        moves.append((r, c))
        else:
            for i in range(9):
                for j in range(9):
                    if board[i][j] == 0:
                        moves.append((i, j))
        return moves

    max_moves = 81  # Full board max
    while not winner and len(move_history) < max_moves:
        current_player = game.curr_player
        current_bot = bot1 if current_player == 1 else bot2
        valid_moves = get_valid_moves(board, activeMiniBoard)

        try:
            move = current_bot.play(board, prev_move, current_player)
        except Exception as e:
            return jsonify({"success": False, "error": f"Bot crashed: {str(e)}"}), 500

        if not move or move not in valid_moves:
            import random
            move = random.choice(valid_moves)

        r, c = move
        game.move(r, c)
        move_history.append({"player": current_player, "move": [r, c]})
        prev_move = move

        miniRow = r % 3
        miniCol = c % 3
        activeMiniBoard = miniRow * 3 + miniCol if mainboard[miniRow][miniCol] == 0 else None

        winner = game.get_winner()

    # Save session
    session.update({
        "board": game.board,
        "mainboard": game.mainboard,
        "curr_player": game.curr_player,
        "winner": winner,
        "activeMiniBoard": activeMiniBoard,
        "move_history": move_history,
        "player1Name": "Uploaded Bot",
        "player2Name": f"{session.get('difficulty', 'Default')} Bot"
    })

    winner_name = None
    if winner == 1:
        winner_name = "Uploaded Bot"
    elif winner == 2:
        winner_name = f"{session.get('difficulty', 'Default')} Bot"

    return jsonify({
        "success": True,
        "board": game.board,
        "mainboard": game.mainboard,
        "currentPlayer": game.curr_player,
        "winner": winner,
        "winner_name": winner_name,
        "player1": "Uploaded Bot",
        "player2": f"{session.get('difficulty', 'Default')} Bot",
        "activeMiniBoard": activeMiniBoard,
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
