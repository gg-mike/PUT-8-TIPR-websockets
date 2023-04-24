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

export function parseMoveRes(arr) {
    return {
        aType: (arr[1] & 0b1111 << 4) >> 4,
        bType: arr[1] & 0b1111,
        isEnd: (arr[2] & 0b1 << 7) !== 0,
        activeChange: (arr[2] & 0b1 << 6) !== 0,
        score: arr[2] & 0b111111
    }
}