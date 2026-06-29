export const CHAPTERS = [
  {
    id: "fruit-forest",
    name: "水果森林",
    shortName: "森林",
    startLevel: 1,
    endLevel: 30,
    accent: "#43bf72",
    backgroundClass: "theme-fruit-forest",
  },
  {
    id: "candy-garden",
    name: "糖果花园",
    shortName: "花园",
    startLevel: 31,
    endLevel: 60,
    accent: "#ff78a9",
    backgroundClass: "theme-candy-garden",
  },
  {
    id: "jelly-castle",
    name: "果冻城堡",
    shortName: "城堡",
    startLevel: 61,
    endLevel: 90,
    accent: "#7f73e8",
    backgroundClass: "theme-jelly-castle",
  },
];

const DIFFICULTY_STEPS = [
  { tier: "easy", rows: 7, cols: 6, iconCount: 10, durationSeconds: 180, hints: 0, shuffles: 0 },
  { tier: "normal", rows: 7, cols: 6, iconCount: 12, durationSeconds: 150, hints: 0, shuffles: 0 },
  { tier: "hard", rows: 7, cols: 6, iconCount: 12, durationSeconds: 120, hints: 0, shuffles: 0 },
];

export const LEVELS = Array.from({ length: 90 }, (_, index) => buildLevel(index + 1));

export function getLevelByNumber(levelNumber) {
  const level = LEVELS.find((item) => item.number === Number(levelNumber));
  if (!level) {
    throw new Error(`Unknown level number: ${levelNumber}`);
  }
  return level;
}

export function getChapterForLevel(levelNumber) {
  const numericLevel = Number(levelNumber);
  const chapter = CHAPTERS.find((item) => numericLevel >= item.startLevel && numericLevel <= item.endLevel);
  if (!chapter) {
    throw new Error(`Unknown chapter for level number: ${levelNumber}`);
  }
  return chapter;
}

export function getLevelsForChapter(chapterId) {
  return LEVELS.filter((level) => level.chapterId === chapterId);
}

function buildLevel(number) {
  const chapter = getChapterForNumber(number);
  const localNumber = number - chapter.startLevel + 1;
  const step = getDifficultyStep(localNumber);

  return {
    ...step,
    id: `level-${String(number).padStart(3, "0")}`,
    number,
    localNumber,
    name: `第${String(number).padStart(2, "0")}关`,
    chapterId: chapter.id,
    coinReward: calculateCoinReward(localNumber),
  };
}

function getDifficultyStep(localNumber) {
  if (localNumber <= 10) return DIFFICULTY_STEPS[0];
  if (localNumber <= 20) return DIFFICULTY_STEPS[1];
  return DIFFICULTY_STEPS[2];
}

function getChapterForNumber(number) {
  return CHAPTERS.find((item) => number >= item.startLevel && number <= item.endLevel);
}

function calculateCoinReward(localNumber) {
  if (localNumber <= 10) return 2;
  if (localNumber <= 20) return 3;
  return 5;
}
