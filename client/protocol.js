import * as game from "./game.js"
import * as utils from "./utils.js"
import {extractHeaderInfo, generateHeader} from "./utils.js";

export let conn = new WebSocket("ws://localhost:8001");

const PacketType = {
    NEW: 0b0001,
    JOIN: 0b0010,
    QUIT: 0b0011,
    START: 0b0100,
    RESET: 0b0101,
    MOVE: 0b0110,
    UPDATE: 0b0111,
    REFRESH: 0b1000,

    UNKNOWN_PT: 0b1111
}


function pt2name(pt, isAck, isErr, errCode) {
    let type = isErr? `_ERR (${errCode})` : isAck ? "_ACK" : "";
    let arr = Object.entries(PacketType).filter(e => e[1] === pt).map(o => o[0])
    if (arr.length === 0) return "UNKNOWN [" + pt + "]";
    else return arr[0] + type;
}

function send(pt, data = [], isAck = false, isErr = false, code = 0) {
    let arr = [].concat(generateHeader(pt, isAck, isErr, code), data)
    conn.send(new Uint8Array(arr).buffer);
    console.debug("[protocol] send(): " + arr);
}

function onmessage(e) {
    let arr = new Uint8Array(e.data);
    let [pt, isAck, isErr, code] = extractHeaderInfo(arr[0]);
    console.debug("[protocol] onmessage(): recv message (" + pt2name(pt, isAck, isErr, code) + ")");
    switch (pt) {
        case PacketType.NEW: return recv_NEW_ACK(arr);
        case PacketType.JOIN: return isErr? recv_JOIN_ERR(code) : recv_JOIN_ACK(arr);
        case PacketType.QUIT: return recv_QUIT_ACK();
        case PacketType.START: return recv_START();
        case PacketType.RESET: return recv_RESET();
        case PacketType.MOVE: return isErr? recv_MOVE_ERR(code) : recv_MOVE_ACK(arr);
        case PacketType.UPDATE: return recv_UPDATE(arr);
        case PacketType.REFRESH: return isErr? recv_REFRESH_ERR(code) : recv_REFRESH_ACK(arr);
        case PacketType.UNKNOWN_PT: throw Error(`Server received unknown packet: ${pt2name(arr[1])}`);
        default: throw Error(`Received unknown packet: ${pt2name(arr[0])}`);
    }

}

export function init() {
    conn = new WebSocket("ws://localhost:8001");
    conn.binaryType = "arraybuffer";
    conn.onopen = () => {
        console.debug("[protocol] onopen(): conn opened");
        send_REFRESH_REQ();
    }
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
    send(PacketType.NEW);
    console.info("[protocol] send_NEW_REQ()");
}

function recv_NEW_ACK(arr) {
    let gameKey = utils.bytes2str(arr.slice(1, 5));
    let playerKey = utils.bytes2str(arr.slice(5));
    game.handleNew(gameKey, playerKey);
}

// ########## JOIN #########

export function send_JOIN_REQ(gameKey) {
    send(PacketType.JOIN, [...utils.str2bytes(gameKey)]);
    console.info("[protocol] send_JOIN_REQ(): " + gameKey);
}

function recv_JOIN_ACK(arr) {
    let playerKey = utils.bytes2str(arr.slice(1));
    game.handleJoin(playerKey);
}

function recv_JOIN_ERR(errCode) {
    if (errCode === 1) game.handleGameDoesntExists();
    else if (errCode === 2) game.handleGameAlreadyFull();
}

// ########## QUIT #########

export function send_QUIT_REQ() {
    send(PacketType.QUIT, [...utils.getPKeyBytes()]);
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
    send(PacketType.MOVE, [(a << 4) | b, ...utils.getPKeyBytes()]);
    console.info("[protocol] send_MOVE_REQ(): ["+ a + ", " + b + "]");
}

function recv_MOVE_ACK(arr) {
    let [aType, bType, isEnd, isCh, score, a, b] = utils.parseMoveRes(arr);
    game.showTiles(a, b, aType, bType, isCh);

    document.getElementById("p_score").innerText = score.toString()
    if (isEnd) game.handleGameEnded();
    if (isCh) game.switchMode(game.Modes.O_TURN);
}

function recv_MOVE_ERR(errCode) {
    if (errCode === 1) utils.showMessage("It's not your move!");
    else if (errCode === 2) utils.showMessage("One of the tiles was already picked!");
}

// ########## UPDATE #######

function recv_UPDATE(arr) {
    let [aType, bType, isEnd, isCh, score, a, b] = utils.parseMoveRes(arr);
    game.showTiles(a, b, aType, bType, isCh);

    document.getElementById("o_score").innerText = score.toString()
    if (isEnd) game.handleGameEnded();
    if (isCh) game.switchMode(game.Modes.P_TURN);
}

// ########## REFRESH ######

function send_REFRESH_REQ() {
    send(PacketType.REFRESH, [...utils.getPKeyBytes()]);
    console.info("[protocol] send_REFRESH_REQ()");
}

function recv_REFRESH_ACK(arr) {
    let is_end = (arr[0] & 0b10) !== 0;
    let is_p_turn = (arr[0] & 0b1) !== 0;
    let board = arr.slice(3);

    document.getElementById("p_score").innerText = arr[1].toString()
    document.getElementById("o_score").innerText = arr[2].toString()

    board.map((elem, i) => {
        let aType = elem >> 4;
        let bType = elem & 0b1111;
        game.showTiles(i * 2, i * 2 + 1, aType, bType, false);
    });

    if (is_end) game.handleGameEnded();
    else game.switchMode(is_p_turn? game.Modes.P_TURN : game.Modes.O_TURN);
}

function recv_REFRESH_ERR(code) {
    if (code === 1) {
        localStorage.clear();
        game.switchMode(game.Modes.IDLE);
        utils.showMessage("Your game no longer exists!");
    }
}
