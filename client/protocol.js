import * as game from "./game.js"
import * as utils from "./utils.js"

export const conn = new WebSocket("ws://localhost:8001");

const PacketType = {
    NEW: 0b00000001,
    JOIN: 0b00000010,
    QUIT: 0b00000011,
    START: 0b00000100,
    RESET: 0b00000101,
    MOVE: 0b00000110,
    UPDATE: 0b00000111,
    REFRESH: 0b00001000,

    ACK: 0b10000000,
    ERR: 0b01000000,

    UNKNOWN_PT: 0b00100000,
}


function pt2name(pt) {
    let type = (pt & PacketType.ACK) ? "_ACK" : (pt & PacketType.ERR) ? "_ERR" : "";
    let arr = Object.entries(PacketType).filter(e => e[1] === (pt & 0b0011111)).map(o => o[0])
    if (arr.length === 0) return "UNKNOWN [" + pt + "]";
    else return arr[0] + type;
}

function send(arr) {
    conn.send(new Uint8Array(arr).buffer);
    console.debug("[protocol] send(): " + arr);
}

function onmessage(e) {
    let arr = new Uint8Array(e.data);
    let pt = arr[0];
    console.debug("[protocol] onmessage(): recv message (" + pt2name(pt) + ")");
    switch (pt) {
        case PacketType.NEW | PacketType.ACK: return recv_NEW_ACK(arr);
        case PacketType.JOIN | PacketType.ACK: return recv_JOIN_ACK(arr);
        case PacketType.JOIN | PacketType.ERR: return recv_JOIN_ERR(arr);
        case PacketType.QUIT | PacketType.ACK: return recv_QUIT_ACK();
        case PacketType.START: return recv_START();
        case PacketType.RESET: return recv_RESET();
        case PacketType.MOVE | PacketType.ACK: return recv_MOVE_ACK(arr);
        case PacketType.MOVE | PacketType.ERR: throw Error("Not implemented [MOVE_ERR]");
        case PacketType.UPDATE: return recv_UPDATE(arr);
        case PacketType.REFRESH: throw Error("Not implemented [REFRESH]");
        case PacketType.UNKNOWN_PT: throw Error(`Server received unknown packet: ${pt2name(arr[1])}`);
        default: throw Error(`Received unknown packet: ${pt2name(arr[0])}`);
    }

}

export function init() {
    conn.binaryType = "arraybuffer";
    conn.onopen = () => console.debug("[protocol] onopen(): conn opened");
    conn.onmessage = onmessage;
    conn.onclose = () => {
        conn.close();
        console.debug("[protocol] onclose(): conn close");
    };
    conn.onerror = () => console.error("[protocol] onerror(): error occurred (" + e.type + ")");
    console.debug("[protocol] init(): conn created");
}

// ########## NEW ##########

export function send_NEW_REQ() {
    send([PacketType.NEW]);
    console.info("[protocol] send_NEW_REQ()");
}

function recv_NEW_ACK(arr) {
    let gameKey = utils.bytes2str(arr.slice(1, 5));
    let playerKey = utils.bytes2str(arr.slice(5));
    game.handleNew(gameKey, playerKey);
}

// ########## JOIN #########

export function send_JOIN_REQ(gameKey) {
    send([PacketType.JOIN, ...utils.str2bytes(gameKey)]);
    console.info("[protocol] send_JOIN_REQ(): " + gameKey);
}

function recv_JOIN_ACK(arr) {
    let playerKey = utils.bytes2str(arr.slice(1));
    game.handleJoin(playerKey);
}

function recv_JOIN_ERR(arr) {
    let errCode = arr[1];
    if (errCode === 1) game.handleGameDoesntExists();
    else if (errCode === 2) game.handleGameAlreadyFull();
}

// ########## QUIT #########

export function send_QUIT_REQ() {
    send([PacketType.QUIT, ...utils.getPKeyBytes()]);
    console.info("[protocol] send_QUIT_REQ()");
}

function recv_QUIT_ACK() {
    localStorage.clear();
    game.switchMode(game.Modes.IDLE);
}


// ########## START ########

function recv_START() {
    console.log("Start game");
    game.switchMode(game.Modes.P_TURN);
}

// ########## RESET ########

function recv_RESET() {
    console.log("Reset game");
    game.switchMode(game.Modes.WAIT);
}

// ########## MOVE #########

export function send_MOVE_REQ(a, b) {
    send([PacketType.QUIT, ...utils.getPKeyBytes(), a << 4 | b]);
    console.info("[protocol] send_MOVE_REQ(): ["+ a + ", " + b + "]");
}

function recv_MOVE_ACK(arr) {
    let [aType, bType, isEnd, activeChange, score]  = [...utils.parseMoveRes(arr)]

    // TODO: show tile types

    document.getElementById("p_score").innerText = score.toString()
    if (isEnd) game.handleGameEnded();
    if (activeChange) game.switchMode(game.Modes.O_TURN);
}

// ########## UPDATE #######

function recv_UPDATE(arr) {
    let [aType, bType, isEnd, activeChange, score]  = [...utils.parseMoveRes(arr)]

    // TODO: show tile types

    document.getElementById("o_score").innerText = score.toString()
    if (isEnd) game.handleGameEnded();
    if (activeChange) game.switchMode(game.Modes.P_TURN);
}

// ########## REFRESH ######



// ########## UNKNOWN_PT ###


