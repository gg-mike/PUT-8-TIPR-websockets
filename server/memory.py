from __future__ import annotations

from itertools import cycle
from random import randint, choice

from websockets.legacy.server import WebSocketServerProtocol


def gen_board() -> [int]:
    empty_cells = [i for i in range(0, 12)]
    t = 0
    board = [-1] * 12

    while len(empty_cells):
        i_a = empty_cells.pop(randint(0, len(empty_cells) - 1))
        i_b = empty_cells.pop(randint(0, len(empty_cells) - 1))
        board[i_a] = board[i_b] = t
        t += 1

    return board


def gen_random_seq(n: int) -> str:
    return "".join(choice("0123456789") for _ in range(n))


def gen_new_key(d: dict[str, any], n: int = 4) -> str:
    key = gen_random_seq(n)
    while key in d:
        key = gen_random_seq(n)
    return key


class Memory:
    def __init__(self, player1):
        self.turns = None
        self.active: str = player1
        self.board: [int] = gen_board()
        self.used: [bool] = [False] * 12
        self.players: dict = {player1: 0}

    def addPlayer(self, player2: str):
        self.players[player2] = 0
        self.turns = cycle(list(self.players.keys()))
        self.active = next(self.turns)

    def isEmpty(self) -> bool:
        return len(self.players) == 0

    def isFull(self) -> bool:
        return len(self.players) == 2

    def reset(self):
        for k in self.players:
            self.players[k] = 0

    def canMove(self, player: str) -> bool:
        return self.active == player

    def move(self, a: int, b: int) -> tuple[int, int, bool, bool, int] | int:
        if self.used[a] or self.used[b]:
            return 2

        b_a = self.board[a]
        b_b = self.board[b]

        if b_a == b_b:
            self.used[a] = self.used[b] = True
            self.players[self.active] += 1
            score = self.players[self.active]
            is_ch = False
        else:
            score = self.players[self.active]
            self.active = next(self.turns)
            is_ch = True

        return b_a, b_b, len(set(self.used)) == 1 and self.used[0], is_ch, score

    def getStatus(self, player_key: str) -> tuple[int, int, int, [int]]:
        bin_board = []
        for i in range(0, len(self.board) - 1, 2):
            x = self.board[i] if self.used[i] else 0b1111
            y = self.board[i + 1] if self.used[i + 1] else 0b1111
            bin_board.append((x << 4) | y)

        is_end = len(set(self.used)) == 1 and self.used[0]
        p_turn = self.active == player_key
        scores = self.players.copy()
        p_score = scores.pop(player_key)
        o_score = scores.popitem()[1]

        return (is_end << 1) | p_turn, p_score, o_score, bin_board


class Games:
    def __init__(self):
        self.players: dict[str, str] = dict()
        self.players_ws: dict[str, WebSocketServerProtocol] = dict()
        self.games: dict[str, Memory] = dict()

    def getGame(self, game_key: str) -> Memory | None:
        return self.games.get(game_key)

    def getOtherPlayer(self, player_key: str) -> str:
        players = list(self.games[self.players[player_key]].players.keys())
        return players[1] if player_key == players[0] else players[0]

    def move(self, player_key: str, a: int, b: int) -> tuple[int, int, bool, bool, int] | int:
        if self.games[self.players[player_key]].canMove(player_key):
            return self.games[self.players[player_key]].move(a, b)
        else:
            return 1

    def createGame(self, ws: WebSocketServerProtocol) -> tuple[str, str]:
        game_key = gen_new_key(self.games)
        player_key = gen_new_key(self.players)
        self.players[player_key] = game_key
        self.players_ws[player_key] = ws
        self.games[game_key] = Memory(player_key)
        return game_key, player_key

    def addPlayer(self, game_key: str, ws: WebSocketServerProtocol) -> tuple[str, int]:
        if game_key not in self.games:
            return "", 1
        elif self.games[game_key].isFull():
            return "", 2

        player_key = gen_new_key(self.players)
        self.players[player_key] = game_key
        self.players_ws[player_key] = ws
        self.games[game_key].addPlayer(player_key)
        return player_key, 0

    def removePlayer(self, player_key: str) -> str | None:
        if player_key not in self.players:
            return None

        game_key = self.players.pop(player_key)
        self.games[game_key].players.pop(player_key)
        self.players_ws.pop(player_key)

        if self.games[game_key].isEmpty():
            print("\tNo players left => deleting game")
            self.games.pop(game_key)
            return None
        else:
            print("\tResetting game")
            self.games[game_key].reset()
            return list(self.games[game_key].players.keys())[0]


def main():
    pass


if __name__ == '__main__':
    main()
