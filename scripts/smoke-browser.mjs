import { createReadStream, existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { extname, join, normalize } from "node:path";
import Module from "node:module";
import { CURRENT_DATA_RESET_VERSION } from "../src/storage-reset.js";

const bundledModules =
  process.env.WORKSPACE_NODE_MODULES ??
  "C:\\Users\\youzi\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules";
process.env.NODE_PATH = [bundledModules, join(bundledModules, ".pnpm", "node_modules"), process.env.NODE_PATH]
  .filter(Boolean)
  .join(";");
Module._initPaths();

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const root = join(process.cwd(), "src");
const outputDir = join(process.cwd(), "output", "playwright");
const modalCardBackground = join(process.cwd(), "src", "assets", "image", "modal-card-bg.png");
const browserExecutable = findBrowserExecutable();
const fullStamina = 60;
const startStaminaCost = 3;
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
};

function serveStatic() {
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    const pathname = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
    const target = normalize(join(root, pathname));

    if (!target.startsWith(root) || !existsSync(target)) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(200, { "content-type": types[extname(target)] ?? "application/octet-stream" });
    createReadStream(target).pipe(response);
  });

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

const server = await serveStatic();
const address = server.address();
const url = `http://127.0.0.1:${address.port}`;
const smokeUrl = `${url}?boardSeed=smoke-easy`;
await mkdir(outputDir, { recursive: true });
if (!existsSync(modalCardBackground)) {
  throw new Error(`Expected mobile popup/result card background to exist: ${modalCardBackground}`);
}

const browser = await chromium.launch({
  headless: true,
  ...(browserExecutable ? { executablePath: browserExecutable } : {}),
});
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await page.addInitScript(() => {
    window.__linkMatchAudioEvents = [];
    const record = (event) => window.__linkMatchAudioEvents.push(event);
    class FakeAudioParam {
      setValueAtTime(value) {
        record(`param-set:${value}`);
      }
      linearRampToValueAtTime(value) {
        record(`param-ramp:${value}`);
      }
      exponentialRampToValueAtTime(value) {
        record(`param-exp:${value}`);
      }
    }
    class FakeGain {
      constructor() {
        this.gain = new FakeAudioParam();
      }
      connect() {
        record("gain-connect");
      }
      disconnect() {
        record("gain-disconnect");
      }
    }
    class FakeOscillator {
      constructor() {
        this.frequency = new FakeAudioParam();
        this.type = "sine";
      }
      connect() {
        record("oscillator-connect");
      }
      start() {
        record("oscillator-start");
      }
      stop() {
        record("oscillator-stop");
      }
    }
    class FakeAudioContext {
      constructor() {
        record("context-created");
        this.currentTime = 0;
        this.destination = {};
        this.state = "running";
      }
      createGain() {
        return new FakeGain();
      }
      createOscillator() {
        return new FakeOscillator();
      }
      resume() {
        record("context-resume");
        return Promise.resolve();
      }
    }
    class FakeMusicAudio {
      constructor(src) {
        record(`audio-created:${src}`);
        this.src = src;
        this.currentTime = 0;
        this._loop = false;
        this._volume = 1;
        this.paused = true;
      }
      set loop(value) {
        this._loop = value;
        record(`audio-loop:${value}`);
      }
      get loop() {
        return this._loop;
      }
      set volume(value) {
        this._volume = value;
        record(`audio-volume:${value}`);
      }
      get volume() {
        return this._volume;
      }
      set preload(value) {
        this._preload = value;
        record(`audio-preload:${value}`);
      }
      get preload() {
        return this._preload;
      }
      set muted(value) {
        this._muted = value;
        record(`audio-muted:${value}`);
      }
      get muted() {
        return this._muted;
      }
      load() {
        record("audio-load");
      }
      play() {
        record("audio-play");
        if (window.__linkMatchRejectNextAudioPlay) {
          window.__linkMatchRejectNextAudioPlay = false;
          record("audio-play-reject");
          return Promise.reject(new Error("blocked"));
        }
        this.paused = false;
        record("audio-play-resolve");
        return Promise.resolve();
      }
      pause() {
        record("audio-pause");
        this.paused = true;
      }
    }
    window.AudioContext = FakeAudioContext;
    window.webkitAudioContext = FakeAudioContext;
    window.Audio = FakeMusicAudio;
    navigator.vibrate = (pattern) => {
      record(`vibrate:${JSON.stringify(pattern)}`);
      return true;
    };
  });
  await page.goto(smokeUrl, { waitUntil: "networkidle" });
  await expectMobileTapZoomDisabled(page);
  await expectFaviconAvailable(page, url);
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  const initialStamina = await page.locator(".screen-start .staminaText").innerText();
  if (initialStamina !== `${fullStamina}/${fullStamina}`) {
    throw new Error(`Expected reset stamina to be ${fullStamina}/${fullStamina}, got: ${initialStamina}`);
  }
  const bodyFont = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
  if (!bodyFont.includes("Microsoft YaHei") && !bodyFont.includes("寰蒋闆呴粦")) {
    throw new Error(`Expected Microsoft YaHei font family, got: ${bodyFont}`);
  }
  const initialCountdownCount = await page.locator(".screen-start .staminaCountdown").count();
  if (initialCountdownCount !== 0) {
    throw new Error(`Expected home stamina refresh time to be removed, got ${initialCountdownCount} countdown node(s).`);
  }
  await expectVersionedAllDataReset(page);
  await expectHomeRoadMap(page);
  await expectHomeScalesWithViewportWidth(page);
  await expectCurrentRoadLevelCentered(page);
  await expectCurrentRoadLevelCenteredAfterGameReturn(page);
  await expectStartFromBrowsedLockedChapterReturnsToCurrentChapter(page);
  await page.screenshot({ path: join(outputDir, "home-map-mobile.png"), fullPage: true });
  await seedProfileThreeStarState(page);
  await expectHomeLevelStarsMatchProgress(page);
  await expectSecondaryPageNavigation(page);
  await expectSettingsPersistenceAndAudioControls(page);
  await expectGameEntryStartsBackgroundMusic(page);
  await seedPlayableFreshState(page);
  await expectStaleFullStaminaSpend(page);
  await page.evaluate(() => localStorage.clear());
  await seedPlayableFreshState(page);
  await page.locator("#startButton").click();
  await page.waitForSelector(".screen-game.active .tile:not(.empty)");
  await expectGameUsesThemeBackground(page);
  const staminaAfterStart = await readStoredStamina(page);
  const gameStaminaText = await page.locator(".screen-game .staminaText").innerText();
  if (
    staminaAfterStart.stamina !== fullStamina - startStaminaCost ||
    gameStaminaText !== `${fullStamina - startStaminaCost}/${fullStamina}`
  ) {
    throw new Error(`Expected starting a level to cost 3 stamina, got: ${staminaAfterStart.stamina}`);
  }
  await page.waitForTimeout(1500);
  await page.screenshot({ path: join(outputDir, "game-initial-mobile.png"), fullPage: true });
  const gameHomeButton = page.locator("#gameHomeButton");
  await gameHomeButton.waitFor({ timeout: 2000 });
  const tileCount = await page.locator(".screen-game.active .tile:not(.empty)").count();
  const tileImageCount = await page.locator(".screen-game.active .tile:not(.empty) img.tile-art").count();
  const hudText = await page.locator(".hud").innerText();
  const stageText = await page.locator(".stage-banner").innerText();
  const tileArtBoxRatio = await getFirstTileArtRatio(page);
  const tileVisibleArtRatio = await getFirstTileVisibleArtRatio(page);
  const gameStaminaCountdownCount = await page.locator(".screen-game.active .staminaCountdown").count();
  const bestPillCount = await page.locator(".screen-game.active .best-pill").count();
  const expectedTileCount = await readCurrentLevelTileCount(page);
  await expectTilePressFeedback(page);
  if (tileCount !== expectedTileCount) {
    throw new Error(`Expected current level to render ${expectedTileCount} tiles, got ${tileCount}.`);
  }
  if (tileImageCount !== tileCount) {
    throw new Error(`Expected every active tile to use fruit candy image art, got ${tileImageCount}/${tileCount}.`);
  }
  if (!stageText.trim()) {
    throw new Error(`Expected top panel to show level text, got: ${stageText}`);
  }
  if (gameStaminaCountdownCount !== 0) {
    throw new Error(`Expected game HUD to hide stamina recovery countdown, got ${gameStaminaCountdownCount}.`);
  }
  if (bestPillCount !== 0) {
    throw new Error(`Expected game HUD best score strip to be removed, got ${bestPillCount}.`);
  }
  await expectPolishedGameUi(page);
  await expectBoardGridFillsFrame(page);
  await expectCompactGameViewportFits(page);
  await expectBoardTiersUseEasyLayout(page);
  await expectDraftThreeVisualSystem(page);
  await expectFlatImageAssets(page);
  await expectPageDoesNotScroll(page);
  if (tileArtBoxRatio < 1.1 || tileArtBoxRatio > 1.32) {
    throw new Error(`Expected tile art to keep the original large proportion inside the tile background, got ratio=${tileArtBoxRatio.toFixed(2)}.`);
  }
  if (tileVisibleArtRatio < 0.96 || tileVisibleArtRatio > 1.28) {
    throw new Error(`Expected visible tile art to keep its original proportion with the tile background, got ratio=${tileVisibleArtRatio.toFixed(2)}.`);
  }

  const firstAspect = await getFirstTileAspect(page);
  const boardBeforeWarning = await getBoardAndFirstTileBox(page);
  await clickInvalidPair(page);
  await page.waitForSelector(".toast.show", { timeout: 2000 });
  const toastText = await page.locator(".toast.show").innerText();
  const selectedAfterMismatch = await page.locator(".tile.selected").count();
  const shakingAfterMismatch = await page.locator(".tile.shake").count();
  if (!toastText.includes("不能连接")) {
    throw new Error(`Expected mismatch warning, got: ${toastText}`);
  }
  await expectToastOverlaysBoardWithoutMovingTiles(page, boardBeforeWarning);
  if (selectedAfterMismatch !== 0) {
    throw new Error(`Expected mismatch to clear selection, got ${selectedAfterMismatch} selected tile(s).`);
  }
  if (shakingAfterMismatch < 2) {
    throw new Error(`Expected mismatch to shake both selected tiles, got ${shakingAfterMismatch}.`);
  }

  await expectZeroToolCounts(page);
  await exhaustTool(page, "#hintButton");
  await expectHintToolDoesNotBreathe(page);
  await page.locator("#hintButton").click();
  await page.waitForSelector("#toolModal:not(.hidden)", { timeout: 2000 });
  await page.screenshot({ path: join(outputDir, "tool-modal-mobile.png"), fullPage: true });
  const toolActionCount = await page.locator("#toolModal:not(.hidden) .modal-actions button").count();
  if (toolActionCount !== 3) {
    throw new Error(`Expected spent tool modal to provide 3 actions, got: ${toolActionCount}`);
  }
  await expectModalHasIcon(page, "#toolModal");
  await expectMobileModalDesignSystem(page, "#toolModal");
  await expectToolAdButtonMatchesRewardedFlow(page, "hint");
  await exhaustTool(page, "#hintButton");
  await page.waitForTimeout(1500);
  await page.locator("#hintButton").click();
  await page.waitForSelector("#toolModal:not(.hidden)", { timeout: 2000 });
  await page.locator("#buyToolButton").click();
  await page.waitForFunction(() => document.querySelector("#toast.show")?.textContent.includes("功能暂未开放"));
  const toolBuyToast = await page.locator("#toast.show").innerText();
  if (!toolBuyToast.includes("功能暂未开放")) {
    throw new Error(`Expected spent tool buy action to show unavailable feature copy, got ${JSON.stringify(toolBuyToast)}.`);
  }
  await page.waitForTimeout(1500);
  await page.locator("#hintButton").click();
  await page.waitForSelector("#toolModal:not(.hidden)", { timeout: 2000 });
  await expectClickCreatesButtonSound(page, "#toolCloseButton", "spent tool continue");

  await exhaustTool(page, "#hintButton");
  await page.waitForTimeout(1500);
  await page.locator("#shuffleButton").click();
  await page.waitForSelector("#toolModal:not(.hidden)", { timeout: 2000 });
  await expectToolAdButtonMatchesRewardedFlow(page, "shuffle", { skipIncompleteCheck: true });
  await expectOwnedShuffleAnimatesBoard(page);

  await page.waitForTimeout(1500);
  await captureFirstLink(page);
  await clearPairs(page, 10);
  const laterAspect = await getFirstTileAspect(page);

  await page.locator("#pauseButton").click();
  await page.waitForSelector("#pauseModal:not(.hidden)", { timeout: 2000 });
  await page.screenshot({ path: join(outputDir, "pause-modal-mobile.png"), fullPage: true });
  await expectMobileModalDesignSystem(page, "#pauseModal");
  await expectModalIconAsset(page, "#pauseModal", "modal-pause-badge.png");
  const pauseActionCount = await page.locator("#pauseModal:not(.hidden) .modal-actions button").count();
  if (pauseActionCount !== 3) {
    throw new Error(`Expected pause modal to provide continue, restart and home actions, got ${pauseActionCount}.`);
  }
  await expectClickCreatesButtonSound(page, "#resumeButton", "pause continue");
  await page.screenshot({ path: join(outputDir, "smoke-mobile.png"), fullPage: true });
  await gameHomeButton.click();
  await page.waitForSelector("#exitModal:not(.hidden)", { timeout: 2000 });
  await page.screenshot({ path: join(outputDir, "exit-modal-mobile.png"), fullPage: true });
  await expectModalHasIcon(page, "#exitModal");
  await expectMobileModalDesignSystem(page, "#exitModal");
  await expectModalIconAsset(page, "#exitModal", "modal-exit-badge.png");
  await expectClickCreatesButtonSound(page, "#exitCancelButton", "exit continue");
  await page.locator("#exitModal").waitFor({ state: "hidden", timeout: 2000 });
  await gameHomeButton.click();
  await page.waitForSelector("#exitModal:not(.hidden)", { timeout: 2000 });
  await page.locator("#confirmRestartButton").click();
  await page.waitForSelector(".screen-game.active .tile:not(.empty)");
  await gameHomeButton.click();
  await page.waitForSelector("#exitModal:not(.hidden)", { timeout: 2000 });
  await page.locator("#confirmHomeButton").click();
  await page.waitForSelector(".screen-start.active");

  await finishFreshLevelAndExpectHomeVines(page);
  await finishGameAndExpectFailureBadge(page);
  await finishGameAndExpectStarsAndNoStaminaAgain(page);
  await finishCompletedLevelAndExpectNoCoinMessage(page);

  if (tileCount <= 0) {
    throw new Error(`Unexpected smoke state: tileCount=${tileCount}, hud=${hudText}`);
  }
  if (firstAspect > 1.08 || laterAspect > 1.08) {
    throw new Error(`Tiles stretched: firstAspect=${firstAspect.toFixed(3)}, laterAspect=${laterAspect.toFixed(3)}`);
  }

  console.log(`Smoke passed: ${tileCount} tiles rendered at ${url}`);
  console.log(`Tile aspect: initial ${firstAspect.toFixed(3)}, after removals ${laterAspect.toFixed(3)}`);
  console.log(`Screenshot: ${join(outputDir, "smoke-mobile.png")}`);
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

async function expectFaviconAvailable(page, baseUrl) {
  const faviconHref = await page.locator('link[rel="icon"]').getAttribute("href");
  if (faviconHref !== "./assets/image/favicon.ico") {
    throw new Error(`Expected document to declare ./assets/image/favicon.ico, got: ${faviconHref}`);
  }

  const response = await page.request.get(`${baseUrl}/assets/image/favicon.ico`);
  if (!response.ok()) {
    throw new Error(
      `Expected /assets/image/favicon.ico to load without console 404 noise, got HTTP ${response.status()}.`,
    );
  }

  const contentType = response.headers()["content-type"] ?? "";
  if (!contentType.includes("image/x-icon")) {
    throw new Error(`Expected /assets/image/favicon.ico to be served as image/x-icon, got: ${contentType}`);
  }
}

async function expectMobileTapZoomDisabled(page) {
  const tapPolicy = await page.evaluate(() => {
    const viewport = document.querySelector('meta[name="viewport"]')?.getAttribute("content") ?? "";
    const bodyTouchAction = getComputedStyle(document.body).touchAction;
    const shellTouchAction = getComputedStyle(document.querySelector(".app-shell")).touchAction;
    return {
      viewport,
      bodyTouchAction,
      shellTouchAction,
    };
  });

  if (
    !tapPolicy.viewport.includes("maximum-scale=1") ||
    !tapPolicy.viewport.includes("user-scalable=no") ||
    tapPolicy.bodyTouchAction !== "manipulation" ||
    tapPolicy.shellTouchAction !== "manipulation"
  ) {
    throw new Error(`Expected mobile tap zoom to be disabled, got ${JSON.stringify(tapPolicy)}.`);
  }
}

async function clickInvalidPair(page) {
  const pair = await page.evaluate(async () => {
    const tiles = [...document.querySelectorAll(".tile:not(.empty)")].map((tile) => ({
      row: Number(tile.dataset.row),
      col: Number(tile.dataset.col),
      symbol: tile.dataset.tile,
    }));
    for (let firstIndex = 0; firstIndex < tiles.length; firstIndex += 1) {
      for (let secondIndex = firstIndex + 1; secondIndex < tiles.length; secondIndex += 1) {
        if (tiles[firstIndex].symbol !== tiles[secondIndex].symbol) {
          return [tiles[firstIndex], tiles[secondIndex]];
        }
      }
    }
    return null;
  });

  if (!pair) throw new Error("Could not find an invalid pair to click.");
  await clickTile(page, pair[0]);
  await clickTile(page, pair[1]);
}

async function expectStaleFullStaminaSpend(page) {
  await page.evaluate((nextStamina) => {
    localStorage.setItem(
      "lianliankan.stamina",
      JSON.stringify({ stamina: nextStamina, updatedAt: Date.now() - 20 * 60 * 1000, adClaims: 0 }),
    );
  }, fullStamina);
  await page.reload({ waitUntil: "networkidle" });
  await page.locator("#startButton").click();
  await page.waitForSelector(".screen-game.active .tile:not(.empty)");
  await page.waitForTimeout(1200);
  const gameStaminaText = await page.locator(".screen-game .staminaText").innerText();
  const stored = await readStoredStamina(page);
  if (
    gameStaminaText !== `${fullStamina - startStaminaCost}/${fullStamina}` ||
    stored.stamina !== fullStamina - startStaminaCost
  ) {
    throw new Error(
      `Expected stale full stamina to spend to ${fullStamina - startStaminaCost}/${fullStamina}, got text=${gameStaminaText}, stored=${stored.stamina}.`,
    );
  }
}

async function clearPairs(page, maxPairs) {
  let idleRetries = 0;
  for (let index = 0; index < maxPairs; index += 1) {
    if (await page.locator(".screen-result.active").count()) return;
    const pair = await page.evaluate(async () => {
      const module = await import(new URL("./engine.js", window.location.href).href);
      const tiles = [...document.querySelectorAll(".tile")];
      const rows = Math.max(...tiles.map((tile) => Number(tile.dataset.row))) + 1;
      const cols = Math.max(...tiles.map((tile) => Number(tile.dataset.col))) + 1;
      const board = Array.from({ length: rows }, () => Array(cols).fill(null));
      tiles.forEach((tile) => {
        if (!tile.classList.contains("empty")) {
          board[Number(tile.dataset.row)][Number(tile.dataset.col)] = tile.dataset.tile;
        }
      });
      return module.findAvailablePair(board);
    });

    if (!pair) {
      idleRetries += 1;
      if (idleRetries > 4) return;
      await page.waitForTimeout(350);
      continue;
    }
    idleRetries = 0;
    await clickTile(page, pair.from);
    await clickTile(page, pair.to);
    await page.waitForTimeout(340);
  }
}

async function captureFirstLink(page) {
  const pair = await page.evaluate(async () => {
    const module = await import(new URL("./engine.js", window.location.href).href);
    const tiles = [...document.querySelectorAll(".tile")];
    const rows = Math.max(...tiles.map((tile) => Number(tile.dataset.row))) + 1;
    const cols = Math.max(...tiles.map((tile) => Number(tile.dataset.col))) + 1;
    const board = Array.from({ length: rows }, () => Array(cols).fill(null));
    tiles.forEach((tile) => {
      if (!tile.classList.contains("empty")) {
        board[Number(tile.dataset.row)][Number(tile.dataset.col)] = tile.dataset.tile;
      }
    });
    return module.findAvailablePair(board);
  });

  if (!pair) throw new Error("Could not find a valid pair for link capture.");
  await clickTile(page, pair.from);
  await clickTile(page, pair.to);
  await page.waitForSelector(".link-layer path.link-core", { state: "attached", timeout: 1000 });
  const oldPolylineCount = await page.locator(".link-layer polyline").count();
  if (oldPolylineCount > 0) {
    throw new Error("Expected rounded path link, but old polyline link was rendered.");
  }
  await page.screenshot({ path: join(outputDir, "link-line-mobile.png"), fullPage: true });
  await page.waitForTimeout(340);
}

async function exhaustTool(page, selector) {
  let guard = 0;
  while (true) {
    const count = await page.locator(selector).locator(".tool-count").innerText();
    if (Number(count) <= 0) return;
    await page.locator(selector).click();
    await page.waitForTimeout(700);
    guard += 1;
    if (guard > 8) {
      throw new Error(`Expected ${selector} count to deplete, still got ${count} after ${guard} clicks.`);
    }
  }
}

async function expectToolAdButtonMatchesRewardedFlow(page, toolKind, options = {}) {
  const countSelector = toolKind === "shuffle" ? "#shuffleCount" : "#hintCount";
  const expectedPlacement = toolKind === "shuffle" ? "tool_shuffle" : "tool_hint";
  const expectedRewardCopy = toolKind === "shuffle" ? "获得洗牌 +1" : "获得提示 +1";
  const expectedIncompleteCopy = toolKind === "shuffle" ? "广告没看完，无法获得洗牌" : "广告没看完，无法获得提示";

  if (!options.skipIncompleteCheck) {
    await page.evaluate(() => {
      window.__lastRewardedPlacement = "";
      window.__linkMatchRewardedAd = async ({ placement }) => {
        window.__lastRewardedPlacement = placement;
        return { completed: false };
      };
    });
    await page.locator("#watchAdButton").click();
    await page.waitForFunction(
      (copy) => document.querySelector("#toast.show")?.textContent.includes(copy),
      expectedIncompleteCopy,
    );
    const failedAdState = await page.evaluate((selector) => ({
      placement: window.__lastRewardedPlacement,
      modalOpen: !document.querySelector("#toolModal")?.classList.contains("hidden"),
      count: document.querySelector(selector)?.textContent?.trim() ?? "",
    }), countSelector);
    if (failedAdState.placement !== expectedPlacement || !failedAdState.modalOpen || failedAdState.count !== "0") {
      throw new Error(`Expected incomplete ${toolKind} tool ad to keep modal open without reward, got ${JSON.stringify(failedAdState)}.`);
    }
  }

  await page.evaluate(() => {
    window.__lastRewardedPlacement = "";
    window.__linkMatchRewardedAd = async ({ placement }) => {
      window.__lastRewardedPlacement = placement;
      return true;
    };
  });
  await page.locator("#watchAdButton").click();
  await page.waitForFunction(
    (copy) => document.querySelector("#toast.show")?.textContent.includes(copy),
    expectedRewardCopy,
  );
  const rewardedAdState = await page.evaluate((selector) => ({
    placement: window.__lastRewardedPlacement,
    modalOpen: !document.querySelector("#toolModal")?.classList.contains("hidden"),
    count: document.querySelector(selector)?.textContent?.trim() ?? "",
  }), countSelector);
  if (rewardedAdState.placement !== expectedPlacement || rewardedAdState.modalOpen || rewardedAdState.count !== "1") {
    throw new Error(`Expected completed ${toolKind} tool ad to grant one use and close modal, got ${JSON.stringify(rewardedAdState)}.`);
  }
}

async function expectOwnedShuffleAnimatesBoard(page) {
  const beforeState = await page.evaluate(() => ({
    count: document.querySelector("#shuffleCount")?.textContent?.trim() ?? "",
    board: [...document.querySelectorAll("#board .tile")].map((tile) => tile.dataset.tile ?? "").join("|"),
  }));
  if (beforeState.count !== "1") {
    throw new Error(`Expected one owned shuffle before animation test, got ${JSON.stringify(beforeState)}.`);
  }

  await page.evaluate(() => {
    window.__linkMatchShuffleRerenderState = null;
    window.__linkMatchOriginalAppend = Element.prototype.append;
    Element.prototype.append = function (...nodes) {
      if (this?.id === "board" && !window.__linkMatchShuffleRerenderState) {
        window.__linkMatchShuffleRerenderState = {
          rerenderedWhileShuffling: this.classList.contains("is-shuffling"),
          tileCount: this.querySelectorAll(".tile").length + nodes.length,
        };
      }
      return window.__linkMatchOriginalAppend.apply(this, nodes);
    };
    const board = document.querySelector("#board");
    const observer = new MutationObserver((mutations) => {
      if (!mutations.some((mutation) => mutation.type === "childList")) return;
      if (window.__linkMatchShuffleRerenderState) {
        observer.disconnect();
        return;
      }
      window.__linkMatchShuffleRerenderState = {
        rerenderedWhileShuffling: board.classList.contains("is-shuffling"),
        tileCount: board.querySelectorAll(".tile").length,
      };
      observer.disconnect();
    });
    observer.observe(board, { childList: true });
  });

  await page.locator("#shuffleButton").click();
  await page.waitForSelector("#board.is-shuffling", { timeout: 400 });
  const animatingState = await page.evaluate(() => ({
    buttonDisabled: document.querySelector("#shuffleButton")?.disabled === true,
    count: document.querySelector("#shuffleCount")?.textContent?.trim() ?? "",
    board: [...document.querySelectorAll("#board .tile")].map((tile) => tile.dataset.tile ?? "").join("|"),
    boardAnimationName: getComputedStyle(document.querySelector("#board")).animationName,
    maxScatter: Math.max(
      ...[...document.querySelectorAll("#board .tile:not(.empty)")].map((tile) => {
        const style = getComputedStyle(tile);
        const x = Number.parseFloat(style.getPropertyValue("--shuffle-x")) || 0;
        const y = Number.parseFloat(style.getPropertyValue("--shuffle-y")) || 0;
        return Math.hypot(x, y);
      }),
    ),
  }));
  if (
    !animatingState.buttonDisabled ||
    animatingState.count !== "0" ||
    animatingState.board !== beforeState.board ||
    animatingState.boardAnimationName !== "none" ||
    animatingState.maxScatter < 45
  ) {
    throw new Error(`Expected shuffle to animate before rerendering board, got ${JSON.stringify(animatingState)}.`);
  }

  await page.waitForFunction((oldBoard) => {
    const boardNode = document.querySelector("#board");
    const currentBoard = [...document.querySelectorAll("#board .tile")].map((tile) => tile.dataset.tile ?? "").join("|");
    return boardNode?.classList.contains("is-shuffling") && currentBoard !== oldBoard;
  }, beforeState.board, { timeout: 900 });
  const swappedDuringAnimationState = await page.evaluate(() => ({
    board: [...document.querySelectorAll("#board .tile")].map((tile) => tile.dataset.tile ?? "").join("|"),
    shuffling: document.querySelector("#board")?.classList.contains("is-shuffling") === true,
    settling: document.querySelector("#board")?.classList.contains("is-shuffle-settling") === true,
  }));
  if (!swappedDuringAnimationState.shuffling || !swappedDuringAnimationState.settling) {
    throw new Error(`Expected new board to appear during the shuffle animation, got ${JSON.stringify(swappedDuringAnimationState)}.`);
  }

  await page.waitForSelector("#board.is-shuffling", { state: "detached", timeout: 1200 });
  const afterState = await page.evaluate(() => ({
    buttonDisabled: document.querySelector("#shuffleButton")?.disabled === true,
    count: document.querySelector("#shuffleCount")?.textContent?.trim() ?? "",
    board: [...document.querySelectorAll("#board .tile")].map((tile) => tile.dataset.tile ?? "").join("|"),
    rerenderState: window.__linkMatchShuffleRerenderState,
  }));
  await page.evaluate(() => {
    if (window.__linkMatchOriginalAppend) {
      Element.prototype.append = window.__linkMatchOriginalAppend;
      delete window.__linkMatchOriginalAppend;
    }
  });
  if (
    afterState.buttonDisabled ||
    afterState.count !== "0" ||
    afterState.board === beforeState.board ||
    afterState.board !== swappedDuringAnimationState.board ||
    afterState.rerenderState?.rerenderedWhileShuffling !== true
  ) {
    throw new Error(`Expected shuffle animation to finish with a new board, got ${JSON.stringify(afterState)}.`);
  }
}

async function expectZeroToolCounts(page) {
  const counts = await page.locator(".screen-game.active .tool-count").evaluateAll((nodes) =>
    nodes.map((node) => node.textContent?.trim() ?? ""),
  );
  if (counts.length !== 2 || counts.some((count) => count !== "0")) {
    throw new Error(`Expected hint and shuffle tools to show zero counts, got ${JSON.stringify(counts)}.`);
  }
}

async function expectVersionedAllDataReset(page) {
  await page.evaluate(() => {
    localStorage.setItem("lianliankan.dataResetVersion", "old-version-before-all-data-reset");
    localStorage.setItem(
      "lianliankan.progress",
      JSON.stringify({
        highestUnlockedLevel: 38,
        coins: 512,
        playerName: "Old",
        records: {
          1: { completed: true, bestScore: 1200, bestStars: 3 },
        },
      }),
    );
    localStorage.setItem(
      "lianliankan.stamina",
      JSON.stringify({ stamina: 9, updatedAt: Date.now(), adClaims: 2 }),
    );
  });
  await page.reload({ waitUntil: "networkidle" });

  const resetData = await page.evaluate(() => ({
    coinText: document.querySelector("#coinText")?.textContent?.trim() ?? "",
    progress: JSON.parse(localStorage.getItem("lianliankan.progress") ?? "{}"),
    stamina: JSON.parse(localStorage.getItem("lianliankan.stamina") ?? "{}"),
    staminaText: document.querySelector(".screen-start .staminaText")?.textContent?.trim() ?? "",
    version: localStorage.getItem("lianliankan.dataResetVersion"),
  }));
  if (
    resetData.version !== CURRENT_DATA_RESET_VERSION ||
    resetData.progress.highestUnlockedLevel !== 1 ||
    resetData.progress.coins !== 0 ||
    Object.keys(resetData.progress.records ?? {}).length !== 0 ||
    resetData.stamina.stamina !== fullStamina ||
    resetData.staminaText !== `${fullStamina}/${fullStamina}` ||
    resetData.coinText !== "0"
  ) {
    throw new Error(`Expected old persisted data to reset on launch, got ${JSON.stringify(resetData)}.`);
  }
}

async function seedPlayableFreshState(page, stamina = fullStamina, highestUnlockedLevel = 1) {
  await page.evaluate(({ nextStamina, resetVersion, nextLevel }) => {
    localStorage.setItem("lianliankan.dataResetVersion", resetVersion);
    localStorage.setItem(
      "lianliankan.progress",
      JSON.stringify({ highestUnlockedLevel: nextLevel, coins: 0, records: {} }),
    );
    localStorage.setItem(
      "lianliankan.stamina",
      JSON.stringify({ stamina: nextStamina, updatedAt: Date.now(), adClaims: 0 }),
    );
  }, { nextStamina: stamina, resetVersion: CURRENT_DATA_RESET_VERSION, nextLevel: highestUnlockedLevel });
  await page.reload({ waitUntil: "networkidle" });
}

async function seedProfileThreeStarState(page) {
  await page.evaluate(({ nextStamina, resetVersion }) => {
    localStorage.setItem("lianliankan.dataResetVersion", resetVersion);
    localStorage.setItem(
      "lianliankan.progress",
      JSON.stringify({
        highestUnlockedLevel: 4,
        coins: 86,
        records: {
          1: { completed: true, bestScore: 1200, bestStars: 3 },
          2: { completed: true, bestScore: 900, bestStars: 2 },
          3: { completed: true, bestScore: 1500, bestStars: 1 },
        },
      }),
    );
    localStorage.setItem(
      "lianliankan.stamina",
      JSON.stringify({ stamina: nextStamina, updatedAt: Date.now(), adClaims: 0 }),
    );
  }, { nextStamina: fullStamina, resetVersion: CURRENT_DATA_RESET_VERSION });
  await page.reload({ waitUntil: "networkidle" });
}

async function expectPolishedGameUi(page) {
  const hudIconCount = await page.locator(".screen-game.active .hud-icon").count();
  if (hudIconCount < 4) {
    throw new Error(`Expected each HUD metric to have an icon, got ${hudIconCount}.`);
  }
  const hudTitleRowCount = await page.locator(".screen-game.active .hud-title-row").count();
  if (hudTitleRowCount !== 4) {
    throw new Error(`Expected each HUD metric to use a centered icon+label title row, got ${hudTitleRowCount}.`);
  }

  const toolButtons = page.locator(".screen-game.active .tool-button");
  const toolButtonCount = await toolButtons.count();
  if (toolButtonCount !== 3) {
    throw new Error(`Expected 3 tool buttons, got ${toolButtonCount}.`);
  }

  for (let index = 0; index < toolButtonCount; index += 1) {
    const button = toolButtons.nth(index);
    const iconCount = await button.locator(".tool-art").count();
    const labelCount = await button.locator(".tool-label").count();
    if (iconCount !== 1 || labelCount !== 1) {
      throw new Error(`Expected tool button ${index + 1} to include one icon and one label.`);
    }
  }

  const toolbarSeparators = await page.locator(".screen-game.active .toolbar").evaluate((node) => {
    const before = getComputedStyle(node, "::before");
    const after = getComputedStyle(node, "::after");
    return {
      beforeContent: before.content,
      beforeDisplay: before.display,
      afterContent: after.content,
      afterDisplay: after.display,
    };
  });
  const toolbarGeometry = await page.locator(".screen-game.active .toolbar").evaluate((node) => {
    const box = node.getBoundingClientRect();
    const screen = node.closest(".screen-game")?.getBoundingClientRect();
    const style = getComputedStyle(node);
    return {
      bottomGap: Math.round((screen?.bottom ?? window.innerHeight) - box.bottom),
      visualHeight: Math.round(box.height),
      visualWidth: Math.round(box.width),
      position: style.position,
    };
  });
  const boardCentering = await page.locator(".screen-game.active .board-wrap").evaluate((node) => {
    const boardBox = node.getBoundingClientRect();
    const screen = node.closest(".screen-game");
    const topPanel = screen?.querySelector(".top-panel")?.getBoundingClientRect();
    const toolbar = screen?.querySelector(".toolbar")?.getBoundingClientRect();
    const availableCenter = ((topPanel?.bottom ?? 0) + (toolbar?.top ?? window.innerHeight)) / 2;
    const boardCenter = (boardBox.top + boardBox.bottom) / 2;
    return {
      centerDelta: Math.round(boardCenter - availableCenter),
      gapBelow: Math.round((toolbar?.top ?? 0) - boardBox.bottom),
      gapAbove: Math.round(boardBox.top - (topPanel?.bottom ?? 0)),
      widthDelta: Math.round(Math.abs((topPanel?.width ?? 0) - boardBox.width)),
    };
  });
  if (
    toolbarSeparators.beforeDisplay !== "none" ||
    toolbarSeparators.afterDisplay !== "none" ||
    toolbarSeparators.beforeContent !== "none" ||
    toolbarSeparators.afterContent !== "none"
  ) {
    throw new Error(`Expected toolbar dotted separators to be removed, got ${JSON.stringify(toolbarSeparators)}.`);
  }
  if (toolbarGeometry.position !== "absolute" || Math.abs(toolbarGeometry.bottomGap - 50) > 2) {
    throw new Error(`Expected toolbar to be fixed 50px above game screen bottom, got ${JSON.stringify(toolbarGeometry)}.`);
  }
  if (toolbarGeometry.visualWidth > 276 || toolbarGeometry.visualHeight > 101) {
    throw new Error(`Expected toolbar to be visually scaled down by about 20%, got ${JSON.stringify(toolbarGeometry)}.`);
  }
  if (
    Math.abs(boardCentering.centerDelta) > 10 ||
    boardCentering.gapAbove < 0 ||
    boardCentering.gapBelow < 0 ||
    boardCentering.widthDelta > 2
  ) {
    throw new Error(`Expected board frame to be centered between HUD and toolbar, got ${JSON.stringify(boardCentering)}.`);
  }
}

async function expectCompactGameViewportFits(page) {
  const baseViewport = { width: 390, height: 844 };
  await page.setViewportSize({ width: 390, height: 700 });
  await page.waitForTimeout(100);

  const compactGeometry = await page.locator(".screen-game.active .board-wrap").evaluate((node) => {
    const boardBox = node.getBoundingClientRect();
    const screen = node.closest(".screen-game");
    const topPanel = screen?.querySelector(".top-panel")?.getBoundingClientRect();
    const toolbar = screen?.querySelector(".toolbar")?.getBoundingClientRect();
    return {
      topPanelBottom: Math.round(topPanel?.bottom ?? 0),
      boardTop: Math.round(boardBox.top),
      boardBottom: Math.round(boardBox.bottom),
      toolbarTop: Math.round(toolbar?.top ?? 0),
      toolbarBottom: Math.round(toolbar?.bottom ?? 0),
      gapAbove: Math.round(boardBox.top - (topPanel?.bottom ?? 0)),
      gapBelow: Math.round((toolbar?.top ?? 0) - boardBox.bottom),
      gapDelta: Math.round(Math.abs((toolbar?.top ?? 0) - boardBox.bottom - (boardBox.top - (topPanel?.bottom ?? 0)))),
      widthDelta: Math.round(Math.abs((topPanel?.width ?? 0) - boardBox.width)),
      viewportHeight: window.innerHeight,
      visualViewportHeight: Math.round(window.visualViewport?.height ?? window.innerHeight),
    };
  });

  await page.setViewportSize(baseViewport);
  await page.waitForTimeout(100);

  if (
    compactGeometry.gapAbove < 0 ||
    compactGeometry.gapBelow < 0 ||
    compactGeometry.gapDelta > 12 ||
    compactGeometry.widthDelta > 2
  ) {
    throw new Error(
      `Expected compact real-device game viewport to keep the board aligned and centered, got ${JSON.stringify(
        compactGeometry,
      )}.`,
    );
  }
}

async function expectBoardTiersUseEasyLayout(page) {
  const baseViewport = { width: 390, height: 844 };
  await page.setViewportSize(baseViewport);
  const geometries = [];

  for (const levelNumber of [1, 11, 21]) {
    await seedPlayableFreshState(page, fullStamina, levelNumber);
    await page.locator("#startButton").click();
    await page.waitForSelector(".screen-game.active .tile:not(.empty)");
    geometries.push(await readGameBoardGeometry(page, levelNumber));
  }

  const [easy, normal, hard] = geometries;
  const overlapping = geometries.find((item) => item.gapBelow < 0 || item.boardBottom > item.toolbarTop);
  if (overlapping) {
    throw new Error(`Expected every board tier to stay above the toolbar, got ${JSON.stringify(geometries)}.`);
  }
  const movedOrResizedFrame = geometries.find(
    (item) =>
      Math.abs(item.wrapWidth - easy.wrapWidth) > 2 ||
      Math.abs(item.boardHeight - easy.boardHeight) > 2,
  );
  if (movedOrResizedFrame) {
    throw new Error(`Expected every board tier to keep the easy game-area size, got ${JSON.stringify(geometries)}.`);
  }
  const resizedTile = geometries.find(
    (item) =>
      Math.abs(item.tileWidth - easy.tileWidth) > 2 ||
      Math.abs(item.tileHeight - easy.tileHeight) > 2 ||
      Math.abs(item.boardWidth - easy.boardWidth) > 2,
  );
  if (resizedTile) {
    throw new Error(`Expected every board tier to keep the easy tile size, got ${JSON.stringify(geometries)}.`);
  }
  const looseGap = geometries.find(
    (item) =>
      Math.abs(item.horizontalGap - 4) > 1 ||
      Math.abs(item.verticalGap - 4) > 1 ||
      Math.abs(item.horizontalGap - easy.horizontalGap) > 1 ||
      Math.abs(item.verticalGap - easy.verticalGap) > 1,
  );
  if (looseGap) {
    throw new Error(`Expected every board tier to keep 4px visual tile gaps, got ${JSON.stringify(geometries)}.`);
  }
  const deformedTile = geometries.find((item) => item.tileWidth <= 0 || item.tileHeight <= 0 || item.tileAspect > 1.04);
  if (deformedTile) {
    throw new Error(`Expected every board tier to keep square tiles, got ${JSON.stringify(geometries)}.`);
  }
  const mismatchedArtRatio = geometries.find((item) => Math.abs(item.artRatio - easy.artRatio) > 0.05);
  if (mismatchedArtRatio) {
    throw new Error(`Expected every board tier to keep the same fruit-art proportion as easy tiles, got ${JSON.stringify(geometries)}.`);
  }

  await seedPlayableFreshState(page);
  await page.locator("#startButton").click();
  await page.waitForSelector(".screen-game.active .tile:not(.empty)");
}

async function readGameBoardGeometry(page, levelNumber) {
  return page.locator(".screen-game.active .board-wrap").evaluate((node, currentLevelNumber) => {
    const wrap = node.getBoundingClientRect();
    const board = node.querySelector(".board")?.getBoundingClientRect();
    const style = getComputedStyle(node);
    const borderLeft = Number.parseFloat(style.borderLeftWidth);
    const borderRight = Number.parseFloat(style.borderRightWidth);
    const paddingLeft = Number.parseFloat(style.paddingLeft);
    const paddingRight = Number.parseFloat(style.paddingRight);
    const tiles = [...node.querySelectorAll(".tile:not(.empty)")].map((tileNode) => ({
      row: Number(tileNode.dataset.row),
      col: Number(tileNode.dataset.col),
      box: tileNode.getBoundingClientRect(),
    }));
    const tile = tiles.find((item) => item.row === 0 && item.col === 0)?.box ?? tiles[0]?.box;
    const rightNeighbor = tiles.find((item) => item.row === 0 && item.col === 1)?.box;
    const bottomNeighbor = tiles.find((item) => item.row === 1 && item.col === 0)?.box;
    const art = node.querySelector(".tile:not(.empty) .tile-art")?.getBoundingClientRect();
    const screen = node.closest(".screen-game");
    const toolbar = screen?.querySelector(".toolbar")?.getBoundingClientRect();
    const tier = screen?.dataset.boardTier ?? "";
    return {
      levelNumber: currentLevelNumber,
      tier,
      boardTop: Math.round(wrap.top),
      boardBottom: Math.round(wrap.bottom),
      toolbarTop: Math.round(toolbar?.top ?? 0),
      toolbarHeight: Math.round(toolbar?.height ?? 0),
      gapBelow: Math.round((toolbar?.top ?? 0) - wrap.bottom),
      leftInset: Math.round((board?.left ?? 0) - wrap.left),
      rightInset: Math.round(wrap.right - (board?.right ?? 0)),
      expectedInsetLeft: Math.round(borderLeft + paddingLeft),
      expectedInsetRight: Math.round(borderRight + paddingRight),
      wrapWidth: Math.round(wrap.width),
      tileWidth: Math.round(tile?.width ?? 0),
      tileHeight: Math.round(tile?.height ?? 0),
      horizontalGap: Math.round(rightNeighbor && tile ? rightNeighbor.left - tile.right : 0),
      verticalGap: Math.round(bottomNeighbor && tile ? bottomNeighbor.top - tile.bottom : 0),
      tileAspect: tile ? Number((Math.max(tile.width / tile.height, tile.height / tile.width)).toFixed(3)) : 0,
      artRatio: tile && art ? Number((Math.max(art.width / tile.width, art.height / tile.height)).toFixed(3)) : 0,
      boardWidth: Math.round(board?.width ?? 0),
      boardHeight: Math.round(board?.height ?? 0),
    };
  }, levelNumber);
}

async function expectBoardGridFillsFrame(page) {
  const fill = await page.locator(".screen-game.active .board-wrap").evaluate((node) => {
    const wrap = node.getBoundingClientRect();
    const board = node.querySelector(".board")?.getBoundingClientRect();
    const style = getComputedStyle(node);
    if (!board) return null;
    return {
      topInset: Math.round(board.top - wrap.top),
      rightInset: Math.round(wrap.right - board.right),
      bottomInset: Math.round(wrap.bottom - board.bottom),
      leftInset: Math.round(board.left - wrap.left),
      paddingTop: Math.round(Number.parseFloat(style.paddingTop)),
      paddingRight: Math.round(Number.parseFloat(style.paddingRight)),
      paddingBottom: Math.round(Number.parseFloat(style.paddingBottom)),
      paddingLeft: Math.round(Number.parseFloat(style.paddingLeft)),
      widthRatio: Number((board.width / wrap.width).toFixed(3)),
    };
  });

  if (!fill) throw new Error("Could not measure board grid fill.");
  if (
    fill.topInset > 24 ||
    fill.bottomInset > 24 ||
    fill.leftInset > 24 ||
    fill.rightInset > 24 ||
    fill.widthRatio < 0.92
  ) {
    throw new Error(`Expected board tiles to fill the board frame without large blank insets, got ${JSON.stringify(fill)}.`);
  }
}

async function getBoardAndFirstTileBox(page) {
  return page.evaluate(() => {
    const board = document.querySelector(".screen-game.active .board")?.getBoundingClientRect();
    const tile = document.querySelector(".screen-game.active .tile:not(.empty)")?.getBoundingClientRect();
    if (!board || !tile) return null;
    return {
      board: { top: board.top, right: board.right, bottom: board.bottom, left: board.left },
      tile: { top: tile.top, right: tile.right, bottom: tile.bottom, left: tile.left },
    };
  });
}

async function expectToastOverlaysBoardWithoutMovingTiles(page, before) {
  const boxes = await page.evaluate(() => {
    const toast = document.querySelector(".screen-game.active .toast.show")?.getBoundingClientRect();
    const board = document.querySelector(".screen-game.active .board")?.getBoundingClientRect();
    const tile = document.querySelector(".screen-game.active .tile:not(.empty)")?.getBoundingClientRect();
    const toastNode = document.querySelector(".screen-game.active .toast.show");
    const boardNode = document.querySelector(".screen-game.active .board");
    if (!toast || !board || !tile || !toastNode || !boardNode) return null;
    return {
      toast: { top: toast.top, right: toast.right, bottom: toast.bottom, left: toast.left },
      board: { top: board.top, right: board.right, bottom: board.bottom, left: board.left },
      tile: { top: tile.top, right: tile.right, bottom: tile.bottom, left: tile.left },
      toastZIndex: Number.parseInt(getComputedStyle(toastNode).zIndex, 10),
      boardZIndex: Number.parseInt(getComputedStyle(boardNode).zIndex, 10),
    };
  });
  if (!before || !boxes) throw new Error("Could not measure toast, board and tile bounds.");
  const overlaps =
    boxes.toast.left < boxes.board.right &&
    boxes.toast.right > boxes.board.left &&
    boxes.toast.top < boxes.board.bottom &&
    boxes.toast.bottom > boxes.board.top;
  const boardMoved = Math.abs(boxes.board.top - before.board.top) > 1 || Math.abs(boxes.board.bottom - before.board.bottom) > 1;
  const tileMoved = Math.abs(boxes.tile.top - before.tile.top) > 1 || Math.abs(boxes.tile.bottom - before.tile.bottom) > 1;
  if (!overlaps || boardMoved || tileMoved || boxes.toastZIndex <= boxes.boardZIndex) {
    throw new Error(
      `Expected toast to overlay the board without pushing tiles down, before=${JSON.stringify(before)}, after=${JSON.stringify(boxes)}.`,
    );
  }
}

async function expectFlatImageAssets(page) {
  const imageSources = await page
    .locator(
      ".screen-game.active .hud-icon, .screen-game.active .tool-art, .screen-game.active .home-art",
    )
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("src") ?? ""));
  const badSource = imageSources.find((source) => !source.includes("./assets/image/"));
  if (badSource) {
    throw new Error(`Expected game UI to use flat assets/image files, got ${badSource}.`);
  }

  const bannerBackground = await page
    .locator(".screen-game.active .stage-banner")
    .evaluate((node) => getComputedStyle(node).backgroundImage);
  if (!bannerBackground.includes("assets/image/title-plaque.png")) {
    throw new Error(`Expected stage banner to use flat title-plaque.png, got ${bannerBackground}.`);
  }
}

async function expectDraftThreeVisualSystem(page) {
  const visualShell = await page.locator(".screen-game.active.draft-three-shell").count();
  const organicHud = await page.locator(".screen-game.active .organic-hud-frame").count();
  const glassBoard = await page.locator(".screen-game.active .glass-board-frame").count();
  const creamToolbar = await page.locator(".screen-game.active .cream-tool-tray").count();

  if (visualShell !== 1 || organicHud !== 1 || glassBoard !== 1 || creamToolbar !== 1) {
    throw new Error(
      `Expected draft-03 visual structure, got shell=${visualShell}, hud=${organicHud}, board=${glassBoard}, toolbar=${creamToolbar}.`,
    );
  }
}

async function expectModalHasIcon(page, selector) {
  const modalIconCount = await page.locator(`${selector}:not(.hidden) .modal-icon`).count();
  if (modalIconCount !== 1) {
    throw new Error(`Expected ${selector} to render one modal icon, got ${modalIconCount}.`);
  }
}

async function expectMobileModalDesignSystem(page, selector) {
  const cardCount = await page.locator(`${selector}:not(.hidden) .candy-modal-card`).count();
  const plaqueCount = await page.locator(`${selector}:not(.hidden) .modal-plaque`).count();
  const iconSources = await page
    .locator(`${selector}:not(.hidden) .modal-icon-art`)
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("src") ?? ""));
  const plaqueLabelText = await page.locator(`${selector}:not(.hidden) .plaque-level-label`).innerText();
  const plaqueDecorCount = await page.locator(`${selector}:not(.hidden) .modal-plaque .icon-decor-art`).count();
  const cardBackground = await page
    .locator(`${selector}:not(.hidden) .candy-modal-card`)
    .evaluate((node) => getComputedStyle(node).backgroundImage);
  const geometry = await page.locator(`${selector}:not(.hidden) .candy-modal-card`).evaluate((card) => {
    const plaque = card.querySelector(".modal-plaque")?.getBoundingClientRect();
    const cardBox = card.getBoundingClientRect();
    return {
      cardTop: cardBox.top,
      plaqueBottom: plaque?.bottom ?? 0,
      plaqueTop: plaque?.top ?? 0,
    };
  });

  if (cardCount !== 1 || plaqueCount !== 1) {
    throw new Error(`Expected ${selector} to use candy mobile modal structure, got card=${cardCount}, plaque=${plaqueCount}.`);
  }
  if (iconSources.length !== 1 || iconSources.some((source) => !source.includes("./assets/image/"))) {
    throw new Error(`Expected ${selector} icon to use one flat assets/image file, got: ${iconSources.join(", ")}`);
  }
  if (!/^第\d{2}关$/.test(plaqueLabelText) || plaqueDecorCount !== 0) {
    throw new Error(
      `Expected ${selector} title plaque to show level text without star decorators, got label=${plaqueLabelText}, decor=${plaqueDecorCount}.`,
    );
  }
  if (!cardBackground.includes("assets/image/modal-card-bg.png")) {
    throw new Error(`Expected ${selector} card background to use modal-card-bg.png, got: ${cardBackground}`);
  }
  if (
    geometry.plaqueTop > geometry.cardTop - 24 ||
    geometry.plaqueTop < geometry.cardTop - 54 ||
    geometry.plaqueBottom < geometry.cardTop + 24 ||
    geometry.plaqueBottom > geometry.cardTop + 54
  ) {
    throw new Error(`Expected ${selector} title plaque to straddle the card top edge, got ${JSON.stringify(geometry)}.`);
  }
  await expectDesignedUiCutButtons(page, `${selector}:not(.hidden) .modal-actions button`);
}

async function expectModalIconAsset(page, selector, fileName) {
  const iconData = await page.locator(`${selector}:not(.hidden) .modal-icon-art`).evaluate((node) => {
    const rect = node.getBoundingClientRect();
    return {
      tagName: node.tagName,
      src: node.getAttribute("src") ?? "",
      width: rect.width,
      height: rect.height,
    };
  });
  if (iconData.tagName !== "IMG" || !iconData.src.includes(fileName) || iconData.width < 100 || iconData.height < 100) {
    throw new Error(`Expected ${selector} to use ${fileName} as a sliced image icon, got ${JSON.stringify(iconData)}.`);
  }
}

async function expectHomeRoadMap(page) {
  await page.waitForSelector(".screen-start.active .road-level", { timeout: 2000 });
  const chapterTabCount = await page.locator(".screen-start.active .chapter-tab").count();
  const bottomTabCount = await page.locator(".screen-start.active .bottom-tab").count();
  const visibleRoadLevelCount = await page.locator(".screen-start.active .road-level").count();
  const currentLevelText = await page.locator(".screen-start.active .road-level.current").innerText();
  const lockedCount = await page.locator(".screen-start.active .road-level.locked").count();
  const availableCount = await page.locator(".screen-start.active .road-level.available").count();
  const continueText = await page.locator("#startButton").innerText();
  const clearButtonCount = await page.locator("#clearProgressButton").count();
  const homeTitleCount = await page.locator(".screen-start.active .home-brand h1, .screen-start.active .home-brand .eyebrow").count();
  const homeStaminaButtonCount = await page.locator(".screen-start.active .getStaminaButton").count();
  const homeStatLabelCount = await page.locator(".screen-start.active .home-stat-label").count();
  const homeStatSmallCount = await page.locator(".screen-start.active .home-stat small").count();
  const homeExchangeEntryCount = await page.locator("#homeExchangeButton").count();
  const coinExchangeTagName = await page.locator("#coinExchangeButton").evaluate((node) => node.tagName);
  const scrollInfo = await page.locator("#roadScroll").evaluate((node) => ({
    clientHeight: node.clientHeight,
    scrollHeight: node.scrollHeight,
  }));
  const layoutInfo = await page.evaluate(() => {
    const startButton = document.querySelector("#startButton");
    const first = document.querySelector('.road-level strong');
    const levelOne = [...document.querySelectorAll(".road-level")].find((node) => node.textContent.includes("01"));
    const levelTwo = [...document.querySelectorAll(".road-level")].find((node) => node.textContent.includes("02"));
    const levelThree = [...document.querySelectorAll(".road-level")].find((node) => node.textContent.includes("03"));
    const levelFour = [...document.querySelectorAll(".road-level")].find((node) => node.textContent.includes("04"));
    const levelThirty = [...document.querySelectorAll(".road-level")].find((node) => node.textContent.includes("30"));
    const chapterSummary = document.querySelector(".chapter-summary");
    const mapPanel = document.querySelector(".map-panel");
    const exchangeEntry = document.querySelector("#homeExchangeButton");
    const prevChapterButton = document.querySelector("#prevChapterButton");
    const roadScroll = document.querySelector("#roadScroll");
    const levelRoad = document.querySelector("#levelRoad");
    const dock = document.querySelector(".home-bottom-dock");
    const appShell = document.querySelector(".app-shell");
    const startButtonStyle = getComputedStyle(startButton);
    const buttonRect = startButton.getBoundingClientRect();
    const summaryRect = chapterSummary.getBoundingClientRect();
    const panelRect = mapPanel.getBoundingClientRect();
    const panelStyle = getComputedStyle(mapPanel);
    const roadScrollStyle = getComputedStyle(roadScroll);
    const levelRoadStyle = getComputedStyle(levelRoad);
    const exchangeEntryRect = exchangeEntry?.getBoundingClientRect();
    const exchangeEntryStyle = exchangeEntry ? getComputedStyle(exchangeEntry) : null;
    const prevChapterButtonRect = prevChapterButton.getBoundingClientRect();
    const lineLayers = [...document.querySelectorAll(".road-path path")].map((node) => node.getAttribute("class"));
    const vineSegmentCount = document.querySelectorAll(".road-vine-image-segment").length;
    const cqwPx = appShell.getBoundingClientRect().width / 100;
    const homeResourceCards = [...document.querySelectorAll(".home-stat")].map((card) => {
      const cardRect = card.getBoundingClientRect();
      const icon = card.querySelector(".home-stat-icon");
      const text = card.querySelector("strong");
      const iconRect = icon.getBoundingClientRect();
      const textRect = text.getBoundingClientRect();
      const textStyle = getComputedStyle(text);
      return {
        textId: text.id,
        cardWidth: cardRect.width,
        cardHeight: cardRect.height,
        iconWidth: iconRect.width,
        iconHeight: iconRect.height,
        iconRight: iconRect.right - cardRect.left,
        iconCenterX: iconRect.left + iconRect.width / 2 - cardRect.left,
        iconCenterY: iconRect.top + iconRect.height / 2 - cardRect.top,
        textLeft: textRect.left - cardRect.left,
        textCenterX: textRect.left + textRect.width / 2 - cardRect.left,
        textCenterY: textRect.top + textRect.height / 2 - cardRect.top,
        textFontSize: Number.parseFloat(textStyle.fontSize),
      };
    });
    const originalScrollTop = roadScroll.scrollTop;
    roadScroll.scrollTop = 0;
    const topLevelToPanelTop = Math.round(levelThirty.getBoundingClientRect().top - panelRect.top);
    roadScroll.scrollTop = originalScrollTop;
    const center = (node) => {
      const rect = node.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    };
    return {
      buttonWidth: buttonRect.width,
      buttonHeight: buttonRect.height,
      buttonRatio: buttonRect.width / buttonRect.height,
      viewportWidth: window.innerWidth,
      buttonBottom: window.innerHeight - buttonRect.bottom,
      levelOneTop: levelOne.getBoundingClientRect().top,
      levelTwoTop: levelTwo.getBoundingClientRect().top,
      titleToPanel: Math.round(panelRect.top - summaryRect.bottom),
      panelToButton: Math.round(buttonRect.top - panelRect.bottom),
      levelOneToPanelBottom: Math.round(panelRect.bottom - levelOne.getBoundingClientRect().bottom),
      topLevelToPanelTop,
      mapPanelMarginTop: Number.parseFloat(panelStyle.marginTop),
      mapPanelBorderRadius: Number.parseFloat(panelStyle.borderTopLeftRadius),
      roadMaskImage: roadScrollStyle.maskImage || roadScrollStyle.webkitMaskImage || "",
      levelRoadPaddingTop: Number.parseFloat(levelRoadStyle.paddingTop),
      levelRoadPaddingBottom: Number.parseFloat(levelRoadStyle.paddingBottom),
      levelCenters: [levelOne, levelTwo, levelThree, levelFour].map(center),
      roadLineLayers: lineLayers,
      vineSegmentCount,
      cqwPx,
      homeResourceCards,
      hasDock: Boolean(dock),
      dockPaddingBottom: dock ? Number.parseFloat(getComputedStyle(dock).paddingBottom) : 0,
      dockTransform: dock ? getComputedStyle(dock).transform : "none",
      buttonDisplay: startButtonStyle.display,
      buttonAlignItems: startButtonStyle.alignItems,
      buttonJustifyItems: startButtonStyle.justifyItems,
      buttonLineHeight: startButtonStyle.lineHeight,
      exchangeEntryHeight: Math.round(exchangeEntryRect?.height ?? 0),
      exchangeEntryAnimationName: exchangeEntryStyle?.animationName ?? "",
      exchangeEntryBackground: exchangeEntryStyle?.backgroundImage ?? "",
      exchangeEntryChildCount: exchangeEntry?.children.length ?? 0,
      exchangeEntryGapBelowLeftArrow: Math.round((exchangeEntryRect?.top ?? 0) - prevChapterButtonRect.bottom),
      exchangeEntryLeftDeltaFromLeftArrow: Math.round((exchangeEntryRect?.left ?? 0) - prevChapterButtonRect.left),
      exchangeEntryLeftToPanel: Math.round((exchangeEntryRect?.left ?? 0) - panelRect.left),
      exchangeEntryTopToPanel: Math.round((exchangeEntryRect?.top ?? 0) - panelRect.top),
      exchangeEntryWidth: Math.round(exchangeEntryRect?.width ?? 0),
      exchangeEntryStyleLeft: Number.parseFloat(exchangeEntryStyle?.left ?? "0"),
      exchangeEntryStyleTop: Number.parseFloat(exchangeEntryStyle?.top ?? "0"),
      exchangeEntryStyleWidth: Number.parseFloat(exchangeEntryStyle?.width ?? "0"),
      firstText: first?.textContent ?? "",
    };
  });

  if (chapterTabCount !== 0) {
    throw new Error(`Expected chapter tabs to be removed, got ${chapterTabCount}.`);
  }
  if (bottomTabCount !== 0) {
    throw new Error(`Expected no bottom tabs, got ${bottomTabCount}.`);
  }
  if (visibleRoadLevelCount !== 30) {
    throw new Error(`Expected current chapter map to render 30 level nodes, got ${visibleRoadLevelCount}.`);
  }
  if (!currentLevelText.includes("01")) {
    throw new Error(`Expected level 01 to be current, got: ${currentLevelText}.`);
  }
  if (lockedCount !== 29 || availableCount !== 0) {
    throw new Error(`Expected formal test mode to lock future levels, got locked=${lockedCount}, available=${availableCount}.`);
  }
  if (!continueText.includes("闯关")) {
    throw new Error(`Expected start button to use start/continue challenge copy, got: ${continueText}.`);
  }
  if (clearButtonCount !== 0) {
    throw new Error(`Expected home screen to hide the clear data test button, got ${clearButtonCount}.`);
  }
  if (homeTitleCount !== 0) {
    throw new Error(`Expected home title text to be removed, got ${homeTitleCount} title nodes.`);
  }
  if (homeStaminaButtonCount !== 0) {
    throw new Error(`Expected home stamina claim button to be removed, got ${homeStaminaButtonCount}.`);
  }
  if (homeStatLabelCount !== 0 || homeStatSmallCount !== 0) {
    throw new Error(`Expected resource cards to omit labels and small countdown text, got labels=${homeStatLabelCount}, small=${homeStatSmallCount}.`);
  }
  const resourceCardMismatch = layoutInfo.homeResourceCards.find((card) => {
    const expectedIconRight = card.cardWidth * 0.4;
    const expectedCoinTextShift = card.textId === "coinText" ? layoutInfo.cqwPx * 3.1282 : 0;
    const expectedTextLeft = card.cardWidth * 0.4 + layoutInfo.cqwPx * 0.7692 + expectedCoinTextShift;
    const expectedCenterY = card.cardHeight / 2;
    const expectedIconSize = layoutInfo.cqwPx * 7.1795;
    const expectedTextSize = layoutInfo.cqwPx * 3.5897;
    return (
      Math.abs(card.iconWidth - expectedIconSize) > 0.75 ||
      Math.abs(card.iconHeight - expectedIconSize) > 0.75 ||
      Math.abs(card.textFontSize - expectedTextSize) > 0.5 ||
      Math.abs(card.iconRight - expectedIconRight) > 1 ||
      Math.abs(card.iconCenterY - expectedCenterY) > 1 ||
      Math.abs(card.textLeft - expectedTextLeft) > 1 ||
      Math.abs(card.textCenterY - expectedCenterY) > 1
    );
  });
  if (layoutInfo.homeResourceCards.length !== 3 || resourceCardMismatch) {
    throw new Error(`Expected compact resource cards to right-align 7.1795cqw icons in the 40% area, left-align 3.5897cqw text with 0.7692cqw margin, and shift #coinText right by 3.1282cqw, got ${JSON.stringify(layoutInfo.homeResourceCards)}.`);
  }
  if (homeExchangeEntryCount !== 1) {
    throw new Error(`Expected a dedicated home exchange shop entry in the map area, got ${homeExchangeEntryCount}.`);
  }
  if (coinExchangeTagName !== "DIV") {
    throw new Error(`Expected top coin resource to be display-only, got tag ${coinExchangeTagName}.`);
  }
  const exchangeEntryStyleTop = Number.parseFloat(layoutInfo.exchangeEntryStyleTop);
  const exchangeEntryStyleLeft = Number.parseFloat(layoutInfo.exchangeEntryStyleLeft);
  const exchangeEntryStyleWidth = Number.parseFloat(layoutInfo.exchangeEntryStyleWidth);
  const dockPaddingBottom = Number.parseFloat(layoutInfo.dockPaddingBottom);
  if (
    !layoutInfo.exchangeEntryBackground.includes("exchange-shop-entry-icon-v1.png") ||
    layoutInfo.exchangeEntryChildCount !== 0 ||
    Math.abs(exchangeEntryStyleTop - 72) > 0.5 ||
    Math.abs(exchangeEntryStyleLeft) > 0.5 ||
    Math.abs(exchangeEntryStyleWidth - 54) > 0.5 ||
    layoutInfo.exchangeEntryAnimationName !== "none"
  ) {
    throw new Error(`Expected exchange shop entry to use the generated icon, proportional position and no animation, got ${JSON.stringify(layoutInfo)}.`);
  }
  if (
    !layoutInfo.hasDock ||
    layoutInfo.buttonWidth < layoutInfo.viewportWidth * 0.7 ||
    Math.abs(layoutInfo.buttonRatio - 1115 / 276) > 0.12 ||
    Math.abs(dockPaddingBottom - 16) > 0.5
  ) {
    throw new Error(`Expected continue button to fill its dock at the source image aspect ratio, got ${JSON.stringify(layoutInfo)}.`);
  }
  if (
    !["grid", "inline-grid"].includes(layoutInfo.buttonDisplay) ||
    layoutInfo.buttonAlignItems !== "center" ||
    layoutInfo.buttonJustifyItems !== "center"
  ) {
    throw new Error(`Expected continue button text to be centered, got ${JSON.stringify(layoutInfo)}.`);
  }
  if (layoutInfo.levelOneTop <= layoutInfo.levelTwoTop) {
    throw new Error(`Expected level 01 to appear below level 02 in bottom-up map, got ${JSON.stringify(layoutInfo)}.`);
  }
  if (
    Math.abs(layoutInfo.titleToPanel - 13) > 1 ||
    layoutInfo.panelToButton < 18 ||
    layoutInfo.panelToButton > 26 ||
    Math.abs(layoutInfo.mapPanelMarginTop - 13) > 1 ||
    layoutInfo.mapPanelBorderRadius !== 0 ||
    !layoutInfo.roadMaskImage.includes("linear-gradient") ||
    !layoutInfo.roadMaskImage.includes("rgba(0, 0, 0, 0)") ||
    Math.abs(layoutInfo.levelRoadPaddingTop - 34) > 1 ||
    Math.abs(layoutInfo.levelRoadPaddingBottom - 58) > 1 ||
    !layoutInfo.dockTransform.includes("matrix")
  ) {
    throw new Error(`Expected road map to use the airy 05 layout with subtle top/bottom fade and extra road breathing room, got ${JSON.stringify(layoutInfo)}.`);
  }
  if (layoutInfo.levelOneToPanelBottom < -2 || layoutInfo.levelOneToPanelBottom > 8) {
    throw new Error(`Expected level 01 to stay aligned to the road edge while the mask softens the clipping, got ${JSON.stringify(layoutInfo)}.`);
  }
  if (layoutInfo.topLevelToPanelTop < 0 || layoutInfo.topLevelToPanelTop > 4) {
    throw new Error(`Expected level 30 to stay aligned to the road edge while the mask softens the clipping, got ${JSON.stringify(layoutInfo)}.`);
  }
  if (
    layoutInfo.levelCenters.length !== 4 ||
    !(layoutInfo.levelCenters[0].x < layoutInfo.levelCenters[1].x) ||
    !(layoutInfo.levelCenters[1].x > layoutInfo.levelCenters[2].x) ||
    !(layoutInfo.levelCenters[2].x < layoutInfo.levelCenters[3].x)
  ) {
    throw new Error(`Expected road levels to alternate left/right lanes, got ${JSON.stringify(layoutInfo)}.`);
  }
  if (layoutInfo.vineSegmentCount !== 29) {
    throw new Error(`Expected fruit forest road to render 29 image-based vine segments, got ${JSON.stringify(layoutInfo)}.`);
  }
  if (scrollInfo.scrollHeight <= scrollInfo.clientHeight) {
    throw new Error(`Expected road map to scroll vertically, got ${JSON.stringify(scrollInfo)}.`);
  }
  await expectHomeChapterArrowsCycle(page);
  await expectGeneratedNodeRoadAssetSystem(page, {
    themeId: "fruit-forest",
    firstLevelText: "01",
    connectorSelector: ".road-vine-image-segment",
    connectorAsset: "road-vine-connector.png",
    lockedCount: 29,
  });
  await expectHomeUsesUiHomeAssets(page);
}

async function expectHomeScalesWithViewportWidth(page) {
  const baseViewport = { width: 390, height: 844 };
  const smallViewports = [
    { width: 360, height: 780 },
    { width: 320, height: 720 },
  ];
  const collect = async () =>
    page.evaluate(() => {
      const rectOf = (selector) => {
        const rect = document.querySelector(selector)?.getBoundingClientRect();
        return { width: rect?.width ?? 0, height: rect?.height ?? 0 };
      };
      const fontSizeOf = (selector) => Number.parseFloat(getComputedStyle(document.querySelector(selector)).fontSize);
      const currentLevel = document.querySelector(".road-level.current") ?? document.querySelector(".road-level");
      const currentRect = currentLevel.getBoundingClientRect();
      const levelRoadRect = document.querySelector("#levelRoad").getBoundingClientRect();
      return {
        viewportWidth: window.innerWidth,
        menuButton: rectOf(".round-menu-button"),
        statIcon: rectOf(".home-stat-icon"),
        chapterArrow: rectOf(".chapter-arrow"),
        exchangeEntry: rectOf("#homeExchangeButton"),
        currentLevel: { width: currentRect.width, height: currentRect.height, top: Number.parseFloat(currentLevel.style.top) },
        levelRoadHeight: levelRoadRect.height,
        startFontSize: fontSizeOf("#startButton"),
        chapterFontSize: fontSizeOf("#chapterSummary"),
      };
    });

  const base = await collect();
  for (const viewport of smallViewports) {
    await page.setViewportSize(viewport);
    await page.waitForTimeout(180);
    const scaled = await collect();
    const ratio = viewport.width / baseViewport.width;
    const checks = [
      ["menuButton.width", scaled.menuButton.width, base.menuButton.width * ratio],
      ["menuButton.height", scaled.menuButton.height, base.menuButton.height * ratio],
      ["statIcon.width", scaled.statIcon.width, base.statIcon.width * ratio],
      ["chapterArrow.width", scaled.chapterArrow.width, base.chapterArrow.width * ratio],
      ["exchangeEntry.width", scaled.exchangeEntry.width, base.exchangeEntry.width * ratio],
      ["currentLevel.width", scaled.currentLevel.width, base.currentLevel.width * ratio],
      ["currentLevel.height", scaled.currentLevel.height, base.currentLevel.height * ratio],
      ["currentLevel.top", scaled.currentLevel.top, base.currentLevel.top * ratio],
      ["levelRoadHeight", scaled.levelRoadHeight, base.levelRoadHeight * ratio],
      ["startFontSize", scaled.startFontSize, base.startFontSize * ratio],
      ["chapterFontSize", scaled.chapterFontSize, base.chapterFontSize * ratio],
    ];
    const mismatch = checks.filter(([, actual, expected]) => Math.abs(actual - expected) > 1.25);
    if (mismatch.length) {
      throw new Error(
        `Expected home UI to scale proportionally at ${viewport.width}px, got ${JSON.stringify({ base, scaled, mismatch })}.`,
      );
    }
  }

  await page.setViewportSize(baseViewport);
  await page.waitForTimeout(180);
}

async function expectCurrentRoadLevelCentered(page) {
  await page.evaluate((resetVersion) => {
    localStorage.setItem("lianliankan.dataResetVersion", resetVersion);
    localStorage.setItem(
      "lianliankan.progress",
      JSON.stringify({
        highestUnlockedLevel: 6,
        coins: 10,
        records: {
          1: { completed: true, bestScore: 1200, bestStars: 3 },
          2: { completed: true, bestScore: 1100, bestStars: 3 },
          3: { completed: true, bestScore: 1000, bestStars: 3 },
          4: { completed: true, bestScore: 950, bestStars: 3 },
          5: { completed: true, bestScore: 900, bestStars: 3 },
        },
      }),
    );
    localStorage.setItem("lianliankan.stamina", JSON.stringify({ stamina: 8, updatedAt: Date.now(), adClaims: 0 }));
  }, CURRENT_DATA_RESET_VERSION);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".screen-start.active .road-level.current", { timeout: 2000 });
  await page.waitForFunction(() => document.querySelector(".screen-start.active .road-level.current")?.textContent.includes("06"));
  await expectVisibleCurrentRoadLevel(page, "06");
}

async function expectCurrentRoadLevelCenteredAfterGameReturn(page) {
  await page.locator("#startButton").click();
  await page.waitForSelector(".screen-game.active .tile:not(.empty)", { timeout: 2000 });
  await page.locator("#gameHomeButton").click();
  await page.waitForSelector("#exitModal:not(.hidden)", { timeout: 2000 });
  await page.locator("#confirmHomeButton").click();
  await page.waitForSelector(".screen-start.active .road-level.current", { timeout: 2000 });
  await expectVisibleCurrentRoadLevel(page, "06");

  await page.locator("#startButton").click();
  await page.waitForSelector(".screen-game.active .tile:not(.empty)", { timeout: 2000 });
  await page.locator("#pauseButton").click();
  await page.waitForSelector("#pauseModal:not(.hidden)", { timeout: 2000 });
  await page.locator("#pauseHomeButton").click();
  await page.waitForSelector(".screen-start.active .road-level.current", { timeout: 2000 });
  await expectVisibleCurrentRoadLevel(page, "06");
}

async function expectStartFromBrowsedLockedChapterReturnsToCurrentChapter(page) {
  await page.evaluate((nextStamina) => {
    localStorage.clear();
    localStorage.setItem(
      "lianliankan.stamina",
      JSON.stringify({ stamina: nextStamina, updatedAt: Date.now(), adClaims: 0 }),
    );
  }, fullStamina);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".screen-start.active .road-level.current", { timeout: 2000 });
  await page.locator("#nextChapterButton").click();

  const browsedChapter = await page.locator("#chapterSummary").innerText();
  if (!browsedChapter.includes("糖果花园")) {
    throw new Error(`Expected to browse locked candy chapter before starting, got: ${browsedChapter}`);
  }

  await page.locator("#startButton").click();
  await page.waitForSelector(".screen-game.active .tile:not(.empty)", { timeout: 2000 });
  const startedLevel = await page.locator("#levelName").innerText();
  if (!startedLevel.includes("01")) {
    throw new Error(`Expected start button to launch current level 01, got: ${startedLevel}`);
  }

  await page.locator("#gameHomeButton").click();
  await page.waitForSelector("#exitModal:not(.hidden)", { timeout: 2000 });
  await page.locator("#confirmHomeButton").click();
  await page.waitForSelector(".screen-start.active .road-level.current", { timeout: 2000 });

  const returnedChapter = await page.locator("#chapterSummary").innerText();
  if (!returnedChapter.includes("水果森林")) {
    throw new Error(`Expected returning home to sync back to current chapter, got: ${returnedChapter}`);
  }
  const returnedLevel = await page.locator(".screen-start.active .road-level.current").innerText();
  if (!returnedLevel.includes("01")) {
    throw new Error(`Expected returning home to show current level 01, got: ${returnedLevel}`);
  }
  await expectCurrentRoadLevelInViewport(page, "01");
}

async function expectVisibleCurrentRoadLevel(page, expectedText) {
  const currentPosition = await page.evaluate(() => {
    const roadScroll = document.querySelector("#roadScroll");
    const currentLevel = document.querySelector(".screen-start.active .road-level.current");
    const scrollRect = roadScroll.getBoundingClientRect();
    const currentRect = currentLevel.getBoundingClientRect();
    return {
      currentText: currentLevel.textContent.trim(),
      deltaFromCenter: Math.round((currentRect.top + currentRect.bottom) / 2 - (scrollRect.top + scrollRect.bottom) / 2),
      scrollTop: Math.round(roadScroll.scrollTop),
    };
  });

  if (!currentPosition.currentText.includes(expectedText) || Math.abs(currentPosition.deltaFromCenter) > 36) {
    throw new Error(`Expected current level ${expectedText} to be centered in the visible road map, got ${JSON.stringify(currentPosition)}.`);
  }
}

async function expectCurrentRoadLevelInViewport(page, expectedText) {
  const currentPosition = await page.evaluate(() => {
    const roadScroll = document.querySelector("#roadScroll");
    const currentLevel = document.querySelector(".screen-start.active .road-level.current");
    const scrollRect = roadScroll.getBoundingClientRect();
    const currentRect = currentLevel.getBoundingClientRect();
    return {
      currentText: currentLevel.textContent.trim(),
      currentTop: Math.round(currentRect.top),
      currentBottom: Math.round(currentRect.bottom),
      scrollTop: Math.round(scrollRect.top),
      scrollBottom: Math.round(scrollRect.bottom),
    };
  });

  if (
    !currentPosition.currentText.includes(expectedText) ||
    currentPosition.currentBottom < currentPosition.scrollTop ||
    currentPosition.currentTop > currentPosition.scrollBottom
  ) {
    throw new Error(`Expected current level ${expectedText} to be visible in the road map, got ${JSON.stringify(currentPosition)}.`);
  }
}

async function expectHomeChapterArrowsCycle(page) {
  const initialDisabledState = await page.locator(".screen-start.active .chapter-arrow").evaluateAll((nodes) =>
    nodes.map((node) => node.disabled),
  );
  if (initialDisabledState.some(Boolean)) {
    throw new Error(`Expected home chapter arrows to stay clickable, got disabled=${initialDisabledState.join(",")}.`);
  }

  const arrowThemeAssets = [
    await readHomeChapterArrowThemeAsset(page, "fruit-forest", "exchange-page-arrow-bg-v2.png"),
  ];
  await expectClickCreatesButtonSound(page, "#prevChapterButton", "previous theme arrow");
  await page.waitForFunction(() => document.querySelector("#startScreen")?.className.includes("home-theme-jelly-castle"));
  arrowThemeAssets.push(await readHomeChapterArrowThemeAsset(page, "jelly-castle", "chapter-arrow-jelly-bg.png"));
  await expectGeneratedNodeRoadAssetSystem(page, {
    themeId: "jelly-castle",
    firstLevelText: "61",
    connectorSelector: ".road-jelly-image-segment",
    connectorAsset: "road-jelly-connector.png",
    lockedCount: 30,
  });
  await expectClickCreatesButtonSound(page, "#nextChapterButton", "next theme arrow");
  await page.waitForFunction(() => document.querySelector("#startScreen")?.className.includes("home-theme-fruit-forest"));
  await page.locator("#nextChapterButton").click();
  await page.waitForFunction(() => document.querySelector("#startScreen")?.className.includes("home-theme-candy-garden"));
  arrowThemeAssets.push(await readHomeChapterArrowThemeAsset(page, "candy-garden", "chapter-arrow-candy-bg.png"));
  await expectGeneratedNodeRoadAssetSystem(page, {
    themeId: "candy-garden",
    firstLevelText: "31",
    connectorSelector: ".road-candy-image-segment",
    connectorAsset: "road-candy-connector.png",
    lockedCount: 30,
  });
  await page.locator("#nextChapterButton").click();
  await page.waitForFunction(() => document.querySelector("#startScreen")?.className.includes("home-theme-jelly-castle"));
  arrowThemeAssets.push(await readHomeChapterArrowThemeAsset(page, "jelly-castle", "chapter-arrow-jelly-bg.png"));
  await expectGeneratedNodeRoadAssetSystem(page, {
    themeId: "jelly-castle",
    firstLevelText: "61",
    connectorSelector: ".road-jelly-image-segment",
    connectorAsset: "road-jelly-connector.png",
    lockedCount: 30,
  });
  await page.locator("#nextChapterButton").click();
  await page.waitForFunction(() => document.querySelector("#startScreen")?.className.includes("home-theme-fruit-forest"));
  expectDistinctHomeChapterArrowThemeAssets(arrowThemeAssets);
}

async function readHomeChapterArrowThemeAsset(page, expectedThemeId, expectedAsset) {
  const asset = await page.locator(".screen-start.active .chapter-arrow").first().evaluate((node, expectedThemeId) => {
    const screen = document.querySelector("#startScreen");
    const computed = getComputedStyle(node);
    return {
      expectedThemeId,
      screenClass: screen?.className ?? "",
      backgroundImage: computed.backgroundImage,
    };
  }, expectedThemeId);

  if (!asset.screenClass.includes(`home-theme-${expectedThemeId}`) || !asset.backgroundImage.includes(expectedAsset)) {
    throw new Error(
      `Expected chapter arrow to use ${expectedAsset} in theme ${expectedThemeId}, got ${JSON.stringify(asset)}.`,
    );
  }
  return asset;
}

function expectDistinctHomeChapterArrowThemeAssets(assets) {
  const uniqueAssets = new Set(assets.map((asset) => asset.backgroundImage));
  if (uniqueAssets.size < 3) {
    throw new Error(`Expected chapter arrows to use different image assets per theme, got ${JSON.stringify(assets)}.`);
  }
}

async function expectGeneratedNodeRoadAssetSystem(page, expected) {
  if (expected.connectorSelector) {
    await page.waitForFunction(
      (selector) => document.querySelectorAll(selector).length === 29,
      expected.connectorSelector,
    );
  }
  const roadData = await page.locator(".screen-start.active").evaluate((root, expected) => {
    const levels = [...document.querySelectorAll(".road-level")];
    const firstLevel = levels.find((node) => node.textContent.includes(expected.firstLevelText)) ?? levels[0];
    const levelRect = firstLevel?.getBoundingClientRect();
    const mainNode = firstLevel?.querySelector(".road-level-main");
    const mainRect = mainNode?.getBoundingClientRect();
    const starRect = firstLevel?.querySelector(".road-stars")?.getBoundingClientRect();
    const numberNode = firstLevel?.querySelector(".road-level-number");
    const numberRect = numberNode?.getBoundingClientRect();
    const numberStyle = numberNode ? getComputedStyle(numberNode) : null;
    const currentLevel = document.querySelector(".road-level.current");
    const currentLevelStyle = currentLevel ? getComputedStyle(currentLevel) : null;
    const panelRect = document.querySelector(".map-panel")?.getBoundingClientRect();
    return {
      themeId: expected.themeId,
      roadPathCount: document.querySelectorAll(".road-path").length,
      connectorCount: expected.connectorSelector ? document.querySelectorAll(expected.connectorSelector).length : null,
      levelCount: levels.length,
      lockedCount: document.querySelectorAll(".road-level.locked").length,
      firstLevelText: firstLevel?.textContent ?? "",
      hasNumberClass: Boolean(firstLevel?.querySelector(".road-level-number")),
      hasMainClass: Boolean(firstLevel?.querySelector(".road-level-main")),
      hasStarSlot: Boolean(firstLevel?.querySelector(".road-stars")),
      starSource: firstLevel?.querySelector(".road-stars img")?.getAttribute("src") ?? "",
      connectorBackgrounds: expected.connectorSelector
        ? [...document.querySelectorAll(expected.connectorSelector)].map((node) => getComputedStyle(node).backgroundImage)
        : [],
      nodeBackground: firstLevel ? getComputedStyle(firstLevel).backgroundImage : "",
      mainBackground: mainNode ? getComputedStyle(mainNode).backgroundImage : "",
      levelWidth: levelRect ? Math.round(levelRect.width) : null,
      levelHeight: levelRect ? Math.round(levelRect.height) : null,
      mainWidth: mainRect ? Math.round(mainRect.width) : null,
      mainHeight: mainRect ? Math.round(mainRect.height) : null,
      levelToPanelBottom: levelRect && panelRect ? Math.round((panelRect.bottom - levelRect.bottom) * 10) / 10 : null,
      numberDisplay: numberStyle?.display ?? "",
      numberAlignItems: numberStyle?.alignItems ?? "",
      numberJustifyItems: numberStyle?.justifyItems ?? "",
      numberPaddingLeft: numberStyle?.paddingLeft ?? "",
      numberPaddingRight: numberStyle?.paddingRight ?? "",
      numberPaddingTop: numberStyle?.paddingTop ?? "",
      numberPaddingBottom: numberStyle?.paddingBottom ?? "",
      numberWidth: numberRect ? Math.round(numberRect.width) : null,
      numberHeight: numberRect ? Math.round(numberRect.height) : null,
      hasCurrentLevel: Boolean(currentLevel),
      currentLevelAnimation: currentLevelStyle?.animationName ?? "",
      starTopToMainTop:
        starRect && starRect.height > 0 && mainRect ? Math.round((starRect.top - mainRect.top) * 10) / 10 : null,
      numberBelowMain:
        numberRect && levelRect ? Math.round(numberRect.top - (levelRect.top + levelRect.height * 0.56)) : null,
      starAboveMain:
        starRect && levelRect ? Math.round(starRect.bottom - (levelRect.top + levelRect.height * 0.38)) : null,
    };
  }, expected);

  if (expected.connectorSelector && roadData.roadPathCount !== 0) {
    throw new Error(`Expected ${expected.themeId} road to use generated image connectors, not SVG road paths: ${JSON.stringify(roadData)}`);
  }
  if (expected.connectorSelector && roadData.connectorCount !== 29) {
    throw new Error(`Expected ${expected.themeId} to render 29 continuous image connector segments, got ${JSON.stringify(roadData)}.`);
  }
  if (roadData.lockedCount !== expected.lockedCount) {
    throw new Error(`Expected ${expected.themeId} locked level count to be ${expected.lockedCount}, got ${JSON.stringify(roadData)}.`);
  }
  if (
    roadData.levelCount !== 30 ||
    !roadData.hasNumberClass ||
    !roadData.hasMainClass ||
    !roadData.hasStarSlot ||
    roadData.levelWidth !== 77 ||
    roadData.levelHeight !== 88 ||
    roadData.mainWidth !== 77 ||
    roadData.mainHeight !== 76
  ) {
    throw new Error(`Expected ${expected.themeId} levels to use top shared stars, main button, and bottom number plaque, got ${JSON.stringify(roadData)}.`);
  }
  if (!roadData.mainBackground.includes(`level-${expected.themeId.split("-")[0]}-`) || roadData.nodeBackground !== "none") {
    throw new Error(`Expected ${expected.themeId} state art on the main button only, got ${JSON.stringify(roadData)}.`);
  }
  if (roadData.numberBelowMain === null || roadData.numberBelowMain < 0 || (roadData.starAboveMain !== null && roadData.starAboveMain > 0)) {
    throw new Error(`Expected ${expected.themeId} number plaque below the main button and shared stars above it, got ${JSON.stringify(roadData)}.`);
  }
  if (roadData.levelToPanelBottom === null || Math.abs(roadData.levelToPanelBottom) > 5) {
    throw new Error(`Expected ${expected.themeId} first level to stay aligned while the road mask softens the edge, got ${JSON.stringify(roadData)}.`);
  }
  const numberPaddingLeft = Number.parseFloat(roadData.numberPaddingLeft);
  const numberPaddingRight = Number.parseFloat(roadData.numberPaddingRight);
  const numberPaddingTop = Number.parseFloat(roadData.numberPaddingTop);
  const numberPaddingBottom = Number.parseFloat(roadData.numberPaddingBottom);
  if (
    roadData.numberDisplay !== "grid" ||
    roadData.numberAlignItems !== "center" ||
    roadData.numberJustifyItems !== "center" ||
    Math.abs(numberPaddingLeft - 9) > 0.5 ||
    Math.abs(numberPaddingRight - 9) > 0.5 ||
    Math.abs(numberPaddingTop - 4) > 0.5 ||
    Math.abs(numberPaddingBottom - 4) > 0.5 ||
    roadData.numberWidth === null ||
    roadData.numberWidth < 46 ||
    roadData.numberHeight === null ||
    roadData.numberHeight < 23
  ) {
    throw new Error(`Expected ${expected.themeId} level number to be vertically centered inside its bottom plaque, got ${JSON.stringify(roadData)}.`);
  }
  if (roadData.starTopToMainTop !== null && (roadData.starTopToMainTop < -11 || roadData.starTopToMainTop > -9)) {
    throw new Error(`Expected ${expected.themeId} top star badge to sit 10px above the level icon, got ${JSON.stringify(roadData)}.`);
  }
  if (roadData.hasCurrentLevel && roadData.currentLevelAnimation !== "currentLevelPulse") {
    throw new Error(`Expected current ${expected.themeId} node to use breathing state on the main art, got ${JSON.stringify(roadData)}.`);
  }
  if (expected.connectorSelector && roadData.connectorBackgrounds.some((item) => !item.includes(expected.connectorAsset))) {
    throw new Error(`Expected every ${expected.themeId} connector to use ${expected.connectorAsset}, got ${JSON.stringify(roadData)}.`);
  }
}

async function expectHomeLevelStarsMatchProgress(page) {
  const starData = await page.locator(".screen-start.active").evaluate(() => {
    const levels = [...document.querySelectorAll(".road-level")];
    return ["01", "02", "03", "04"].map((label) => {
      const node = levels.find((item) => item.textContent.includes(label));
      const starBox = node?.querySelector(".road-stars");
      const nodeRect = node?.getBoundingClientRect();
      const starRect = starBox?.getBoundingClientRect();
      const image = starBox?.querySelector("img");
      return {
        label,
        imageCount: starBox?.querySelectorAll("img").length ?? -1,
        imageSource: image?.getAttribute("src") ?? "",
        visibleStars: starBox ? getComputedStyle(starBox).display !== "none" : false,
        starWidth: starRect ? Math.round(starRect.width) : null,
        starHeight: starRect ? Math.round(starRect.height) : null,
        starBottom: starRect ? Math.round(starRect.bottom) : null,
        levelTop: nodeRect ? Math.round(nodeRect.top) : null,
      };
    });
  });
  const expected = new Map([
    ["01", 3],
    ["02", 2],
    ["03", 1],
    ["04", 0],
  ]);
  const mismatch = starData.filter((item) => {
    const expectedStars = expected.get(item.label);
    if (expectedStars === 0) return item.imageCount !== 0;
    return item.imageCount !== 1 || !item.imageSource.includes(`road-stars-${expectedStars}.png`);
  });
  if (mismatch.length) {
    throw new Error(`Expected road level star images to match bestStars, got ${JSON.stringify(starData)}.`);
  }
  const misplaced = starData.filter((item) => item.imageCount > 0 && item.starBottom > item.levelTop + 28);
  if (misplaced.length) {
    throw new Error(`Expected earned road stars to sit on the level header, got ${JSON.stringify(starData)}.`);
  }
  const earnedStarSizes = starData
    .filter((item) => item.imageCount > 0)
    .map((item) => `${item.starWidth}x${item.starHeight}`);
  if (new Set(earnedStarSizes).size !== 1) {
    throw new Error(`Expected earned road star badges to share one display size, got ${JSON.stringify(starData)}.`);
  }
  const emptyVisible = starData.filter((item) => item.imageCount === 0 && item.visibleStars);
  if (emptyVisible.length) {
    throw new Error(`Expected empty road star badges to stay hidden, got ${JSON.stringify(starData)}.`);
  }
  await expectLevelBackgroundsAreCleanBases(page);
}

async function expectLevelBackgroundsAreCleanBases(page) {
  const backgroundData = await page.evaluate(async () => {
    const collectBackgroundUrls = () =>
      [...document.querySelectorAll(".road-level")].map((node) => {
        const match = getComputedStyle(node).backgroundImage.match(/url\(["']?(.*?)["']?\)/);
        return match?.[1] ?? "";
      });
    const urls = [...new Set(collectBackgroundUrls().filter(Boolean))];

    async function inspectLevelBase(url) {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.src = url;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      context.drawImage(image, 0, 0);
      const isCurrent = url.includes("current");
      const centers = isCurrent ? [0.36, 0.5, 0.64] : [0.29, 0.5, 0.71];
      const boxWidth = image.naturalWidth * (isCurrent ? 0.17 : 0.22);
      const boxHeight = image.naturalHeight * (isCurrent ? 0.2 : 0.27);
      const centerY = image.naturalHeight * (isCurrent ? 0.72 : 0.74);
      let blackPixels = 0;
      let transparentPixels = 0;
      let sampled = 0;
      centers.forEach((centerXRatio) => {
        const left = Math.max(0, Math.floor(image.naturalWidth * centerXRatio - boxWidth / 2));
        const top = Math.max(0, Math.floor(centerY - boxHeight / 2));
        const width = Math.min(image.naturalWidth - left, Math.ceil(boxWidth));
        const height = Math.min(image.naturalHeight - top, Math.ceil(boxHeight));
        const data = context.getImageData(left, top, width, height).data;
        sampled += width * height;
        for (let index = 0; index < data.length; index += 4) {
          const alpha = data[index + 3];
          if (alpha <= 12) transparentPixels += 1;
          if (alpha > 12 && data[index] < 30 && data[index + 1] < 30 && data[index + 2] < 30) {
            blackPixels += 1;
          }
        }
      });
      return {
        blackPixels,
        file: url.split("/").pop(),
        height: image.naturalHeight,
        sampledPixels: sampled,
        transparentPixels,
        width: image.naturalWidth,
      };
    }

    return Promise.all(urls.map(inspectLevelBase));
  });
  const dirty = backgroundData.filter(
    (item) => item.blackPixels > item.sampledPixels * 0.01 || item.transparentPixels > item.sampledPixels * 0.1,
  );
  if (dirty.length) {
    throw new Error(`Expected regenerated level bases without black bars or cutout gaps, got ${JSON.stringify(dirty)}.`);
  }
}

async function expectSecondaryPageNavigation(page) {
  await expectClickCreatesSound(page, "#profileButton", "profile entry");
  await page.waitForSelector("#profileScreen.active", { timeout: 1200 });
  if (!(await page.locator("#profileScreen.active").innerText()).includes("个人中心")) {
    throw new Error("Expected profile entry to open the personal center page.");
  }
  await expectSecondaryPageBuiltFromLayout(page, "#profileScreen", ".profile-layout");
  await expectProfilePageOptimizedLayout(page);
  await expectProfilePlayerNameBounded(page);
  await expectProfileThreeStarDataMatchesHome(page);
  await page.screenshot({ path: join(outputDir, "profile-mobile.png"), fullPage: true });
  await expectClickCreatesButtonSound(page, "#profileBackButton", "profile back");
  await page.waitForSelector(".screen-start.active", { timeout: 1200 });

  await expectClickCreatesSound(page, "#settingsButton", "settings entry");
  await page.waitForSelector("#settingsScreen.active", { timeout: 1200 });
  if (!(await page.locator("#settingsScreen.active").innerText()).includes("设置")) {
    throw new Error("Expected settings entry to open the settings page.");
  }
  await expectSecondaryPageBuiltFromLayout(page, "#settingsScreen", ".settings-layout");
  await expectSecondaryPageOptimizedLikeProfile(page, "#settingsScreen", ".settings-layout", ".settings-panel, .settings-row");
  await expectSettingsPageRefinements(page);
  await page.screenshot({ path: join(outputDir, "settings-mobile.png"), fullPage: true });
  await expectClickCreatesButtonSound(page, "#settingsBackButton", "settings back");
  await page.waitForSelector(".screen-start.active", { timeout: 1200 });

  await page.locator("#coinExchangeButton").click({ force: true });
  if ((await page.locator("#exchangeScreen.active").count()) !== 0) {
    throw new Error("Expected top coin resource card not to open the exchange shop page.");
  }

  await page.locator("#homeExchangeButton").click({ force: true });
  await page.waitForSelector("#comingSoonModal:not(.hidden)", { timeout: 1200 });
  if ((await page.locator("#exchangeScreen.active").count()) !== 0) {
    throw new Error("Expected dedicated home exchange entry to stay on the home page.");
  }
  const comingSoonText = await page.locator("#comingSoonTitle").innerText();
  if (comingSoonText !== "功能暂未开放") {
    throw new Error(`Expected dedicated home exchange entry to show unavailable feature modal, got: ${comingSoonText}`);
  }
  const comingSoonPlaqueText = (await page.locator("#comingSoonModal:not(.hidden) .plaque-level-label").innerText()).trim();
  if (comingSoonPlaqueText !== "") {
    throw new Error(`Expected unavailable feature modal plaque to have no copy, got: ${comingSoonPlaqueText}`);
  }
  await page.locator("#comingSoonCloseButton").click();
  await page.locator("#comingSoonModal").waitFor({ state: "hidden", timeout: 1200 });
}

async function expectClickCreatesSound(page, selector, label) {
  await page.evaluate(() => {
    window.__linkMatchAudioEvents = [];
  });
  await page.locator(selector).click();
  const audioEvents = await page.evaluate(() => window.__linkMatchAudioEvents.slice());
  if (!audioEvents.includes("oscillator-start")) {
    throw new Error(`Expected ${label} click to play a sound, got ${JSON.stringify(audioEvents)}.`);
  }
}

async function expectClickCreatesButtonSound(page, selector, label) {
  await page.evaluate(() => {
    window.__linkMatchAudioEvents = [];
  });
  await page.locator(selector).click();
  const audioEvents = await page.evaluate(() => window.__linkMatchAudioEvents.slice());
  if (!audioEvents.includes("param-ramp:0.022")) {
    throw new Error(`Expected ${label} click to play the shared button sound, got ${JSON.stringify(audioEvents)}.`);
  }
}

async function expectSecondaryPageBuiltFromLayout(page, screenSelector, layoutSelector) {
  const fullPageImageCount = await page.locator(`${screenSelector} .secondary-design-image`).count();
  if (fullPageImageCount > 0) {
    throw new Error(`${screenSelector} still uses a full-page design image instead of HTML layout.`);
  }
  const hasLayout = await page.locator(`${screenSelector} ${layoutSelector}`).count();
  if (hasLayout !== 1) {
    throw new Error(`${screenSelector} should render exactly one layout root ${layoutSelector}.`);
  }
}

async function expectSecondaryPageOptimizedLikeProfile(page, screenSelector, layoutSelector, cardSelector, options = {}) {
  const layout = await page.locator(`${screenSelector}.active ${layoutSelector}`).evaluate((node, cardSelector) => {
    const backButton = node.querySelector(".secondary-back-button")?.getBoundingClientRect();
    const title = node.querySelector(".secondary-title")?.getBoundingClientRect();
    const titleText = node.querySelector(".secondary-title h2");
    const titleStyle = titleText ? getComputedStyle(titleText) : null;
    const titleTransform = titleStyle?.transform ?? "none";
    const cards = [...node.querySelectorAll(cardSelector)];
    const cardData = cards.map((card) => {
      const style = getComputedStyle(card);
      return {
        background: style.backgroundImage,
        borderWidth: Number.parseFloat(style.borderTopWidth),
        color: style.backgroundColor,
      };
    });

    return {
      backWidth: Math.round(backButton?.width ?? 0),
      cardData,
      cardCount: cards.length,
      clientHeight: node.clientHeight,
      homeButtonCount: node.querySelectorAll(".secondary-home-button").length,
      layoutOverflowY: getComputedStyle(node).overflowY,
      scrollHeight: node.scrollHeight,
      titleFontSize: titleStyle ? Number.parseFloat(titleStyle.fontSize) : 0,
      titleHeight: Math.round(title?.height ?? 0),
      titleTranslateY: titleTransform === "none" ? 0 : Math.round(new DOMMatrixReadOnly(titleTransform).m42),
    };
  }, cardSelector);

  if (layout.backWidth < 58 || layout.backWidth > 61) {
    throw new Error(`Expected ${screenSelector} back button to match profile page size, got ${JSON.stringify(layout)}.`);
  }
  if (layout.titleHeight < 75 || layout.titleHeight > 78 || Math.abs(layout.titleFontSize - 24) > 0.5) {
    throw new Error(`Expected ${screenSelector} title to match profile page scale, got ${JSON.stringify(layout)}.`);
  }
  if (layout.titleTranslateY > -6 || layout.titleTranslateY < -8) {
    throw new Error(`Expected ${screenSelector} title text to match profile page alignment, got ${JSON.stringify(layout)}.`);
  }
  if (layout.cardCount === 0) {
    throw new Error(`Expected ${screenSelector} to render optimized middle cards, got ${JSON.stringify(layout)}.`);
  }
  const cardWithColor = layout.cardData.find((card) => card.color !== "rgba(0, 0, 0, 0)" || card.background === "none");
  if (cardWithColor) {
    throw new Error(`Expected ${screenSelector} cards to use transparent image-backed panels, got ${JSON.stringify(layout)}.`);
  }
  const cardWithBorder = layout.cardData.find((card) => card.borderWidth !== 0);
  if (cardWithBorder) {
    throw new Error(`Expected ${screenSelector} cards to remove white borders, got ${JSON.stringify(layout)}.`);
  }
  if (layout.homeButtonCount !== 0) {
    throw new Error(`Expected ${screenSelector} bottom home button to be removed, got ${JSON.stringify(layout)}.`);
  }
  if (!options.allowPageScroll && (layout.scrollHeight > layout.clientHeight || layout.layoutOverflowY !== "hidden")) {
    throw new Error(`Expected ${screenSelector} page not to scroll, got ${JSON.stringify(layout)}.`);
  }
  if (options.allowPageScroll && layout.scrollHeight > layout.clientHeight && layout.layoutOverflowY === "hidden") {
    throw new Error(`Expected ${screenSelector} overflow to remain reachable, got ${JSON.stringify(layout)}.`);
  }
}

async function expectSettingsPageRefinements(page) {
  const layout = await page.locator("#settingsScreen.active .settings-layout").evaluate((node) => {
    const panel = node.querySelector(".settings-panel");
    const panelStyle = panel ? getComputedStyle(panel) : null;
    const rows = [...node.querySelectorAll(".settings-row")];
    const rowData = rows.map((row) => {
      const rowBox = row.getBoundingClientRect();
      const icon = row.querySelector(".settings-icon");
      const iconBox = icon?.getBoundingClientRect();
      const iconStyle = icon ? getComputedStyle(icon) : null;
      const label = row.querySelector("strong");
      const labelBox = label?.getBoundingClientRect();
      const labelStyle = label ? getComputedStyle(label) : null;
      const toggle = row.querySelector(".settings-toggle");
      const toggleBox = toggle?.getBoundingClientRect();
      const toggleStyle = toggle ? getComputedStyle(toggle) : null;
      const toggleAfter = toggle ? getComputedStyle(toggle, "::after") : null;
      const childCenters = [...row.children].map((child) => {
        const box = child.getBoundingClientRect();
        return Math.round(Math.abs((box.top + box.bottom) / 2 - (rowBox.top + rowBox.bottom) / 2));
      });
      return {
        childCenterMaxDelta: Math.max(...childCenters),
        iconHeight: iconStyle ? Number.parseFloat(iconStyle.height) : 0,
        iconMarginLeft: iconStyle ? Number.parseFloat(iconStyle.marginLeft) : 0,
        iconWidth: iconStyle ? Number.parseFloat(iconStyle.width) : 0,
        iconLabelGap: Math.round((labelBox?.left ?? 0) - (iconBox?.right ?? 0)),
        labelFontSize: labelStyle ? Number.parseFloat(labelStyle.fontSize) : 0,
        labelHeight: Math.round(labelBox?.height ?? 0),
        labelToggleGap: Math.round((toggleBox?.left ?? 0) - (labelBox?.right ?? 0)),
        labelText: label?.textContent ?? "",
        labelWhiteSpace: labelStyle?.whiteSpace ?? "",
        leafIconCount: row.querySelectorAll(".secondary-label-row img").length,
        rowMinHeight: Number.parseFloat(getComputedStyle(row).minHeight),
        toggleAfterHeight: toggleAfter ? Number.parseFloat(toggleAfter.height) : 0,
        toggleAfterRight: toggleAfter ? Number.parseFloat(toggleAfter.right) : 0,
        toggleAfterTop: toggleAfter ? Number.parseFloat(toggleAfter.top) : 0,
        toggleAfterWidth: toggleAfter ? Number.parseFloat(toggleAfter.width) : 0,
        togglePaddingLeft: toggleStyle ? Number.parseFloat(toggleStyle.paddingLeft) : 0,
        togglePaddingRight: toggleStyle ? Number.parseFloat(toggleStyle.paddingRight) : 0,
      };
    });

    return {
      clearProgressCount: node.querySelectorAll("#clearProgressButton, .settings-clear-card").length,
      panelPaddingBottom: panelStyle ? Number.parseFloat(panelStyle.paddingBottom) : 0,
      panelPaddingLeft: panelStyle ? Number.parseFloat(panelStyle.paddingLeft) : 0,
      panelPaddingRight: panelStyle ? Number.parseFloat(panelStyle.paddingRight) : 0,
      panelPaddingTop: panelStyle ? Number.parseFloat(panelStyle.paddingTop) : 0,
      rowData,
      rowCount: rows.length,
    };
  });

  if (layout.rowCount !== 3) {
    throw new Error(`Expected settings page to keep exactly three setting rows, got ${JSON.stringify(layout)}.`);
  }
  if (
    Math.abs(layout.panelPaddingTop - 60) > 0.5 ||
    Math.abs(layout.panelPaddingRight - 20) > 0.5 ||
    Math.abs(layout.panelPaddingBottom - 40) > 0.5 ||
    Math.abs(layout.panelPaddingLeft - 20) > 0.5
  ) {
    throw new Error(`Expected settings panel padding to be 60px 20px 40px, got ${JSON.stringify(layout)}.`);
  }
  const rowWithLeaves = layout.rowData.find((row) => row.leafIconCount !== 0);
  if (rowWithLeaves) {
    throw new Error(`Expected settings row labels to remove side leaf icons, got ${JSON.stringify(layout)}.`);
  }
  const offCenterRow = layout.rowData.find((row) => row.childCenterMaxDelta > 3);
  if (offCenterRow) {
    throw new Error(`Expected settings row content to be vertically centered, got ${JSON.stringify(layout)}.`);
  }
  const wrongIconSize = layout.rowData.find(
    (row) =>
      Math.abs(row.iconWidth - 40) > 0.5 ||
      Math.abs(row.iconHeight - 40) > 0.5,
  );
  if (wrongIconSize) {
    throw new Error(`Expected settings icons to use 40px size, got ${JSON.stringify(layout)}.`);
  }
  const crampedRow = layout.rowData.find((row) => row.iconLabelGap < 14 || row.labelToggleGap < 14);
  if (crampedRow) {
    throw new Error(`Expected settings icon, label and toggle to keep at least 14px spacing, got ${JSON.stringify(layout)}.`);
  }
  const wrongRowHeight = layout.rowData.find((row) => Math.abs(row.rowMinHeight - 80) > 0.5);
  if (wrongRowHeight) {
    throw new Error(`Expected settings rows to use 80px min-height, got ${JSON.stringify(layout)}.`);
  }
  const wrappedLabel = layout.rowData.find((row) => row.labelHeight > 28 || row.labelWhiteSpace !== "nowrap");
  if (wrappedLabel) {
    throw new Error(`Expected settings row labels to stay on one line, got ${JSON.stringify(layout)}.`);
  }
  const wrongLabelSize = layout.rowData.find((row) => Math.abs(row.labelFontSize - 19.2) > 0.5);
  if (wrongLabelSize) {
    throw new Error(`Expected settings row labels to use 1.2rem font size, got ${JSON.stringify(layout)}.`);
  }
  const wrongTogglePadding = layout.rowData.find(
    (row) => Math.abs(row.togglePaddingLeft - 20) > 0.5 || Math.abs(row.togglePaddingRight - 50) > 0.5,
  );
  if (wrongTogglePadding) {
    throw new Error(`Expected settings toggle padding to be 0 50px 0 20px, got ${JSON.stringify(layout)}.`);
  }
  const wrongToggleKnob = layout.rowData.find(
    (row) =>
      Math.abs(row.toggleAfterTop - 7) > 0.5 ||
      Math.abs(row.toggleAfterRight - 10) > 0.5 ||
      Math.abs(row.toggleAfterWidth - 26) > 0.5 ||
      Math.abs(row.toggleAfterHeight - 26) > 0.5,
  );
  if (wrongToggleKnob) {
    throw new Error(`Expected settings toggle knob to use top 7px, right 10px, 26px size, got ${JSON.stringify(layout)}.`);
  }
  if (layout.clearProgressCount !== 0) {
    throw new Error(`Expected settings clear-progress card to be removed, got ${JSON.stringify(layout)}.`);
  }
}

async function expectSettingsPersistenceAndAudioControls(page) {
  await page.locator("#settingsButton").click();
  await page.waitForSelector("#settingsScreen.active", { timeout: 1200 });
  await page.locator("#musicToggle").click();
  await page.locator("#soundToggle").click();
  await page.locator("#vibrationToggle").click();

  const storedAudioSettings = await page.evaluate(() => localStorage.getItem("lianliankan.audioSettings"));
  if (storedAudioSettings !== null) {
    throw new Error(`Expected audio settings to stay session-only, got persisted value ${storedAudioSettings}.`);
  }

  const offToggleState = await page.locator("#settingsScreen.active").evaluate(() => ({
    music: document.querySelector("#musicToggle")?.getAttribute("aria-pressed"),
    sound: document.querySelector("#soundToggle")?.getAttribute("aria-pressed"),
    vibration: document.querySelector("#vibrationToggle")?.getAttribute("aria-pressed"),
  }));
  if (offToggleState.music !== "false" || offToggleState.sound !== "false" || offToggleState.vibration !== "false") {
    throw new Error(`Expected settings toggles to turn off for current session, got ${JSON.stringify(offToggleState)}.`);
  }

  await page.evaluate(() => {
    window.__linkMatchAudioEvents = [];
  });
  await page.locator("#settingsBackButton").click();
  await page.waitForSelector(".screen-start.active", { timeout: 1200 });
  await page.locator("#startButton").click();
  await page.waitForSelector(".screen-game.active .tile:not(.empty)");
  const sessionMutedAudioEvents = await page.evaluate(() => window.__linkMatchAudioEvents.slice());
  if (sessionMutedAudioEvents.some(isAudioStartEvent)) {
    throw new Error(`Expected disabled music and sound to avoid creating audio in the same session, got ${JSON.stringify(sessionMutedAudioEvents)}.`);
  }

  await page.reload({ waitUntil: "networkidle" });
  const resetToggleStateBeforeInteraction = await page.evaluate(() => ({
    music: document.querySelector("#musicToggle")?.getAttribute("aria-pressed"),
    sound: document.querySelector("#soundToggle")?.getAttribute("aria-pressed"),
    vibration: document.querySelector("#vibrationToggle")?.getAttribute("aria-pressed"),
  }));
  if (
    resetToggleStateBeforeInteraction.music !== "true" ||
    resetToggleStateBeforeInteraction.sound !== "true" ||
    resetToggleStateBeforeInteraction.vibration !== "true"
  ) {
    throw new Error(
      `Expected settings to reset on before the first post-refresh interaction, got ${JSON.stringify(resetToggleStateBeforeInteraction)}.`,
    );
  }

  await page.evaluate(() => {
    window.__linkMatchAudioEvents = [];
    window.__linkMatchRejectNextAudioPlay = true;
    window.dispatchEvent(new Event("pointerdown", { bubbles: true }));
  });
  const rejectedTouchUnlockAudioEvents = await page.evaluate(() => window.__linkMatchAudioEvents.slice());
  if (!rejectedTouchUnlockAudioEvents.includes("audio-play-reject")) {
    throw new Error(`Expected blocked first touch to keep startup music retryable, got ${JSON.stringify(rejectedTouchUnlockAudioEvents)}.`);
  }
  await page.evaluate(() => {
    window.dispatchEvent(new Event("click", { bubbles: true }));
  });
  const touchUnlockAudioEvents = await page.evaluate(() => window.__linkMatchAudioEvents.slice());
  if (touchUnlockAudioEvents.filter((event) => event === "audio-play").length < 2 || !touchUnlockAudioEvents.includes("audio-play-resolve")) {
    throw new Error(`Expected click after blocked touch to retry and unlock startup music, got ${JSON.stringify(touchUnlockAudioEvents)}.`);
  }

  await page.locator("#settingsButton").click();
  await page.waitForSelector("#settingsScreen.active", { timeout: 1200 });
  const resetToggleState = await page.locator("#settingsScreen.active").evaluate(() => ({
    music: document.querySelector("#musicToggle")?.getAttribute("aria-pressed"),
    sound: document.querySelector("#soundToggle")?.getAttribute("aria-pressed"),
    vibration: document.querySelector("#vibrationToggle")?.getAttribute("aria-pressed"),
  }));
  if (resetToggleState.music !== "true" || resetToggleState.sound !== "true" || resetToggleState.vibration !== "true") {
    throw new Error(`Expected settings toggles to reset on after reload, got ${JSON.stringify(resetToggleState)}.`);
  }

  await page.locator("#settingsBackButton").click();
  await page.waitForSelector(".screen-start.active", { timeout: 1200 });
  await page.evaluate(() => {
    window.__linkMatchAudioEvents = [];
  });
  await page.locator("#startButton").click();
  await page.waitForSelector(".screen-game.active .tile:not(.empty)");
  const sessionEnabledAudioEvents = await page.evaluate(() => window.__linkMatchAudioEvents.slice());
  if (!sessionEnabledAudioEvents.includes("audio-play") && !sessionEnabledAudioEvents.includes("oscillator-start")) {
    throw new Error(`Expected enabled music or sound to create audio, got ${JSON.stringify(sessionEnabledAudioEvents)}.`);
  }

  await page.locator("#gameHomeButton").click();
  await page.locator("#confirmHomeButton").click();
  await page.waitForSelector(".screen-start.active", { timeout: 1200 });
  return;

  const storedOffSettings = await page.evaluate(() => JSON.parse(localStorage.getItem("lianliankan.audioSettings") ?? "{}"));
  if (
    storedOffSettings.music !== false ||
    storedOffSettings.sound !== false ||
    storedOffSettings.vibration !== false
  ) {
    throw new Error(`Expected settings toggles to persist off state, got ${JSON.stringify(storedOffSettings)}.`);
  }

  await page.reload({ waitUntil: "networkidle" });
  await page.locator("#settingsButton").click();
  await page.waitForSelector("#settingsScreen.active", { timeout: 1200 });
  const reloadedToggleState = await page.locator("#settingsScreen.active").evaluate(() => ({
    music: document.querySelector("#musicToggle")?.getAttribute("aria-pressed"),
    musicText: document.querySelector("#musicToggle span")?.textContent,
    sound: document.querySelector("#soundToggle")?.getAttribute("aria-pressed"),
    soundText: document.querySelector("#soundToggle span")?.textContent,
    vibration: document.querySelector("#vibrationToggle")?.getAttribute("aria-pressed"),
    vibrationText: document.querySelector("#vibrationToggle span")?.textContent,
  }));
  if (
    reloadedToggleState.music !== "false" ||
    reloadedToggleState.musicText !== "关" ||
    reloadedToggleState.sound !== "false" ||
    reloadedToggleState.soundText !== "关" ||
    reloadedToggleState.vibration !== "false" ||
    reloadedToggleState.vibrationText !== "关"
  ) {
    throw new Error(`Expected settings toggles to restore off state after reload, got ${JSON.stringify(reloadedToggleState)}.`);
  }

  await page.locator("#settingsBackButton").click();
  await page.waitForSelector(".screen-start.active", { timeout: 1200 });
  await seedPlayableFreshState(page);
  await page.evaluate(() => {
    window.__linkMatchAudioEvents = [];
  });
  await page.locator("#startButton").click();
  await page.waitForSelector(".screen-game.active .tile:not(.empty)");
  const mutedAudioEvents = await page.evaluate(() => window.__linkMatchAudioEvents.slice());
  if (mutedAudioEvents.some(isAudioStartEvent)) {
    throw new Error(`Expected disabled music and sound to avoid creating audio, got ${JSON.stringify(mutedAudioEvents)}.`);
  }

  await page.evaluate(() => {
    localStorage.setItem(
      "lianliankan.audioSettings",
      JSON.stringify({ music: true, sound: true, vibration: true }),
    );
    window.__linkMatchAudioEvents = [];
  });
  await page.reload({ waitUntil: "networkidle" });
  await seedPlayableFreshState(page);
  await page.locator("#startButton").click();
  await page.waitForSelector(".screen-game.active .tile:not(.empty)");
  const enabledAudioEvents = await page.evaluate(() => window.__linkMatchAudioEvents.slice());
  if (!enabledAudioEvents.includes("audio-play") || !enabledAudioEvents.includes("oscillator-start")) {
    throw new Error(`Expected enabled music and sound to create audio, got ${JSON.stringify(enabledAudioEvents)}.`);
  }

  await page.locator("#gameHomeButton").click();
  await page.locator("#confirmHomeButton").click();
  await page.waitForSelector(".screen-start.active", { timeout: 1200 });
}

async function expectGameEntryStartsBackgroundMusic(page) {
  await seedPlayableFreshState(page);
  const startupAudioEvents = await page.evaluate(() => window.__linkMatchAudioEvents.slice());
  if (!startupAudioEvents.includes("audio-created:./assets/audio/background_video.mp3") || !startupAudioEvents.includes("audio-play")) {
    throw new Error(`Expected opening the mini game to start background music, got ${JSON.stringify(startupAudioEvents)}.`);
  }

  await page.evaluate(() => {
    window.__linkMatchAudioEvents = [];
  });
  await page.locator("#startButton").click();
  await page.waitForSelector(".screen-game.active .tile:not(.empty)");
  const levelAudioEvents = await page.evaluate(() => window.__linkMatchAudioEvents.slice());
  if (!levelAudioEvents.includes("audio-play") && !levelAudioEvents.includes("oscillator-start")) {
    throw new Error(`Expected entering a level to keep audio active, got ${JSON.stringify(levelAudioEvents)}.`);
  }

  await page.locator("#gameHomeButton").click();
  await page.locator("#confirmHomeButton").click();
  await page.waitForSelector(".screen-start.active", { timeout: 1200 });
  await page.reload({ waitUntil: "networkidle" });
  return;

  await page.evaluate(() => {
    localStorage.setItem(
      "lianliankan.audioSettings",
      JSON.stringify({ music: true, sound: false, vibration: false }),
    );
  });
  await seedPlayableFreshState(page);
  await page.evaluate(() => {
    window.__linkMatchAudioEvents = [];
  });
  await page.locator("#startButton").click();
  await page.waitForSelector(".screen-game.active .tile:not(.empty)");

  const audioEvents = await page.evaluate(() => window.__linkMatchAudioEvents.slice());
  if (!audioEvents.includes("audio-play")) {
    throw new Error(`Expected game entry to start background music with sound effects off, got ${JSON.stringify(audioEvents)}.`);
  }

  await page.locator("#gameHomeButton").click();
  await page.locator("#confirmHomeButton").click();
  await page.waitForSelector(".screen-start.active", { timeout: 1200 });
  await page.evaluate(() => {
    localStorage.setItem(
      "lianliankan.audioSettings",
      JSON.stringify({ music: true, sound: true, vibration: true }),
    );
  });
  await page.reload({ waitUntil: "networkidle" });
}

async function expectProfilePageOptimizedLayout(page) {
  const layout = await page.locator("#profileScreen.active .profile-layout").evaluate((node) => {
    const backButton = node.querySelector("#profileBackButton")?.getBoundingClientRect();
    const title = node.querySelector(".secondary-title--profile")?.getBoundingClientRect();
    const titleText = node.querySelector(".secondary-title--profile h2");
    const identityCard = node.querySelector(".profile-identity-card");
    const cards = [...node.querySelectorAll(".profile-identity-card, .profile-stat-card, .profile-wide-card")];
    const statsGrid = node.querySelector(".profile-stats-grid");
    const levelBadge = node.querySelector("#profileCurrentLevelText");
    const starText = node.querySelector("#profileStarText");
    const completedCounter = node.querySelector("#profileCompletedText");
    const threeStarCounter = node.querySelector("#profileThreeStarText");
    const completedText = node.querySelector("#profileCompletedText")?.textContent ?? "";
    const threeStarText = node.querySelector("#profileThreeStarText")?.textContent ?? "";
    const nodeBox = node.getBoundingClientRect();
    const gridBox = statsGrid?.getBoundingClientRect();
    const cardData = cards.map((card) => {
      const style = getComputedStyle(card);
      const box = card.getBoundingClientRect();
      const childBoxes = [...card.children].map((child) => child.getBoundingClientRect());
      const contentTop = Math.min(...childBoxes.map((child) => child.top));
      const contentBottom = Math.max(...childBoxes.map((child) => child.bottom));
      return {
        background: style.backgroundImage,
        borderWidth: Number.parseFloat(style.borderTopWidth),
        centerDelta: Math.round(Math.abs((contentTop + contentBottom) / 2 - (box.top + box.bottom) / 2)),
        color: style.backgroundColor,
        height: Math.round(box.height),
      };
    });
    const identityStyle = identityCard ? getComputedStyle(identityCard) : null;
    const titleStyle = titleText ? getComputedStyle(titleText) : null;
    const titleTransform = titleStyle?.transform ?? "none";
    const levelBadgeBox = levelBadge?.getBoundingClientRect();
    const levelBadgeStyle = levelBadge ? getComputedStyle(levelBadge) : null;
    const starStyle = starText ? getComputedStyle(starText) : null;
    const levelBadgeTransform = levelBadgeStyle?.transform ?? "none";
    const starTransform = starStyle?.transform ?? "none";
    const completedStyle = completedCounter ? getComputedStyle(completedCounter) : null;
    const threeStarStyle = threeStarCounter ? getComputedStyle(threeStarCounter) : null;
    const iconData = {
      coinWidth: Math.round(node.querySelector(".profile-wide-icon")?.getBoundingClientRect().width ?? 0),
      levelWidth: Math.round(node.querySelector(".profile-stat-icon--level")?.getBoundingClientRect().width ?? 0),
      starWidth: Math.round(
        [...node.querySelectorAll(".profile-stat-card")]
          .find((card) => card.textContent.includes("总星数"))
          ?.querySelector(".profile-stat-icon")
          ?.getBoundingClientRect().width ?? 0,
      ),
    };
    return {
      backWidth: Math.round(backButton?.width ?? 0),
      cardData,
      cardCount: cards.length,
      clientHeight: node.clientHeight,
      completedText,
      gridCenterDelta: gridBox ? Math.round(Math.abs((gridBox.left + gridBox.right) / 2 - (nodeBox.left + nodeBox.right) / 2)) : 999,
      homeButtonCount: node.querySelectorAll("#profileHomeButton").length,
      iconData,
      identityMarginTop: identityStyle ? Number.parseFloat(identityStyle.marginTop) : 0,
      layoutOverflowY: getComputedStyle(node).overflowY,
      levelBadgeFontSize: levelBadgeStyle ? Number.parseFloat(levelBadgeStyle.fontSize) : 0,
      levelBadgeLineHeight: levelBadgeStyle ? Number.parseFloat(levelBadgeStyle.lineHeight) : 0,
      levelBadgeTranslateY: levelBadgeTransform === "none" ? 0 : Math.round(new DOMMatrixReadOnly(levelBadgeTransform).m42),
      levelBadgeWidth: Math.round(levelBadgeBox?.width ?? 0),
      nodeHeight: Math.round(nodeBox.height),
      scrollHeight: node.scrollHeight,
      completedFontSize: completedStyle ? Number.parseFloat(completedStyle.fontSize) : 0,
      starFontSize: starStyle ? Number.parseFloat(starStyle.fontSize) : 0,
      starTranslateY: starTransform === "none" ? 0 : Math.round(new DOMMatrixReadOnly(starTransform).m42),
      threeStarFontSize: threeStarStyle ? Number.parseFloat(threeStarStyle.fontSize) : 0,
      threeStarText,
      titleFontSize: titleStyle ? Number.parseFloat(titleStyle.fontSize) : 0,
      titleHeight: Math.round(title?.height ?? 0),
      titleTextAlign: titleStyle?.textAlign ?? "",
      titleTranslateY: titleTransform === "none" ? 0 : Math.round(new DOMMatrixReadOnly(titleTransform).m42),
    };
  });

  if (layout.backWidth < 50 || layout.backWidth > 56) {
    throw new Error(`Expected profile back button to stay compact on mobile, got ${JSON.stringify(layout)}.`);
  }
  if (layout.titleHeight < 60 || layout.titleHeight > 72 || layout.titleFontSize < 21 || layout.titleFontSize > 23) {
    throw new Error(`Expected profile title to use the compact mobile scale, got ${JSON.stringify(layout)}.`);
  }
  if (layout.cardCount !== 6) {
    throw new Error(`Expected profile page to render 6 middle cards, got ${JSON.stringify(layout)}.`);
  }
  const cardWithColor = layout.cardData.find((card) => card.color !== "rgba(0, 0, 0, 0)" || !card.background.includes("module-profile-"));
  if (cardWithColor) {
    throw new Error(`Expected profile cards to keep image backgrounds without beige color fill, got ${JSON.stringify(layout)}.`);
  }
  const cardWithBorder = layout.cardData.find((card) => card.borderWidth !== 0);
  if (cardWithBorder) {
    throw new Error(`Expected profile middle cards to remove white borders, got ${JSON.stringify(layout)}.`);
  }
  const offCenterCard = layout.cardData.find((card) => card.centerDelta > 8);
  if (offCenterCard) {
    throw new Error(`Expected profile middle cards to center their content vertically, got ${JSON.stringify(layout)}.`);
  }
  if (layout.gridCenterDelta > 2) {
    throw new Error(`Expected profile middle card grid to be centered, got ${JSON.stringify(layout)}.`);
  }
  if (layout.titleTranslateY > -5 || layout.titleTranslateY < -7) {
    throw new Error(`Expected profile title text to keep compact vertical alignment, got ${JSON.stringify(layout)}.`);
  }
  if (
    layout.iconData.levelWidth < 78 ||
    layout.iconData.levelWidth > 80 ||
    layout.iconData.starWidth < 52 ||
    layout.iconData.starWidth > 54 ||
    layout.iconData.coinWidth < 57 ||
    layout.iconData.coinWidth > 59
  ) {
    throw new Error(`Expected profile level/star/coin icons to use compact sizes, got ${JSON.stringify(layout)}.`);
  }
  if (
    layout.levelBadgeFontSize < 14 ||
    layout.levelBadgeFontSize > 15 ||
    layout.levelBadgeLineHeight < 14 ||
    layout.levelBadgeLineHeight > 15
  ) {
    throw new Error(`Expected current-level green badge text to use compact scale and stay centered, got ${JSON.stringify(layout)}.`);
  }
  if (layout.levelBadgeTranslateY < 5 || layout.levelBadgeTranslateY > 7) {
    throw new Error(`Expected current-level green badge to keep compact vertical offset, got ${JSON.stringify(layout)}.`);
  }
  if (layout.starFontSize < 17 || layout.starFontSize > 18) {
    throw new Error(`Expected total-stars number text to use compact scale, got ${JSON.stringify(layout)}.`);
  }
  if (layout.starTranslateY < 5 || layout.starTranslateY > 7) {
    throw new Error(`Expected total-stars number to keep compact vertical offset, got ${JSON.stringify(layout)}.`);
  }
  if (
    layout.completedFontSize < 19 ||
    layout.completedFontSize > 20 ||
    layout.threeStarFontSize < 19 ||
    layout.threeStarFontSize > 20
  ) {
    throw new Error(`Expected completed and three-star number text to use compact scale, got ${JSON.stringify(layout)}.`);
  }
  if (!/^\d+关$/.test(layout.completedText) || !/^\d+关$/.test(layout.threeStarText)) {
    throw new Error(`Expected completed and three-star counts to include 关 suffix, got ${JSON.stringify(layout)}.`);
  }
  if (layout.scrollHeight > layout.clientHeight || layout.layoutOverflowY !== "hidden") {
    throw new Error(`Expected profile page not to scroll, got ${JSON.stringify(layout)}.`);
  }
  if (layout.identityMarginTop < 16 || layout.identityMarginTop > 30) {
    throw new Error(`Expected profile identity card to use compact top spacing, got ${JSON.stringify(layout)}.`);
  }
  if (layout.homeButtonCount !== 0) {
    throw new Error(`Expected profile bottom home button to be removed, got ${JSON.stringify(layout)}.`);
  }

  const originalViewport = page.viewportSize() ?? { width: 390, height: 844 };
  await page.setViewportSize({ width: 390, height: 700 });
  const compactLayout = await page.locator("#profileScreen.active .profile-layout").evaluate((node) => {
    const nodeBox = node.getBoundingClientRect();
    const contentBottom = Math.max(
      ...[...node.querySelectorAll(".secondary-title--profile, .profile-identity-card, .profile-stat-card, .profile-wide-card")].map(
        (item) => item.getBoundingClientRect().bottom,
      ),
    );
    return {
      bottomInset: Math.round(nodeBox.bottom - contentBottom),
      clientHeight: node.clientHeight,
      layoutOverflowY: getComputedStyle(node).overflowY,
      scrollHeight: node.scrollHeight,
    };
  });
  await page.setViewportSize(originalViewport);
  if (
    compactLayout.scrollHeight > compactLayout.clientHeight ||
    compactLayout.layoutOverflowY !== "hidden" ||
    compactLayout.bottomInset < 6
  ) {
    throw new Error(`Expected profile page to fit inside a short mobile browser viewport, got ${JSON.stringify(compactLayout)}.`);
  }
}

async function expectProfileThreeStarDataMatchesHome(page) {
  const profileData = await page.locator("#profileScreen.active .profile-layout").evaluate(() => {
    const progress = JSON.parse(localStorage.getItem("lianliankan.progress") ?? "{}");
    const records = Object.values(progress.records ?? {});
    const expectedThreeStarLevels = records.filter((record) => record.bestStars >= 3).length;
    const homeThreeStarNodes = [...document.querySelectorAll(".screen-start .road-level")].filter(
      (node) => node.querySelector(".road-stars img")?.getAttribute("src")?.includes("road-stars-3.png"),
    ).length;

    return {
      expectedThreeStarLevels,
      expectedText: `${expectedThreeStarLevels}关`,
      homeThreeStarNodes,
      profileText: document.querySelector("#profileThreeStarText")?.textContent ?? "",
    };
  });

  if (
    profileData.profileText !== profileData.expectedText ||
    profileData.homeThreeStarNodes !== profileData.expectedThreeStarLevels
  ) {
    throw new Error(`Expected profile three-star count to match home map bestStars, got ${JSON.stringify(profileData)}.`);
  }
}

async function expectProfilePlayerNameBounded(page) {
  const profileData = await page.locator("#profileScreen.active .profile-layout").evaluate(() => {
    const progress = JSON.parse(localStorage.getItem("lianliankan.progress") ?? "{}");
    const profileName = document.querySelector("#profilePlayerNameText")?.textContent?.trim() ?? "";

    return {
      storedName: progress.playerName ?? "",
      profileName,
      characterCount: Array.from(profileName).length,
    };
  });

  if (
    !profileData.profileName ||
    profileData.profileName !== profileData.storedName ||
    profileData.characterCount > 6
  ) {
    throw new Error(`Expected profile player name to be stored and at most 6 chars, got ${JSON.stringify(profileData)}.`);
  }
}

async function expectHomeUsesUiHomeAssets(page) {
  const assets = await page.locator(".screen-start.active").evaluate((node) => {
    const backgroundImageOf = (selector) => getComputedStyle(document.querySelector(selector)).backgroundImage;
    const firstRoadLevel = document.querySelector(".road-level.current");
    const summary = document.querySelector("#chapterSummary");
    return {
      screenClass: node.className,
      screenBackground: getComputedStyle(node).backgroundImage,
      profileIcon: document.querySelector("#profileButton img")?.getAttribute("src") ?? "",
      settingsIcon: document.querySelector("#settingsButton img")?.getAttribute("src") ?? "",
      statBackground: backgroundImageOf(".home-stat"),
      arrowBackground: backgroundImageOf(".chapter-arrow"),
      arrowIcon: document.querySelector("#nextChapterButton img")?.getAttribute("src") ?? "",
      summaryBackground: summary ? getComputedStyle(summary).backgroundImage : "",
      levelBackground: firstRoadLevel
        ? getComputedStyle(firstRoadLevel.querySelector(".road-level-main") ?? firstRoadLevel).backgroundImage
        : "",
      startBackground: backgroundImageOf("#startButton"),
      lockIcon: document.querySelector(".chapter-lock img")?.getAttribute("src") ?? "",
    };
  });

  const expected = [
    ["screenBackground", "background-fruit-full.png"],
    ["profileIcon", "icon-profile.png"],
    ["settingsIcon", "icon-settings.png"],
    ["statBackground", "resource-card-bg.png"],
    ["arrowBackground", "exchange-page-arrow-bg-v2.png"],
    ["arrowIcon", "exchange-page-arrow-bg-v2.png"],
    ["summaryBackground", "chapter-title-fruit-bg.png"],
    ["levelBackground", "level-fruit-current-bg.png"],
    ["startBackground", "start-button-fruit-bg.png"],
    ["lockIcon", "icon-lock.png"],
  ];
  const missing = expected.filter(([key, value]) => !String(assets[key]).includes(value));
  if (!assets.screenClass.includes("home-theme-fruit-forest") || missing.length) {
    throw new Error(`Expected home screen to render flattened image assets, got ${JSON.stringify({ assets, missing })}.`);
  }
}

async function expectGameUsesThemeBackground(page) {
  const assets = await page.locator(".screen-game.active").evaluate((node) => ({
    screenClass: node.className,
    screenBackground: getComputedStyle(node).backgroundImage,
  }));

  if (
    !assets.screenClass.includes("theme-fruit-forest") ||
    !assets.screenBackground.includes("background-fruit-full.png")
  ) {
    throw new Error(`Expected fruit game screen to render fruit full background, got ${JSON.stringify(assets)}.`);
  }
}

async function readCurrentLevelTileCount(page) {
  return page.evaluate(async () => {
    const module = await import(new URL("./levels.js", window.location.href).href);
    const levelName = document.querySelector("#levelName")?.textContent ?? "第01关";
    const levelNumber = Number(levelName.replace(/\D/g, "")) || 1;
    const level = module.LEVELS.find((item) => item.number === levelNumber) ?? module.LEVELS[0];
    return level.rows * level.cols;
  });
}

async function expectMobileResultDesignSystem(page) {
  const shellCount = await page.locator(".screen-result.active.mobile-result-shell").count();
  const cardCount = await page.locator(".screen-result.active .candy-result-card").count();
  const badgeSource = await page.locator(".screen-result.active .result-badge-art").getAttribute("src");
  const badgeGeometry = await page.locator(".screen-result.active .result-badge-art").evaluate((node) => {
    const badge = node.closest(".result-badge");
    const badgeBox = badge?.getBoundingClientRect();
    const artBox = node.getBoundingClientRect();
    return {
      artWidth: Math.round(artBox.width),
      artHeight: Math.round(artBox.height),
      badgeWidth: Math.round(badgeBox?.width ?? 0),
      badgeBackground: badge ? getComputedStyle(badge).backgroundImage : "",
    };
  });
  const badgeCheckColor = await page.locator(".screen-result.active .result-badge-art").evaluate(async (node) => {
    if (!node.complete) {
      await new Promise((resolve) => node.addEventListener("load", resolve, { once: true }));
    }

    const canvas = document.createElement("canvas");
    canvas.width = node.naturalWidth;
    canvas.height = node.naturalHeight;
    const context = canvas.getContext("2d");
    context.drawImage(node, 0, 0);

    const sampleBox = {
      x: Math.round(canvas.width * 0.38),
      y: Math.round(canvas.height * 0.36),
      width: Math.round(canvas.width * 0.28),
      height: Math.round(canvas.height * 0.22),
    };
    const pixels = context.getImageData(sampleBox.x, sampleBox.y, sampleBox.width, sampleBox.height).data;
    let visiblePixels = 0;
    let greenPixels = 0;
    let redTotal = 0;
    let greenTotal = 0;
    let blueTotal = 0;

    for (let index = 0; index < pixels.length; index += 4) {
      const red = pixels[index];
      const green = pixels[index + 1];
      const blue = pixels[index + 2];
      const alpha = pixels[index + 3];
      if (alpha < 48) {
        continue;
      }
      visiblePixels += 1;
      if (green > red + 45 && green > blue + 18) {
        greenPixels += 1;
        redTotal += red;
        greenTotal += green;
        blueTotal += blue;
      }
    }

    return {
      averageBlue: greenPixels > 0 ? Math.round(blueTotal / greenPixels) : 0,
      averageGreen: greenPixels > 0 ? Math.round(greenTotal / greenPixels) : 0,
      averageRed: greenPixels > 0 ? Math.round(redTotal / greenPixels) : 0,
      greenPixels,
      visiblePixels,
      greenRatio: visiblePixels > 0 ? Number((greenPixels / visiblePixels).toFixed(3)) : 0,
    };
  });
  const plaqueLabelText = await page.locator(".screen-result.active .plaque-level-label").innerText();
  const plaqueDecorCount = await page.locator(".screen-result.active .result-plaque .icon-decor-art").count();
  const starSources = await page
    .locator(".screen-result.active .result-star-art")
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("src") ?? ""));
  const cardBackground = await page
    .locator(".screen-result.active .candy-result-card")
    .evaluate((node) => getComputedStyle(node).backgroundImage);
  const resultStaminaCount = await page.locator(".screen-result.active .result-stamina").count();
  const resultEyebrowCount = await page.locator(".screen-result.active .result-eyebrow").count();
  const resultStatsCount = await page.locator(".screen-result.active .result-stats").count();
  const resultTitle = page.locator(".screen-result.active #resultTitle");
  const resultTitleText = await resultTitle.innerText();
  const resultCoinCount = page.locator(".screen-result.active #resultTitle .result-coin-count");
  const resultCoinCountText = await resultCoinCount.innerText().catch(() => "");
  const resultCoinIcon = page.locator(".screen-result.active #resultTitle .result-coin-icon");
  const doubleCoinButtonCount = await page.locator(".screen-result.active #doubleCoinsButton:not(.hidden)").count();
  const doubleCoinButtonText = await page.locator(".screen-result.active #doubleCoinsButton").innerText().catch(() => "");
  const resultCoinStyle = await resultCoinCount
    .evaluate((node) => {
      const style = getComputedStyle(node);
      const parentStyle = getComputedStyle(node.parentElement);
      return {
        color: style.color,
        fontSize: Number.parseFloat(style.fontSize),
        fontWeight: Number(style.fontWeight),
        parentFontSize: Number.parseFloat(parentStyle.fontSize),
        parentAlign: parentStyle.textAlign,
      };
    })
    .catch(() => null);
  const resultCoinIconData = await resultCoinIcon
    .evaluate((node) => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return {
        background: style.backgroundImage,
        height: Number(rect.height.toFixed(1)),
        src: node.getAttribute("src") ?? "",
        tagName: node.tagName,
        width: Number(rect.width.toFixed(1)),
      };
    })
    .catch(() => null);
  const nextLevelButtonCount = await page.locator(".screen-result.active #nextLevelButton").count();
  const nextLevelButtonText = await page.locator(".screen-result.active #nextLevelButton").innerText().catch(() => "");
  const resultButtonGaps = await page.locator(".screen-result.active .result-card > button:not(.hidden)").evaluateAll((nodes) => {
    const boxes = nodes.map((node) => node.getBoundingClientRect());
    return boxes.slice(1).map((box, index) => Math.round(box.top - boxes[index].bottom));
  });
  const overlay = await page.locator(".screen-result.active").evaluate((node) => {
    const color = getComputedStyle(node).backgroundColor;
    const channels = color.match(/rgba?\(([^)]+)\)/);
    const parts = channels ? channels[1].split(",").map((part) => Number(part.trim())) : [];
    return { color, alpha: parts.length === 4 ? parts[3] : 1 };
  });
  const geometry = await page.locator(".screen-result.active .candy-result-card").evaluate((card) => {
    const plaque = card.querySelector(".result-plaque")?.getBoundingClientRect();
    const cardBox = card.getBoundingClientRect();
    return {
      cardTop: cardBox.top,
      plaqueBottom: plaque?.bottom ?? 0,
      plaqueTop: plaque?.top ?? 0,
    };
  });

  if (shellCount !== 1 || cardCount !== 1) {
    throw new Error(`Expected result screen to use mobile candy result structure, got shell=${shellCount}, card=${cardCount}.`);
  }
  if (!badgeSource?.includes("./assets/image/") || starSources.some((source) => !source.includes("./assets/image/"))) {
    throw new Error(
      `Expected result badge and stars to use flat assets/image files, got badge=${badgeSource}, stars=${starSources.join(", ")}`,
    );
  }
  if (!badgeSource.includes("result-pass-badge.png")) {
    throw new Error(`Expected success result badge to use generated pass badge icon, got badge=${badgeSource}.`);
  }
  if (
    badgeGeometry.artWidth < 120 ||
    badgeGeometry.artHeight < 120 ||
    badgeGeometry.badgeWidth < 128 ||
    badgeGeometry.badgeBackground !== "none"
  ) {
    throw new Error(`Expected success result badge to render as a larger standalone asset, got ${JSON.stringify(badgeGeometry)}.`);
  }
  if (
    badgeCheckColor.greenRatio < 0.12 ||
    badgeCheckColor.averageRed < 25 ||
    badgeCheckColor.averageRed > 80 ||
    badgeCheckColor.averageGreen < 185 ||
    badgeCheckColor.averageGreen > 225 ||
    badgeCheckColor.averageBlue < 110 ||
    badgeCheckColor.averageBlue > 160
  ) {
    throw new Error(`Expected success result badge checkmark to keep the original teal-green color, got ${JSON.stringify(badgeCheckColor)}.`);
  }
  if (!/^第\d{2}关$/.test(plaqueLabelText) || plaqueDecorCount !== 0) {
    throw new Error(
      `Expected result title plaque to show level text without star decorators, got label=${plaqueLabelText}, decor=${plaqueDecorCount}.`,
    );
  }
  if (!cardBackground.includes("assets/image/modal-card-bg.png")) {
    throw new Error(`Expected result card background to use modal-card-bg.png, got: ${cardBackground}`);
  }
  if (overlay.alpha < 0.2) {
    throw new Error(`Expected result screen to keep a translucent game-background overlay, got: ${JSON.stringify(overlay)}.`);
  }
  if (resultStaminaCount !== 0 || resultEyebrowCount !== 0) {
    throw new Error(`Expected result screen without stamina panel and eyebrow, got stamina=${resultStaminaCount}, eyebrow=${resultEyebrowCount}.`);
  }
  if (resultStatsCount !== 0) {
    throw new Error(`Expected result score/best stat buttons to be removed, got ${resultStatsCount}.`);
  }
  if (resultTitleText.replace(/\s+/g, "") !== "通关成功，获得2") {
    throw new Error(`Expected success title to read 通关成功，获得2, got text=${resultTitleText}.`);
  }
  if (doubleCoinButtonCount !== 1 || doubleCoinButtonText !== "双倍金币") {
    throw new Error(`Expected visible double coin button, got count=${doubleCoinButtonCount}, text=${doubleCoinButtonText}.`);
  }
  if (
    resultCoinCountText !== "2" ||
    !resultCoinStyle ||
    resultCoinStyle.parentAlign !== "center" ||
    resultCoinStyle.fontSize <= resultCoinStyle.parentFontSize ||
    resultCoinStyle.fontWeight < 700
  ) {
    throw new Error(`Expected highlighted larger bold coin number 2, got text=${resultCoinCountText}, style=${JSON.stringify(resultCoinStyle)}.`);
  }
  if (
    !resultCoinIconData ||
    resultCoinIconData.tagName !== "IMG" ||
    !resultCoinIconData.src.includes("result-coin.png") ||
    resultCoinIconData.background !== "none" ||
    Math.abs(resultCoinIconData.height - resultCoinStyle.fontSize) > 3 ||
    Math.abs(resultCoinIconData.width - resultCoinStyle.fontSize) > 3
  ) {
    throw new Error(`Expected coin reward to use a sliced image icon matching the number size, got ${JSON.stringify(resultCoinIconData)}.`);
  }
  if (nextLevelButtonCount !== 1 || nextLevelButtonText !== "下一关") {
    throw new Error(`Expected result screen to include 下一关 action, got count=${nextLevelButtonCount}, text=${nextLevelButtonText}.`);
  }
  if (resultButtonGaps.length !== 3 || resultButtonGaps.some((gap) => Math.abs(gap - 12) > 2)) {
    throw new Error(`Expected result action buttons to have 12px vertical gaps, got ${JSON.stringify(resultButtonGaps)}.`);
  }
  if (
    geometry.plaqueTop > geometry.cardTop - 24 ||
    geometry.plaqueTop < geometry.cardTop - 54 ||
    geometry.plaqueBottom < geometry.cardTop + 24 ||
    geometry.plaqueBottom > geometry.cardTop + 54
  ) {
    throw new Error(`Expected result title plaque to straddle the card top edge, got ${JSON.stringify(geometry)}.`);
  }
  await expectDesignedUiCutButtons(page, ".screen-result.active .result-card > button:not(.hidden)");
}

async function expectDesignedUiCutButtons(page, selector) {
  const buttonData = await page
    .locator(selector)
    .evaluateAll((nodes) =>
      nodes.map((node) => {
        const rect = node.getBoundingClientRect();
        return {
          background: getComputedStyle(node).backgroundImage,
          width: rect.width,
          height: rect.height,
        };
      }),
    );
  if (buttonData.length === 0) {
    throw new Error(`Expected designed buttons for ${selector}, got none.`);
  }
  const badBackground = buttonData.find((item) => !item.background.includes("assets/image/modal-button-"));
  if (badBackground) {
    throw new Error(`Expected ${selector} to use flat modal button image assets, got ${badBackground.background}.`);
  }
  const deformed = buttonData.find((item) => item.height < 48 || item.width / item.height > 4.8);
  if (deformed) {
    throw new Error(`Expected ${selector} buttons not to be stretched, got ${JSON.stringify(deformed)}.`);
  }
}

async function expectHintToolDoesNotBreathe(page) {
  const animation = await page
    .locator(".screen-game.active .tool-button--hint .tool-art")
    .evaluate((node) => getComputedStyle(node).animationName);
  if (animation.includes("tool-breathe")) {
    throw new Error(`Expected empty hint tool button not to breathe, got ${animation}.`);
  }
}

async function expectPageDoesNotScroll(page) {
  await page.evaluate(() => window.scrollTo(0, 600));
  await page.waitForTimeout(100);
  const scrollState = await page.evaluate(() => ({
    scrollY: window.scrollY,
    bodyOverflow: getComputedStyle(document.body).overflowY,
    htmlOverflow: getComputedStyle(document.documentElement).overflowY,
    scrollHeight: document.scrollingElement?.scrollHeight ?? 0,
    innerHeight: window.innerHeight,
  }));
  if (
    scrollState.scrollY !== 0 ||
    scrollState.bodyOverflow !== "hidden" ||
    scrollState.htmlOverflow !== "hidden" ||
    scrollState.scrollHeight > scrollState.innerHeight + 2
  ) {
    throw new Error(`Expected mobile game page not to scroll, got ${JSON.stringify(scrollState)}.`);
  }
}

async function finishGameAndExpectStarsAndNoStaminaAgain(page) {
  await page.evaluate(() => {
    localStorage.setItem(
      "lianliankan.stamina",
      JSON.stringify({ stamina: 3, updatedAt: Date.now(), adClaims: 0 }),
    );
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.locator("#startButton").click();
  await page.waitForSelector(".screen-game.active .tile:not(.empty)");
  await clearPairs(page, 80);
  await page.waitForSelector(".screen-result.active", { timeout: 3000 });
  await page.screenshot({ path: join(outputDir, "result-stars-mobile.png"), fullPage: true });
  const resultBadgeCount = await page.locator(".screen-result.active .result-badge").count();
  if (resultBadgeCount !== 1) {
    throw new Error(`Expected result screen to show one result badge, got ${resultBadgeCount}.`);
  }
  await expectMobileResultDesignSystem(page);
  const stars = await page.locator("#resultStars .star.filled").count();
  if (stars < 1 || stars > 3) {
    throw new Error(`Expected completed level to show 1-3 filled stars, got ${stars}.`);
  }

  const resultReplayText = await page.locator("#againButton").innerText();
  if (resultReplayText !== "再玩一局") {
    throw new Error(`Expected result replay button to stay as replay action, got ${JSON.stringify(resultReplayText)}.`);
  }
  await page.locator("#againButton").click();
  await page.waitForSelector("#staminaModal:not(.hidden)", { timeout: 2000 });
  const staminaActionCount = await page.locator("#staminaModal:not(.hidden) .modal-actions button").count();
  const staminaTitleCount = await page.locator("#staminaModal:not(.hidden) #staminaTitle").count();
  if (staminaTitleCount !== 1 || staminaActionCount !== 3) {
    throw new Error(
      `Expected no-stamina replay modal with title and 3 actions, got title=${staminaTitleCount}, actions=${staminaActionCount}`,
    );
  }
  await page.screenshot({ path: join(outputDir, "stamina-modal-mobile.png"), fullPage: true });
  await expectMobileModalDesignSystem(page, "#staminaModal");
  await page.locator("#staminaAdButton").click();
  const staminaAfterAd = await readStoredStamina(page);
  if (staminaAfterAd.stamina !== 30 || staminaAfterAd.adClaims !== 1) {
    throw new Error(`Expected ad to grant 30 stamina once, got: ${JSON.stringify(staminaAfterAd)}`);
  }

  await page.evaluate(() => {
    localStorage.setItem(
      "lianliankan.stamina",
      JSON.stringify({ stamina: 1, updatedAt: Date.now(), adClaims: 3 }),
    );
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.locator("#startButton").click();
  await page.waitForSelector("#staminaModal:not(.hidden)", { timeout: 2000 });
  const maxClaimAdButtonDisabled = await page.locator("#staminaAdButton").isDisabled();
  if (maxClaimAdButtonDisabled) {
    throw new Error("Expected max-claim stamina ad button to stay clickable.");
  }
  const maxClaimInitialTitle = await page.locator("#staminaTitle").innerText();
  const maxClaimInitialMessage = await page.locator("#staminaMessage").innerText();
  if (
    maxClaimInitialTitle !== "体力不足" ||
    maxClaimInitialMessage !== "开始一关需要3点体力，可以看广告获取或去商城购买体力。"
  ) {
    throw new Error(
      `Expected max-claim stamina modal to keep the no-stamina copy before click, got title=${JSON.stringify(maxClaimInitialTitle)}, message=${JSON.stringify(maxClaimInitialMessage)}`,
    );
  }
  await page.locator("#staminaAdButton").click();
  await page.waitForFunction(() => document.querySelector("#toast.show")?.textContent.includes("今日已达上限"));
  const maxClaimToast = await page.locator("#toast.show").innerText();
  const staminaAfterMaxClaimClick = await readStoredStamina(page);
  if (
    !maxClaimToast.includes("今日已达上限") ||
    staminaAfterMaxClaimClick.stamina !== 1 ||
    staminaAfterMaxClaimClick.adClaims !== 3
  ) {
    throw new Error(
      `Expected max ad claim click to show a small limit toast without changing stamina, got toast=${JSON.stringify(maxClaimToast)}, stamina=${JSON.stringify(staminaAfterMaxClaimClick)}`,
    );
  }
  await page.locator("#startButton").click();
  await page.waitForSelector("#staminaModal:not(.hidden)", { timeout: 2000 });
  await page.locator("#staminaBuyButton").click();
  await page.waitForFunction(() => document.querySelector("#toast.show")?.textContent.includes("功能暂未开放"));
  const staminaPurchaseToast = await page.locator("#toast.show").innerText();
  const staminaAfterPurchase = await readStoredStamina(page);
  if (!staminaPurchaseToast.includes("功能暂未开放") || staminaAfterPurchase.stamina !== 1 || staminaAfterPurchase.adClaims !== 3) {
    throw new Error(
      `Expected stamina purchase to show buy placeholder without changing stamina, got toast=${JSON.stringify(staminaPurchaseToast)}, stamina=${JSON.stringify(staminaAfterPurchase)}`,
    );
  }
}

async function finishFreshLevelAndExpectHomeVines(page) {
  await page.evaluate((nextStamina) => {
    localStorage.setItem(
      "lianliankan.stamina",
      JSON.stringify({ stamina: nextStamina, updatedAt: Date.now(), adClaims: 0 }),
    );
    localStorage.setItem(
      "lianliankan.progress",
      JSON.stringify({
        highestUnlockedLevel: 1,
        coins: 0,
        records: {},
      }),
    );
  }, fullStamina);
  await page.reload({ waitUntil: "networkidle" });
  await page.locator("#startButton").click();
  await page.waitForSelector(".screen-game.active .tile:not(.empty)");

  const hasSmokeHook = await page.evaluate(() => typeof window.__linkMatchSmoke?.finishGameForSmoke === "function");
  if (!hasSmokeHook) {
    throw new Error("Expected boardSeed smoke URL to expose finishGameForSmoke hook.");
  }

  await page.evaluate(() => window.__linkMatchSmoke.finishGameForSmoke(true));
  await page.waitForSelector('.screen-result.active[data-result="success"]', { timeout: 2000 });
  await expectDoubleCoinAdReward(page);
  await page.locator("#homeButton").click();
  await page.waitForSelector(".screen-start.active", { timeout: 2000 });
  await page.waitForFunction(() => document.querySelectorAll(".road-vine-image-segment").length === 29);
  await expectFruitVineConnectorsAligned(page, "after success result home return");
  await page.screenshot({ path: join(outputDir, "home-after-success-return.png"), fullPage: true });
}

async function expectDoubleCoinAdReward(page) {
  await page.evaluate(() => {
    window.__linkMatchRewardedAd = async () => ({ completed: false });
  });
  await page.locator("#doubleCoinsButton").click();
  await page.waitForFunction(() => document.querySelector("#resultToast.show")?.textContent.includes("广告没看完"));
  const coinsAfterIncompleteAd = await page.evaluate(() => JSON.parse(localStorage.getItem("lianliankan.progress")).coins);
  if (coinsAfterIncompleteAd !== 2) {
    throw new Error(`Expected incomplete double-coin ad to keep coins at 2, got ${coinsAfterIncompleteAd}.`);
  }

  await page.evaluate(() => {
    window.__linkMatchRewardedAd = async () => true;
  });
  await page.locator("#doubleCoinsButton").click();
  await page.waitForFunction(() => document.querySelector("#resultToast.show")?.textContent.includes("获得双倍金币"));
  const doubleRewardData = await page.locator(".screen-result.active").evaluate((screen) => ({
    coins: JSON.parse(localStorage.getItem("lianliankan.progress")).coins,
    doubleButtonVisible: !screen.querySelector("#doubleCoinsButton")?.classList.contains("hidden"),
    gameToastVisible: Boolean(document.querySelector("#toast.show")),
    resultToastParent: screen.querySelector("#resultToast")?.closest(".result-card")?.className ?? "",
    resultToastGeometry: (() => {
      const toast = screen.querySelector("#resultToast");
      const badge = screen.querySelector(".result-badge");
      const card = screen.querySelector(".result-card");
      const toastBox = toast?.getBoundingClientRect();
      const badgeBox = badge?.getBoundingClientRect();
      const cardBox = card?.getBoundingClientRect();
      return {
        cardTop: Math.round(cardBox?.top ?? 0),
        toastHeight: Math.round(toastBox?.height ?? 0),
        toastTop: Math.round(toastBox?.top ?? 0),
        toastWidth: Math.round(toastBox?.width ?? 0),
      };
    })(),
  }));
  if (
    doubleRewardData.coins !== 4 ||
    !doubleRewardData.doubleButtonVisible ||
    doubleRewardData.gameToastVisible ||
    !doubleRewardData.resultToastParent.includes("result-card") ||
    doubleRewardData.resultToastGeometry.toastTop - doubleRewardData.resultToastGeometry.cardTop < 30 ||
    doubleRewardData.resultToastGeometry.toastTop - doubleRewardData.resultToastGeometry.cardTop > 60 ||
    doubleRewardData.resultToastGeometry.toastHeight < 40 ||
    doubleRewardData.resultToastGeometry.toastWidth < 220
  ) {
    throw new Error(`Expected completed double-coin ad to grant one extra reward and keep button visible, got ${JSON.stringify(doubleRewardData)}.`);
  }

  await page.waitForFunction(() => document.querySelector("#resultToast.hidden"), null, { timeout: 3200 });

  await page.locator("#doubleCoinsButton").click();
  await page.waitForFunction(() => document.querySelector("#resultToast.show")?.textContent.includes("已经领取过"));
  const coinsAfterRepeatClick = await page.evaluate(() => JSON.parse(localStorage.getItem("lianliankan.progress")).coins);
  if (coinsAfterRepeatClick !== 4) {
    throw new Error(`Expected repeated double-coin click not to add coins again, got ${coinsAfterRepeatClick}.`);
  }
  await page.waitForFunction(() => document.querySelector("#resultToast.hidden"), null, { timeout: 3200 });
}

async function expectFruitVineConnectorsAligned(page, label) {
  const vineData = await page.locator(".screen-start.active").evaluate(() => {
    const road = document.querySelector("#levelRoad");
    const roadRect = road.getBoundingClientRect();
    const segments = [...document.querySelectorAll(".road-vine-image-segment")].map((node) => ({
      left: Number.parseFloat(node.style.left),
      width: Number.parseFloat(node.style.width),
      top: Number.parseFloat(node.style.top),
    }));
    return {
      count: segments.length,
      roadWidth: Math.round(roadRect.width),
      segments,
    };
  });
  const misplaced = vineData.segments.filter(
    (segment) =>
      !Number.isFinite(segment.left) ||
      !Number.isFinite(segment.width) ||
      segment.left < vineData.roadWidth * 0.2 ||
      segment.left > vineData.roadWidth * 0.8 ||
      segment.width < vineData.roadWidth * 0.35,
  );
  if (vineData.count !== 29 || vineData.roadWidth <= 0 || misplaced.length) {
    throw new Error(`Expected fruit vine connectors to stay aligned ${label}, got ${JSON.stringify(vineData)}.`);
  }
}

async function finishCompletedLevelAndExpectNoCoinMessage(page) {
  await page.evaluate((nextStamina) => {
    localStorage.setItem(
      "lianliankan.stamina",
      JSON.stringify({ stamina: nextStamina, updatedAt: Date.now(), adClaims: 0 }),
    );
    localStorage.setItem(
      "lianliankan.progress",
      JSON.stringify({
        highestUnlockedLevel: 2,
        coins: 2,
        records: {
          1: { completed: true, bestScore: 1200, bestStars: 2 },
        },
      }),
    );
  }, fullStamina);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".screen-start.active .road-level.completed", { timeout: 2000 });
  await page.locator(".screen-start.active .road-level.completed").first().click();
  await page.waitForSelector(".screen-game.active .tile:not(.empty)");

  const hasSmokeHook = await page.evaluate(() => typeof window.__linkMatchSmoke?.finishGameForSmoke === "function");
  if (!hasSmokeHook) {
    throw new Error("Expected boardSeed smoke URL to expose finishGameForSmoke hook.");
  }

  await page.evaluate(() => window.__linkMatchSmoke.finishGameForSmoke(true));
  await page.waitForSelector('.screen-result.active[data-result="success"]', { timeout: 2000 });

  const repeatResult = await page.locator(".screen-result.active #resultTitle").evaluate((title) => ({
    coinCount: title.querySelectorAll(".result-coin-count").length,
    doubleCoinButtonVisible: !document.querySelector("#doubleCoinsButton")?.classList.contains("hidden"),
    iconCount: title.querySelectorAll(".result-coin-icon").length,
    text: title.innerText,
  }));
  if (repeatResult.text.replace(/\s+/g, "") !== "恭喜通关，重复关卡无法获得金币。") {
    throw new Error(`Expected replay clear no-coin message, got: ${repeatResult.text}.`);
  }
  if (repeatResult.coinCount !== 0 || repeatResult.iconCount !== 0) {
    throw new Error(`Expected replay clear title without coin number or icon, got ${JSON.stringify(repeatResult)}.`);
  }
  if (repeatResult.doubleCoinButtonVisible) {
    throw new Error(`Expected replay clear result to hide double coin button, got ${JSON.stringify(repeatResult)}.`);
  }

  const storedProgress = await page.evaluate(() => JSON.parse(localStorage.getItem("lianliankan.progress")));
  if (storedProgress.coins !== 2) {
    throw new Error(`Expected replay clear to keep coin balance at 2, got ${storedProgress.coins}.`);
  }
}

async function finishGameAndExpectFailureBadge(page) {
  await page.evaluate((nextStamina) => {
    localStorage.setItem(
      "lianliankan.stamina",
      JSON.stringify({ stamina: nextStamina, updatedAt: Date.now(), adClaims: 0 }),
    );
  }, fullStamina);
  await page.reload({ waitUntil: "networkidle" });
  await page.locator("#startButton").click();
  await page.waitForSelector(".screen-game.active .tile:not(.empty)");

  const hasSmokeHook = await page.evaluate(
    () =>
      typeof window.__linkMatchSmoke?.finishGameForSmoke === "function" &&
      typeof window.__linkMatchSmoke?.setRemainingSecondsForSmoke === "function" &&
      typeof window.__linkMatchSmoke?.setTimerLastTickAtForSmoke === "function" &&
      typeof window.__linkMatchSmoke?.tickTimerForSmoke === "function",
  );
  if (!hasSmokeHook) {
    throw new Error("Expected boardSeed smoke URL to expose timer and finishGame smoke hooks.");
  }

  await page.evaluate(() => {
    window.__linkMatchSmoke.setRemainingSecondsForSmoke(5);
    window.__linkMatchSmoke.setTimerLastTickAtForSmoke(Date.now() - 6_000);
    window.__linkMatchSmoke.tickTimerForSmoke();
  });
  await page.waitForSelector('.screen-result.active[data-result="failure"]', { timeout: 2000 });
  await page.screenshot({ path: join(outputDir, "result-failure-mobile.png"), fullPage: true });

  const failureData = await page.locator(".screen-result.active").evaluate(async (screen) => {
    const badge = screen.querySelector(".result-badge");
    const badgeArt = screen.querySelector(".result-badge-art");
    const title = screen.querySelector("#resultTitle");
    const nextLevelButton = screen.querySelector("#nextLevelButton");
    const doubleCoinsButton = screen.querySelector("#doubleCoinsButton");
    const reviveButton = screen.querySelector("#reviveButton");
    const resultBuyToolsButton = screen.querySelector("#resultBuyToolsButton");
    const againButton = screen.querySelector("#againButton");
    const homeButton = screen.querySelector("#homeButton");
    if (
      !badge ||
      !badgeArt ||
      !title ||
      !nextLevelButton ||
      !doubleCoinsButton ||
      !reviveButton ||
      !resultBuyToolsButton ||
      !againButton ||
      !homeButton
    ) {
      return null;
    }
    if (!badgeArt.complete) {
      await new Promise((resolve) => badgeArt.addEventListener("load", resolve, { once: true }));
    }

    const canvas = document.createElement("canvas");
    canvas.width = badgeArt.naturalWidth;
    canvas.height = badgeArt.naturalHeight;
    const context = canvas.getContext("2d");
    context.drawImage(badgeArt, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let redPixels = 0;
    let redX = 0;
    let redY = 0;

    for (let index = 0; index < pixels.length; index += 4) {
      const red = pixels[index];
      const green = pixels[index + 1];
      const blue = pixels[index + 2];
      const alpha = pixels[index + 3];
      if (alpha < 80 || red < 170 || green > 100 || blue > 100 || red < green + 70 || red < blue + 70) {
        continue;
      }
      const pixelIndex = index / 4;
      redPixels += 1;
      redX += pixelIndex % canvas.width;
      redY += Math.floor(pixelIndex / canvas.width);
    }

    const badgeBox = badge.getBoundingClientRect();
    const artBox = badgeArt.getBoundingClientRect();
    const titleStyle = getComputedStyle(title);
    const badgeStyle = getComputedStyle(badge);
    return {
      artHeight: Math.round(artBox.height),
      artWidth: Math.round(artBox.width),
      badgeBackground: getComputedStyle(badge).backgroundImage,
      badgeTransform: badgeStyle.transform,
      centerX: redPixels > 0 ? Number((redX / redPixels / canvas.width).toFixed(3)) : 0,
      centerY: redPixels > 0 ? Number((redY / redPixels / canvas.height).toFixed(3)) : 0,
      redRatio: Number((redPixels / (canvas.width * canvas.height)).toFixed(4)),
      src: badgeArt.getAttribute("src") ?? "",
      titleFontSize: Number.parseFloat(titleStyle.fontSize),
      titleTextAlign: titleStyle.textAlign,
      title: title.innerText,
      nextLevelHidden: nextLevelButton.classList.contains("hidden"),
      doubleCoinHidden: doubleCoinsButton.classList.contains("hidden"),
      reviveHidden: reviveButton.classList.contains("hidden"),
      reviveText: reviveButton.innerText,
      buyToolsHidden: resultBuyToolsButton.classList.contains("hidden"),
      buyToolsText: resultBuyToolsButton.innerText,
      againHidden: againButton.classList.contains("hidden"),
      againText: againButton.innerText,
      homeHidden: homeButton.classList.contains("hidden"),
      homeText: homeButton.innerText,
      badgeWidth: Math.round(badgeBox.width),
    };
  });

  if (
    !failureData ||
    !failureData.src.includes("result-fail-badge.png") ||
    failureData.title !== "挑战失败，再来一次吧。" ||
    failureData.titleFontSize < 16 ||
    failureData.titleFontSize > 19 ||
    failureData.titleTextAlign !== "center" ||
    !failureData.nextLevelHidden ||
    !failureData.doubleCoinHidden ||
    failureData.reviveHidden ||
    failureData.reviveText !== "复活" ||
    failureData.buyToolsHidden ||
    failureData.buyToolsText !== "购买道具" ||
    failureData.againHidden ||
    failureData.againText !== "再玩一局" ||
    failureData.homeHidden ||
    failureData.homeText !== "返回首页" ||
    failureData.artWidth < 120 ||
    failureData.artHeight < 120 ||
    failureData.badgeWidth < 128 ||
    failureData.badgeBackground !== "none" ||
    !failureData.badgeTransform.includes("-30") ||
    failureData.redRatio < 0.008 ||
    failureData.redRatio > 0.04 ||
    Math.abs(failureData.centerX - 0.5) > 0.06 ||
    Math.abs(failureData.centerY - 0.47) > 0.08
  ) {
    throw new Error(`Expected failure result to use centered medium red-X badge, got ${JSON.stringify(failureData)}.`);
  }

  await expectFailureReviveAdFlow(page);

  await page.locator("#homeButton").click();
  await page.waitForSelector(".screen-start.active");
}

async function expectFailureReviveAdFlow(page) {
  await page.evaluate(() => {
    window.__linkMatchRewardedAd = async () => ({ completed: false });
  });
  await page.locator("#reviveButton").click();
  await page.waitForFunction(() => document.querySelector("#resultToast.show")?.textContent.includes("复活失败"));
  const failedReviveData = await page.locator(".screen-result.active").evaluate((screen) => ({
    resultStillActive: screen.classList.contains("active"),
    reviveDisabled: screen.querySelector("#reviveButton")?.disabled ?? true,
    timeText: document.querySelector("#timeText")?.textContent ?? "",
  }));
  if (!failedReviveData.resultStillActive || failedReviveData.reviveDisabled || failedReviveData.timeText !== "00:00") {
    throw new Error(`Expected incomplete revive ad to keep failure result open and time at 00:00, got ${JSON.stringify(failedReviveData)}.`);
  }

  await page.evaluate(() => {
    window.__linkMatchRewardedAd = async ({ placement }) => {
      window.__lastRewardedPlacement = placement;
      return true;
    };
  });
  await page.locator("#reviveButton").click();
  await page.waitForFunction(() => document.querySelector(".screen-game.active") && !document.querySelector(".screen-result.active"));
  await page.waitForFunction(() => document.querySelector("#timeText")?.textContent === "03:00");
  const revivedData = await page.evaluate(() => ({
    placement: window.__lastRewardedPlacement,
    resultActive: Boolean(document.querySelector(".screen-result.active")),
    gameActive: Boolean(document.querySelector(".screen-game.active")),
    timeText: document.querySelector("#timeText")?.textContent ?? "",
    remainingText: document.querySelector("#remainingText")?.textContent ?? "",
    toast: document.querySelector("#toast.show")?.textContent ?? "",
  }));
  if (
    revivedData.placement !== "revive" ||
    revivedData.resultActive ||
    !revivedData.gameActive ||
    revivedData.timeText !== "03:00" ||
    Number(revivedData.remainingText) <= 0 ||
    !revivedData.toast.includes("复活成功")
  ) {
    throw new Error(`Expected completed revive ad to resume the board with reset time, got ${JSON.stringify(revivedData)}.`);
  }

  await page.evaluate(() => {
    window.__linkMatchSmoke.setRemainingSecondsForSmoke(0);
    window.__linkMatchSmoke.finishGameForSmoke(false);
  });
  await page.waitForSelector('.screen-result.active[data-result="failure"]', { timeout: 2000 });
  const secondFailureReviveData = await page.locator(".screen-result.active #reviveButton").evaluate((button) => ({
    hidden: button.classList.contains("hidden"),
    disabled: button.disabled,
    text: button.innerText,
  }));
  if (!secondFailureReviveData.hidden) {
    throw new Error(
      `Expected revive button to be hidden after it has already been used once in the same run, got ${JSON.stringify(secondFailureReviveData)}.`,
    );
  }

  await page.locator(".screen-result.active #resultBuyToolsButton").click();
  await page.waitForFunction(() => document.querySelector("#resultToast.show")?.textContent.includes("功能暂未开放"));
  const buyToolsToast = await page.locator("#resultToast.show").innerText();
  if (!buyToolsToast.includes("功能暂未开放")) {
    throw new Error(`Expected result buy-tools action to show coming-soon toast, got ${JSON.stringify(buyToolsToast)}.`);
  }
}

async function readStoredStamina(page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem("lianliankan.stamina")));
}

function isAudioStartEvent(event) {
  return (
    event === "audio-play" ||
    event.startsWith("audio-created:") ||
    event === "context-created" ||
    event === "oscillator-start"
  );
}

async function expectTilePressFeedback(page) {
  const tile = page.locator(".screen-game.active .tile:not(.empty)").first();
  await tile.waitFor({ timeout: 2000 });
  const handle = await tile.elementHandle();
  if (!handle) throw new Error("Expected an active tile to test press feedback.");

  await tile.dispatchEvent("pointerdown", { pointerType: "touch", isPrimary: true, button: 0 });
  const pressedState = await handle.evaluate((element) => ({
    pressed: element.classList.contains("pressed"),
    transform: getComputedStyle(element).transform,
    boxShadow: getComputedStyle(element).boxShadow,
  }));
  if (!pressedState.pressed || pressedState.transform === "none" || pressedState.boxShadow === "none") {
    throw new Error(`Expected tile pointerdown to show pressed feedback, got ${JSON.stringify(pressedState)}.`);
  }

  await tile.dispatchEvent("pointerup", { pointerType: "touch", isPrimary: true, button: 0 });
  await page.waitForFunction((element) => !element.classList.contains("pressed"), handle, { timeout: 500 });
}

async function clickTile(page, point) {
  await page.locator(`[data-row="${point.row}"][data-col="${point.col}"]`).click();
}

async function getFirstTileAspect(page) {
  return page.evaluate(() => {
    const tile = document.querySelector(".tile:not(.empty)");
    if (!tile) return 1;
    const rect = tile.getBoundingClientRect();
    return Math.max(rect.width / rect.height, rect.height / rect.width);
  });
}

async function getFirstTileArtRatio(page) {
  return page.evaluate(() => {
    const tile = document.querySelector(".tile:not(.empty)");
    const art = tile?.querySelector(".tile-art");
    if (!tile || !art) return 0;
    const tileRect = tile.getBoundingClientRect();
    const artRect = art.getBoundingClientRect();
    return Math.max(artRect.width / tileRect.width, artRect.height / tileRect.height);
  });
}

async function getFirstTileVisibleArtRatio(page) {
  return page.evaluate(async () => {
    const tile = document.querySelector(".tile:not(.empty)");
    const art = tile?.querySelector(".tile-art");
    if (!tile || !art) return 0;
    if (!art.complete || !art.naturalWidth) {
      await new Promise((resolve, reject) => {
        art.addEventListener("load", resolve, { once: true });
        art.addEventListener("error", reject, { once: true });
      });
    }

    const tileRect = tile.getBoundingClientRect();
    const artRect = art.getBoundingClientRect();
    const canvas = document.createElement("canvas");
    canvas.width = art.naturalWidth;
    canvas.height = art.naturalHeight;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(art, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let minX = canvas.width;
    let minY = canvas.height;
    let maxX = -1;
    let maxY = -1;

    for (let pixelIndex = 0; pixelIndex < pixels.length; pixelIndex += 4) {
      if (pixels[pixelIndex + 3] <= 8) continue;
      const pointIndex = pixelIndex / 4;
      const x = pointIndex % canvas.width;
      const y = Math.floor(pointIndex / canvas.width);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }

    if (maxX < 0) return 0;
    const visibleWidthRatio = (maxX - minX + 1) / canvas.width;
    const visibleHeightRatio = (maxY - minY + 1) / canvas.height;
    return Math.max(
      visibleWidthRatio * (artRect.width / tileRect.width),
      visibleHeightRatio * (artRect.height / tileRect.height),
    );
  });
}

function findBrowserExecutable() {
  const candidates = [
    process.env.BROWSER_EXECUTABLE,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ].filter(Boolean);

  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}
