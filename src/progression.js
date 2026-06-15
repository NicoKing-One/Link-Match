import { LEVELS } from "./levels.js";

export const MAX_LEVEL_NUMBER = LEVELS.length;
export const MAX_STARS_PER_LEVEL = 3;

export function createInitialProgress() {
  return {
    highestUnlockedLevel: 1,
    coins: 0,
    records: {},
  };
}

export function normalizeProgress(progress) {
  if (!progress || typeof progress !== "object") {
    return createInitialProgress();
  }

  const records = {};
  Object.entries(progress.records ?? {}).forEach(([levelNumber, record]) => {
    const numericLevel = Number(levelNumber);
    if (!Number.isInteger(numericLevel) || numericLevel < 1 || numericLevel > MAX_LEVEL_NUMBER) return;
    records[String(numericLevel)] = normalizeRecord(record);
  });

  return {
    highestUnlockedLevel: clampInteger(progress.highestUnlockedLevel, 1, MAX_LEVEL_NUMBER, 1),
    coins: clampInteger(progress.coins, 0, Number.MAX_SAFE_INTEGER, 0),
    records,
  };
}

export function getLevelStatus(levelNumber, progress) {
  const safeProgress = normalizeProgress(progress);
  const numericLevel = Number(levelNumber);
  const record = safeProgress.records[String(numericLevel)];

  if (record?.completed) return "completed";
  if (numericLevel === safeProgress.highestUnlockedLevel) return "current";
  if (numericLevel < safeProgress.highestUnlockedLevel) return "available";
  return "locked";
}

export function getChapterStatus(chapter, progress) {
  const safeProgress = normalizeProgress(progress);
  if (safeProgress.highestUnlockedLevel < chapter.startLevel) return "locked";
  if (safeProgress.highestUnlockedLevel > chapter.endLevel) return "completed";
  return "active";
}

export function applyLevelResult(progress, level, result) {
  const safeProgress = normalizeProgress(progress);
  const levelNumber = String(level.number);
  const previousRecord = safeProgress.records[levelNumber] ?? createEmptyRecord();
  const nextRecord = { ...previousRecord };

  nextRecord.bestScore = Math.max(nextRecord.bestScore, clampInteger(result.score, 0, Number.MAX_SAFE_INTEGER, 0));

  let starsAdded = 0;
  let coinsAdded = 0;
  let firstClear = false;
  let highestUnlockedLevel = safeProgress.highestUnlockedLevel;

  if (result.won) {
    const resultStars = clampInteger(result.stars, 0, MAX_STARS_PER_LEVEL, 0);
    starsAdded = Math.max(0, resultStars - previousRecord.bestStars);
    firstClear = !previousRecord.completed;
    nextRecord.completed = true;
    nextRecord.bestStars = Math.max(previousRecord.bestStars, resultStars);
    coinsAdded = calculateCoinReward(level, {
      firstClear,
      stars: resultStars,
      remainingSeconds: result.remainingSeconds,
    });
    if (level.number === safeProgress.highestUnlockedLevel && level.number < MAX_LEVEL_NUMBER) {
      highestUnlockedLevel = level.number + 1;
    }
  }

  const nextProgress = {
    highestUnlockedLevel,
    coins: safeProgress.coins + coinsAdded,
    records: {
      ...safeProgress.records,
      [levelNumber]: nextRecord,
    },
  };

  return {
    progress: nextProgress,
    starsAdded,
    coinsAdded,
    firstClear,
    record: nextRecord,
  };
}

export function calculateTotalStars(progress) {
  const safeProgress = normalizeProgress(progress);
  return Object.values(safeProgress.records).reduce((total, record) => total + record.bestStars, 0);
}

export function calculateCompletedLevels(progress) {
  const safeProgress = normalizeProgress(progress);
  return Object.values(safeProgress.records).filter((record) => record.completed).length;
}

export function calculateThreeStarLevels(progress) {
  const safeProgress = normalizeProgress(progress);
  return Object.values(safeProgress.records).filter((record) => record.bestStars >= MAX_STARS_PER_LEVEL).length;
}

function calculateCoinReward(level, result) {
  if (!result.firstClear) return 0;
  return clampInteger(level.coinReward, 0, 999, 0);
}

function normalizeRecord(record) {
  return {
    completed: Boolean(record?.completed),
    bestScore: clampInteger(record?.bestScore, 0, Number.MAX_SAFE_INTEGER, 0),
    bestStars: clampInteger(record?.bestStars, 0, MAX_STARS_PER_LEVEL, 0),
  };
}

function createEmptyRecord() {
  return {
    completed: false,
    bestScore: 0,
    bestStars: 0,
  };
}

function clampInteger(value, min, max, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(numeric)));
}
