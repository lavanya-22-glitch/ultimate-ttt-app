import random

def play(board, prev_move, player):
    valid_moves = []
    
    if not prev_move:
        valid_moves = [(r, c) for r in range(9) for c in range(9) if board[r][c] == 0]
    else:
        mr, mc = prev_move[0] % 3, prev_move[1] % 3
        nr, nc = mr * 3, mc * 3
        
        # Check if target board is won/drawn
        subgrid = [board[r][nc:nc+3] for r in range(nr, nr+3)]
        if all(cell != 0 for row in subgrid for cell in row):
            # Any move allowed
            valid_moves = [(r, c) for r in range(9) for c in range(9) if board[r][c] == 0]
        else:
            valid_moves = [(r, c) for r in range(nr, nr+3) for c in range(nc, nc+3) if board[r][c] == 0]

    return random.choice(valid_moves)
