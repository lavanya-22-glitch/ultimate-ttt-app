import time
import random
import copy

MAX_DEPTH = 5
TIME_LIMIT = 3.9  # leave a buffer

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
        score = minimax(temp_board, move, MAX_DEPTH - 1, False, player, float("-inf"), float("inf"))
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

    position_weights = [
        [2, 1, 2],
        [1, 3, 1],
        [2, 1, 2]
    ]

    def score_line(a, b, c, p):
        if a == b == c == p:
            return 100
        elif (a == b == p and c == 0) or (b == c == p and a == 0) or (a == c == p and b == 0):
            return 10
        elif a == b == c == (opp if p == player else player):
            return -80
        return 0

    for i in range(0, 9, 3):
        for j in range(0, 9, 3):
            mini = [[board[i + x][j + y] for y in range(3)] for x in range(3)]

            # Evaluate rows, cols, diagonals
            for r in range(3):
                score += score_line(mini[r][0], mini[r][1], mini[r][2], player)
            for c in range(3):
                score += score_line(mini[0][c], mini[1][c], mini[2][c], player)
            score += score_line(mini[0][0], mini[1][1], mini[2][2], player)
            score += score_line(mini[0][2], mini[1][1], mini[2][0], player)

            # Positional weights
            for r in range(3):
                for c in range(3):
                    if mini[r][c] == player:
                        score += position_weights[r][c]
                    elif mini[r][c] == opp:
                        score -= position_weights[r][c] // 2  # Penalize lightly for opp

    return score


def get_valid_moves(board, prev_move, full_board):
    if prev_move is None:
        return [(r, c) for r in range(9) for c in range(9) if board[r][c] == 0]

    mr, mc = prev_move[0] % 3, prev_move[1] % 3
    nr, nc = mr * 3, mc * 3

    local_block = [full_board[r][nc:nc+3] for r in range(nr, nr+3)]
    if all(cell != 0 for row in local_block for cell in row):
        return [(r, c) for r in range(9) for c in range(9) if board[r][c] == 0]

    return [(r, c) for r in range(nr, nr+3) for c in range(nc, nc+3) if board[r][c] == 0]

def make_move(board, move, player):
    r, c = move
    board[r][c] = player
