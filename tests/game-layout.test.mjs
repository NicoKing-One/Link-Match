import { test } from "node:test";
import assert from "node:assert/strict";

import { calculateBoardFrameWidth } from "../src/game-layout.js";

test("limits board frame width when a wider phone has compact vertical space", () => {
  const frameWidth = calculateBoardFrameWidth({
    availableWidth: 414,
    availableHeight: 425,
    rows: 7,
    cols: 6,
    frameHorizontalChrome: 24,
    frameVerticalChrome: 24,
  });

  assert.equal(Math.round(frameWidth), 368);
});

test("keeps the board frame full width when vertical space is sufficient", () => {
  const frameWidth = calculateBoardFrameWidth({
    availableWidth: 374,
    availableHeight: 500,
    rows: 7,
    cols: 6,
    frameHorizontalChrome: 24,
    frameVerticalChrome: 24,
  });

  assert.equal(frameWidth, 374);
});
