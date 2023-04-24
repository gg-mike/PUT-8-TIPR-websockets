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

    let clicked = JSON.parse(localStorage.getItem("clicked"));

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
    if (gameKey !== null) {
        // TODO: after refresh if data is in localStorage send message to server to update itself
        game.switchMode(game.Modes.WAIT);
    }

    let clicked = localStorage.getItem("clicked");
    if (clicked === null || JSON.parse(clicked).length !== 2)
        disableAccept(true);
    if (clicked === null) localStorage.setItem("clicked", "[]");


    document.getElementById("join").onclick =
        () => protocol.send_JOIN_REQ(document.getElementById("game-key").value);
    document.getElementById("newGame").onclick = () => protocol.send_NEW_REQ();
    document.getElementById("quitGame").onclick = () => protocol.send_QUIT_REQ();

    document.getElementById("accept").onclick = accept;
    const board = document.querySelector(".board");
    game.createBoard(board);
    onClickBoard(board);
}

if (document.readyState !== "loading") init();
else window.addEventListener("DOMContentLoaded", () => init());
