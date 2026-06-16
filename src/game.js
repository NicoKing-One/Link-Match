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
  claimPurchasedStamina,
  normalizeStaminaState,
  spendStartStamina,
} from "./game-rules.js";
import {
  MAX_LEVEL_NUMBER,
  applyLevelResult,
  calculateCompletedLevels,
  calculateThreeStarLevels,
  calculateTotalStars,
  createInitialProgress,
  getChapterStatus,
  getLevelStatus,
  normalizeProgress,
} from "./progression.js";

const ICON_VIEW = {
  flower: { label: "草莓", src: "./assets/jelly-fruit/tiles/flower.png" },
  star: { label: "蓝莓", src: "./assets/jelly-fruit/tiles/star.png" },
  moon: { label: "葡萄", src: "./assets/jelly-fruit/tiles/moon.png" },
  sun: { label: "柠檬糖", src: "./assets/jelly-fruit/tiles/sun.png" },
  leaf: { label: "橙子", src: "./assets/jelly-fruit/tiles/leaf.png" },
  gem: { label: "猕猴桃", src: "./assets/jelly-fruit/tiles/gem.png" },
  heart: { label: "西瓜", src: "./assets/jelly-fruit/tiles/heart.png" },
  cloud: { label: "樱桃", src: "./assets/jelly-fruit/tiles/cloud.png" },
  bolt: { label: "棒棒糖", src: "./assets/jelly-fruit/tiles/bolt.png" },
  drop: { label: "蜜桃糖", src: "./assets/jelly-fruit/tiles/drop.png" },
  music: { label: "青苹果", src: "./assets/jelly-fruit/tiles/music.png" },
  crown: { label: "紫糖球", src: "./assets/jelly-fruit/tiles/crown.png" },
};

const STAMINA_KEY = "lianliankan.stamina";
const PROGRESS_KEY = "lianliankan.progress";
const DATA_RESET_KEY = "lianliankan.dataResetVersion";
const DATA_RESET_VERSION = "2026-06-13-full-stamina-baseline";
const ROAD_STEP_Y = 52;
const ROAD_TOP_Y = 36;
const ROAD_X_PATTERN = [18, 34, 62, 80, 66, 38];
const EXCHANGE_TITLE_PAGES = [
  [
    { name: "萌新果冻", price: 20 },
    { name: "水果新星", price: 35 },
    { name: "糖果学徒", price: 55 },
    { name: "连线小将", price: 80 },
    { name: "森林旅人", price: 120 },
    { name: "甜心队长", price: 180 },
    { name: "闪光萌主", price: 260 },
    { name: "果冻骑士", price: 360 },
    { name: "蜜糖达人", price: 520 },
  ],
  [
    { name: "星辉领主", price: 650 },
    { name: "彩虹旅者", price: 820 },
    { name: "宝石猎人", price: 1000 },
    { name: "果香名人", price: 1250 },
    { name: "甜梦伯爵", price: 1600 },
    { name: "泡泡冠军", price: 2100 },
    { name: "糖霜大师", price: 2800 },
    { name: "金牌连线", price: 3600 },
    { name: "金币大亨", price: 5000 },
  ],
];

resetStoredPlayerDataIfNeeded();

const screens = {
  start: document.querySelector("#startScreen"),
  profile: document.querySelector("#profileScreen"),
  settings: document.querySelector("#settingsScreen"),
  exchange: document.querySelector("#exchangeScreen"),
  game: document.querySelector("#gameScreen"),
  result: document.querySelector("#resultScreen"),
};

const elements = {
  appShell: document.querySelector(".app-shell"),
  chapterTabs: document.querySelector("#chapterTabs"),
  chapterSummary: document.querySelector("#chapterSummary"),
  chapterLockNotice: document.querySelector("#chapterLockNotice"),
  levelRoad: document.querySelector("#levelRoad"),
  roadScroll: document.querySelector("#roadScroll"),
  prevChapterButton: document.querySelector("#prevChapterButton"),
  nextChapterButton: document.querySelector("#nextChapterButton"),
  profileButton: document.querySelector("#profileButton"),
  settingsButton: document.querySelector("#settingsButton"),
  coinExchangeButton: document.querySelector("#coinExchangeButton"),
  profileBackButton: document.querySelector("#profileBackButton"),
  profileHomeButton: document.querySelector("#profileHomeButton"),
  settingsBackButton: document.querySelector("#settingsBackButton"),
  settingsHomeButton: document.querySelector("#settingsHomeButton"),
  exchangeBackButton: document.querySelector("#exchangeBackButton"),
  exchangeHomeButton: document.querySelector("#exchangeHomeButton"),
  profileCurrentLevelText: document.querySelector("#profileCurrentLevelText"),
  profileStarText: document.querySelector("#profileStarText"),
  profileCoinText: document.querySelector("#profileCoinText"),
  profileCompletedText: document.querySelector("#profileCompletedText"),
  profileThreeStarText: document.querySelector("#profileThreeStarText"),
  exchangeCoinText: document.querySelector("#exchangeCoinText"),
  exchangeShopGrid: document.querySelector("#exchangeShopGrid"),
  exchangeShopPageText: document.querySelector("#exchangeShopPageText"),
  exchangePrevPageButton: document.querySelector("#exchangePrevPageButton"),
  exchangeNextPageButton: document.querySelector("#exchangeNextPageButton"),
  exchangeResultModal: document.querySelector("#exchangeResultModal"),
  exchangeResultMessage: document.querySelector("#exchangeResultMessage"),
  exchangeResultCloseButton: document.querySelector("#exchangeResultCloseButton"),
  settingToggles: document.querySelectorAll(".settings-toggle"),
  clearProgressButton: document.querySelector("#clearProgressButton"),
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
  resultBadgeArt: document.querySelector("#resultBadgeArt"),
  resultTitle: document.querySelector("#resultTitle"),
  resultSummary: document.querySelector("#resultSummary"),
  resultStars: document.querySelector("#resultStars"),
  resultScore: document.querySelector("#resultScore"),
  resultBest: document.querySelector("#resultBest"),
  nextLevelButton: document.querySelector("#nextLevelButton"),
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
  staminaTimer: null,
  toastTimer: null,
  hints: 0,
  shuffles: 0,
  stamina: loadStaminaState(),
  progress: loadProgressState(),
  chapterIndex: 0,
  exchangePageIndex: 0,
  paused: false,
  busy: false,
};

state.level = LEVELS[state.progress.highestUnlockedLevel - 1] ?? LEVELS[0];
state.chapterIndex = CHAPTERS.findIndex(
  (chapter) => state.level.number >= chapter.startLevel && state.level.number <= chapter.endLevel,
);
if (state.chapterIndex < 0) state.chapterIndex = 0;

bindEvents();
refreshStamina();
startStaminaTimer();
renderHome();
showScreen("start");

function bindEvents() {
  elements.startButton.addEventListener("click", () => requestStartGame(LEVELS[state.progress.highestUnlockedLevel - 1]));
  elements.prevChapterButton.addEventListener("click", () => switchChapter(-1));
  elements.nextChapterButton.addEventListener("click", () => switchChapter(1));
  elements.profileButton.addEventListener("click", () => openSecondaryPage("profile"));
  elements.settingsButton.addEventListener("click", () => openSecondaryPage("settings"));
  elements.coinExchangeButton.addEventListener("click", () => openSecondaryPage("exchange"));
  [
    elements.profileBackButton,
    elements.profileHomeButton,
    elements.settingsBackButton,
    elements.settingsHomeButton,
    elements.exchangeBackButton,
    elements.exchangeHomeButton,
  ].filter(Boolean).forEach((button) => {
    button.addEventListener("click", returnHome);
  });
  elements.settingToggles.forEach((button) => {
    button.addEventListener("click", () => toggleSettingButton(button));
  });
  elements.clearProgressButton?.addEventListener("click", () => {
    showHomeNotice("清除进度功能待接入");
  });
  elements.exchangePrevPageButton.addEventListener("click", () => switchExchangePage(-1));
  elements.exchangeNextPageButton.addEventListener("click", () => switchExchangePage(1));
  elements.exchangeResultCloseButton.addEventListener("click", closeExchangeResultModal);
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
  elements.nextLevelButton.addEventListener("click", requestNextLevel);
  elements.againButton.addEventListener("click", () => requestStartGame(state.level));
  elements.homeButton.addEventListener("click", () => {
    stopTimer();
    renderHome();
    showScreen("start");
  });
}

function openSecondaryPage(name) {
  stopTimer();
  state.paused = false;
  hideToast();
  hideModals();
  if (name === "exchange") state.exchangePageIndex = 0;
  renderHome();
  showScreen(name);
}

function renderHome() {
  const currentLevel = LEVELS[state.progress.highestUnlockedLevel - 1] ?? LEVELS[0];
  elements.startButton.textContent = calculateCompletedLevels(state.progress) > 0 ? "继续闯关" : "开始闯关";
  elements.coinText.textContent = state.progress.coins;
  elements.starText.textContent = `${calculateTotalStars(state.progress)}/${MAX_LEVEL_NUMBER * 3}`;
  elements.completedText.textContent = `已通关 ${calculateCompletedLevels(state.progress)}`;
  renderSecondaryPages(currentLevel);
  renderChapterTabs();
  renderRoadMap();
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
  elements.exchangeCoinText.textContent = `${state.progress.coins}个`;
  renderExchangeShop();
}

function renderExchangeShop() {
  const titles = EXCHANGE_TITLE_PAGES[state.exchangePageIndex] ?? EXCHANGE_TITLE_PAGES[0];
  elements.exchangeShopGrid.innerHTML = "";
  titles.forEach((title) => {
    const item = document.createElement("article");
    item.className = "exchange-shop-item";

    const badge = document.createElement("div");
    badge.className = "exchange-title-badge";
    badge.textContent = title.name;

    const button = document.createElement("button");
    button.className = "exchange-price-button";
    button.type = "button";
    button.dataset.price = String(title.price);
    button.dataset.titleName = title.name;
    button.setAttribute("aria-label", `兑换${title.name}，需要${title.price}金币`);

    const coinIcon = document.createElement("img");
    coinIcon.src = "./assets/UI-ICON/exchange-page/icon-coin.png";
    coinIcon.alt = "";
    coinIcon.setAttribute("aria-hidden", "true");

    const price = document.createElement("span");
    price.textContent = String(title.price);

    button.append(coinIcon, price);
    button.addEventListener("click", () => openExchangeResultModal(state.progress.coins >= title.price));
    item.append(badge, button);
    elements.exchangeShopGrid.append(item);
  });
  elements.exchangeShopPageText.textContent = `第 ${state.exchangePageIndex + 1} / ${EXCHANGE_TITLE_PAGES.length} 页`;
}

function switchExchangePage(direction) {
  state.exchangePageIndex =
    (state.exchangePageIndex + direction + EXCHANGE_TITLE_PAGES.length) % EXCHANGE_TITLE_PAGES.length;
  renderExchangeShop();
}

function openExchangeResultModal(success) {
  elements.exchangeResultMessage.textContent = success ? "已兑换成功" : "金币不足";
  elements.exchangeResultModal.classList.remove("hidden");
}

function closeExchangeResultModal() {
  elements.exchangeResultModal.classList.add("hidden");
}

function toggleSettingButton(button) {
  const isOn = !button.classList.contains("is-on");
  button.classList.toggle("is-on", isOn);
  button.setAttribute("aria-pressed", String(isOn));
  button.querySelector("span").textContent = isOn ? "开" : "关";
}

function renderChapterTabs() {
  elements.chapterTabs.innerHTML = "";
  CHAPTERS.forEach((chapter, index) => {
    const status = getChapterStatus(chapter, state.progress);
    const button = document.createElement("button");
    button.type = "button";
    button.className = `chapter-tab ${status}${index === state.chapterIndex ? " selected" : ""}`;
    button.setAttribute("role", "tab");
    button.setAttribute("aria-selected", index === state.chapterIndex ? "true" : "false");
    button.innerHTML = `<strong>${chapter.name}</strong><span>${chapter.startLevel}-${chapter.endLevel}</span>`;
    button.addEventListener("click", () => {
      state.chapterIndex = index;
      renderHome();
    });
    elements.chapterTabs.append(button);
  });
  elements.prevChapterButton.disabled = state.chapterIndex === 0;
  elements.nextChapterButton.disabled = state.chapterIndex === CHAPTERS.length - 1;
}

function renderRoadMap() {
  const chapter = CHAPTERS[state.chapterIndex];
  const chapterLevels = getLevelsForChapter(chapter.id);
  const chapterStatus = getChapterStatus(chapter, state.progress);
  const roadHeight = ROAD_TOP_Y * 2 + (chapterLevels.length - 1) * ROAD_STEP_Y;
  const points = chapterLevels.map((level, index) => ({
    level,
    x: ROAD_X_PATTERN[index % ROAD_X_PATTERN.length],
    y: roadHeight - ROAD_TOP_Y - index * ROAD_STEP_Y,
  }));

  elements.chapterSummary.textContent = `${chapter.name} · ${chapter.startLevel}-${chapter.endLevel}关`;
  elements.chapterSummary.dataset.status = chapterStatus;
  elements.chapterLockNotice.classList.toggle("hidden", chapterStatus !== "locked");
  elements.chapterLockNotice.textContent =
    chapter.id === "candy-garden" ? "通关第30关后解锁糖果花园" : "通关第60关后解锁果冻城堡";
  elements.levelRoad.className = `level-road ${chapter.backgroundClass}`;
  elements.levelRoad.style.height = `${roadHeight}px`;
  elements.levelRoad.innerHTML = buildRoadSvg(points, roadHeight);

  points.forEach(({ level, x, y }) => {
    const status = getLevelStatus(level.number, state.progress);
    const record = state.progress.records[String(level.number)] ?? { bestStars: 0 };
    const button = document.createElement("button");
    button.type = "button";
    button.className = `road-level ${status}`;
    button.style.left = `calc(${x}% - 24px)`;
    button.style.top = `${y - 24}px`;
    button.disabled = status === "locked";
    button.setAttribute("aria-label", `${formatLevelTitle(level)} ${getLevelStatusText(status)}`);
    button.innerHTML = `<strong>${String(level.number).padStart(2, "0")}</strong>${renderMiniStars(record.bestStars)}`;
    button.addEventListener("click", () => requestStartGame(level));
    elements.levelRoad.append(button);
  });
  window.requestAnimationFrame(() => {
    elements.roadScroll.scrollTop = elements.roadScroll.scrollHeight;
  });
}

function requestStartGame(level) {
  if (getLevelStatus(level.number, state.progress) === "locked") {
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
  state.hints = level.hints;
  state.shuffles = level.shuffles;
  state.paused = false;
  state.busy = false;
  hideModals();

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
  if (state.hints <= 0) {
    openToolModal("提示");
    return;
  }
  const pair = findAvailablePair(state.board);
  if (!pair) {
    showToast("没有可连接组合了，请使用洗牌道具");
    return;
  }
  state.hints -= 1;
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
  if (state.shuffles <= 0) {
    openToolModal("洗牌");
    return;
  }
  state.shuffles -= 1;
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
  elements.pauseModal.classList.remove("hidden");
}

function resumeGame() {
  state.paused = false;
  elements.pauseModal.classList.add("hidden");
}

function startTimer() {
  updateHud();
  state.timer = window.setInterval(() => {
    if (state.paused || state.busy) return;
    state.remainingSeconds -= 1;
    updateHud();
    if (state.remainingSeconds <= 0) {
      finishGame(false);
    }
  }, 1000);
}

function stopTimer() {
  if (state.timer) {
    window.clearInterval(state.timer);
    state.timer = null;
  }
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
  renderHome();
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
  const best = getBestScore(state.level.number);
  const showCoinReward = won && result.firstClear;

  elements.resultTitle.classList.add("result-title--compact");
  elements.resultTitle.classList.toggle("result-title--coin", showCoinReward);
  elements.resultTitle.innerHTML = showCoinReward
    ? `通关成功，获得<span class="result-coin-count">${result.coinsAdded}</span><img class="result-coin-icon" src="./assets/ui-cut/result-coin.png" alt="金币" />`
    : won
      ? "恭喜通关，重复关卡无法获得金币。"
      : "挑战失败，再来一次吧。";
  elements.resultBadgeArt.src = won ? "./assets/ui-cut/result-pass-badge.png" : "./assets/ui-cut/result-fail-badge.png";
  screens.result.dataset.result = won ? "success" : "failure";
  elements.resultSummary.textContent = won
    ? `用 ${state.moves} 步清空棋盘，新增 ${result.starsAdded} 星。`
    : `还剩 ${remaining} 个图案没有消除，可以调整策略再来一次。`;
  renderResultStars(stars);
  elements.resultScore.textContent = `得分 ${finalScore}`;
  elements.resultBest.textContent = `最佳 ${best}`;
  elements.nextLevelButton.classList.toggle("hidden", !won || state.level.number >= MAX_LEVEL_NUMBER);
  updateStaminaView();
  showScreen("result");
}

function updateHud() {
  elements.timeText.textContent = formatTime(Math.max(0, state.remainingSeconds));
  elements.remainingText.textContent = countRemainingTiles(state.board);
  elements.scoreText.textContent = state.score;
  elements.hintCount.textContent = state.hints;
  elements.shuffleCount.textContent = state.shuffles;
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
  elements.toolModalIcon.src = toolName === "洗牌" ? "./assets/ui-cut/tool-shuffle.png" : "./assets/ui-cut/tool-hint.png";
  elements.toolTitle.textContent = `${toolName}用完了`;
  elements.toolMessage.textContent = `${toolName}次数已经用完，可以看广告获取，或购买更多道具。`;
  elements.toolModal.classList.remove("hidden");
}

function closeToolModal(message) {
  state.paused = false;
  elements.toolModal.classList.add("hidden");
  if (message) showToast(message);
}

function openStaminaModal(
  title = "体力不足",
  message = `看广告或购买可以获取 ${AD_STAMINA_REWARD} 点体力，广告最多获取 ${MAX_AD_STAMINA_CLAIMS} 次。`,
) {
  state.paused = screens.game.classList.contains("active");
  elements.staminaTitle.textContent = title;
  elements.staminaMessage.textContent = message;
  elements.staminaAdButton.disabled = state.stamina.adClaims >= MAX_AD_STAMINA_CLAIMS;
  elements.staminaModal.classList.remove("hidden");
}

function closeStaminaModal() {
  state.paused = false;
  elements.staminaModal.classList.add("hidden");
}

function claimStaminaFromAd() {
  refreshStamina();
  const result = claimAdStamina(state.stamina);
  saveStaminaState(result.state);
  if (!result.ok) {
    openStaminaModal("领取次数已用完", `广告体力最多可以领取 ${MAX_AD_STAMINA_CLAIMS} 次，请等待体力自动恢复。`);
    return;
  }

  closeStaminaModal();
  showToast(`获得 ${AD_STAMINA_REWARD} 点体力`);
}

function buyStamina() {
  refreshStamina();
  saveStaminaState(claimPurchasedStamina(state.stamina));
  closeStaminaModal();
  showToast(`购买成功，获得 ${AD_STAMINA_REWARD} 点体力`);
}

function openExitModal() {
  if (!screens.game.classList.contains("active")) return;
  state.paused = true;
  elements.exitModal.classList.remove("hidden");
}

function closeExitModal() {
  state.paused = false;
  elements.exitModal.classList.add("hidden");
}

function hideModals() {
  elements.pauseModal.classList.add("hidden");
  elements.toolModal.classList.add("hidden");
  elements.exitModal.classList.add("hidden");
  elements.staminaModal.classList.add("hidden");
  elements.exchangeResultModal.classList.add("hidden");
}

function renderResultStars(count) {
  elements.resultStars.classList.remove("hidden");
  elements.resultStars.innerHTML = "";
  for (let index = 1; index <= 3; index += 1) {
    const star = document.createElement("span");
    star.className = `star result-star${index <= count ? " filled" : ""}`;
    const art = document.createElement("img");
    art.className = `result-star-art${index <= count ? " filled" : ""}`;
    art.src = "./assets/ui-cut/best-star.png";
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

function resetStoredPlayerDataIfNeeded() {
  try {
    if (localStorage.getItem(DATA_RESET_KEY) === DATA_RESET_VERSION) return;
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(createInitialProgress()));
    localStorage.setItem(STAMINA_KEY, JSON.stringify({ stamina: MAX_STAMINA, updatedAt: Date.now(), adClaims: 0 }));
    localStorage.setItem(DATA_RESET_KEY, DATA_RESET_VERSION);
  } catch {
    // Ignore storage failures; normal loaders still fall back to zeroed defaults.
  }
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
    button.disabled = state.stamina.adClaims >= MAX_AD_STAMINA_CLAIMS;
    button.textContent = state.stamina.adClaims >= MAX_AD_STAMINA_CLAIMS ? "已领取完" : "获取体力";
  });
}

function switchChapter(direction) {
  state.chapterIndex = Math.min(CHAPTERS.length - 1, Math.max(0, state.chapterIndex + direction));
  renderHome();
}

function buildRoadSvg(points, height) {
  const data = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  return `<svg class="road-path" viewBox="0 0 100 ${height}" preserveAspectRatio="none" aria-hidden="true"><path d="${data}" /></svg>`;
}

function renderMiniStars(count) {
  const stars = [];
  for (let index = 1; index <= 3; index += 1) {
    stars.push(`<span class="${index <= count ? "filled" : ""}"></span>`);
  }
  return `<span class="road-stars" aria-hidden="true">${stars.join("")}</span>`;
}

function getLevelStatusText(status) {
  if (status === "completed") return "已通关";
  if (status === "current") return "当前可挑战";
  if (status === "available") return "可重玩";
  return "未解锁";
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
  elements.appShell.classList.toggle(
    "is-secondary-active",
    name === "profile" || name === "settings" || name === "exchange",
  );
  Object.entries(screens).forEach(([screenName, screen]) => {
    screen.classList.toggle("active", screenName === name);
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
  };
}
