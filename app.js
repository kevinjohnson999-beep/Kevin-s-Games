const homeView = document.querySelector("#homeView");
const ticTacToeView = document.querySelector("#ticTacToeView");
const ticTacToeBtn = document.querySelector("#ticTacToeBtn");
const backBtn = document.querySelector("#backBtn");
const resetBtn = document.querySelector("#resetBtn");
const board = document.querySelector("#board");
const gameStatus = document.querySelector("#gameStatus");

const wins = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

let cells = Array(9).fill("");
let turn = "X";
let over = false;

function showGame() {
  homeView.classList.add("hidden");
  ticTacToeView.classList.remove("hidden");
  resetGame();
}

function showHome() {
  ticTacToeView.classList.add("hidden");
  homeView.classList.remove("hidden");
}

function resetGame() {
  cells = Array(9).fill("");
  turn = "X";
  over = false;
  renderBoard();
  gameStatus.textContent = "X goes first";
}

function winner() {
  return wins.find(([a, b, c]) => cells[a] && cells[a] === cells[b] && cells[a] === cells[c]);
}

function play(index) {
  if (over || cells[index]) return;
  cells[index] = turn;
  const win = winner();
  if (win) {
    over = true;
    gameStatus.textContent = `${turn} wins`;
  } else if (cells.every(Boolean)) {
    over = true;
    gameStatus.textContent = "Draw game";
  } else {
    turn = turn === "X" ? "O" : "X";
    gameStatus.textContent = `${turn}'s turn`;
  }
  renderBoard();
}

function renderBoard() {
  board.innerHTML = "";
  const win = winner();
  cells.forEach((value, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "cell";
    button.textContent = value;
    button.disabled = over || Boolean(value);
    if (win?.includes(index)) button.classList.add("winner");
    button.addEventListener("click", () => play(index));
    board.append(button);
  });
}

ticTacToeBtn.addEventListener("click", showGame);
backBtn.addEventListener("click", showHome);
resetBtn.addEventListener("click", resetGame);
renderBoard();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  });
}
