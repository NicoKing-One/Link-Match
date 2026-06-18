import { createReadStream, existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { extname, join, normalize } from "node:path";
import Module from "node:module";

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
const modalDesignDraft = join(process.cwd(), "docs", "ui-design-drafts", "mobile-modal-result-design.png");
const modalCardBackground = join(process.cwd(), "src", "assets", "ui-cut", "modal-card-bg.png");
const browserExecutable = findBrowserExecutable();
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
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
if (!existsSync(modalDesignDraft)) {
  throw new Error(`Expected mobile popup/result design draft to exist: ${modalDesignDraft}`);
}
if (!existsSync(modalCardBackground)) {
  throw new Error(`Expected mobile popup/result card background to exist: ${modalCardBackground}`);
}

const browser = await chromium.launch({
  headless: true,
  ...(browserExecutable ? { executablePath: browserExecutable } : {}),
});
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await page.goto(smokeUrl, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  const initialStamina = await page.locator(".screen-start .staminaText").innerText();
  if (initialStamina !== "50/50") {
    throw new Error(`Expected reset stamina to be 50/50, got: ${initialStamina}`);
  }
  const bodyFont = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
  if (!bodyFont.includes("Microsoft YaHei") && !bodyFont.includes("寰蒋闆呴粦")) {
    throw new Error(`Expected Microsoft YaHei font family, got: ${bodyFont}`);
  }
  const initialCountdown = await page.locator(".screen-start .staminaCountdown").innerText();
  if (!initialCountdown.includes("刷新")) {
    throw new Error(`Expected full stamina countdown to show reset time, got: ${initialCountdown}`);
  }
  await expectHomeRoadMap(page);
  await page.screenshot({ path: join(outputDir, "home-map-mobile.png"), fullPage: true });
  await seedProfileThreeStarState(page);
  await expectSecondaryPageNavigation(page);
  await seedPlayableFreshState(page);
  await expectStaleFullStaminaSpend(page);
  await page.evaluate(() => localStorage.clear());
  await seedPlayableFreshState(page);
  await page.locator("#startButton").click();
  await page.waitForSelector(".screen-game.active .tile:not(.empty)");
  const staminaAfterStart = await readStoredStamina(page);
  const gameStaminaText = await page.locator(".screen-game .staminaText").innerText();
  if (staminaAfterStart.stamina !== 47 || gameStaminaText !== "47/50") {
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
  const tileArtRatio = await getFirstTileArtRatio(page);
  const gameStaminaCountdownCount = await page.locator(".screen-game.active .staminaCountdown").count();
  const bestPillCount = await page.locator(".screen-game.active .best-pill").count();
  const expectedTileCount = await readCurrentLevelTileCount(page);
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
  await expectDraftThreeVisualSystem(page);
  await expectUiCutAssets(page);
  await expectPageDoesNotScroll(page);
  if (tileArtRatio < 0.82 || tileArtRatio > 1.12) {
    throw new Error(`Expected tile art to occupy most of the tile, got ratio=${tileArtRatio.toFixed(2)}.`);
  }

  const firstAspect = await getFirstTileAspect(page);
  await clickInvalidPair(page);
  await page.waitForSelector(".toast.show", { timeout: 2000 });
  const toastText = await page.locator(".toast.show").innerText();
  const selectedAfterMismatch = await page.locator(".tile.selected").count();
  const shakingAfterMismatch = await page.locator(".tile.shake").count();
  if (!toastText.includes("不能连接")) {
    throw new Error(`Expected mismatch warning, got: ${toastText}`);
  }
  await expectToastDoesNotCoverBoard(page);
  if (selectedAfterMismatch !== 0) {
    throw new Error(`Expected mismatch to clear selection, got ${selectedAfterMismatch} selected tile(s).`);
  }
  if (shakingAfterMismatch < 2) {
    throw new Error(`Expected mismatch to shake both selected tiles, got ${shakingAfterMismatch}.`);
  }

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
  await page.locator("#toolCloseButton").click();

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
  await page.locator("#resumeButton").click();
  await page.screenshot({ path: join(outputDir, "smoke-mobile.png"), fullPage: true });
  await gameHomeButton.click();
  await page.waitForSelector("#exitModal:not(.hidden)", { timeout: 2000 });
  await page.screenshot({ path: join(outputDir, "exit-modal-mobile.png"), fullPage: true });
  await expectModalHasIcon(page, "#exitModal");
  await expectMobileModalDesignSystem(page, "#exitModal");
  await expectModalIconAsset(page, "#exitModal", "modal-exit-badge.png");
  await page.locator("#confirmRestartButton").click();
  await page.waitForSelector(".screen-game.active .tile:not(.empty)");
  await gameHomeButton.click();
  await page.waitForSelector("#exitModal:not(.hidden)", { timeout: 2000 });
  await page.locator("#confirmHomeButton").click();
  await page.waitForSelector(".screen-start.active");

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
  await page.evaluate(() => {
    localStorage.setItem(
      "lianliankan.stamina",
      JSON.stringify({ stamina: 50, updatedAt: Date.now() - 20 * 60 * 1000, adClaims: 0 }),
    );
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.locator("#startButton").click();
  await page.waitForSelector(".screen-game.active .tile:not(.empty)");
  await page.waitForTimeout(1200);
  const gameStaminaText = await page.locator(".screen-game .staminaText").innerText();
  const stored = await readStoredStamina(page);
  if (gameStaminaText !== "47/50" || stored.stamina !== 47) {
    throw new Error(`Expected stale full stamina to spend to 47/50, got text=${gameStaminaText}, stored=${stored.stamina}.`);
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

async function seedPlayableFreshState(page, stamina = 50) {
  await page.evaluate((nextStamina) => {
    localStorage.setItem("lianliankan.dataResetVersion", "2026-06-13-full-stamina-baseline");
    localStorage.setItem(
      "lianliankan.progress",
      JSON.stringify({ highestUnlockedLevel: 1, coins: 0, records: {} }),
    );
    localStorage.setItem(
      "lianliankan.stamina",
      JSON.stringify({ stamina: nextStamina, updatedAt: Date.now(), adClaims: 0 }),
    );
  }, stamina);
  await page.reload({ waitUntil: "networkidle" });
}

async function seedProfileThreeStarState(page) {
  await page.evaluate(() => {
    localStorage.setItem("lianliankan.dataResetVersion", "2026-06-13-full-stamina-baseline");
    localStorage.setItem(
      "lianliankan.progress",
      JSON.stringify({
        highestUnlockedLevel: 4,
        coins: 86,
        records: {
          1: { completed: true, bestScore: 1200, bestStars: 3 },
          2: { completed: true, bestScore: 900, bestStars: 2 },
          3: { completed: true, bestScore: 1500, bestStars: 3 },
        },
      }),
    );
    localStorage.setItem("lianliankan.stamina", JSON.stringify({ stamina: 50, updatedAt: Date.now(), adClaims: 0 }));
  });
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
  if (Math.abs(boardCentering.centerDelta) > 10 || boardCentering.gapAbove < 0 || boardCentering.gapBelow < 0) {
    throw new Error(`Expected board frame to be centered between HUD and toolbar, got ${JSON.stringify(boardCentering)}.`);
  }
}

async function expectToastDoesNotCoverBoard(page) {
  const boxes = await page.evaluate(() => {
    const toast = document.querySelector(".screen-game.active .toast.show")?.getBoundingClientRect();
    const board = document.querySelector(".screen-game.active .board")?.getBoundingClientRect();
    if (!toast || !board) return null;
    return {
      toast: { top: toast.top, right: toast.right, bottom: toast.bottom, left: toast.left },
      board: { top: board.top, right: board.right, bottom: board.bottom, left: board.left },
    };
  });
  if (!boxes) throw new Error("Could not measure toast and board bounds.");
  const overlaps =
    boxes.toast.left < boxes.board.right &&
    boxes.toast.right > boxes.board.left &&
    boxes.toast.top < boxes.board.bottom &&
    boxes.toast.bottom > boxes.board.top;
  if (overlaps) {
    throw new Error(
      `Expected toast not to cover board, got toast=${JSON.stringify(boxes.toast)}, board=${JSON.stringify(
        boxes.board,
      )}.`,
    );
  }
}

async function expectUiCutAssets(page) {
  const imageSources = await page
    .locator(
      ".screen-game.active .hud-icon, .screen-game.active .tool-art, .screen-game.active .home-art",
    )
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("src") ?? ""));
  const badSource = imageSources.find((source) => !source.includes("./assets/ui-cut/"));
  if (badSource) {
    throw new Error(`Expected game UI to use independent ui-cut assets, got ${badSource}.`);
  }

  const bannerBackground = await page
    .locator(".screen-game.active .stage-banner")
    .evaluate((node) => getComputedStyle(node).backgroundImage);
  if (!bannerBackground.includes("assets/ui-cut/title-plaque.png")) {
    throw new Error(`Expected stage banner to use ui-cut title plaque, got ${bannerBackground}.`);
  }
}

async function expectDraftThreeVisualSystem(page) {
  const visualShell = await page.locator(".screen-game.active.draft-three-shell").count();
  const organicHud = await page.locator(".screen-game.active .organic-hud-frame").count();
  const glassBoard = await page.locator(".screen-game.active .glass-board-frame").count();
  const creamToolbar = await page.locator(".screen-game.active .cream-tool-tray").count();
  const targetPath = await page.locator(".screen-game.active").getAttribute("data-visual-target");

  if (visualShell !== 1 || organicHud !== 1 || glassBoard !== 1 || creamToolbar !== 1) {
    throw new Error(
      `Expected draft-03 visual structure, got shell=${visualShell}, hud=${organicHud}, board=${glassBoard}, toolbar=${creamToolbar}.`,
    );
  }
  if (!targetPath?.includes("ui-design-draft-03.png")) {
    throw new Error(`Expected game screen to record draft-03 as visual target, got: ${targetPath}`);
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
  const visualTarget = await page.locator(`${selector}:not(.hidden)`).getAttribute("data-visual-target");
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
  if (!visualTarget?.includes("mobile-modal-result-design.png")) {
    throw new Error(`Expected ${selector} to record the mobile popup design draft, got ${visualTarget}.`);
  }
  if (iconSources.length !== 1 || iconSources.some((source) => !source.includes("./assets/ui-cut/"))) {
    throw new Error(`Expected ${selector} icon to use one ui-cut image, got: ${iconSources.join(", ")}`);
  }
  if (!/^第\d{2}关$/.test(plaqueLabelText) || plaqueDecorCount !== 0) {
    throw new Error(
      `Expected ${selector} title plaque to show level text without star decorators, got label=${plaqueLabelText}, decor=${plaqueDecorCount}.`,
    );
  }
  if (!cardBackground.includes("assets/ui-cut/modal-card-bg.png")) {
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
  const continueText = await page.locator("#startButton").innerText();
  const homeTitleCount = await page.locator(".screen-start.active .home-brand h1, .screen-start.active .home-brand .eyebrow").count();
  const homeStaminaButtonCount = await page.locator(".screen-start.active .getStaminaButton").count();
  const homeStatLabelCount = await page.locator(".screen-start.active .home-stat-label").count();
  const homeStatSmallCount = await page.locator(".screen-start.active .home-stat small").count();
  const scrollInfo = await page.locator("#roadScroll").evaluate((node) => ({
    clientHeight: node.clientHeight,
    scrollHeight: node.scrollHeight,
  }));
  const layoutInfo = await page.evaluate(() => {
    const startButton = document.querySelector("#startButton");
    const first = document.querySelector('.road-level strong');
    const levelOne = [...document.querySelectorAll(".road-level")].find((node) => node.textContent.includes("01"));
    const levelTwo = [...document.querySelectorAll(".road-level")].find((node) => node.textContent.includes("02"));
    const dock = document.querySelector(".home-bottom-dock");
    const startButtonStyle = getComputedStyle(startButton);
    const buttonRect = startButton.getBoundingClientRect();
    return {
      buttonWidth: buttonRect.width,
      buttonHeight: buttonRect.height,
      buttonRatio: buttonRect.width / buttonRect.height,
      viewportWidth: window.innerWidth,
      buttonBottom: window.innerHeight - buttonRect.bottom,
      levelOneTop: levelOne.getBoundingClientRect().top,
      levelTwoTop: levelTwo.getBoundingClientRect().top,
      hasDock: Boolean(dock),
      dockPaddingBottom: dock ? getComputedStyle(dock).paddingBottom : "",
      buttonDisplay: startButtonStyle.display,
      buttonAlignItems: startButtonStyle.alignItems,
      buttonJustifyItems: startButtonStyle.justifyItems,
      buttonLineHeight: startButtonStyle.lineHeight,
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
  if (lockedCount < 20) {
    throw new Error(`Expected most future levels to be locked, got levels=${lockedCount}.`);
  }
  if (!continueText.includes("闯关")) {
    throw new Error(`Expected start button to use start/continue challenge copy, got: ${continueText}.`);
  }
  if (homeTitleCount !== 0) {
    throw new Error(`Expected home title text to be removed, got ${homeTitleCount} title nodes.`);
  }
  if (homeStaminaButtonCount !== 0) {
    throw new Error(`Expected home stamina claim button to be removed, got ${homeStaminaButtonCount}.`);
  }
  if (homeStatLabelCount !== 0 || homeStatSmallCount !== 1) {
    throw new Error(`Expected resource cards to keep only stamina countdown small text, got labels=${homeStatLabelCount}, small=${homeStatSmallCount}.`);
  }
  if (
    !layoutInfo.hasDock ||
    layoutInfo.buttonWidth < layoutInfo.viewportWidth * 0.7 ||
    Math.abs(layoutInfo.buttonRatio - 1115 / 276) > 0.12 ||
    layoutInfo.dockPaddingBottom !== "30px"
  ) {
    throw new Error(`Expected continue button to fill its dock at the source image aspect ratio, got ${JSON.stringify(layoutInfo)}.`);
  }
  if (
    !["grid", "inline-grid"].includes(layoutInfo.buttonDisplay) ||
    layoutInfo.buttonAlignItems !== "center" ||
    layoutInfo.buttonJustifyItems !== "center" ||
    layoutInfo.buttonLineHeight !== "16px"
  ) {
    throw new Error(`Expected continue button text to be centered, got ${JSON.stringify(layoutInfo)}.`);
  }
  if (layoutInfo.levelOneTop <= layoutInfo.levelTwoTop) {
    throw new Error(`Expected level 01 to appear below level 02 in bottom-up map, got ${JSON.stringify(layoutInfo)}.`);
  }
  if (scrollInfo.scrollHeight <= scrollInfo.clientHeight) {
    throw new Error(`Expected road map to scroll vertically, got ${JSON.stringify(scrollInfo)}.`);
  }
  await expectHomeUsesUiHomeAssets(page);
}

async function expectSecondaryPageNavigation(page) {
  await page.locator("#profileButton").click();
  await page.waitForSelector("#profileScreen.active", { timeout: 1200 });
  if (!(await page.locator("#profileScreen.active").innerText()).includes("个人中心")) {
    throw new Error("Expected profile entry to open the personal center page.");
  }
  await expectSecondaryPageBuiltFromLayout(page, "#profileScreen", ".profile-layout");
  await expectProfilePageOptimizedLayout(page);
  await expectProfileThreeStarDataMatchesHome(page);
  await page.screenshot({ path: join(outputDir, "profile-mobile.png"), fullPage: true });
  await page.locator("#profileBackButton").click();
  await page.waitForSelector(".screen-start.active", { timeout: 1200 });

  await page.locator("#settingsButton").click();
  await page.waitForSelector("#settingsScreen.active", { timeout: 1200 });
  if (!(await page.locator("#settingsScreen.active").innerText()).includes("设置")) {
    throw new Error("Expected settings entry to open the settings page.");
  }
  await expectSecondaryPageBuiltFromLayout(page, "#settingsScreen", ".settings-layout");
  await expectSecondaryPageOptimizedLikeProfile(page, "#settingsScreen", ".settings-layout", ".settings-panel, .settings-row");
  await expectSettingsPageRefinements(page);
  await page.screenshot({ path: join(outputDir, "settings-mobile.png"), fullPage: true });
  await page.locator("#settingsBackButton").click();
  await page.waitForSelector(".screen-start.active", { timeout: 1200 });

  await page.locator("#coinExchangeButton").click();
  await page.waitForSelector("#exchangeScreen.active", { timeout: 1200 });
  if (!(await page.locator("#exchangeScreen.active").innerText()).includes("兑换商城")) {
    throw new Error("Expected coin resource entry to open the exchange shop page.");
  }
  await expectSecondaryPageBuiltFromLayout(page, "#exchangeScreen", ".exchange-layout");
  await expectExchangePageRemovesConsumableOffers(page);
  await expectExchangeCoinCardCompactLayout(page);
  await expectExchangeTitleShop(page);
  await expectSecondaryPageOptimizedLikeProfile(page, "#exchangeScreen", ".exchange-layout", ".exchange-coin-card, .exchange-shop-panel", {
    allowPageScroll: true,
  });
  await page.locator("#exchangeScreen.active .exchange-layout").evaluate((layout) => {
    layout.scrollTop = 0;
  });
  await page.locator("#exchangeScreen.active .exchange-shop-grid").evaluate((grid) => {
    grid.scrollTop = 0;
  });
  await page.screenshot({ path: join(outputDir, "exchange-mobile.png"), fullPage: true });
  await page.locator("#exchangeBackButton").click();
  await page.waitForSelector(".screen-start.active", { timeout: 1200 });
}

async function expectExchangePageRemovesConsumableOffers(page) {
  const exchangeData = await page.locator("#exchangeScreen.active").evaluate((screen) => ({
    buttonCount: screen.querySelectorAll(".exchange-button").length,
    itemCount: screen.querySelectorAll(".exchange-item").length,
    text: screen.innerText,
  }));
  if (exchangeData.itemCount !== 0 || exchangeData.buttonCount !== 0) {
    throw new Error(
      `Expected coin exchange page to remove stamina/hint/shuffle offers, got items=${exchangeData.itemCount}, buttons=${exchangeData.buttonCount}.`,
    );
  }
  for (const label of ["体力 +30", "提示 +1", "洗牌 +1", "20 金币", "15 金币"]) {
    if (exchangeData.text.includes(label)) {
      throw new Error(`Expected coin exchange page not to show old consumable offer text: ${label}.`);
    }
  }
}

async function expectExchangeCoinCardCompactLayout(page) {
  const coinCardData = await page.locator("#exchangeScreen.active .exchange-coin-card").evaluate((card) => {
    const cardBox = card.getBoundingClientRect();
    const coinIcon = card.querySelector(":scope > img");
    const coinIconBox = coinIcon?.getBoundingClientRect();
    const coinText = card.querySelector("#exchangeCoinText");
    const coinTextStyle = coinText ? getComputedStyle(coinText) : null;
    const coinIconStyle = coinIcon ? getComputedStyle(coinIcon) : null;
    const cardStyle = getComputedStyle(card);
    return {
      cardHeight: Math.round(cardBox.height),
      cardMinHeight: Number.parseFloat(cardStyle.minHeight),
      cardWidth: Math.round(cardBox.width),
      coinIconHeight: Math.round(coinIconBox?.height ?? 0),
      coinIconMarginLeft: coinIconStyle ? Number.parseFloat(coinIconStyle.marginLeft) : 0,
      coinIconWidth: Math.round(coinIconBox?.width ?? 0),
      coinText: coinText?.textContent ?? "",
      labelText: card.querySelector(".secondary-label-row span")?.textContent ?? "",
      fontSize: coinTextStyle ? Number.parseFloat(coinTextStyle.fontSize) : 0,
      marginTop: coinTextStyle ? Number.parseFloat(coinTextStyle.marginTop) : 0,
      paddingBottom: Number.parseFloat(cardStyle.paddingBottom),
      paddingTop: Number.parseFloat(cardStyle.paddingTop),
    };
  });
  if (
    coinCardData.cardMinHeight !== 80 ||
    Math.abs(coinCardData.cardWidth - 248) > 2 ||
    coinCardData.coinIconHeight !== 45 ||
    coinCardData.coinIconMarginLeft !== 20 ||
    coinCardData.coinIconWidth !== 45 ||
    coinCardData.coinText !== "86个" ||
    coinCardData.labelText !== "我的金币" ||
    Math.abs(coinCardData.fontSize - 22.4) > 0.5 ||
    coinCardData.marginTop !== 5 ||
    coinCardData.paddingBottom !== 10 ||
    coinCardData.paddingTop !== 10
  ) {
    throw new Error(`Expected compact exchange coin card, got ${JSON.stringify(coinCardData)}.`);
  }
}

async function expectExchangeTitleShop(page) {
  await expectExchangeShopUsesV2Assets(page);
  const firstPageData = await page.locator("#exchangeScreen.active").evaluate((screen) => ({
    itemCount: screen.querySelectorAll(".exchange-shop-item").length,
    pageText: screen.querySelector("#exchangeShopPageText")?.textContent ?? "",
    titleTexts: [...screen.querySelectorAll(".exchange-title-badge")].map((node) => node.textContent?.trim() ?? ""),
  }));
  if (
    firstPageData.itemCount !== 6 ||
    firstPageData.pageText !== "第 1 / 3 页" ||
    !firstPageData.titleTexts.includes("萌新果冻")
  ) {
    throw new Error(`Expected exchange title shop page 1 with 6 titles, got ${JSON.stringify(firstPageData)}.`);
  }

  await page.locator("#exchangeNextPageButton").click();
  const secondPageData = await page.locator("#exchangeScreen.active").evaluate((screen) => ({
    itemCount: screen.querySelectorAll(".exchange-shop-item").length,
    pageText: screen.querySelector("#exchangeShopPageText")?.textContent ?? "",
    titleTexts: [...screen.querySelectorAll(".exchange-title-badge")].map((node) => node.textContent?.trim() ?? ""),
  }));
  if (
    secondPageData.itemCount !== 6 ||
    secondPageData.pageText !== "第 2 / 3 页" ||
    !secondPageData.titleTexts.includes("闪光萌主")
  ) {
    throw new Error(`Expected exchange title shop page 2 with 6 titles, got ${JSON.stringify(secondPageData)}.`);
  }

  await page.locator("#exchangeNextPageButton").click();
  const thirdPageData = await page.locator("#exchangeScreen.active").evaluate((screen) => ({
    itemCount: screen.querySelectorAll(".exchange-shop-item").length,
    pageText: screen.querySelector("#exchangeShopPageText")?.textContent ?? "",
    titleTexts: [...screen.querySelectorAll(".exchange-title-badge")].map((node) => node.textContent?.trim() ?? ""),
  }));
  if (
    thirdPageData.itemCount !== 6 ||
    thirdPageData.pageText !== "第 3 / 3 页" ||
    !thirdPageData.titleTexts.includes("金币大亨")
  ) {
    throw new Error(`Expected exchange title shop page 3 with 6 titles, got ${JSON.stringify(thirdPageData)}.`);
  }

  await page.locator("#exchangeNextPageButton").click();
  await page.locator("#exchangeScreen.active .exchange-price-button").first().click();
  await page.waitForSelector("#exchangeResultModal:not(.hidden)", { timeout: 1200 });
  const successText = await page.locator("#exchangeResultMessage").innerText();
  if (successText !== "已兑换成功") {
    throw new Error(`Expected successful title exchange modal, got: ${successText}`);
  }
  await page.locator("#exchangeResultCloseButton").click();
  await page.locator("#exchangeResultModal").waitFor({ state: "hidden", timeout: 1200 });

  await page.locator("#exchangeNextPageButton").click();
  await page.locator("#exchangeNextPageButton").click();
  await page.locator("#exchangeScreen.active .exchange-price-button").last().click();
  await page.waitForSelector("#exchangeResultModal:not(.hidden)", { timeout: 1200 });
  const failText = await page.locator("#exchangeResultMessage").innerText();
  if (failText !== "金币不足") {
    throw new Error(`Expected insufficient coin title exchange modal, got: ${failText}`);
  }
  await page.locator("#exchangeResultCloseButton").click();
  await page.locator("#exchangeResultModal").waitFor({ state: "hidden", timeout: 1200 });
  await page.locator("#exchangeNextPageButton").click();
}

async function expectExchangeShopUsesV2Assets(page) {
  const assetData = await page.locator("#exchangeScreen.active").evaluate((screen) => {
    const backgroundImageOf = (selector) => getComputedStyle(screen.querySelector(selector)).backgroundImage;
    const panelStyle = getComputedStyle(screen.querySelector(".exchange-shop-panel"));
    const gridStyle = getComputedStyle(screen.querySelector(".exchange-shop-grid"));
    const item = screen.querySelector(".exchange-shop-item");
    const itemStyle = getComputedStyle(item);
    const itemBox = item.getBoundingClientRect();
    const titleBadge = item.querySelector(".exchange-title-badge");
    const titleBadgeBox = titleBadge.getBoundingClientRect();
    const titleBadgeStyle = getComputedStyle(titleBadge);
    const priceButton = item.querySelector(".exchange-price-button");
    const priceButtonBox = priceButton.getBoundingClientRect();
    const priceIconBox = priceButton.querySelector("img").getBoundingClientRect();
    return {
      panelBackground: backgroundImageOf(".exchange-shop-panel"),
      itemBackground: backgroundImageOf(".exchange-shop-item"),
      itemBackgroundSize: itemStyle.backgroundSize,
      itemWidth: Math.round(itemBox.width),
      itemRatio: itemBox.width / itemBox.height,
      priceButtonRatio: priceButtonBox.width / priceButtonBox.height,
      priceIconHeight: Math.round(priceIconBox.height),
      priceIconWidth: Math.round(priceIconBox.width),
      priceButtonBackground: backgroundImageOf(".exchange-price-button"),
      titleBadgeAlignItems: titleBadgeStyle.alignItems,
      titleBadgeCenterDelta: Math.round(Math.abs((titleBadgeBox.top + titleBadgeBox.bottom) / 2 - titleBadgeBox.top - titleBadgeBox.height / 2)),
      titleBadgeDisplay: titleBadgeStyle.display,
      titleBadgeJustifyContent: titleBadgeStyle.justifyContent,
      arrowBackground: backgroundImageOf(".exchange-page-arrow"),
      panelMinHeight: panelStyle.minHeight,
      shopColumnCount: gridStyle.gridTemplateColumns.split(" ").filter(Boolean).length,
    };
  });
  const expected = [
    ["panelBackground", "exchange-shop-panel-bg-v2.png"],
    ["itemBackground", "exchange-title-card-bg-v2.png"],
    ["priceButtonBackground", "exchange-price-button-bg-v2.png"],
    ["arrowBackground", "exchange-page-arrow-bg-v2.png"],
  ];
  const missing = expected.filter(([key, fileName]) => !String(assetData[key]).includes(fileName));
  if (missing.length) {
    throw new Error(`Expected exchange shop to use v2 generated assets, got ${JSON.stringify({ assetData, missing })}.`);
  }
  if (assetData.panelMinHeight !== "auto" || assetData.shopColumnCount !== 2) {
    throw new Error(`Expected exchange shop panel to use auto min-height with 2 columns, got ${JSON.stringify(assetData)}.`);
  }
  if (assetData.itemBackgroundSize !== "contain" || Math.abs(assetData.itemRatio - 943 / 1228) > 0.02) {
    throw new Error(`Expected exchange shop item background to keep original image ratio, got ${JSON.stringify(assetData)}.`);
  }
  if (assetData.itemWidth !== 117) {
    throw new Error(`Expected exchange shop items to be 117px wide, got ${JSON.stringify(assetData)}.`);
  }
  if (
    Math.abs(assetData.priceButtonRatio - 1224 / 427) > 0.04 ||
    assetData.priceIconHeight !== 16 ||
    assetData.priceIconWidth !== 16
  ) {
    throw new Error(`Expected exchange price button and coin icon to keep normal size, got ${JSON.stringify(assetData)}.`);
  }
  if (
    assetData.titleBadgeDisplay !== "flex" ||
    assetData.titleBadgeAlignItems !== "center" ||
    assetData.titleBadgeJustifyContent !== "center"
  ) {
    throw new Error(`Expected exchange title text to be centered in the green badge, got ${JSON.stringify(assetData)}.`);
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
      const iconStyle = icon ? getComputedStyle(icon) : null;
      const label = row.querySelector("strong");
      const labelBox = label?.getBoundingClientRect();
      const labelStyle = label ? getComputedStyle(label) : null;
      const toggle = row.querySelector(".settings-toggle");
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
        labelFontSize: labelStyle ? Number.parseFloat(labelStyle.fontSize) : 0,
        labelHeight: Math.round(labelBox?.height ?? 0),
        labelText: label?.textContent ?? "",
        labelWhiteSpace: labelStyle?.whiteSpace ?? "",
        leafIconCount: row.querySelectorAll(".secondary-label-row img").length,
        rowMinHeight: Number.parseFloat(getComputedStyle(row).minHeight),
        rowColumns: getComputedStyle(row).gridTemplateColumns,
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
      Math.abs(row.iconHeight - 40) > 0.5 ||
      Math.abs(row.iconMarginLeft - 20) > 0.5,
  );
  if (wrongIconSize) {
    throw new Error(`Expected settings icons to use 40px size and 20px left margin, got ${JSON.stringify(layout)}.`);
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
  const wrongColumns = layout.rowData.find((row) => !row.rowColumns.includes("70px") || !row.rowColumns.includes("120px"));
  if (wrongColumns) {
    throw new Error(`Expected settings rows to use 70px 1fr 120px columns, got ${JSON.stringify(layout)}.`);
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

  if (layout.backWidth < 58 || layout.backWidth > 61) {
    throw new Error(`Expected profile back button to be 20% smaller, got ${JSON.stringify(layout)}.`);
  }
  if (layout.titleHeight < 75 || layout.titleHeight > 78 || Math.abs(layout.titleFontSize - 24) > 0.5) {
    throw new Error(`Expected profile title icon to shrink 20% and text to be 24px, got ${JSON.stringify(layout)}.`);
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
  if (layout.titleTranslateY > -6 || layout.titleTranslateY < -8) {
    throw new Error(`Expected profile title text to move down 8px from previous position, got ${JSON.stringify(layout)}.`);
  }
  if (
    layout.iconData.levelWidth < 90 ||
    layout.iconData.levelWidth > 92 ||
    layout.iconData.starWidth < 60 ||
    layout.iconData.starWidth > 62 ||
    layout.iconData.coinWidth < 68 ||
    layout.iconData.coinWidth > 70
  ) {
    throw new Error(`Expected profile level/star/coin icons to shrink another 10%, got ${JSON.stringify(layout)}.`);
  }
  if (
    layout.levelBadgeFontSize < 15.5 ||
    layout.levelBadgeFontSize > 16.5 ||
    layout.levelBadgeLineHeight < 15.5 ||
    layout.levelBadgeLineHeight > 16.5
  ) {
    throw new Error(`Expected current-level green badge text to be 1rem and vertically centered, got ${JSON.stringify(layout)}.`);
  }
  if (layout.levelBadgeTranslateY < 9 || layout.levelBadgeTranslateY > 11) {
    throw new Error(`Expected current-level green badge to move down 10px, got ${JSON.stringify(layout)}.`);
  }
  if (layout.starFontSize < 19 || layout.starFontSize > 20) {
    throw new Error(`Expected total-stars number text to be 1.2rem, got ${JSON.stringify(layout)}.`);
  }
  if (layout.starTranslateY < 9 || layout.starTranslateY > 11) {
    throw new Error(`Expected total-stars number to move down 10px, got ${JSON.stringify(layout)}.`);
  }
  if (
    layout.completedFontSize < 22 ||
    layout.completedFontSize > 23 ||
    layout.threeStarFontSize < 22 ||
    layout.threeStarFontSize > 23
  ) {
    throw new Error(`Expected completed and three-star number text to be 1.4rem, got ${JSON.stringify(layout)}.`);
  }
  if (!/^\d+关$/.test(layout.completedText) || !/^\d+关$/.test(layout.threeStarText)) {
    throw new Error(`Expected completed and three-star counts to include 关 suffix, got ${JSON.stringify(layout)}.`);
  }
  if (layout.scrollHeight > layout.clientHeight || layout.layoutOverflowY !== "hidden") {
    throw new Error(`Expected profile page not to scroll, got ${JSON.stringify(layout)}.`);
  }
  if (Math.abs(layout.identityMarginTop - 50) > 0.5) {
    throw new Error(`Expected profile identity card to have margin-top: 50px, got ${JSON.stringify(layout)}.`);
  }
  if (layout.homeButtonCount !== 0) {
    throw new Error(`Expected profile bottom home button to be removed, got ${JSON.stringify(layout)}.`);
  }
}

async function expectProfileThreeStarDataMatchesHome(page) {
  const profileData = await page.locator("#profileScreen.active .profile-layout").evaluate(() => {
    const progress = JSON.parse(localStorage.getItem("lianliankan.progress") ?? "{}");
    const records = Object.values(progress.records ?? {});
    const expectedThreeStarLevels = records.filter((record) => record.bestStars >= 3).length;
    const homeThreeStarNodes = [...document.querySelectorAll(".screen-start .road-level")].filter(
      (node) => node.querySelectorAll(".road-stars .filled").length === 3,
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
      levelBackground: firstRoadLevel ? getComputedStyle(firstRoadLevel).backgroundImage : "",
      startBackground: backgroundImageOf("#startButton"),
      lockIcon: document.querySelector(".chapter-lock img")?.getAttribute("src") ?? "",
    };
  });

  const expected = [
    ["screenBackground", "UI-Home/background-fruit-full.png"],
    ["profileIcon", "UI-Home/icon-profile.png"],
    ["settingsIcon", "UI-Home/icon-settings.png"],
    ["statBackground", "UI-Home/resource-card-bg.png"],
    ["arrowBackground", "UI-ICON/exchange-page/exchange-page-arrow-bg-v2.png"],
    ["arrowIcon", "UI-ICON/exchange-page/exchange-page-arrow-bg-v2.png"],
    ["summaryBackground", "UI-Home/chapter-title-fruit-bg.png"],
    ["levelBackground", "UI-Home/level-fruit-current-bg.png"],
    ["startBackground", "UI-Home/start-button-fruit-bg.png"],
    ["lockIcon", "UI-Home/icon-lock.png"],
  ];
  const missing = expected.filter(([key, value]) => !String(assets[key]).includes(value));
  if (!assets.screenClass.includes("home-theme-fruit-forest") || missing.length) {
    throw new Error(`Expected home screen to render UI-Home sliced assets, got ${JSON.stringify({ assets, missing })}.`);
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
  const visualTarget = await page.locator(".screen-result.active").getAttribute("data-visual-target");
  const cardBackground = await page
    .locator(".screen-result.active .candy-result-card")
    .evaluate((node) => getComputedStyle(node).backgroundImage);
  const resultStaminaCount = await page.locator(".screen-result.active .result-stamina").count();
  const resultEyebrowCount = await page.locator(".screen-result.active .result-eyebrow").count();
  const resultTitle = page.locator(".screen-result.active #resultTitle");
  const resultTitleText = await resultTitle.innerText();
  const resultCoinCount = page.locator(".screen-result.active #resultTitle .result-coin-count");
  const resultCoinCountText = await resultCoinCount.innerText().catch(() => "");
  const resultCoinIcon = page.locator(".screen-result.active #resultTitle .result-coin-icon");
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
  if (!visualTarget?.includes("mobile-modal-result-design.png")) {
    throw new Error(`Expected result screen to record the mobile result design draft, got ${visualTarget}.`);
  }
  if (!badgeSource?.includes("./assets/ui-cut/") || starSources.some((source) => !source.includes("./assets/ui-cut/"))) {
    throw new Error(`Expected result badge and stars to use ui-cut image assets, got badge=${badgeSource}, stars=${starSources.join(", ")}`);
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
  if (!cardBackground.includes("assets/ui-cut/modal-card-bg.png")) {
    throw new Error(`Expected result card background to use modal-card-bg.png, got: ${cardBackground}`);
  }
  if (overlay.alpha < 0.35) {
    throw new Error(`Expected result screen to use a dark translucent overlay, got: ${JSON.stringify(overlay)}.`);
  }
  if (resultStaminaCount !== 0 || resultEyebrowCount !== 0) {
    throw new Error(`Expected result screen without stamina panel and eyebrow, got stamina=${resultStaminaCount}, eyebrow=${resultEyebrowCount}.`);
  }
  if (resultTitleText.replace(/\s+/g, "") !== "通关成功，获得2") {
    throw new Error(`Expected success title to read 通关成功，获得2, got text=${resultTitleText}.`);
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
  if (resultButtonGaps.length !== 2 || resultButtonGaps.some((gap) => Math.abs(gap - 12) > 2)) {
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
  await expectDesignedUiCutButtons(page, ".screen-result.active .result-card > button");
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
  const badBackground = buttonData.find((item) => !item.background.includes("assets/ui-cut/modal-button-"));
  if (badBackground) {
    throw new Error(`Expected ${selector} to use ui-cut button slices, got ${badBackground.background}.`);
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
  await page.locator("#staminaBuyButton").click();
  const staminaAfterPurchase = await readStoredStamina(page);
  if (staminaAfterPurchase.stamina !== 31 || staminaAfterPurchase.adClaims !== 3) {
    throw new Error(`Expected purchase to grant 30 stamina without ad claims, got: ${JSON.stringify(staminaAfterPurchase)}`);
  }
}

async function finishCompletedLevelAndExpectNoCoinMessage(page) {
  await page.evaluate(() => {
    localStorage.setItem(
      "lianliankan.stamina",
      JSON.stringify({ stamina: 50, updatedAt: Date.now(), adClaims: 0 }),
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
  });
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
    iconCount: title.querySelectorAll(".result-coin-icon").length,
    text: title.innerText,
  }));
  if (repeatResult.text.replace(/\s+/g, "") !== "恭喜通关，重复关卡无法获得金币。") {
    throw new Error(`Expected replay clear no-coin message, got: ${repeatResult.text}.`);
  }
  if (repeatResult.coinCount !== 0 || repeatResult.iconCount !== 0) {
    throw new Error(`Expected replay clear title without coin number or icon, got ${JSON.stringify(repeatResult)}.`);
  }

  const storedProgress = await page.evaluate(() => JSON.parse(localStorage.getItem("lianliankan.progress")));
  if (storedProgress.coins !== 2) {
    throw new Error(`Expected replay clear to keep coin balance at 2, got ${storedProgress.coins}.`);
  }
}

async function finishGameAndExpectFailureBadge(page) {
  await page.evaluate(() => {
    localStorage.setItem(
      "lianliankan.stamina",
      JSON.stringify({ stamina: 50, updatedAt: Date.now(), adClaims: 0 }),
    );
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.locator("#startButton").click();
  await page.waitForSelector(".screen-game.active .tile:not(.empty)");

  const hasSmokeHook = await page.evaluate(() => typeof window.__linkMatchSmoke?.finishGameForSmoke === "function");
  if (!hasSmokeHook) {
    throw new Error("Expected boardSeed smoke URL to expose finishGameForSmoke hook.");
  }

  await page.evaluate(() => window.__linkMatchSmoke.finishGameForSmoke(false));
  await page.waitForSelector('.screen-result.active[data-result="failure"]', { timeout: 2000 });
  await page.screenshot({ path: join(outputDir, "result-failure-mobile.png"), fullPage: true });

  const failureData = await page.locator(".screen-result.active").evaluate(async (screen) => {
    const badge = screen.querySelector(".result-badge");
    const badgeArt = screen.querySelector(".result-badge-art");
    const title = screen.querySelector("#resultTitle");
    const nextLevelButton = screen.querySelector("#nextLevelButton");
    if (!badge || !badgeArt || !title || !nextLevelButton) {
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

  await page.locator("#homeButton").click();
  await page.waitForSelector(".screen-start.active");
}

async function readStoredStamina(page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem("lianliankan.stamina")));
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
