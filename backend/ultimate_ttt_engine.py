X, O, DRAW = 1, 2, 3

def check_small(board, minir, minic):
    b = [[0 for _ in range(3)] for _ in range(3)]  
    for i in range(3):
        for j in range(3):
            b[i][j] = board[minir * 3 + i][minic * 3 + j]

    for r in range(3):
        if b[r][0] == b[r][1] == b[r][2] != 0:
            return b[r][0]

    for c in range(3):
        if b[0][c] == b[1][c] == b[2][c] != 0:
            return b[0][c]

    if b[0][0] == b[1][1] == b[2][2] != 0:
        return b[0][0]

    if b[0][2] == b[1][1] == b[2][0] != 0:
        return b[0][2]

    if all(b[i][j] != 0 for i in range(3) for j in range(3)):
        return 3
    return 0



def check_global(mainboard):
    for r in range(3):
        if mainboard[r][0] == mainboard[r][1] == mainboard[r][2] != 0 and mainboard[r][0] != DRAW:
            return mainboard[r][0]
    for c in range(3):
        if mainboard[0][c] == mainboard[1][c] == mainboard[2][c] != 0 and mainboard[0][c] != DRAW:
            return mainboard[0][c]
    if mainboard[0][0] == mainboard[1][1] == mainboard[2][2] != 0 and mainboard[0][0] != DRAW:
        return mainboard[0][0]
    if mainboard[0][2] == mainboard[1][1] == mainboard[2][0] != DRAW and mainboard[0][2] != 0:
        return mainboard[0][2]
    return 0

class UltimateTTT:
    def __init__(self):
        self.board = []
        for _ in range(9):
            self.board.append([0]*9)

        self.mainboard = []
        for _ in range(3):
            self.mainboard.append([0]*3)

        self.last = None
        self.curr_player = X

    def get_valid_moves(self):
        if not self.last:
            return [(r, c) for r in range(9) for c in range(9) if self.board[r][c] == 0]
        mr, mc = self.last[0] % 3, self.last[1] % 3
        nr, nc = mr*3, mc*3
        if self.mainboard[mr][mc] != 0 or all(self.board[r][c] != 0 for r in range(nr, nr+3) for c in range(nc, nc+3)):
            return [(r, c) for r in range(9) for c in range(9) if self.board[r][c] == 0]
        
        return [(r, c) for r in range(nr, nr+3) for c in range(nc, nc+3) if self.board[r][c] == 0]

    def move(self, r, c):
        if (r, c) not in self.get_valid_moves(): return False
        self.board[r][c] = self.curr_player
        tr, tc = r//3, c//3
        self.mainboard[tr][tc] = check_small(self.board, tr, tc)
        self.last = (r, c)
        self.curr_player = O if self.curr_player == X else X
        return True

    def get_winner(self):
        g = check_global(self.mainboard)
        if g != 0: return g
        if all(self.board[r][c] != 0 for r in range(9) for c in range(9)): return DRAW
        return None

    def print_board(self):
        def maps(v):
            if v == 0:
                return '.'
            elif v == 1:
                return 'X'
            else :
                return 'O'

        active = None
        if self.last:
            mr, mc = self.last[0] % 3, self.last[1] % 3
            if self.mainboard[mr][mc] == 0:
                active = (mr, mc)

        print("\nCurrent board state:")
        for r in range(9):
            row_str = ''
            for c in range(9):
                sr, sc = r//3, c//3
                val = maps(self.board[r][c])
                if active and (sr, sc) == active:
                    val = f"[{val}]"
                else:
                    val = f" {val} "
                row_str += val
                if c % 3 == 2 and c < 8:
                    row_str += ' |'
            print(row_str)
            if r % 3 == 2 and r < 8:
                print('-'*30)
        winner = self.get_winner()
        if winner:
            print(f"\n🏆 Winner: {'X' if winner == X else ('O' if winner == O else 'Draw')}")
