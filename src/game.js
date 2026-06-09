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

const screens = {
  start: document.querySelector("#startScreen"),
  game: document.querySelector("#gameScreen"),
  result: document.querySelector("#resultScreen"),
};

const elements = {
  levelList: document.querySelector("#levelList"),
  startButton: document.querySelector("#startButton"),
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
  restartButton: document.querySelector("#restartButton"),
  hintCount: document.querySelector("#hintCount"),
  shuffleCount: document.querySelector("#shuffleCount"),
  pauseModal: document.querySelector("#pauseModal"),
  resumeButton: document.querySelector("#resumeButton"),
  resultEyebrow: document.querySelector("#resultEyebrow"),
  resultTitle: document.querySelector("#resultTitle"),
  resultSummary: document.querySelector("#resultSummary"),
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
  toastTimer: null,
  hints: 0,
  shuffles: 0,
  paused: false,
  busy: false,
};

renderLevelChoices();
bindEvents();
showScreen("start");

function bindEvents() {
  elements.startButton.addEventListener("click", () => startGame(state.level));
  elements.hintButton.addEventListener("click", useHint);
  elements.shuffleButton.addEventListener("click", useShuffle);
  elements.pauseButton.addEventListener("click", pauseGame);
  elements.restartButton.addEventListener("click", () => startGame(state.level));
  elements.gameHomeButton.addEventListener("click", returnHome);
  elements.resumeButton.addEventListener("click", resumeGame);
  elements.againButton.addEventListener("click", () => startGame(state.level));
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
    pulseTile(selected);
    pulseTile(point);
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
  if (state.hints <= 0 || state.paused || state.busy) return;
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
  if (state.shuffles <= 0 || state.paused || state.busy) return;
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
  elements.pauseModal.classList.add("hidden");
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
  elements.resultTitle.textContent = won ? "通关成功" : "挑战结束";
  elements.resultSummary.textContent = won
    ? `用 ${state.moves} 步清空棋盘，剩余 ${formatTime(state.remainingSeconds)}。`
    : `还剩 ${remaining} 个图案没有消除，可以调整策略再来一次。`;
  elements.resultScore.textContent = `得分 ${finalScore}`;
  elements.resultBest.textContent = `最佳 ${Math.max(finalScore, best)}`;
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
