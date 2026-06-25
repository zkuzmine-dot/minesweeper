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
