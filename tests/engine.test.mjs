import assert from "node:assert/strict";
import test from "node:test";

import {
  canConnect,
  createBoard,
  createSeededRandom,
  findAvailablePair,
  findConnection,
  hasAvailableMove,
  LEVELS,
  shuffleBoard,
} from "../src/engine.js";

test("connects matching tiles in a straight line", () => {
  const board = [
    ["A", "A"],
    [null, null],
  ];

  const path = findConnection(board, { row: 0, col: 0 }, { row: 0, col: 1 });

  assert.deepEqual(path, [
    { row: 0, col: 0 },
    { row: 0, col: 1 },
  ]);
  assert.equal(canConnect(board, { row: 0, col: 0 }, { row: 0, col: 1 }), true);
});

test("connects matching tiles with one turn through empty cells", () => {
  const board = [
    ["A", null],
    [null, "A"],
  ];

  assert.deepEqual(findConnection(board, { row: 0, col: 0 }, { row: 1, col: 1 }), [
    { row: 0, col: 0 },
    { row: 0, col: 1 },
    { row: 1, col: 1 },
  ]);
});

test("connects matching tiles with two turns around blockers", () => {
  const board = [
    ["A", "B", "A"],
    [null, "B", null],
    [null, null, null],
  ];

  assert.deepEqual(findConnection(board, { row: 0, col: 0 }, { row: 0, col: 2 }), [
    { row: 0, col: 0 },
    { row: 2, col: 0 },
    { row: 2, col: 2 },
    { row: 0, col: 2 },
  ]);
});

test("rejects non-matching tiles and blocked routes over two turns", () => {
  const nonMatching = [["A", "B"]];
  assert.equal(canConnect(nonMatching, { row: 0, col: 0 }, { row: 0, col: 1 }), false);

  const blocked = [
    ["B", "B", "B", "B", "B"],
    ["B", "A", "B", "A", "B"],
    ["B", "B", "B", "B", "B"],
  ];
  assert.equal(canConnect(blocked, { row: 1, col: 1 }, { row: 1, col: 3 }), false);
});

test("creates a paired board with an even tile count", () => {
  const values = [0.13, 0.77, 0.21, 0.42, 0.64, 0.35, 0.92, 0.18];
  const rng = () => values.shift() ?? 0.5;

  const board = createBoard({ rows: 2, cols: 4, iconKinds: ["A", "B"], rng });
  const flat = board.flat();

  assert.equal(flat.length, 8);
  assert.equal(flat.filter((tile) => tile === "A").length % 2, 0);
  assert.equal(flat.filter((tile) => tile === "B").length % 2, 0);
});

test("creates repeatable boards from the same seed", () => {
  const icons = LEVELS.find((level) => level.id === "easy").iconCount;
  const iconKinds = Array.from({ length: icons }, (_, index) => `icon-${index}`);

  const first = createBoard({ rows: 6, cols: 7, iconKinds, rng: createSeededRandom("smoke-easy") });
  const second = createBoard({ rows: 6, cols: 7, iconKinds, rng: createSeededRandom("smoke-easy") });
  const third = createBoard({ rows: 6, cols: 7, iconKinds, rng: createSeededRandom("other-smoke-easy") });

  assert.deepEqual(first, second);
  assert.notDeepEqual(first, third);
});

test("easy, normal and hard levels share the easy board layout while time still steps down", () => {
  const easy = LEVELS.find((level) => level.id === "easy");
  const normal = LEVELS.find((level) => level.id === "normal");
  const hard = LEVELS.find((level) => level.id === "hard");

  assert.equal(easy.rows, 7);
  assert.equal(easy.cols, 6);
  assert.equal(easy.rows * easy.cols, 42);
  assert.equal(easy.durationSeconds, 180);
  assert.equal(normal.rows, 7);
  assert.equal(normal.cols, 6);
  assert.equal(normal.rows * normal.cols, 42);
  assert.equal(normal.durationSeconds, 150);
  assert.equal(hard.rows, 7);
  assert.equal(hard.cols, 6);
  assert.equal(hard.rows * hard.cols, 42);
  assert.equal(hard.durationSeconds, 120);
});

test("finds available moves and preserves pairs when shuffling", () => {
  const board = [
    ["A", "A"],
    ["B", "B"],
  ];
  const pair = findAvailablePair(board);

  assert.ok(pair);
  assert.equal(hasAvailableMove(board), true);

  const shuffled = shuffleBoard(board, () => 0.1);
  assert.deepEqual(shuffled.flat().sort(), ["A", "A", "B", "B"]);
});
