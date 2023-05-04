import * as game from "./game.js";
import * as protocol from "./protocol.js";


function accept() {
    let clicked = JSON.parse(localStorage.getItem("clicked"));
    protocol.send_MOVE_REQ(clicked[0], clicked[1]);
}

function disableAccept(isDisabled) {
    document.getElementById("accept").disabled = isDisabled;
}

function onClickBoard(board) {
  board.addEventListener("click", ({ target }) => {
    const column = target.dataset.column;
    if (column === undefined) return;
    if (target.classList.contains("used")) return;
    let clicked = localStorage.getItem("clicked");
    clicked = clicked === null ? [] : JSON.parse(clicked);

    let isClicked = target.classList.contains("clicked");
    if (!isClicked && clicked.length < 2) {
        target.classList.toggle("clicked");
        clicked.push(column)
        if (clicked.length === 2) disableAccept(false);
    } else if (isClicked) {
        target.classList.toggle("clicked");
        clicked = clicked.filter(x => x !== column);
        disableAccept(true);
    }

    localStorage.setItem("clicked", JSON.stringify(clicked));
  });
}

function init() {
    protocol.init();

    let gameKey = localStorage.getItem("game-key");
    let playerKey = localStorage.getItem("player-key");
    let clicked = localStorage.getItem("clicked");
    disableAccept(clicked === null || JSON.parse(clicked).length !== 2);
    if (clicked === null) localStorage.setItem("clicked", "[]");


    document.getElementById("join").onclick =
        () => protocol.send_JOIN_REQ(document.getElementById("game-key").value);
    document.getElementById("newGame").onclick = () => protocol.send_NEW_REQ();
    document.getElementById("quitGame").onclick = () => protocol.send_QUIT_REQ();

    document.getElementById("accept").onclick = accept;
    const board = document.querySelector(".board");
    game.createBoard(board);
    onClickBoard(board);

    if (gameKey !== null && playerKey !== null) {
        game.switchMode(game.Modes.WAIT);
    } else {
        localStorage.clear();
        game.switchMode(game.Modes.IDLE)
    }
}

if (document.readyState !== "loading") init();
else window.addEventListener("DOMContentLoaded", () => init());
