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
  { rows: 6, cols: 6, iconCount: 8, durationSeconds: 190, hints: 0, shuffles: 0 },
  { rows: 6, cols: 7, iconCount: 10, durationSeconds: 210, hints: 0, shuffles: 0 },
  { rows: 6, cols: 7, iconCount: 12, durationSeconds: 200, hints: 0, shuffles: 0 },
  { rows: 7, cols: 8, iconCount: 12, durationSeconds: 240, hints: 0, shuffles: 0 },
  { rows: 7, cols: 8, iconCount: 12, durationSeconds: 225, hints: 0, shuffles: 0 },
  { rows: 8, cols: 8, iconCount: 12, durationSeconds: 260, hints: 0, shuffles: 0 },
  { rows: 7, cols: 8, iconCount: 12, durationSeconds: 215, hints: 0, shuffles: 0 },
  { rows: 8, cols: 8, iconCount: 12, durationSeconds: 245, hints: 0, shuffles: 0 },
  { rows: 8, cols: 9, iconCount: 12, durationSeconds: 275, hints: 0, shuffles: 0 },
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
  const step = DIFFICULTY_STEPS[Math.floor((number - 1) / 10)];
  const localNumber = number - chapter.startLevel + 1;

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

function getChapterForNumber(number) {
  return CHAPTERS.find((item) => number >= item.startLevel && number <= item.endLevel);
}

function calculateCoinReward(localNumber) {
  if (localNumber <= 10) return 2;
  if (localNumber <= 20) return 3;
  return 5;
}
