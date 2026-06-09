export const DEFAULT_ICONS = [
  "flower",
  "star",
  "moon",
  "sun",
  "leaf",
  "gem",
  "heart",
  "cloud",
  "bolt",
  "drop",
  "music",
  "crown",
];

export const LEVELS = [
  { id: "easy", name: "轻松", rows: 6, cols: 6, iconCount: 9, durationSeconds: 180, hints: 5, shuffles: 3 },
  { id: "normal", name: "标准", rows: 7, cols: 8, iconCount: 14, durationSeconds: 240, hints: 4, shuffles: 3 },
  { id: "hard", name: "挑战", rows: 8, cols: 9, iconCount: 18, durationSeconds: 300, hints: 3, shuffles: 2 },
];

export function createBoard({ rows, cols, iconKinds = DEFAULT_ICONS, rng = Math.random }) {
  const total = rows * cols;
  if (total % 2 !== 0) {
    throw new Error("Board must contain an even number of tiles.");
  }
  if (!iconKinds.length) {
    throw new Error("At least one icon kind is required.");
  }

  const tiles = [];
  for (let index = 0; index < total / 2; index += 1) {
    const icon = iconKinds[index % iconKinds.length];
    tiles.push(icon, icon);
  }

  shuffleArray(tiles, rng);
  return chunk(tiles, cols);
}

export function findConnection(board, from, to) {
  if (!isSelectablePair(board, from, to)) return null;

  const direct = buildDirectPath(board, from, to);
  if (direct) return direct;

  const oneTurn = buildOneTurnPath(board, from, to);
  if (oneTurn) return oneTurn;

  return buildTwoTurnPath(board, from, to);
}

export function canConnect(board, from, to) {
  return Boolean(findConnection(board, from, to));
}

export function removePair(board, from, to) {
  const nextBoard = cloneBoard(board);
  nextBoard[from.row][from.col] = null;
  nextBoard[to.row][to.col] = null;
  return nextBoard;
}

export function findAvailablePair(board) {
  const tiles = [];
  board.forEach((row, rowIndex) => {
    row.forEach((tile, colIndex) => {
      if (tile) tiles.push({ row: rowIndex, col: colIndex, tile });
    });
  });

  for (let index = 0; index < tiles.length; index += 1) {
    for (let otherIndex = index + 1; otherIndex < tiles.length; otherIndex += 1) {
      const first = tiles[index];
      const second = tiles[otherIndex];
      if (first.tile === second.tile && canConnect(board, first, second)) {
        return { from: toPoint(first), to: toPoint(second), path: findConnection(board, first, second) };
      }
    }
  }

  return null;
}

export function hasAvailableMove(board) {
  return Boolean(findAvailablePair(board));
}

export function shuffleBoard(board, rng = Math.random) {
  const values = board.flat().filter(Boolean);
  shuffleArray(values, rng);

  const nextBoard = board.map((row) => row.map((tile) => (tile ? values.shift() : null)));
  return nextBoard;
}

export function countRemainingTiles(board) {
  return board.flat().filter(Boolean).length;
}

export function isBoardCleared(board) {
  return countRemainingTiles(board) === 0;
}

function buildDirectPath(board, from, to) {
  if (!isStraightLine(from, to)) return null;
  return isSegmentClear(board, from, to, from, to) ? [toPoint(from), toPoint(to)] : null;
}

function buildOneTurnPath(board, from, to) {
  const corners = [
    { row: from.row, col: to.col },
    { row: to.row, col: from.col },
  ];

  for (const corner of corners) {
    if (!isPassable(board, corner, to)) continue;
    if (isSegmentClear(board, from, corner, from, to) && isSegmentClear(board, corner, to, from, to)) {
      return compressPath([from, corner, to]);
    }
  }

  return null;
}

function buildTwoTurnPath(board, from, to) {
  const rows = preferredLines(from.row, to.row, board.length);
  const cols = preferredLines(from.col, to.col, board[0].length);

  for (const row of rows) {
    const cornerA = { row, col: from.col };
    const cornerB = { row, col: to.col };
    if (isPassable(board, cornerA, to) && isPassable(board, cornerB, to)) {
      if (
        isSegmentClear(board, from, cornerA, from, to) &&
        isSegmentClear(board, cornerA, cornerB, from, to) &&
        isSegmentClear(board, cornerB, to, from, to)
      ) {
        return compressPath([from, cornerA, cornerB, to]);
      }
    }
  }

  for (const col of cols) {
    const cornerA = { row: from.row, col };
    const cornerB = { row: to.row, col };
    if (isPassable(board, cornerA, to) && isPassable(board, cornerB, to)) {
      if (
        isSegmentClear(board, from, cornerA, from, to) &&
        isSegmentClear(board, cornerA, cornerB, from, to) &&
        isSegmentClear(board, cornerB, to, from, to)
      ) {
        return compressPath([from, cornerA, cornerB, to]);
      }
    }
  }

  return null;
}

function preferredLines(first, second, size) {
  const inside = [];
  const lower = Math.min(first, second);
  const upper = Math.max(first, second);

  for (let distance = 1; distance < size + 1; distance += 1) {
    const before = lower - distance;
    const after = upper + distance;
    if (before >= 0) inside.push(before);
    if (after < size) inside.push(after);
  }

  const between = [];
  for (let value = lower; value <= upper; value += 1) {
    between.push(value);
  }

  return [...new Set([...between, ...inside, -1, size])];
}

function isSegmentClear(board, start, end, from, to) {
  if (!isStraightLine(start, end)) return false;

  const rowStep = Math.sign(end.row - start.row);
  const colStep = Math.sign(end.col - start.col);
  let current = { row: start.row + rowStep, col: start.col + colStep };

  while (current.row !== end.row || current.col !== end.col) {
    if (!isPassable(board, current, to) && !samePoint(current, from)) return false;
    current = { row: current.row + rowStep, col: current.col + colStep };
  }

  return isPassable(board, end, to) || samePoint(end, from) || samePoint(end, to);
}

function isSelectablePair(board, from, to) {
  if (!inBounds(board, from) || !inBounds(board, to) || samePoint(from, to)) return false;
  const first = board[from.row][from.col];
  const second = board[to.row][to.col];
  return Boolean(first && second && first === second);
}

function isPassable(board, point, target) {
  if (!inBounds(board, point)) return isWithinOuterBorder(board, point);
  return board[point.row][point.col] === null || samePoint(point, target);
}

function isWithinOuterBorder(board, point) {
  const rows = board.length;
  const cols = board[0].length;
  return point.row >= -1 && point.row <= rows && point.col >= -1 && point.col <= cols;
}

function inBounds(board, point) {
  return point.row >= 0 && point.row < board.length && point.col >= 0 && point.col < board[0].length;
}

function isStraightLine(first, second) {
  return first.row === second.row || first.col === second.col;
}

function samePoint(first, second) {
  return first.row === second.row && first.col === second.col;
}

function compressPath(points) {
  const compact = points.map(toPoint);
  for (let index = compact.length - 2; index > 0; index -= 1) {
    const previous = compact[index - 1];
    const current = compact[index];
    const next = compact[index + 1];
    if (isStraightLine(previous, current) && isStraightLine(current, next) && isStraightLine(previous, next)) {
      compact.splice(index, 1);
    }
  }
  return compact;
}

function toPoint(point) {
  return { row: point.row, col: point.col };
}

function cloneBoard(board) {
  return board.map((row) => [...row]);
}

function chunk(values, size) {
  const rows = [];
  for (let index = 0; index < values.length; index += size) {
    rows.push(values.slice(index, index + size));
  }
  return rows;
}

function shuffleArray(values, rng) {
  for (let index = values.length - 1; index > 0; index -= 1) {
    const target = Math.floor(rng() * (index + 1));
    [values[index], values[target]] = [values[target], values[index]];
  }
  return values;
}
