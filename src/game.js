import {
  DEFAULT_ICONS,
  LEVELS,
  canConnect,
  countRemainingTiles,
  createBoard,
  findAvailablePair,
  findConnection,
  isBoardCleared,
  removePair,
  shuffleBoard,
} from "./engine.js";
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

const ICON_VIEW = {
  flower: { symbol: "✿", color: "#ff6b8f" },
  star: { symbol: "★", color: "#f5b942" },
  moon: { symbol: "☾", color: "#7c68d9" },
  sun: { symbol: "☀", color: "#ff8a3d" },
  leaf: { symbol: "◆", color: "#5fbf72" },
  gem: { symbol: "◇", color: "#18a7d8" },
  heart: { symbol: "♥", color: "#ef4f6d" },
  cloud: { symbol: "☁", color: "#6b9ac4" },
  bolt: { symbol: "⚡", color: "#f0a500" },
  drop: { symbol: "●", color: "#34a0d4" },
  music: { symbol: "♪", color: "#ad6fea" },
  crown: { symbol: "♛", color: "#d99122" },
};

const STAMINA_KEY = "lianliankan.stamina";

const screens = {
  start: document.querySelector("#startScreen"),
  game: document.querySelector("#gameScreen"),
  result: document.querySelector("#resultScreen"),
};

const elements = {
  levelList: document.querySelector("#levelList"),
  startButton: document.querySelector("#startButton"),
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
  bestText: document.querySelector("#bestText"),
  gameHomeButton: document.querySelector("#gameHomeButton"),
  hintButton: document.querySelector("#hintButton"),
  shuffleButton: document.querySelector("#shuffleButton"),
  pauseButton: document.querySelector("#pauseButton"),
  hintCount: document.querySelector("#hintCount"),
  shuffleCount: document.querySelector("#shuffleCount"),
  pauseModal: document.querySelector("#pauseModal"),
  resumeButton: document.querySelector("#resumeButton"),
  toolModal: document.querySelector("#toolModal"),
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
  resultEyebrow: document.querySelector("#resultEyebrow"),
  resultTitle: document.querySelector("#resultTitle"),
  resultSummary: document.querySelector("#resultSummary"),
  resultStars: document.querySelector("#resultStars"),
  resultScore: document.querySelector("#resultScore"),
  resultBest: document.querySelector("#resultBest"),
  againButton: document.querySelector("#againButton"),
  homeButton: document.querySelector("#homeButton"),
};

const state = {
  level: LEVELS[1],
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
  paused: false,
  busy: false,
};

renderLevelChoices();
bindEvents();
refreshStamina();
startStaminaTimer();
showScreen("start");

function bindEvents() {
  elements.startButton.addEventListener("click", () => requestStartGame(state.level));
  elements.getStaminaButtons.forEach((button) => {
    button.addEventListener("click", claimStaminaFromAd);
  });
  elements.hintButton.addEventListener("click", useHint);
  elements.shuffleButton.addEventListener("click", useShuffle);
  elements.pauseButton.addEventListener("click", pauseGame);
  elements.gameHomeButton.addEventListener("click", openExitModal);
  elements.resumeButton.addEventListener("click", resumeGame);
  elements.watchAdButton.addEventListener("click", () => closeToolModal("广告功能待接入"));
  elements.buyToolButton.addEventListener("click", () => closeToolModal("购买功能待接入"));
  elements.toolCloseButton.addEventListener("click", () => closeToolModal());
  elements.confirmHomeButton.addEventListener("click", returnHome);
  elements.confirmRestartButton.addEventListener("click", () => requestStartGame(state.level));
  elements.exitCancelButton.addEventListener("click", closeExitModal);
  elements.staminaAdButton.addEventListener("click", claimStaminaFromAd);
  elements.staminaBuyButton.addEventListener("click", buyStamina);
  elements.staminaCloseButton.addEventListener("click", closeStaminaModal);
  elements.againButton.addEventListener("click", () => requestStartGame(state.level));
  elements.homeButton.addEventListener("click", () => {
    stopTimer();
    showScreen("start");
  });
}

function renderLevelChoices() {
  elements.levelList.innerHTML = "";
  LEVELS.forEach((level) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `level-card${level.id === state.level.id ? " selected" : ""}`;
    button.dataset.level = level.id;
    button.innerHTML = `<strong>${level.name}</strong><span>${level.rows}×${level.cols}<br>${formatTime(
      level.durationSeconds,
    )}<br>提示 ${level.hints} · 洗牌 ${level.shuffles}</span>`;
    button.addEventListener("click", () => {
      state.level = level;
      renderLevelChoices();
    });
    elements.levelList.append(button);
  });
}

function requestStartGame(level) {
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

  elements.levelName.textContent = `${level.name}模式`;
  updateBestText();
  renderBoard();
  updateHud();
  showScreen("game");
  startTimer();
}

function createPlayableBoard(level) {
  const icons = DEFAULT_ICONS.slice(0, level.iconCount);
  let board = createBoard({ rows: level.rows, cols: level.cols, iconKinds: icons });
  let guard = 0;
  while (!findAvailablePair(board) && guard < 20) {
    board = shuffleBoard(board);
    guard += 1;
  }
  return board;
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
      button.setAttribute("aria-label", tile ? `第 ${rowIndex + 1} 行第 ${colIndex + 1} 列` : "已消除");

      if (tile) {
        const view = ICON_VIEW[tile] ?? ICON_VIEW.flower;
        button.style.setProperty("--tile-color", view.color);
        button.innerHTML = `<span class="symbol">${view.symbol}</span>`;
        button.addEventListener("click", () => selectTile({ row: rowIndex, col: colIndex }));
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
    state.board = shuffleBoard(state.board);
    renderBoard();
  }
}

function useHint() {
  if (state.paused || state.busy) return;
  if (state.hints <= 0) {
    openToolModal("提示");
    return;
  }
  const pair = findAvailablePair(state.board);
  if (!pair) return;
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
  showScreen("start");
}

function finishGame(won) {
  stopTimer();
  state.paused = false;
  elements.pauseModal.classList.add("hidden");

  const remaining = countRemainingTiles(state.board);
  const finalScore = won ? state.score + state.remainingSeconds * 5 : state.score;
  state.score = finalScore;
  const best = getBestScore(state.level.id);
  if (finalScore > best) {
    localStorage.setItem(bestKey(state.level.id), String(finalScore));
  }

  elements.resultEyebrow.textContent = won ? "完成" : "时间到";
  elements.resultTitle.textContent = won ? "通关成功" : "挑战失败";
  elements.resultSummary.textContent = won
    ? `用 ${state.moves} 步清空棋盘，剩余 ${formatTime(state.remainingSeconds)}。`
    : `还剩 ${remaining} 个图案没有消除，可以调整策略再来一次。`;
  renderResultStars(won ? calculateStarCount(state.remainingSeconds, state.level) : 0);
  elements.resultScore.textContent = `得分 ${finalScore}`;
  elements.resultBest.textContent = `最佳 ${Math.max(finalScore, best)}`;
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

function updateBestText() {
  elements.bestText.textContent = `最佳 ${getBestScore(state.level.id)}`;
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
}

function renderResultStars(count) {
  elements.resultStars.classList.toggle("hidden", count === 0);
  elements.resultStars.innerHTML = "";
  for (let index = 1; index <= 3; index += 1) {
    const star = document.createElement("span");
    star.className = `star${index <= count ? " filled" : ""}`;
    star.textContent = "★";
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
  const points = path.map(pointToSvg).map((point) => `${point.x},${point.y}`).join(" ");
  const line = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  line.setAttribute("points", points);
  elements.linkLayer.append(line);
}

function clearLink() {
  elements.linkLayer.innerHTML = "";
}

function showToast(message) {
  window.clearTimeout(state.toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  state.toastTimer = window.setTimeout(() => {
    hideToast();
  }, 1400);
}

function hideToast() {
  window.clearTimeout(state.toastTimer);
  elements.toast.classList.remove("show");
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
  Object.entries(screens).forEach(([screenName, screen]) => {
    screen.classList.toggle("active", screenName === name);
  });
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function getBestScore(levelId) {
  return Number(localStorage.getItem(bestKey(levelId)) || 0);
}

function bestKey(levelId) {
  return `lianliankan.best.${levelId}`;
}

function samePoint(first, second) {
  return first.row === second.row && first.col === second.col;
}
