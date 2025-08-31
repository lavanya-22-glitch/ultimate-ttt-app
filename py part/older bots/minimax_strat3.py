#over engineered fail...

import time
import random
import copy

MAX_DEPTH = 5
TIME_LIMIT = 3.8
start_time = None

def play(board, prev_move, player):
    global start_time
    start_time = time.time()

    valid_moves = get_valid_moves(board, prev_move, board)
    best_score = float("-inf")
    best_move = random.choice(valid_moves)

    for move in valid_moves:
        temp_board = copy.deepcopy(board)
        make_move(temp_board, move, player)

        penalty = -100 if is_bad_send(move, board) else 0  # Not too harsh

        score = minimax(temp_board, move, MAX_DEPTH - 1, False, player, float("-inf"), float("inf")) + penalty

        if score > best_score:
            best_score = score
            best_move = move

    return best_move

def minimax(board, prev_move, depth, maximizing, player, alpha, beta):
    global start_time
    if time.time() - start_time > TIME_LIMIT or depth == 0:
        return evaluate(board, player)

    valid_moves = get_valid_moves(board, prev_move, board)
    if not valid_moves:
        return evaluate(board, player)

    if maximizing:
        max_eval = float("-inf")
        for move in valid_moves:
            temp_board = copy.deepcopy(board)
            make_move(temp_board, move, player)
            eval = minimax(temp_board, move, depth-1, False, player, alpha, beta)
            max_eval = max(max_eval, eval)
            alpha = max(alpha, eval)
            if beta <= alpha:
                break
        return max_eval
    else:
        min_eval = float("inf")
        opp = 2 if player == 1 else 1
        for move in valid_moves:
            temp_board = copy.deepcopy(board)
            make_move(temp_board, move, opp)
            eval = minimax(temp_board, move, depth-1, True, player, alpha, beta)
            min_eval = min(min_eval, eval)
            beta = min(beta, eval)
            if beta <= alpha:
                break
        return min_eval

def evaluate(board, player):
    opp = 2 if player == 1 else 1
    score = 0
    position_weights = [[2, 1, 2], [1, 3, 1], [2, 1, 2]]
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

            # Two-in-a-row scoring
            for r in range(3):
                row = mini[r]
                if row.count(player) == 2 and row.count(0) == 1:
                    score += 10
                if row.count(opp) == 2 and row.count(0) == 1:
                    score -= 8
            for c in range(3):
                col = [mini[r][c] for r in range(3)]
                if col.count(player) == 2 and col.count(0) == 1:
                    score += 10
                if col.count(opp) == 2 and col.count(0) == 1:
                    score -= 8

            # Positional weights
            for r in range(3):
                for c in range(3):
                    if mini[r][c] == player:
                        score += position_weights[r][c]
                    elif mini[r][c] == opp:
                        score -= position_weights[r][c] // 2

    def score_global_line(a, b, c):
        if a == b == c == player:
            return 300
        elif (a == b == player and c == 0) or (b == c == player and a == 0) or (a == c == player and b == 0):
            return 100
        elif a == b == c == opp:
            return -300
        return 0

    for r in range(3):
        score += score_global_line(mainboard[r][0], mainboard[r][1], mainboard[r][2])
    for c in range(3):
        score += score_global_line(mainboard[0][c], mainboard[1][c], mainboard[2][c])
    score += score_global_line(mainboard[0][0], mainboard[1][1], mainboard[2][2])
    score += score_global_line(mainboard[0][2], mainboard[1][1], mainboard[2][0])

    if mainboard[1][1] == player:
        score += 15
    elif mainboard[1][1] == opp:
        score -= 15

    return score

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

def get_valid_moves(board, prev_move, full_board):
    if prev_move is None:
        return [(r, c) for r in range(9) for c in range(9) if board[r][c] == 0]

    mr, mc = prev_move[0] % 3, prev_move[1] % 3
    nr, nc = mr * 3, mc * 3

    subgrid = [full_board[r][nc:nc+3] for r in range(nr, nr+3)]
    if all(cell != 0 for row in subgrid for cell in row):
        return [(r, c) for r in range(9) for c in range(9) if board[r][c] == 0]

    return [(r, c) for r in range(nr, nr+3) for c in range(nc, nc+3) if board[r][c] == 0]

def make_move(board, move, player):
    r, c = move
    board[r][c] = player

def is_bad_send(move, board):
    send_r, send_c = move[0] % 3, move[1] % 3
    nr, nc = send_r * 3, send_c * 3
    for r in range(nr, nr + 3):
        for c in range(nc, nc + 3):
            if board[r][c] == 0:
                return False
    return True
