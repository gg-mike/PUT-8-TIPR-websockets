#!/usr/bin/env python

import asyncio

import websockets
import protocol
import memory


games = memory.Games()


async def handler(websocket):
    while True:
        try:
            req = await websocket.recv()
        except websockets.ConnectionClosedOK:
            break
        await protocol.process_message(websocket, req, games)


async def main():
    async with websockets.serve(handler, "", 8001):
        await asyncio.Future()  # run forever


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("### Shutting down server ###")
