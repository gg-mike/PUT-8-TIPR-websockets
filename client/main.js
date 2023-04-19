function showMessage(message) {
  window.setTimeout(() => window.alert(message), 50);
}

function join() {
    let gameCode = document.getElementById("game-code").value;

    // TODO: check if code is okay
    if (gameCode === "") return showMessage(`No game with game code "${gameCode}" found`);

    localStorage.setItem("game-code", gameCode);

    console.log("joined game: " + gameCode);
    switchMode(true);
}

function newGame() {
    console.log("newGame");
    switchMode(true);
}

function quitGame() {
    localStorage.removeItem("game-code");
    switchMode(false);
}

function switchMode(isGame) {
    if (isGame) {
        document.getElementById("start").style.display = "none";
        document.getElementById("game").style.display = "flex";
        document.querySelector("canvas").style.display = "initial";
    } else {
        document.getElementById("start").style.display = "flex";
        document.getElementById("game").style.display = "none";
        document.querySelector("canvas").style.display = "none";
    }
}

function createBoard(board) {
    console.log("createBoard");
    let ctx = board.getContext("2d");
    let rects = [], r, i = 0;

    for (let _x = 0; _x < 10; _x++)
        for (let _y = 0; _y < 10; _y++)
            rects.push({ x: 10 + 50 * _x, y: 10 + 50 * _y, w: 40, h: 40});

    while(r = rects[i++]) ctx.rect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = "gray";
    ctx.fill();

    board.onmousemove = function(e) {
        // important: correct mouse position:
        let rect = this.getBoundingClientRect(),
            x = e.clientX - rect.left,
            y = e.clientY - rect.top,
            i = 0, r;

        // console.log(rect);

        ctx.clearRect(0, 0, board.width, board.height); // for demo

        while (r = rects[i++]) {
            ctx.beginPath();
            ctx.rect(r.x, r.y, r.w, r.h);

            ctx.fillStyle = ctx.isPointInPath(x, y) ? "red" : "gray";
            ctx.fill();
        }
    }
}

window.addEventListener("DOMContentLoaded", () => {
  // Initialize the UI.
  const board = document.querySelector("canvas");
  createBoard(board);
  // // Open the WebSocket connection and register event handlers.
  // const websocket = new WebSocket("ws://localhost:8001/");
  // receiveMoves(board, websocket);
  // sendMoves(board, websocket);
});