// Простой самописный assert: считает успехи/провалы и пишет строку в страницу.
const results = document.getElementById('results');
let passed = 0;
let failed = 0;

function assert(condition, name) {
  const ok = !!condition;
  if (ok) passed++; else failed++;
  const text = (ok ? 'OK   ' : 'FAIL ') + name;
  console.log(text);
  if (results) {
    const line = document.createElement('div');
    line.className = ok ? 'ok' : 'fail';
    line.textContent = text;
    results.appendChild(line);
  }
}

// 1. createBoard создаёт поле нужного размера (rows × cols клеток)
{
  const state = createBoard(9, 9, 10);
  assert(state.board.length === 9 && state.board[0].length === 9,
    'createBoard: поле 9×9 клеток');
}

// 2. createBoard не расставляет мины до первого клика (mines.size === 0)
{
  const state = createBoard(9, 9, 10);
  assert(state.mines.size === 0, 'createBoard: мин нет до первого клика');
}

// 3. placeMines расставляет ровно mineCount мин
{
  const state = createBoard(9, 9, 10);
  placeMines(state, 0, 0);
  assert(state.mines.size === 10, 'placeMines: расставлено ровно 10 мин');
}

// 4. placeMines не ставит мины на первую клетку и её соседей
{
  const state = createBoard(9, 9, 10);
  placeMines(state, 4, 4);
  let clean = true;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (state.mines.has((4 + dr) + ',' + (4 + dc))) clean = false;
    }
  }
  assert(clean, 'placeMines: первая клетка и её соседи без мин');
}

// 5. countAdjacentMines возвращает точное число мин вокруг клетки
{
  const state = createBoard(3, 3, 0);
  state.mines.add('0,0');
  state.mines.add('0,1');
  state.mines.add('2,2');
  assert(countAdjacentMines(state, 1, 1) === 3,
    'countAdjacentMines: 3 мины вокруг центра');
}

// 6. revealCell добавляет клетку в revealed
{
  const state = createBoard(9, 9, 0);
  state.mines.add('5,6'); // мина рядом → (5,5) станет цифрой, без flood fill
  revealCell(state, 5, 5);
  assert(state.revealed.has('5,5'), 'revealCell: клетка попадает в revealed');
}

// 7. revealCell flood fill: пустая клетка открывает связанные пустые клетки и их
//    соседей (но не мину). Поле 3×3 с миной в углу: клик по (2,2) откроет все 8
//    безопасных клеток, а мина (0,0) останется закрытой.
{
  const state = createBoard(3, 3, 0);
  state.mines.add('0,0');
  revealCell(state, 2, 2);
  assert(state.revealed.size === 8 && !state.revealed.has('0,0'),
    'revealCell: flood fill открывает все безопасные клетки, мину не трогает');
}

// 8. toggleFlag ставит флаг на закрытую клетку и убирает повторным вызовом
{
  const state = createBoard(9, 9, 10);
  toggleFlag(state, 3, 3);
  const placed = state.flags.has('3,3');
  toggleFlag(state, 3, 3);
  const removed = !state.flags.has('3,3');
  assert(placed && removed, 'toggleFlag: флаг ставится и снимается повторным кликом');
}

// 9. checkWin возвращает false, пока есть закрытые безопасные клетки
{
  const state = createBoard(3, 3, 1);
  state.mines.add('0,0');
  revealCell(state, 0, 1); // открыли одну цифру, остальные ещё закрыты
  assert(checkWin(state) === false, 'checkWin: false пока открыты не все безопасные клетки');
}

// 10. checkWin возвращает true, когда открыты все безопасные клетки
{
  const state = createBoard(3, 3, 1);
  state.mines.add('0,0');
  revealCell(state, 2, 2); // flood fill открывает все 8 безопасных клеток
  assert(checkWin(state) === true, 'checkWin: true когда открыты все безопасные клетки');
}

// Итог
const summary = document.getElementById('summary');
const summaryText = failed === 0
  ? `ВСЕ ТЕСТЫ ПРОШЛИ: ${passed}/${passed}`
  : `ЕСТЬ ПАДЕНИЯ: ${failed} из ${passed + failed}`;
console.log(summaryText);
if (summary) {
  summary.textContent = summaryText;
  summary.className = failed === 0 ? 'ok' : 'fail';
}
