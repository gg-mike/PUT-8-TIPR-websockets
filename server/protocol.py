import memory
from packet import PacketType, extract_header_info, generate_header, str2bytes


def process_NEW_REQ(ws, games: memory.Games) -> bytes:
    print(f"NEW|REQ")
    game_key, player_key = games.createGame(ws)
    print(f"\tCreated new game \"{game_key}\" with player \"{player_key}\"")
    return generate_header(PacketType.NEW) + str2bytes(game_key) + str2bytes(player_key)


async def process_JOIN_REQ(ws, game_key: str, games: memory.Games) -> bytes:
    print(f"JOIN|REQ: game=\"{game_key}\"")
    player_key, r = games.addPlayer(game_key, ws)
    if r == 0:
        print(f"\tAdded player \"{player_key}\" to game")
        print(f"\tSending message to first player to start a game")
        await games.players_ws[games.games[game_key].active].send(generate_header(PacketType.START))
        return generate_header(PacketType.JOIN) + str2bytes(player_key)
    elif r == 1:
        print("\tRequested game doesn't exist")
        return generate_header(PacketType.JOIN, is_err=True, code=1)
    elif r == 2:
        print("\tRequested game is already full")
        return generate_header(PacketType.JOIN, is_err=True, code=2)


async def process_QUIT_REQ(player_key: str, games: memory.Games) -> bytes:
    print(f"QUIT|REQ: player=\"{player_key}\"")
    left_player = games.removePlayer(player_key)
    if left_player is not None:
        await games.players_ws[left_player].send(generate_header(PacketType.RESET))
    return generate_header(PacketType.QUIT)


async def process_MOVE_REQ(moves: int, player_key: str, games: memory.Games) -> bytes:
    a = moves >> 4
    b = moves & 0b1111
    print(f"MOVE|REQ: player=\"{player_key}\", {a=}, {b=}")
    res = games.move(player_key, a, b)
    if type(res) == int:
        return generate_header(PacketType.MOVE, is_err=True, code=res)
    b_a, b_b, is_end, is_ch, score = res
    code = ((is_end << 1) | is_ch)
    pt = generate_header(PacketType.UPDATE, code=code) + bytes([((b_a << 4) | b_b), score, moves])
    await games.players_ws[games.getOtherPlayer(player_key)].send(pt)
    return generate_header(PacketType.MOVE, code=code) + bytes([((b_a << 4) | b_b), score, moves])


def process_REFRESH(ws, player_key: str, games: memory.Games) -> bytes:
    print(f"REFRESH|REQ: player=\"{player_key}\"")
    if player_key not in games.players:
        return generate_header(PacketType.REFRESH, is_err=True, code=1)

    game = games.games[games.players[player_key]]
    games.players_ws[player_key] = ws
    code, p_score, o_score, board = game.getStatus(player_key)

    return generate_header(PacketType.REFRESH, code=code) + bytes([p_score, o_score] + board)


async def generate_response(websocket, req: bytes, games: memory.Games) -> bytes:
    pt, is_ack, is_err, code = extract_header_info(req[0])

    if pt == PacketType.NEW:
        return process_NEW_REQ(websocket, games)
    elif pt == PacketType.JOIN:
        return await process_JOIN_REQ(websocket, req[1:].decode("utf-8"), games)
    elif pt == PacketType.QUIT:
        return await process_QUIT_REQ(req[1:].decode("utf-8"), games)
    elif pt == PacketType.MOVE:
        return await process_MOVE_REQ(req[1], req[2:].decode("utf-8"), games)
    elif pt == PacketType.REFRESH:
        return process_REFRESH(websocket, req[1:].decode("utf-8"), games)
    else:
        print(f"Unknown packet type: {pt}")
        return bytes([PacketType.UNKNOWN_PT, pt])


async def process_message(websocket, req: bytes, games: memory.Games):
    res = await generate_response(websocket, req, games)
    res_repr = "|".join([f"{r:08b}" for r in res])
    print(f"\tSending response: {res_repr}")
    await websocket.send(res)


def main():
    pass


if __name__ == '__main__':
    main()
