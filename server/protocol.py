from enum import IntEnum
import memory


class PacketType(IntEnum):
    ACK = 0b10000000
    ERR = 0b01000000

    NEW = 0b00000001
    JOIN = 0b00000010
    QUIT = 0b00000011
    START = 0b00000100
    RESET = 0b00000101
    MOVE = 0b00000110
    UPDATE = 0b00000111

    REFRESH = 0b00001000

    UNKNOWN_PT = 0b00100000


def str2bytes(s: str) -> bytes:
    return bytes(bytearray(s, "ascii"))


def process_NEW_REQ(ws, games: memory.Games) -> bytes:
    print(f"Request to create new game")
    game_key, player_key = games.createGame(ws)
    print(f"\tCreated new game \"{game_key}\" with player \"{player_key}\"")
    return bytes([PacketType.NEW | PacketType.ACK]) + str2bytes(game_key) + str2bytes(player_key)


async def process_JOIN_REQ(ws, game_key: str, games: memory.Games) -> bytes:
    print(f"Request to join game with code \"{game_key}\"")
    player_key, r = games.addPlayer(game_key, ws)
    if r == 0:
        print(f"\tAdded player \"{player_key}\" to game")
        print(f"\tSending message to first player to start a game")
        await games.players_ws[games.games[game_key].active].send(bytes([PacketType.START]))
        return bytes([PacketType.JOIN | PacketType.ACK]) + str2bytes(player_key)
    elif r == 1:
        print("\tRequested game doesn't exist")
        return bytes([PacketType.JOIN | PacketType.ERR, 1])
    elif r == 2:
        print("\tRequested game is already full")
        return bytes([PacketType.JOIN | PacketType.ERR, 2])


async def process_QUIT_REQ(player_key: str, games: memory.Games) -> bytes:
    print(f"Request to quit game by player \"{player_key}\"")
    left_player = games.removePlayer(player_key)
    if left_player is not None:
        await games.players_ws[left_player].send(bytes([PacketType.RESET]))
    return bytes([PacketType.QUIT | PacketType.ACK])


def process_REFRESH(player_key: str, games: memory.Games) -> bytes:
    print(f"Request to refresh player \"{player_key}\"")
    # TODO: determine whether the game still exists, whose turn is it, what are the scores
    return bytes([PacketType.REFRESH | PacketType.ACK])


async def generate_response(websocket, req: bytes, games: memory.Games) -> bytes:
    pt = req[0]

    if pt == PacketType.NEW:
        return process_NEW_REQ(websocket, games)
    elif pt == PacketType.JOIN:
        return await process_JOIN_REQ(websocket, req[1:].decode("utf-8"), games)
    elif pt == PacketType.QUIT:
        return await process_QUIT_REQ(req[1:].decode("utf-8"), games)
    elif pt == PacketType.REFRESH:
        return process_REFRESH(req[1:].decode("utf-8"), games)
    else:
        print(f"Unknown packet type: {pt}")
        return bytes([PacketType.UNKNOWN_PT, pt])


async def process_message(websocket, req: bytes, games: memory.Games):
    res = await generate_response(websocket, req, games)
    print(f"Sending response: {res}")
    await websocket.send(res)


def main():
    pass


if __name__ == '__main__':
    main()
