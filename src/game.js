import {
  DEFAULT_ICONS,
  canConnect,
  countRemainingTiles,
  createBoard,
  createSeededRandom,
  findAvailablePair,
  findConnection,
  isBoardCleared,
  removePair,
  shuffleBoard,
} from "./engine.js";
import { CHAPTERS, LEVELS, getLevelsForChapter } from "./levels.js";
import {
  AD_STAMINA_REWARD,
  MAX_AD_STAMINA_CLAIMS,
  MAX_STAMINA,
  START_STAMINA_COST,
  calculateNextStaminaCountdown,
  calculateRecoveredStamina,
  calculateStarCount,
  claimAdStamina,
  normalizeStaminaState,
  spendStartStamina,
} from "./game-rules.js";
import {
  MAX_LEVEL_NUMBER,
  applyLevelResult,
  calculateCompletedLevels,
  calculateThreeStarLevels,
  calculateTotalStars,
  getChapterStatus,
  getLevelStatus,
  normalizeProgress,
} from "./progression.js";

const ICON_VIEW = {
  flower: { label: "草莓", src: "./assets/image/flower.png" },
  star: { label: "蓝莓", src: "./assets/image/star.png" },
  moon: { label: "葡萄", src: "./assets/image/moon.png" },
  sun: { label: "柠檬糖", src: "./assets/image/sun.png" },
  leaf: { label: "橙子", src: "./assets/image/leaf.png" },
  gem: { label: "猕猴桃", src: "./assets/image/gem.png" },
  heart: { label: "西瓜", src: "./assets/image/heart.png" },
  cloud: { label: "樱桃", src: "./assets/image/cloud.png" },
  bolt: { label: "棒棒糖", src: "./assets/image/bolt.png" },
  drop: { label: "蜜桃糖", src: "./assets/image/drop.png" },
  music: { label: "青苹果", src: "./assets/image/music.png" },
  crown: { label: "紫糖球", src: "./assets/image/crown.png" },
};

const STAMINA_KEY = "lianliankan.stamina";
const PROGRESS_KEY = "lianliankan.progress";
const TEST_UNLOCK_ALL_LEVELS = false;
const TEST_UNLIMITED_TOOLS = false;
const UNLIMITED_TOOL_COUNT_TEXT = "不限";
const HOME_LAYOUT_BASE_WIDTH = 390;
const ROAD_STEP_Y = 110;
const ROAD_TOP_Y = 34;
const ROAD_BOTTOM_Y = 38;
const GENERATED_ROAD_NODE_PADDING_Y = 48;
const ROAD_X_PATTERN = [30, 70];
const HOME_THEME_CLASSES = CHAPTERS.map((chapter) => `home-theme-${chapter.id}`);
const IMAGE_ROAD_CONNECTOR_CLASS_BY_CHAPTER = {
  "fruit-forest": "road-vine-image-segment",
  "candy-garden": "road-candy-image-segment",
  "jelly-castle": "road-jelly-image-segment",
};
const screens = {
  start: document.querySelector("#startScreen"),
  profile: document.querySelector("#profileScreen"),
  settings: document.querySelector("#settingsScreen"),
  game: document.querySelector("#gameScreen"),
  result: document.querySelector("#resultScreen"),
};

const elements = {
  appShell: document.querySelector(".app-shell"),
  chapterSummary: document.querySelector("#chapterSummary"),
  chapterLockNotice: document.querySelector("#chapterLockNotice"),
  levelRoad: document.querySelector("#levelRoad"),
  roadScroll: document.querySelector("#roadScroll"),
  prevChapterButton: document.querySelector("#prevChapterButton"),
  nextChapterButton: document.querySelector("#nextChapterButton"),
  profileButton: document.querySelector("#profileButton"),
  settingsButton: document.querySelector("#settingsButton"),
  coinExchangeButton: document.querySelector("#coinExchangeButton"),
  homeExchangeButton: document.querySelector("#homeExchangeButton"),
  profileBackButton: document.querySelector("#profileBackButton"),
  profileHomeButton: document.querySelector("#profileHomeButton"),
  settingsBackButton: document.querySelector("#settingsBackButton"),
  settingsHomeButton: document.querySelector("#settingsHomeButton"),
  profileCurrentLevelText: document.querySelector("#profileCurrentLevelText"),
  profileStarText: document.querySelector("#profileStarText"),
  profileCoinText: document.querySelector("#profileCoinText"),
  profileCompletedText: document.querySelector("#profileCompletedText"),
  profileThreeStarText: document.querySelector("#profileThreeStarText"),
  settingToggles: document.querySelectorAll(".settings-toggle"),
  startButton: document.querySelector("#startButton"),
  coinText: document.querySelector("#coinText"),
  starText: document.querySelector("#starText"),
  completedText: document.querySelector("#completedText"),
  homeToast: document.querySelector("#homeToast"),
  staminaTexts: document.querySelectorAll(".staminaText"),
  staminaCountdowns: document.querySelectorAll(".staminaCountdown"),
  getStaminaButtons: document.querySelectorAll(".getStaminaButton"),
  board: document.querySelector("#board"),
  toast: document.querySelector("#toast"),
  linkLayer: document.querySelector("#linkLayer"),
  timeText: document.querySelector("#timeText"),
  remainingText: document.querySelector("#remainingText"),
  scoreText: document.querySelector("#scoreText"),
  levelName: document.querySelector("#levelName"),
  plaqueLevelLabels: document.querySelectorAll(".plaque-level-label"),
  gameHomeButton: document.querySelector("#gameHomeButton"),
  hintButton: document.querySelector("#hintButton"),
  shuffleButton: document.querySelector("#shuffleButton"),
  pauseButton: document.querySelector("#pauseButton"),
  hintCount: document.querySelector("#hintCount"),
  shuffleCount: document.querySelector("#shuffleCount"),
  pauseModal: document.querySelector("#pauseModal"),
  resumeButton: document.querySelector("#resumeButton"),
  pauseRestartButton: document.querySelector("#pauseRestartButton"),
  pauseHomeButton: document.querySelector("#pauseHomeButton"),
  toolModal: document.querySelector("#toolModal"),
  toolModalIcon: document.querySelector("#toolModalIcon"),
  toolTitle: document.querySelector("#toolTitle"),
  toolMessage: document.querySelector("#toolMessage"),
  watchAdButton: document.querySelector("#watchAdButton"),
  buyToolButton: document.querySelector("#buyToolButton"),
  toolCloseButton: document.querySelector("#toolCloseButton"),
  exitModal: document.querySelector("#exitModal"),
  confirmHomeButton: document.querySelector("#confirmHomeButton"),
  confirmRestartButton: document.querySelector("#confirmRestartButton"),
  exitCancelButton: document.querySelector("#exitCancelButton"),
  staminaModal: document.querySelector("#staminaModal"),
  staminaTitle: document.querySelector("#staminaTitle"),
  staminaMessage: document.querySelector("#staminaMessage"),
  staminaAdButton: document.querySelector("#staminaAdButton"),
  staminaBuyButton: document.querySelector("#staminaBuyButton"),
  staminaCloseButton: document.querySelector("#staminaCloseButton"),
  comingSoonModal: document.querySelector("#comingSoonModal"),
  comingSoonCloseButton: document.querySelector("#comingSoonCloseButton"),
  resultBadgeArt: document.querySelector("#resultBadgeArt"),
  resultTitle: document.querySelector("#resultTitle"),
  resultSummary: document.querySelector("#resultSummary"),
  resultStars: document.querySelector("#resultStars"),
  resultToast: document.querySelector("#resultToast"),
  doubleCoinsButton: document.querySelector("#doubleCoinsButton"),
  nextLevelButton: document.querySelector("#nextLevelButton"),
  reviveButton: document.querySelector("#reviveButton"),
  resultBuyToolsButton: document.querySelector("#resultBuyToolsButton"),
  againButton: document.querySelector("#againButton"),
  homeButton: document.querySelector("#homeButton"),
};

const state = {
  level: LEVELS[0],
  board: [],
  selected: null,
  score: 0,
  moves: 0,
  remainingSeconds: 0,
  timer: null,
  timerLastTickAt: 0,
  staminaTimer: null,
  toastTimer: null,
  resultToastTimer: null,
  hints: 0,
  shuffles: 0,
  stamina: loadStaminaState(),
  progress: loadProgressState(),
  chapterIndex: 0,
  paused: false,
  busy: false,
  doubleCoinReward: null,
  revivedThisRun: false,
};
let homeResizeTimer = null;

state.level = LEVELS[state.progress.highestUnlockedLevel - 1] ?? LEVELS[0];
state.chapterIndex = CHAPTERS.findIndex(
  (chapter) => state.level.number >= chapter.startLevel && state.level.number <= chapter.endLevel,
);
if (state.chapterIndex < 0) state.chapterIndex = 0;

bindEvents();
refreshStamina();
startStaminaTimer();
renderHome({ syncToCurrentLevel: true });
showScreen("start");

function bindEvents() {
  elements.startButton.addEventListener("click", () => requestStartGame(LEVELS[state.progress.highestUnlockedLevel - 1]));
  elements.prevChapterButton.addEventListener("click", () => switchChapter(-1));
  elements.nextChapterButton.addEventListener("click", () => switchChapter(1));
  elements.profileButton.addEventListener("click", () => openSecondaryPage("profile"));
  elements.settingsButton.addEventListener("click", () => openSecondaryPage("settings"));
  elements.homeExchangeButton.addEventListener("click", openComingSoonModal);
  [
    elements.profileBackButton,
    elements.profileHomeButton,
    elements.settingsBackButton,
    elements.settingsHomeButton,
  ].filter(Boolean).forEach((button) => {
    button.addEventListener("click", returnHome);
  });
  elements.settingToggles.forEach((button) => {
    button.addEventListener("click", () => toggleSettingButton(button));
  });
  elements.getStaminaButtons.forEach((button) => {
    button.addEventListener("click", claimStaminaFromAd);
  });
  elements.hintButton.addEventListener("click", useHint);
  elements.shuffleButton.addEventListener("click", useShuffle);
  elements.pauseButton.addEventListener("click", pauseGame);
  elements.gameHomeButton.addEventListener("click", openExitModal);
  elements.resumeButton.addEventListener("click", resumeGame);
  elements.pauseRestartButton.addEventListener("click", () => requestStartGame(state.level));
  elements.pauseHomeButton.addEventListener("click", returnHome);
  elements.watchAdButton.addEventListener("click", () => closeToolModal("广告功能待接入"));
  elements.buyToolButton.addEventListener("click", () => closeToolModal("购买功能待接入"));
  elements.toolCloseButton.addEventListener("click", () => closeToolModal());
  elements.confirmHomeButton.addEventListener("click", returnHome);
  elements.confirmRestartButton.addEventListener("click", () => requestStartGame(state.level));
  elements.exitCancelButton.addEventListener("click", closeExitModal);
  elements.staminaAdButton.addEventListener("click", claimStaminaFromAd);
  elements.staminaBuyButton.addEventListener("click", buyStamina);
  elements.staminaCloseButton.addEventListener("click", closeStaminaModal);
  elements.comingSoonCloseButton.addEventListener("click", closeComingSoonModal);
  elements.doubleCoinsButton.addEventListener("click", claimDoubleCoins);
  elements.nextLevelButton.addEventListener("click", requestNextLevel);
  elements.reviveButton.addEventListener("click", reviveAfterAd);
  elements.resultBuyToolsButton.addEventListener("click", buyResultTools);
  elements.againButton.addEventListener("click", () => requestStartGame(state.level));
  elements.homeButton.addEventListener("click", () => {
    stopTimer();
    renderHome({ syncToCurrentLevel: true });
    showScreen("start");
  });
  window.addEventListener("resize", () => {
    if (!screens.start.classList.contains("active")) return;
    window.clearTimeout(homeResizeTimer);
    homeResizeTimer = window.setTimeout(renderRoadMap, 120);
  });
}

function openSecondaryPage(name) {
  stopTimer();
  state.paused = false;
  hideToast();
  hideModals();
  renderHome({ syncToCurrentLevel: true });
  showScreen(name);
}

function renderHome({ syncToCurrentLevel = false } = {}) {
  const currentLevel = LEVELS[state.progress.highestUnlockedLevel - 1] ?? LEVELS[0];
  if (syncToCurrentLevel) syncChapterIndexToLevel(currentLevel);
  elements.startButton.textContent = calculateCompletedLevels(state.progress) > 0 ? "继续闯关" : "开始闯关";
  elements.coinText.textContent = state.progress.coins;
  elements.starText.textContent = `${calculateTotalStars(state.progress)}/${MAX_LEVEL_NUMBER * 3}`;
  if (elements.completedText) {
    elements.completedText.textContent = `已通关 ${calculateCompletedLevels(state.progress)}`;
  }
  renderSecondaryPages(currentLevel);
  renderChapterSwitcher();
  renderRoadMap();
}

function syncChapterIndexToLevel(level) {
  const nextChapterIndex = CHAPTERS.findIndex(
    (chapter) => level.number >= chapter.startLevel && level.number <= chapter.endLevel,
  );
  if (nextChapterIndex >= 0) state.chapterIndex = nextChapterIndex;
}

function renderSecondaryPages(currentLevel) {
  const totalStars = calculateTotalStars(state.progress);
  const completedLevels = calculateCompletedLevels(state.progress);
  const threeStarLevels = calculateThreeStarLevels(state.progress);

  elements.profileCurrentLevelText.textContent = `第${String(currentLevel.number).padStart(2, "0")}关`;
  elements.profileStarText.textContent = `${totalStars}/${MAX_LEVEL_NUMBER * 3}`;
  elements.profileCoinText.textContent = state.progress.coins;
  elements.profileCompletedText.textContent = `${completedLevels}关`;
  elements.profileThreeStarText.textContent = `${threeStarLevels}关`;
}

function toggleSettingButton(button) {
  const isOn = !button.classList.contains("is-on");
  button.classList.toggle("is-on", isOn);
  button.setAttribute("aria-pressed", String(isOn));
  button.querySelector("span").textContent = isOn ? "开" : "关";
}

function renderChapterSwitcher() {
  elements.prevChapterButton.disabled = false;
  elements.nextChapterButton.disabled = false;
}

function renderRoadMap() {
  const chapter = CHAPTERS[state.chapterIndex];
  const chapterLevels = getLevelsForChapter(chapter.id);
  const chapterStatus = getDisplayChapterStatus(chapter);
  const roadScale = getHomeLayoutScale();
  const roadStepY = ROAD_STEP_Y * roadScale;
  const roadTopY = getRoadNodeEdgePadding(chapter.id, "top") * roadScale;
  const roadBottomY = getRoadNodeEdgePadding(chapter.id, "bottom") * roadScale;
  const roadHeight = roadTopY + roadBottomY + (chapterLevels.length - 1) * roadStepY;
  const points = chapterLevels.map((level, index) => ({
    level,
    x: ROAD_X_PATTERN[index % ROAD_X_PATTERN.length],
    y: roadHeight - roadBottomY - index * roadStepY,
  }));

  elements.chapterSummary.textContent = `${chapter.name} · ${chapter.startLevel}-${chapter.endLevel}关`;
  elements.chapterSummary.className = `chapter-summary chapter-summary--${chapter.id}`;
  elements.chapterSummary.dataset.status = chapterStatus;
  elements.chapterLockNotice.classList.toggle("hidden", chapterStatus !== "locked");
  const lockText = chapter.id === "candy-garden" ? "通关第30关后解锁糖果花园" : "通关第60关后解锁果冻城堡";
  const lockCopy = elements.chapterLockNotice.querySelector("span");
  if (lockCopy) lockCopy.textContent = lockText;
  screens.start.classList.remove(...HOME_THEME_CLASSES);
  screens.start.classList.add(`home-theme-${chapter.id}`);
  elements.levelRoad.className = `level-road ${chapter.backgroundClass}`;
  elements.levelRoad.style.height = `${roadHeight}px`;
  elements.levelRoad.innerHTML = IMAGE_ROAD_CONNECTOR_CLASS_BY_CHAPTER[chapter.id] ? "" : buildRoadSvg(points, roadHeight);

  points.forEach(({ level, x, y }) => {
    const status = getDisplayLevelStatus(level);
    const record = state.progress.records[String(level.number)] ?? { bestStars: 0 };
    const button = document.createElement("button");
    button.type = "button";
    button.className = `road-level road-level--${chapter.id} ${status}`;
    button.style.left = `${x}%`;
    button.style.top = `${y}px`;
    button.disabled = status === "locked";
    button.setAttribute("aria-label", `${formatLevelTitle(level)} ${getLevelStatusText(status)}`);
    button.innerHTML = `${renderMiniStars(record.bestStars)}<span class="road-level-main" aria-hidden="true"></span><strong class="road-level-number">${String(level.number).padStart(2, "0")}</strong>`;
    button.addEventListener("click", () => requestStartGame(level));
    elements.levelRoad.append(button);
  });
  window.requestAnimationFrame(() => {
    renderRoadConnectors(points, chapter.id);
    scrollRoadToCurrentLevel();
  });
}

function scrollRoadToCurrentLevel() {
  const currentLevel = elements.levelRoad.querySelector(".road-level.current");
  if (!currentLevel) {
    elements.roadScroll.scrollTop = elements.roadScroll.scrollHeight;
    return;
  }

  const levelCenterY = Number.parseFloat(currentLevel.style.top) || currentLevel.offsetTop;
  const maxScrollTop = Math.max(0, elements.roadScroll.scrollHeight - elements.roadScroll.clientHeight);
  const targetScrollTop = levelCenterY - elements.roadScroll.clientHeight / 2;
  elements.roadScroll.scrollTop = Math.min(maxScrollTop, Math.max(0, targetScrollTop));
}

function renderRoadConnectors(points, chapterId, attempt = 0) {
  elements.levelRoad.querySelectorAll(".road-vine-image-segment").forEach((node) => node.remove());
  elements.levelRoad.querySelectorAll(".road-candy-image-segment").forEach((node) => node.remove());
  elements.levelRoad.querySelectorAll(".road-jelly-image-segment").forEach((node) => node.remove());
  const connectorClass = IMAGE_ROAD_CONNECTOR_CLASS_BY_CHAPTER[chapterId];
  if (!connectorClass) return;

  const roadWidth =
    elements.levelRoad.getBoundingClientRect().width ||
    elements.levelRoad.clientWidth ||
    elements.roadScroll.getBoundingClientRect().width ||
    elements.roadScroll.clientWidth;
  if (roadWidth <= 0) {
    if (attempt < 2) {
      window.requestAnimationFrame(() => renderRoadConnectors(points, chapterId, attempt + 1));
    }
    return;
  }

  points.slice(0, -1).forEach((start, index) => {
    const end = points[index + 1];
    const startX = (start.x / 100) * roadWidth;
    const endX = (end.x / 100) * roadWidth;
    const dx = endX - startX;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy);
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const connector = document.createElement("span");
    connector.className = connectorClass;
    connector.style.left = `${startX}px`;
    connector.style.top = `${start.y}px`;
    connector.style.width = `${length}px`;
    connector.style.transform = `translateY(-50%) rotate(${angle}deg)`;
    elements.levelRoad.append(connector);
  });
}

function getRoadNodeEdgePadding(chapterId, edge) {
  if (chapterId === "fruit-forest" || chapterId === "candy-garden" || chapterId === "jelly-castle") {
    return GENERATED_ROAD_NODE_PADDING_Y;
  }
  return edge === "top" ? ROAD_TOP_Y : ROAD_BOTTOM_Y;
}

function getHomeLayoutScale() {
  const homeWidth =
    screens.start.getBoundingClientRect().width ||
    elements.roadScroll.getBoundingClientRect().width ||
    window.innerWidth ||
    HOME_LAYOUT_BASE_WIDTH;
  return Math.max(0.1, homeWidth / HOME_LAYOUT_BASE_WIDTH);
}

function requestStartGame(level) {
  if (getDisplayLevelStatus(level) === "locked") {
    showHomeNotice("先通关上一关才能挑战这里");
    return;
  }
  refreshStamina();
  const result = spendStartStamina(state.stamina);
  if (!result.ok) {
    saveStaminaState(result.state);
    elements.exitModal.classList.add("hidden");
    openStaminaModal(
      "体力不足",
      `开始一关需要 ${START_STAMINA_COST} 点体力，可以看广告或购买获取 ${AD_STAMINA_REWARD} 点。`,
    );
    return;
  }

  saveStaminaState(result.state);
  startGame(level);
}

function requestNextLevel() {
  const nextLevel = LEVELS[state.level.number];
  if (!nextLevel) {
    showToast("已经通关全部关卡");
    return;
  }
  requestStartGame(nextLevel);
}

function startGame(level) {
  stopTimer();
  state.level = level;
  state.board = createPlayableBoard(level);
  state.selected = null;
  state.score = 0;
  state.moves = 0;
  state.remainingSeconds = level.durationSeconds;
  state.hints = TEST_UNLIMITED_TOOLS ? Number.POSITIVE_INFINITY : level.hints;
  state.shuffles = TEST_UNLIMITED_TOOLS ? Number.POSITIVE_INFINITY : level.shuffles;
  state.paused = false;
  state.busy = false;
  state.revivedThisRun = false;
  hideModals();

  screens.game.dataset.boardTier = level.tier ?? "easy";
  elements.levelName.textContent = formatLevelTitle(level);
  updatePlaqueLevelLabels();
  renderBoard();
  updateHud();
  showScreen("game");
  startTimer();
}

function createPlayableBoard(level) {
  const icons = DEFAULT_ICONS.slice(0, level.iconCount);
  const rng = createBoardRandom(level);
  let board = createBoard({ rows: level.rows, cols: level.cols, iconKinds: icons, rng });
  let guard = 0;
  while (!findAvailablePair(board) && guard < 20) {
    board = shuffleBoard(board, rng);
    guard += 1;
  }
  return board;
}

function createBoardRandom(level) {
  const seed = new URLSearchParams(window.location.search).get("boardSeed");
  return seed ? createSeededRandom(`${seed}:${level.id}`) : Math.random;
}

function renderBoard() {
  elements.board.innerHTML = "";
  elements.board.style.setProperty("--rows", state.level.rows);
  elements.board.style.setProperty("--cols", state.level.cols);
  elements.board.style.gridTemplateColumns = `repeat(${state.level.cols}, minmax(0, 1fr))`;
  elements.board.style.gridTemplateRows = `repeat(${state.level.rows}, minmax(0, 1fr))`;

  state.board.forEach((row, rowIndex) => {
    row.forEach((tile, colIndex) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `tile${tile ? "" : " empty"}`;
      button.dataset.row = rowIndex;
      button.dataset.col = colIndex;
      if (tile) button.dataset.tile = tile;

      if (tile) {
        const view = ICON_VIEW[tile] ?? ICON_VIEW.flower;
        button.setAttribute("aria-label", `第 ${rowIndex + 1} 行第 ${colIndex + 1} 列，${view.label}`);
        button.innerHTML = `<img class="tile-art" src="${view.src}" alt="" aria-hidden="true" />`;
        button.addEventListener("click", () => selectTile({ row: rowIndex, col: colIndex }));
      } else {
        button.setAttribute("aria-label", "已消除");
      }

      elements.board.append(button);
    });
  });
  clearLink();
}

function selectTile(point) {
  if (state.busy || state.paused || !state.board[point.row][point.col]) return;
  clearHints();

  if (!state.selected) {
    state.selected = point;
    updateSelection();
    return;
  }

  if (samePoint(state.selected, point)) {
    state.selected = null;
    updateSelection();
    return;
  }

  const selected = state.selected;
  const path = findConnection(state.board, selected, point);
  if (!path || !canConnect(state.board, selected, point)) {
    showToast(getMismatchMessage(selected, point));
    shakeTile(selected);
    shakeTile(point);
    state.selected = null;
    updateSelection();
    return;
  }

  state.busy = true;
  drawLink(path);
  state.board = removePair(state.board, selected, point);
  state.selected = null;
  state.moves += 1;
  state.score += 100 + Math.max(0, Math.floor(state.remainingSeconds / 5));
  updateHud();
  updateSelection();

  window.setTimeout(() => {
    renderBoard();
    state.busy = false;
    handleBoardProgress();
  }, 220);
}

function handleBoardProgress() {
  if (isBoardCleared(state.board)) {
    finishGame(true);
    return;
  }

  if (!findAvailablePair(state.board)) {
    showToast("没有可连接组合了，请使用洗牌道具");
  }
}

function useHint() {
  if (state.paused || state.busy) return;
  if (!TEST_UNLIMITED_TOOLS && state.hints <= 0) {
    openToolModal("提示");
    return;
  }
  const pair = findAvailablePair(state.board);
  if (!pair) {
    showToast("没有可连接组合了，请使用洗牌道具");
    return;
  }
  if (!TEST_UNLIMITED_TOOLS) state.hints -= 1;
  state.selected = null;
  updateHud();
  clearHints();
  setTileClass(pair.from, "hint", true);
  setTileClass(pair.to, "hint", true);
  drawLink(pair.path);
  window.setTimeout(clearLink, 650);
}

function useShuffle() {
  if (state.paused || state.busy) return;
  if (!TEST_UNLIMITED_TOOLS && state.shuffles <= 0) {
    openToolModal("洗牌");
    return;
  }
  if (!TEST_UNLIMITED_TOOLS) state.shuffles -= 1;
  state.selected = null;
  state.board = shuffleBoard(state.board);
  let guard = 0;
  while (!findAvailablePair(state.board) && guard < 12) {
    state.board = shuffleBoard(state.board);
    guard += 1;
  }
  renderBoard();
  updateHud();
}

function pauseGame() {
  if (!screens.game.classList.contains("active")) return;
  state.paused = true;
  state.timerLastTickAt = Date.now();
  elements.pauseModal.classList.remove("hidden");
}

function resumeGame() {
  state.paused = false;
  state.timerLastTickAt = Date.now();
  elements.pauseModal.classList.add("hidden");
}

function startTimer() {
  stopTimer();
  state.timerLastTickAt = Date.now();
  updateHud();
  state.timer = window.setInterval(tickTimer, 250);
}

function tickTimer() {
  const now = Date.now();
  if (state.paused) {
    state.timerLastTickAt = now;
    return;
  }

  const elapsedSeconds = Math.floor((now - state.timerLastTickAt) / 1000);
  if (elapsedSeconds <= 0) return;

  state.timerLastTickAt += elapsedSeconds * 1000;
  state.remainingSeconds = Math.max(0, state.remainingSeconds - elapsedSeconds);
  updateHud();
  if (state.remainingSeconds <= 0) {
    finishGame(false);
  }
}

function stopTimer() {
  if (state.timer) {
    window.clearInterval(state.timer);
    state.timer = null;
  }
  state.timerLastTickAt = 0;
}

function returnHome() {
  stopTimer();
  state.paused = false;
  state.selected = null;
  updateSelection();
  clearHints();
  clearLink();
  hideToast();
  hideModals();
  renderHome({ syncToCurrentLevel: true });
  showScreen("start");
}

function finishGame(won) {
  stopTimer();
  state.paused = false;
  elements.pauseModal.classList.add("hidden");

  const remaining = countRemainingTiles(state.board);
  const finalScore = won ? state.score + state.remainingSeconds * 5 : state.score;
  const stars = won ? calculateStarCount(state.remainingSeconds, state.level) : 0;
  const result = applyLevelResult(state.progress, state.level, {
    won,
    score: finalScore,
    stars,
    remainingSeconds: state.remainingSeconds,
  });
  saveProgressState(result.progress);
  state.score = finalScore;
  const showCoinReward = won && result.firstClear;
  state.doubleCoinReward = showCoinReward && result.coinsAdded > 0 ? { amount: result.coinsAdded, claimed: false } : null;

  elements.resultTitle.classList.add("result-title--compact");
  elements.resultTitle.classList.toggle("result-title--coin", showCoinReward);
  elements.resultTitle.innerHTML = showCoinReward
    ? `通关成功，获得<span class="result-coin-count">${result.coinsAdded}</span><img class="result-coin-icon" src="./assets/image/result-coin.png" alt="金币" />`
    : won
      ? "恭喜通关，重复关卡无法获得金币。"
      : "挑战失败，再来一次吧。";
  elements.resultBadgeArt.src = won ? "./assets/image/result-pass-badge.png" : "./assets/image/result-fail-badge.png";
  screens.result.dataset.result = won ? "success" : "failure";
  elements.resultSummary.textContent = won
    ? `用 ${state.moves} 步清空棋盘，新增 ${result.starsAdded} 星。`
    : `还剩 ${remaining} 个图案没有消除，可以调整策略再来一次。`;
  renderResultStars(stars);
  hideResultToast();
  elements.doubleCoinsButton.disabled = false;
  elements.doubleCoinsButton.textContent = "双倍金币";
  elements.doubleCoinsButton.classList.toggle("hidden", !state.doubleCoinReward);
  elements.nextLevelButton.classList.toggle("hidden", !won || state.level.number >= MAX_LEVEL_NUMBER);
  elements.reviveButton.disabled = false;
  elements.reviveButton.textContent = "复活";
  elements.reviveButton.classList.toggle("hidden", won || state.revivedThisRun);
  elements.resultBuyToolsButton.classList.toggle("hidden", won);
  elements.againButton.textContent = "再玩一局";
  updateStaminaView();
  showScreen("result");
}

async function claimDoubleCoins() {
  const reward = state.doubleCoinReward;
  if (!reward?.amount) {
    showResultToast("当前没有可领取的双倍金币奖励");
    return;
  }

  if (reward.claimed) {
    showResultToast("双倍奖励已经领取过了");
    return;
  }

  elements.doubleCoinsButton.disabled = true;
  showResultToast("广告播放中，请看完后领取双倍金币");

  const completed = await playRewardedAd("double_coins");
  if (!completed) {
    elements.doubleCoinsButton.disabled = false;
    showResultToast("广告没看完，无法获得双倍奖励");
    return;
  }

  state.progress = normalizeProgress({
    ...state.progress,
    coins: state.progress.coins + reward.amount,
  });
  reward.claimed = true;
  saveProgressState(state.progress);
  updateProgressTextViews();
  elements.doubleCoinsButton.disabled = false;
  showResultToast(`获得双倍金币 +${reward.amount}`);
}

async function reviveAfterAd() {
  if (screens.result.dataset.result !== "failure") {
    showResultToast("当前不能复活");
    return;
  }

  if (state.revivedThisRun) {
    showResultToast("本局已用完");
    return;
  }

  elements.reviveButton.disabled = true;
  showResultToast("广告播放中，请看完后复活");

  const completed = await playRewardedAd("revive");
  if (!completed) {
    elements.reviveButton.disabled = false;
    showResultToast("复活失败，广告没看完");
    return;
  }

  state.revivedThisRun = true;
  state.remainingSeconds = state.level.durationSeconds;
  state.paused = false;
  state.busy = false;
  state.selected = null;
  hideResultToast();
  hideToast();
  hideModals();
  clearHints();
  clearLink();
  renderBoard();
  updateHud();
  showScreen("game");
  startTimer();
  showToast("复活成功，继续挑战");
}

function buyResultTools() {
  showResultToast("购买功能待接入");
}

async function playRewardedAd(placement) {
  const adBridge = window.linkMatchAds?.showRewardedAd ?? window.__linkMatchRewardedAd;
  window.dispatchEvent(new CustomEvent("link-match:rewarded-ad", { detail: { placement } }));

  if (typeof adBridge === "function") {
    try {
      const result = await adBridge({ placement });
      return isRewardedAdComplete(result);
    } catch {
      return false;
    }
  }

  await new Promise((resolve) => window.setTimeout(resolve, 700));
  return true;
}

function isRewardedAdComplete(result) {
  if (result === true) return true;
  if (!result || typeof result !== "object") return false;
  return result.completed === true || result.rewarded === true || result.watched === true || result.isEnded === true;
}

function updateProgressTextViews() {
  elements.coinText.textContent = state.progress.coins;
  elements.profileCoinText.textContent = state.progress.coins;
}

function updateHud() {
  elements.timeText.textContent = formatTime(Math.max(0, state.remainingSeconds));
  elements.remainingText.textContent = countRemainingTiles(state.board);
  elements.scoreText.textContent = state.score;
  elements.hintCount.textContent = formatToolCount(state.hints);
  elements.shuffleCount.textContent = formatToolCount(state.shuffles);
}

function updatePlaqueLevelLabels() {
  const label = formatLevelTitle(state.level);
  elements.plaqueLevelLabels.forEach((node) => {
    node.textContent = label;
  });
}

function updateSelection() {
  document.querySelectorAll(".tile.selected").forEach((tile) => tile.classList.remove("selected"));
  if (state.selected) setTileClass(state.selected, "selected", true);
}

function clearHints() {
  document.querySelectorAll(".tile.hint").forEach((tile) => tile.classList.remove("hint"));
}

function pulseTile(point) {
  setTileClass(point, "hint", true);
  window.setTimeout(() => setTileClass(point, "hint", false), 260);
}

function shakeTile(point) {
  const tile = getTileElement(point);
  if (!tile) return;
  tile.classList.remove("shake");
  tile.offsetWidth;
  tile.classList.add("shake");
  window.setTimeout(() => tile.classList.remove("shake"), 360);
}

function openToolModal(toolName) {
  state.paused = true;
  state.timerLastTickAt = Date.now();
  elements.toolModalIcon.src = toolName === "洗牌" ? "./assets/image/tool-shuffle.png" : "./assets/image/tool-hint.png";
  elements.toolTitle.textContent = `${toolName}用完了`;
  elements.toolMessage.textContent = `${toolName}次数已经用完，可以看广告获取，或购买更多道具。`;
  elements.toolModal.classList.remove("hidden");
}

function closeToolModal(message) {
  state.paused = false;
  state.timerLastTickAt = Date.now();
  elements.toolModal.classList.add("hidden");
  if (message) showToast(message);
}

function openStaminaModal(
  title = "体力不足",
  message = `看广告或购买可以获取 ${AD_STAMINA_REWARD} 点体力，广告最多获取 ${MAX_AD_STAMINA_CLAIMS} 次。`,
) {
  state.paused = screens.game.classList.contains("active");
  if (state.paused) state.timerLastTickAt = Date.now();
  elements.staminaTitle.textContent = title;
  elements.staminaMessage.textContent = message;
  elements.staminaAdButton.disabled = false;
  elements.staminaAdButton.textContent = "看广告获取";
  elements.staminaModal.classList.remove("hidden");
}

function closeStaminaModal() {
  state.paused = false;
  state.timerLastTickAt = Date.now();
  elements.staminaModal.classList.add("hidden");
}

function openComingSoonModal() {
  hideToast();
  elements.comingSoonModal.classList.remove("hidden");
}

function closeComingSoonModal() {
  elements.comingSoonModal.classList.add("hidden");
}

function claimStaminaFromAd() {
  refreshStamina();
  const result = claimAdStamina(state.stamina);
  saveStaminaState(result.state);
  if (!result.ok) {
    closeStaminaModal();
    showToast("今日已达上限");
    return;
  }

  closeStaminaModal();
  showToast(`获得 ${AD_STAMINA_REWARD} 点体力`);
}

function buyStamina() {
  refreshStamina();
  closeStaminaModal();
  showToast("购买功能待接入");
}

function openExitModal() {
  if (!screens.game.classList.contains("active")) return;
  state.paused = true;
  state.timerLastTickAt = Date.now();
  elements.exitModal.classList.remove("hidden");
}

function closeExitModal() {
  state.paused = false;
  state.timerLastTickAt = Date.now();
  elements.exitModal.classList.add("hidden");
}

function hideModals() {
  elements.pauseModal.classList.add("hidden");
  elements.toolModal.classList.add("hidden");
  elements.exitModal.classList.add("hidden");
  elements.staminaModal.classList.add("hidden");
  elements.comingSoonModal.classList.add("hidden");
}

function renderResultStars(count) {
  elements.resultStars.classList.remove("hidden");
  elements.resultStars.innerHTML = "";
  for (let index = 1; index <= 3; index += 1) {
    const star = document.createElement("span");
    star.className = `star result-star${index <= count ? " filled" : ""}`;
    const art = document.createElement("img");
    art.className = `result-star-art${index <= count ? " filled" : ""}`;
    art.src = "./assets/image/best-star.png";
    art.alt = "";
    art.setAttribute("aria-hidden", "true");
    star.append(art);
    elements.resultStars.append(star);
  }
}

function refreshStamina() {
  const nextState = calculateRecoveredStamina(state.stamina);
  if (JSON.stringify(nextState) !== JSON.stringify(state.stamina)) {
    saveStaminaState(nextState);
    return;
  }
  updateStaminaView();
}

function startStaminaTimer() {
  state.staminaTimer = window.setInterval(refreshStamina, 1000);
}

function saveStaminaState(nextState) {
  state.stamina = normalizeStaminaState(nextState);
  localStorage.setItem(STAMINA_KEY, JSON.stringify(state.stamina));
  updateStaminaView();
}

function loadStaminaState() {
  try {
    return normalizeStaminaState(JSON.parse(localStorage.getItem(STAMINA_KEY)));
  } catch {
    return normalizeStaminaState(null);
  }
}

function saveProgressState(nextState) {
  state.progress = normalizeProgress(nextState);
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(state.progress));
}

function loadProgressState() {
  try {
    return normalizeProgress(JSON.parse(localStorage.getItem(PROGRESS_KEY)));
  } catch {
    return normalizeProgress(null);
  }
}

function createFullStaminaState() {
  return { stamina: MAX_STAMINA, updatedAt: Date.now(), adClaims: 0 };
}

function updateStaminaView() {
  elements.staminaTexts.forEach((text) => {
    text.textContent = `${state.stamina.stamina}/${MAX_STAMINA}`;
  });
  const countdown = calculateNextStaminaCountdown(state.stamina);
  const countdownText =
    countdown.type === "recover"
      ? `恢复 ${formatCountdown(countdown.remainingMs)}`
      : `刷新 ${formatCountdown(countdown.remainingMs)}`;
  elements.staminaCountdowns.forEach((text) => {
    text.textContent = countdownText;
  });
  elements.getStaminaButtons.forEach((button) => {
    button.disabled = false;
    button.textContent = "获取体力";
  });
}

function switchChapter(direction) {
  state.chapterIndex = (state.chapterIndex + direction + CHAPTERS.length) % CHAPTERS.length;
  renderHome();
}

function buildRoadSvg(points, height) {
  const data = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  return `<svg class="road-path" viewBox="0 0 100 ${height}" preserveAspectRatio="none" aria-hidden="true">
    <path class="road-line-shadow" d="${data}" />
    <path class="road-line-outer" d="${data}" />
    <path class="road-line-main" d="${data}" />
    <path class="road-line-highlight" d="${data}" />
    <path class="road-line-accent" d="${data}" />
    ${buildRoadVineDecorations(points)}
  </svg>`;
}

function buildRoadVineDecorations(points) {
  const decorations = [];
  points.slice(0, -1).forEach((start, index) => {
    const end = points[index + 1];
    const angle = (Math.atan2(end.y - start.y, end.x - start.x) * 180) / Math.PI;
    [0.34, 0.66].forEach((progress, leafIndex) => {
      const cx = start.x + (end.x - start.x) * progress;
      const cy = start.y + (end.y - start.y) * progress;
      const side = (index + leafIndex) % 2 === 0 ? -1 : 1;
      const leafAngle = angle + side * 54;
      const leafX = cx + side * 0.9;
      const leafY = cy - 1.5;
      const budX = cx - side * 0.8;
      const budY = cy + 2;
      decorations.push(
        `<ellipse class="road-vine-leaf" cx="${leafX.toFixed(2)}" cy="${leafY.toFixed(2)}" rx="1.35" ry="2.7" transform="rotate(${leafAngle.toFixed(1)} ${leafX.toFixed(2)} ${leafY.toFixed(2)})" />`,
        `<circle class="road-vine-bud" cx="${budX.toFixed(2)}" cy="${budY.toFixed(2)}" r="0.9" />`,
      );
    });
  });
  return `<g class="road-vine-decorations">${decorations.join("")}</g>`;
}

function renderMiniStars(count) {
  const filledCount = Math.min(3, Math.max(0, Number(count) || 0));
  if (filledCount <= 0) return `<span class="road-stars" aria-hidden="true"></span>`;
  return `<span class="road-stars road-stars--${filledCount}" aria-label="${filledCount}星"><img src="./assets/image/road-stars-${filledCount}.png" alt="" aria-hidden="true" /></span>`;
}

function getLevelStatusText(status) {
  if (status === "completed") return "已通关";
  if (status === "current") return "当前可挑战";
  if (status === "available") return TEST_UNLOCK_ALL_LEVELS ? "可测试" : "可重玩";
  return "未解锁";
}

function getDisplayChapterStatus(chapter) {
  const status = getChapterStatus(chapter, state.progress);
  return TEST_UNLOCK_ALL_LEVELS && status === "locked" ? "active" : status;
}

function getDisplayLevelStatus(level) {
  const status = getLevelStatus(level.number, state.progress);
  return TEST_UNLOCK_ALL_LEVELS && status === "locked" ? "available" : status;
}

function formatToolCount(count) {
  return Number.isFinite(count) ? String(count) : UNLIMITED_TOOL_COUNT_TEXT;
}

function formatCountdown(milliseconds) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function setTileClass(point, className, enabled) {
  const tile = getTileElement(point);
  if (tile) tile.classList.toggle(className, enabled);
}

function getTileElement(point) {
  return elements.board.querySelector(`[data-row="${point.row}"][data-col="${point.col}"]`);
}

function drawLink(path) {
  elements.linkLayer.innerHTML = "";
  const points = path.map(pointToSvg);
  const data = buildRoundedPath(points, 18);
  const glow = document.createElementNS("http://www.w3.org/2000/svg", "path");
  const core = document.createElementNS("http://www.w3.org/2000/svg", "path");
  glow.setAttribute("class", "link-glow");
  core.setAttribute("class", "link-core");
  glow.setAttribute("d", data);
  core.setAttribute("d", data);
  elements.linkLayer.append(glow, core);
}

function clearLink() {
  elements.linkLayer.innerHTML = "";
}

function buildRoundedPath(points, radius) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  const commands = [`M ${points[0].x} ${points[0].y}`];

  for (let index = 1; index < points.length - 1; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const next = points[index + 1];
    const previousDistance = distance(previous, current);
    const nextDistance = distance(current, next);
    const cornerRadius = Math.min(radius, previousDistance / 2, nextDistance / 2);
    const beforeCorner = moveToward(current, previous, cornerRadius);
    const afterCorner = moveToward(current, next, cornerRadius);

    commands.push(`L ${beforeCorner.x} ${beforeCorner.y}`);
    commands.push(`Q ${current.x} ${current.y} ${afterCorner.x} ${afterCorner.y}`);
  }

  const last = points[points.length - 1];
  commands.push(`L ${last.x} ${last.y}`);
  return commands.join(" ");
}

function moveToward(from, to, amount) {
  const total = distance(from, to);
  if (total === 0) return { ...from };
  const ratio = amount / total;
  return {
    x: from.x + (to.x - from.x) * ratio,
    y: from.y + (to.y - from.y) * ratio,
  };
}

function distance(first, second) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

function showToast(message) {
  window.clearTimeout(state.toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  if (elements.homeToast) {
    elements.homeToast.textContent = message;
    elements.homeToast.classList.add("show");
  }
  state.toastTimer = window.setTimeout(() => {
    hideToast();
  }, 1400);
}

function showHomeNotice(message) {
  showToast(message);
}

function showResultToast(message) {
  window.clearTimeout(state.resultToastTimer);
  elements.resultToast.textContent = message;
  elements.resultToast.classList.remove("hidden");
  elements.resultToast.classList.add("show");
  state.resultToastTimer = window.setTimeout(() => {
    hideResultToast();
  }, 2500);
}

function hideResultToast() {
  window.clearTimeout(state.resultToastTimer);
  elements.resultToast.textContent = "";
  elements.resultToast.classList.remove("show");
  elements.resultToast.classList.add("hidden");
}

function hideToast() {
  window.clearTimeout(state.toastTimer);
  elements.toast.classList.remove("show");
  if (elements.homeToast) {
    elements.homeToast.classList.remove("show");
  }
}

function getMismatchMessage(first, second) {
  const firstTile = state.board[first.row][first.col];
  const secondTile = state.board[second.row][second.col];
  if (firstTile !== secondTile) {
    return "不能连接：两个图案不一样";
  }
  return "不能连接：中间被挡住了";
}

function pointToSvg(point) {
  const boardRect = elements.board.getBoundingClientRect();
  const layerRect = elements.linkLayer.getBoundingClientRect();
  const tileWidth = boardRect.width / state.level.cols;
  const tileHeight = boardRect.height / state.level.rows;
  return {
    x: boardRect.left - layerRect.left + (point.col + 0.5) * tileWidth,
    y: boardRect.top - layerRect.top + (point.row + 0.5) * tileHeight,
  };
}

function showScreen(name) {
  elements.appShell.classList.toggle("is-secondary-active", name === "profile" || name === "settings");
  Object.entries(screens).forEach(([screenName, screen]) => {
    screen.classList.toggle("active", screenName === name || (name === "result" && screenName === "game"));
  });
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function formatLevelTitle(level) {
  return `第${String(level.number).padStart(2, "0")}关`;
}

function getBestScore(levelNumber) {
  const record = state.progress.records[String(levelNumber)];
  return record?.bestScore ?? 0;
}

function samePoint(first, second) {
  return first.row === second.row && first.col === second.col;
}

if (new URLSearchParams(window.location.search).has("boardSeed")) {
  window.__linkMatchSmoke = {
    finishGameForSmoke: finishGame,
    setRemainingSecondsForSmoke(seconds) {
      state.remainingSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
      state.timerLastTickAt = Date.now();
      updateHud();
    },
    setTimerLastTickAtForSmoke(timestamp) {
      state.timerLastTickAt = Number(timestamp) || Date.now();
    },
    tickTimerForSmoke: tickTimer,
  };
}
