import assert from "node:assert/strict";
import test from "node:test";

import { CHAPTERS, LEVELS, getChapterForLevel, getLevelByNumber } from "../src/levels.js";
import {
  applyLevelResult,
  calculateTotalStars,
  createInitialProgress,
  getChapterStatus,
  getLevelStatus,
  normalizeProgress,
} from "../src/progression.js";

test("builds three 30-level chapters with global level numbers", () => {
  assert.equal(CHAPTERS.length, 3);
  assert.equal(LEVELS.length, 90);
  assert.deepEqual(
    CHAPTERS.map((chapter) => [chapter.name, chapter.startLevel, chapter.endLevel]),
    [
      ["水果森林", 1, 30],
      ["糖果花园", 31, 60],
      ["果冻城堡", 61, 90],
    ],
  );
  assert.equal(getLevelByNumber(1).chapterId, "fruit-forest");
  assert.equal(getLevelByNumber(31).chapterId, "candy-garden");
  assert.equal(getChapterForLevel(61).name, "果冻城堡");
});

test("starts with only level 1 playable and later chapters locked", () => {
  const progress = createInitialProgress();

  assert.equal(progress.highestUnlockedLevel, 1);
  assert.equal(getLevelStatus(1, progress), "current");
  assert.equal(getLevelStatus(2, progress), "locked");
  assert.equal(getChapterStatus(CHAPTERS[0], progress), "active");
  assert.equal(getChapterStatus(CHAPTERS[1], progress), "locked");
});

test("winning unlocks the next level and chapter gates unlock at 31 and 61", () => {
  const afterLevel1 = applyLevelResult(createInitialProgress(), getLevelByNumber(1), {
    won: true,
    score: 1200,
    stars: 2,
    remainingSeconds: 88,
  }).progress;
  assert.equal(afterLevel1.highestUnlockedLevel, 2);
  assert.equal(getLevelStatus(1, afterLevel1), "completed");
  assert.equal(getLevelStatus(2, afterLevel1), "current");

  const afterLevel30 = applyLevelResult(
    { highestUnlockedLevel: 30, coins: 0, records: {} },
    getLevelByNumber(30),
    { won: true, score: 4200, stars: 3, remainingSeconds: 120 },
  ).progress;
  assert.equal(afterLevel30.highestUnlockedLevel, 31);
  assert.equal(getChapterStatus(CHAPTERS[1], afterLevel30), "active");

  const afterLevel60 = applyLevelResult(
    { highestUnlockedLevel: 60, coins: 0, records: {} },
    getLevelByNumber(60),
    { won: true, score: 5200, stars: 3, remainingSeconds: 130 },
  ).progress;
  assert.equal(afterLevel60.highestUnlockedLevel, 61);
  assert.equal(getChapterStatus(CHAPTERS[2], afterLevel60), "active");
});

test("stars record the historical best while coins are awarded on every win", () => {
  const firstWin = applyLevelResult(createInitialProgress(), getLevelByNumber(1), {
    won: true,
    score: 1000,
    stars: 1,
    remainingSeconds: 60,
  });
  const secondWin = applyLevelResult(firstWin.progress, getLevelByNumber(1), {
    won: true,
    score: 1400,
    stars: 3,
    remainingSeconds: 100,
  });
  const thirdWin = applyLevelResult(secondWin.progress, getLevelByNumber(1), {
    won: true,
    score: 1300,
    stars: 2,
    remainingSeconds: 80,
  });

  assert.equal(firstWin.starsAdded, 1);
  assert.equal(firstWin.coinsAdded, 20);
  assert.equal(secondWin.starsAdded, 2);
  assert.equal(thirdWin.starsAdded, 0);
  assert.equal(thirdWin.progress.records["1"].bestStars, 3);
  assert.equal(thirdWin.progress.records["1"].bestScore, 1400);
  assert.equal(calculateTotalStars(thirdWin.progress), 3);
  assert.ok(thirdWin.coinsAdded > 0);
  assert.ok(thirdWin.progress.coins > secondWin.progress.coins);
});

test("normalizes old or partial progress safely", () => {
  assert.deepEqual(normalizeProgress(null), createInitialProgress());
  assert.deepEqual(normalizeProgress({ highestUnlockedLevel: 120, coins: -4, records: { 1: { bestStars: 9 } } }), {
    highestUnlockedLevel: 90,
    coins: 0,
    records: {
      1: { completed: false, bestScore: 0, bestStars: 3 },
    },
  });
});
