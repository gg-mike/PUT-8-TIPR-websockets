import * as utils from "./utils.js";


export const Modes = {
    IDLE: 0,
    WAIT: 1,
    P_TURN: 2,
    O_TURN: 3,
    END: 4
}


export function createBoard(board) {
    console.log("createBoard");
    for (let column = 0; column < 4; column++) {
        const columnElement = document.createElement("div");
        columnElement.className = "column";
        for (let row = 0; row < 3; row++) {
          const cellElement = document.createElement("canvas");
          cellElement.className = "cell";
          cellElement.dataset.column = `${row + column * 3}`;
          columnElement.append(cellElement);
        }
        board.append(columnElement);
    }
}

export function switchMode(newMode) {
    if (newMode !== Modes.IDLE) {
        document.getElementById("start").style.display = "none";
        document.getElementById("game").style.display = "flex";

        if (newMode === Modes.WAIT) {
            document.querySelector("main").classList.value = "wait";
            document.getElementById("p_score").innerText = "0";
            document.getElementById("o_score").innerText = "0";
        } else if (newMode === Modes.P_TURN) {
            document.querySelector("main").classList.value = "p_turn";
        } else if (newMode === Modes.O_TURN) {
            document.querySelector("main").classList.value = "o_turn";
        } else if (newMode === Modes.END) {
            document.querySelector("main").classList.value = "end";
        }
        document.getElementById("g_key").innerText = localStorage.getItem("game-key");
        // TODO: wait, player's turn, opponent's turn, win
    } else {
        document.querySelector("main").classList.value = "idle";
        document.getElementById("start").style.display = "flex";
        document.getElementById("game").style.display = "none";
    }
}


export function handleNew(gameKey, playerKey) {
    localStorage.setItem("game-key", gameKey);
    localStorage.setItem("player-key", playerKey);
    utils.showMessage(`You've created game "${gameKey}"`);
    switchMode(Modes.WAIT);
}

export function handleJoin(playerKey) {
    let gameKey = document.getElementById("game-key").value;
    localStorage.setItem("game-key", gameKey);
    localStorage.setItem("player-key", playerKey);
    document.getElementById("p_score").innerText = "0";
    document.getElementById("o_score").innerText = "0";

    utils.showMessage(`You've joined game "${gameKey}"`);
    switchMode(Modes.O_TURN);
}

export function handleGameDoesntExists() {
    let gameKey = document.getElementById("game-key").value;
    document.getElementById("game-key").value = "";
    utils.showMessage(`Game "${gameKey}" doesn't exist!`);
}

export function handleGameAlreadyFull() {
    let gameKey = document.getElementById("game-key").value;
    document.getElementById("game-key").value = "";
    utils.showMessage(`Game "${gameKey}" is already full`);
}

export function handleGameEnded() {
    let pScore = Number.parseInt(document.getElementById("p_score").innerText);
    let oScore = Number.parseInt(document.getElementById("o_score").innerText);

    if (pScore === oScore)
        utils.showMessage("Game ended with a draw!");
    else if (pScore > oScore)
        utils.showMessage("You won the game");
    else
        utils.showMessage("You lost the game");
}
