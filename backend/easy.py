import random

def get_local_board(board, tr, tc):
    return [[board[tr*3 + i][tc*3 + j] for j in range(3)] for i in range(3)]

def check_win(board, player):
    for i in range(3):
        if all(board[i][j] == player for j in range(3)) or all(board[j][i] == player for j in range(3)):
            return True
    if board[0][0] == board[1][1] == board[2][2] == player:
        return True
    if board[0][2] == board[1][1] == board[2][0] == player:
        return True
    return False

def play(board, prev_move, player):
    opponent = 2 if player == 1 else 1
    valid_moves = []

    if not prev_move:
        valid_moves = [(r, c) for r in range(9) for c in range(9) if board[r][c] == 0]
    else:
        mr, mc = prev_move[0] % 3, prev_move[1] % 3
        nr, nc = mr * 3, mc * 3
        subgrid = [board[r][nc:nc+3] for r in range(nr, nr+3)]
        if all(cell != 0 for row in subgrid for cell in row):
            valid_moves = [(r, c) for r in range(9) for c in range(9) if board[r][c] == 0]
        else:
            valid_moves = [(r, c) for r in range(nr, nr+3) for c in range(nc, nc+3) if board[r][c] == 0]

    # Try to win local board
    for r, c in valid_moves:
        tr, tc = r // 3, c // 3
        temp_board = get_local_board(board, tr, tc)
        temp_board[r % 3][c % 3] = player
        if check_win(temp_board, player):
            return (r, c)

    # Try to block opponent
    for r, c in valid_moves:
        tr, tc = r // 3, c // 3
        temp_board = get_local_board(board, tr, tc)
        temp_board[r % 3][c % 3] = opponent
        if check_win(temp_board, opponent):
            return (r, c)

    # Else, just pick randomly
    return random.choice(valid_moves)
