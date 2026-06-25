function key(row, col) {
  return row + ',' + col;
}

function createBoard(rows, cols, mineCount) {
  const board = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      row.push({ row: r, col: c });
    }
    board.push(row);
  }

  return {
    rows,
    cols,
    mineCount,
    board,
    mines: new Set(),
    flags: new Set(),
    revealed: new Set(),
    gameOver: false,
    won: false,
    startTime: null
  };
}

function placeMines(gameState, firstRow, firstCol) {
  const { rows, cols, mineCount, mines } = gameState;

  // первый клик и его соседи должны остаться без мин
  const safe = new Set();
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const r = firstRow + dr;
      const c = firstCol + dc;
      if (r >= 0 && r < rows && c >= 0 && c < cols) {
        safe.add(key(r, c));
      }
    }
  }

  while (mines.size < mineCount) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    const k = key(r, c);
    if (safe.has(k) || mines.has(k)) continue;
    mines.add(k);
  }

  return gameState;
}

function countAdjacentMines(gameState, row, col) {
  const { rows, cols, mines } = gameState;
  let count = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = row + dr;
      const c = col + dc;
      if (r >= 0 && r < rows && c >= 0 && c < cols && mines.has(key(r, c))) {
        count++;
      }
    }
  }
  return count;
}

function revealCell(gameState, row, col) {
  const k = key(row, col);

  if (gameState.gameOver || gameState.revealed.has(k) || gameState.flags.has(k)) {
    return gameState;
  }

  gameState.revealed.add(k);

  if (gameState.mines.has(k)) {
    gameState.gameOver = true;
    return gameState;
  }

  // пустая клетка — раскрываем всех соседей, те раскроют своих и т.д.
  if (countAdjacentMines(gameState, row, col) === 0) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const r = row + dr;
        const c = col + dc;
        if (r >= 0 && r < gameState.rows && c >= 0 && c < gameState.cols) {
          revealCell(gameState, r, c);
        }
      }
    }
  }

  return gameState;
}

function checkWin(gameState) {
  const safeCells = gameState.rows * gameState.cols - gameState.mines.size;
  return gameState.revealed.size === safeCells;
}

function toggleFlag(gameState, row, col) {
  const k = key(row, col);

  // флаг только на закрытую клетку
  if (gameState.gameOver || gameState.revealed.has(k)) {
    return gameState;
  }

  if (gameState.flags.has(k)) {
    gameState.flags.delete(k);
  } else {
    gameState.flags.add(k);
  }

  return gameState;
}

window.createBoard = createBoard;
window.placeMines = placeMines;
window.countAdjacentMines = countAdjacentMines;
window.revealCell = revealCell;
window.checkWin = checkWin;
window.toggleFlag = toggleFlag;


// ---------- рендер и управление ----------

const ROWS = 9;
const COLS = 9;
const MINES = 10;

let gameState = createBoard(ROWS, COLS, MINES);
let timerInterval = null;

const boardEl = document.getElementById('board');
const minesCounterEl = document.getElementById('mines-counter');
const timerEl = document.getElementById('timer');
const messageEl = document.getElementById('message');
const newGameBtn = document.getElementById('new-game-btn');

function renderBoard(gameState) {
  boardEl.style.gridTemplateColumns = `repeat(${gameState.cols}, 32px)`;
  boardEl.innerHTML = '';

  for (let r = 0; r < gameState.rows; r++) {
    for (let c = 0; c < gameState.cols; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.row = r;
      cell.dataset.col = c;

      const k = key(r, c);
      if (gameState.revealed.has(k)) {
        cell.classList.add('revealed');
        if (gameState.mines.has(k)) {
          cell.classList.add('mine');
          cell.textContent = '💣';
        } else {
          const n = countAdjacentMines(gameState, r, c);
          if (n > 0) {
            cell.textContent = n;
            cell.classList.add('n' + n);
          }
        }
      } else if (gameState.flags.has(k)) {
        cell.textContent = '🚩';
      }

      boardEl.appendChild(cell);
    }
  }

  minesCounterEl.textContent = '💣 ' + (gameState.mineCount - gameState.flags.size);
}

function handleLeftClick(row, col) {
  if (gameState.gameOver) return;

  // первый клик: ставим мины (защищая эту клетку) и запускаем таймер
  if (gameState.startTime === null) {
    placeMines(gameState, row, col);
    gameState.startTime = Date.now();
    startTimer();
  }

  revealCell(gameState, row, col);

  if (gameState.gameOver) {
    endGame(false);
  } else if (checkWin(gameState)) {
    gameState.won = true;
    gameState.gameOver = true;
    endGame(true);
  }

  renderBoard(gameState);
}

function handleRightClick(row, col) {
  if (gameState.gameOver) return;
  toggleFlag(gameState, row, col);
  renderBoard(gameState);
}

function endGame(won) {
  stopTimer();
  if (won) {
    gameState.mines.forEach(k => gameState.flags.add(k));
    messageEl.textContent = '🎉 Победа!';
    newGameBtn.textContent = '😎';
  } else {
    gameState.mines.forEach(k => gameState.revealed.add(k)); // показываем все мины
    messageEl.textContent = '💥 Поражение!';
    newGameBtn.textContent = '😵';
  }
}

function startTimer() {
  timerInterval = setInterval(() => {
    const seconds = Math.floor((Date.now() - gameState.startTime) / 1000);
    timerEl.textContent = '⏱ ' + seconds;
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

function newGame() {
  stopTimer();
  gameState = createBoard(ROWS, COLS, MINES);
  messageEl.textContent = '';
  timerEl.textContent = '⏱ 0';
  newGameBtn.textContent = '🙂';
  renderBoard(gameState);
}

window.renderBoard = renderBoard;

if (boardEl) {
  boardEl.addEventListener('click', (e) => {
    const cell = e.target.closest('.cell');
    if (cell) handleLeftClick(+cell.dataset.row, +cell.dataset.col);
  });

  boardEl.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const cell = e.target.closest('.cell');
    if (cell) handleRightClick(+cell.dataset.row, +cell.dataset.col);
  });

  newGameBtn.addEventListener('click', newGame);

  renderBoard(gameState);
}
