export function showMessage(message) {
  window.setTimeout(() => window.alert(message), 50);
}

export function bytes2str(b) {
    return String.fromCharCode(...b);
}

export function str2bytes(s) {
    return [...s].map(ch => ch.charCodeAt(0))
}

export function getPKeyBytes() {
    return str2bytes(localStorage.getItem("player-key"));
}

export function extractHeaderInfo(header) {
    return [
        header >> 4,
        (header & 0b1000) !== 0,
        (header & 0b100) !== 0,
        header & 0b11
    ];
}

export function generateHeader(pt, isAck, isErr, code) {
    return (pt << 4) | (isAck << 3) | (isErr << 2) | (code & 0b11);
}

export function parseMoveRes(arr) {
    return [
        arr[1] >> 4,
        arr[1] & 0b1111,
        (arr[0] & 0b10) !== 0,
        (arr[0] & 0b1) !== 0,
        arr[2],
        arr[3] >> 4,
        arr[3] & 0b1111
    ]
}