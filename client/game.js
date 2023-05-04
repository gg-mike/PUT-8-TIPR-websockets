import * as utils from "./utils.js";


export const Modes = {
    IDLE: 0,
    WAIT: 1,
    P_TURN: 2,
    O_TURN: 3,
    END: 4
}


export function createBoard(board) {
    for (let column = 0; column < 4; column++) {
        const columnElement = document.createElement("div");
        columnElement.className = "column";
        for (let row = 0; row < 3; row++) {
          const cellElement = document.createElement("canvas");
          cellElement.id = `c${row + column * 3}`;
          cellElement.width = 100;
          cellElement.height = 100;
          cellElement.className = "cell";
          cellElement.dataset.column = `${row + column * 3}`;
          columnElement.append(cellElement);
        }
        board.append(columnElement);
    }
}


export function showTiles(a, b, aType, bType, isTmp) {
    localStorage.setItem("clicked", "[]");
    let clickedCanvas = document.querySelectorAll(".clicked");
    clickedCanvas.forEach(elem => elem.classList.remove("clicked"));
    let cA = document.getElementById(`c${a}`);
    let ctxA = cA.getContext("2d");
    let cB = document.getElementById(`c${b}`);
    let ctxB = cB.getContext("2d");

    drawShape(ctxA, aType);
    drawShape(ctxB, bType);

    if (isTmp) {
        setTimeout(() => clearCanvas(cA),2000);
        setTimeout(() => clearCanvas(cB),2000);
    } else {
        if (aType !== 15) cA.classList.add("used");
        if (bType !== 15) cB.classList.add("used");
    }
}

function drawShape(ctx, t) {
    switch (t) {
        case 0: {
            ctx.lineWidth = 10;
            ctx.strokeStyle = "green";
            ctx.beginPath();
            ctx.moveTo(25, 25);
            ctx.lineTo(75, 25);
            ctx.moveTo(25, 75);
            ctx.lineTo(75, 75);
            ctx.stroke();
            break;
        }
        case 1: {
            ctx.lineWidth = 10;
            ctx.strokeStyle = "red";
            ctx.beginPath();
            ctx.moveTo(25, 25);
            ctx.lineTo(50, 50);
            ctx.lineTo(75, 25);
            ctx.moveTo(25, 75);
            ctx.lineTo(50, 50);
            ctx.lineTo(75, 75);
            ctx.stroke();
            break;
        }
        case 2: {
            ctx.lineWidth = 10;
            ctx.strokeStyle = "blue";
            ctx.beginPath();
            ctx.moveTo(25, 25);
            ctx.lineTo(50, 50);
            ctx.lineTo(75, 25);
            ctx.moveTo(25, 75);
            ctx.lineTo(75, 75);
            ctx.stroke();
            break;
        }
        case 3: {
            ctx.lineWidth = 10;
            ctx.strokeStyle = "orangered";
            ctx.beginPath();
            ctx.moveTo(25, 75);
            ctx.lineTo(50, 50);
            ctx.lineTo(75, 75);
            ctx.moveTo(25, 25);
            ctx.lineTo(75, 25);
            ctx.stroke();
            break;
        }
        case 4: {
            ctx.lineWidth = 10;
            ctx.strokeStyle = "black";
            ctx.beginPath();
            ctx.moveTo(25, 25);
            ctx.lineTo(50, 50);
            ctx.lineTo(75, 25);
            ctx.stroke();
            break;
        }
        case 5: {
            ctx.lineWidth = 10;
            ctx.strokeStyle = "purple";
            ctx.beginPath();
            ctx.moveTo(25, 75);
            ctx.lineTo(50, 50);
            ctx.lineTo(75, 75);
            ctx.stroke();
            break;
        }
    }
}

function clearCanvas(canvas) {
    if (canvas.getContext) {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
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
