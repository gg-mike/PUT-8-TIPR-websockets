# PUT-8-TIPR-websockets

Memory game for 2 players.

Frontend is a simple Vanilla JS app and backend is created using [websockets](https://websockets.readthedocs.io/en/stable/) library for Python.
App uses custom protocol for communication.

## Protocol

Packet handling can be found in files `client/protocol.js` and `server/protocol.py`.

```
+----------------+----+----+--------+----------------...----------------+
|      TYPE      | SV | ER |  CODE  |              PAYLOAD              |
|       4b       | 1b | 1b |   2b   |               0B-9B               |
+----------------+----+----+--------+----------------...----------------+
```
| Field | Description |
| ----- | ----------- |
| `TYPE` | indicated type of the packet |
| `SV` | 0 - client `REQ`, 1 - server `ACK` |
| `ER` | 1 if error occured |
| `CODE` | if `ER` is 1 the `CODE` is the error code, else it is used as game flags |
| `PAYLOAD` | holds any data needed for game, e.g. game and player keys, moves, scores |
