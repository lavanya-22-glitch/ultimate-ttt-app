#attacks and defends

#strat2 but deep and dsa integrated

import time
import random
import copy

MAX_DEPTH = 6
TIME_LIMIT = 3.8
start_time = None
transposition_table = {}

def play(board, prev_move, player):
    global start_time, transposition_table
    start_time = time.time()
    transposition_table = {}

    valid_moves = get_valid_moves(board, prev_move, board)

    # Move ordering: sort moves that go to center/corner first
    move_scores = []
    for move in valid_moves:
        r, c = move
        local_r, local_c = r % 3, c % 3
        priority = 0
        if (local_r, local_c) == (1, 1):
            priority = 3
        elif (local_r, local_c) in [(0, 0), (0, 2), (2, 0), (2, 2)]:
            priority = 2
        else:
            priority = 1
        move_scores.append((priority, move))

    sorted_moves = [m for _, m in sorted(move_scores, reverse=True)]

    best_score = float("-inf")
    best_move = sorted_moves[0]

    for move in sorted_moves:
        temp_board = copy.deepcopy(board)
        make_move(temp_board, move, player)

        score = minimax(temp_board, move, MAX_DEPTH - 1, False, player, float("-inf"), float("inf"))

        if score > best_score:
            best_score = score
            best_move = move

    return best_move

def minimax(board, prev_move, depth, maximizing, player, alpha, beta):
    global start_time, transposition_table

    if time.time() - start_time > TIME_LIMIT:
        return evaluate(board, player)

    board_key = hash_board(board)
    if (board_key, depth, maximizing) in transposition_table:
        return transposition_table[(board_key, depth, maximizing)]

    if depth == 0:
        return evaluate(board, player)

    valid_moves = get_valid_moves(board, prev_move, board)
    if not valid_moves:
        return evaluate(board, player)

    best_val = float("-inf") if maximizing else float("inf")
    opponent = 2 if player == 1 else 1

    for move in valid_moves:
        temp_board = copy.deepcopy(board)
        make_move(temp_board, move, player if maximizing else opponent)
        eval = minimax(temp_board, move, depth-1, not maximizing, player, alpha, beta)

        if maximizing:
            best_val = max(best_val, eval)
            alpha = max(alpha, eval)
        else:
            best_val = min(best_val, eval)
            beta = min(beta, eval)

        if beta <= alpha:
            break

    transposition_table[(board_key, depth, maximizing)] = best_val
    return best_val

def evaluate(board, player):
    opp = 2 if player == 1 else 1
    score = 0
    position_weights = [[2, -2, 2], [-2, 3, -2], [2, -2, 2]]
    mainboard = [[0 for _ in range(3)] for _ in range(3)]

    for i in range(3):
        for j in range(3):
            mini = [[board[i * 3 + x][j * 3 + y] for y in range(3)] for x in range(3)]
            winner = check_local_winner(mini)
            mainboard[i][j] = winner

            if winner == player:
                score += 50
            elif winner == opp:
                score -= 50
            elif winner == 3:
                score -= 10

            # Attack & defense evaluation
            def line_score(line, p):
                if line.count(p) == 2 and line.count(0) == 1:
                    return True
                return False

            for r in range(3):
                row = mini[r]
                if line_score(row, player):
                    score += 15
                elif line_score(row, opp):
                    score -= 20

            for c in range(3):
                col = [mini[r][c] for r in range(3)]
                if line_score(col, player):
                    score += 15
                elif line_score(col, opp):
                    score -= 20

            diag1 = [mini[d][d] for d in range(3)]
            diag2 = [mini[d][2 - d] for d in range(3)]

            if line_score(diag1, player):
                score += 15
            elif line_score(diag1, opp):
                score -= 20

            if line_score(diag2, player):
                score += 15
            elif line_score(diag2, opp):
                score -= 20

            # Positional bias
            for r in range(3):
                for c in range(3):
                    cell = mini[r][c]
                    if cell == player:
                        score += position_weights[r][c]
                    elif cell == opp:
                        score -= position_weights[r][c] // 2

    # Global alignment
    def score_line(a, b, c):
        if a == b == c == player:
            return 300
        elif (a == b == player and c == 0) or (b == c == player and a == 0) or (a == c == player and b == 0):
            return 100
        elif a == b == c == opp:
            return -300
        return 0

    for r in range(3):
        score += score_line(mainboard[r][0], mainboard[r][1], mainboard[r][2])
    for c in range(3):
        score += score_line(mainboard[0][c], mainboard[1][c], mainboard[2][c])
    score += score_line(mainboard[0][0], mainboard[1][1], mainboard[2][2])
    score += score_line(mainboard[0][2], mainboard[1][1], mainboard[2][0])

    return score


def get_valid_moves(board, prev_move, full_board):
    def is_block_active(r, c):
        mini = [[board[r * 3 + x][c * 3 + y] for y in range(3)] for x in range(3)]
        winner = check_local_winner(mini)
        return winner == 0  # only playable if not won/drawn

    if prev_move is None:
        return [(r, c) for r in range(9) for c in range(9) if board[r][c] == 0]

    mr, mc = prev_move[0] % 3, prev_move[1] % 3

    # Check if target mini-board is still active
    if is_block_active(mr, mc):
        nr, nc = mr * 3, mc * 3
        return [(r, c) for r in range(nr, nr+3) for c in range(nc, nc+3) if board[r][c] == 0]
    else:
        # If not active, any move in any active mini-board is allowed
        valid = []
        for br in range(3):
            for bc in range(3):
                if is_block_active(br, bc):
                    nr, nc = br * 3, bc * 3
                    for r in range(nr, nr+3):
                        for c in range(nc, nc+3):
                            if board[r][c] == 0:
                                valid.append((r, c))
        return valid


def make_move(board, move, player):
    r, c = move
    board[r][c] = player

def check_local_winner(mini):
    for r in range(3):
        if mini[r][0] == mini[r][1] == mini[r][2] != 0:
            return mini[r][0]
    for c in range(3):
        if mini[0][c] == mini[1][c] == mini[2][c] != 0:
            return mini[0][c]
    if mini[0][0] == mini[1][1] == mini[2][2] != 0:
        return mini[0][0]
    if mini[0][2] == mini[1][1] == mini[2][0] != 0:
        return mini[0][2]
    if all(mini[i][j] != 0 for i in range(3) for j in range(3)):
        return 3
    return 0

def hash_board(board):
    return str(board)  # Simple hash; fast enough for our purposes
