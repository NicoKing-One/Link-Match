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
  await page.goto(url, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  const initialStamina = await page.locator(".screen-start .staminaText").innerText();
  if (initialStamina !== "50/50") {
    throw new Error(`Expected initial stamina to be 50/50, got: ${initialStamina}`);
  }
  const bodyFont = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
  if (!bodyFont.includes("Microsoft YaHei") && !bodyFont.includes("寰蒋闆呴粦")) {
    throw new Error(`Expected Microsoft YaHei font family, got: ${bodyFont}`);
  }
  const initialCountdown = await page.locator(".screen-start .staminaCountdown").innerText();
  if (!initialCountdown.includes("刷新")) {
    throw new Error(`Expected full stamina countdown to show reset time, got: ${initialCountdown}`);
  }
  await expectStaleFullStaminaSpend(page);
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  await page.locator(".level-card").first().click();
  await page.locator(".screen-start .getStaminaButton").click();
  const bonusStamina = await page.locator(".screen-start .staminaText").innerText();
  if (bonusStamina !== "80/50") {
    throw new Error(`Expected ad stamina to exceed max as 80/50, got: ${bonusStamina}`);
  }
  await page.locator("#startButton").click();
  await page.waitForSelector(".screen-game.active .tile:not(.empty)");
  const staminaAfterStart = await readStoredStamina(page);
  const gameStaminaText = await page.locator(".screen-game .staminaText").innerText();
  if (staminaAfterStart.stamina !== 77 || gameStaminaText !== "77/50") {
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
  if (tileCount !== 42) {
    throw new Error(`Expected easy mode to render a 6x7 board with 42 tiles, got ${tileCount}.`);
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
  await expectHintToolBreathes(page);
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
  await page.locator("#confirmRestartButton").click();
  await page.waitForSelector(".screen-game.active .tile:not(.empty)");
  await gameHomeButton.click();
  await page.waitForSelector("#exitModal:not(.hidden)", { timeout: 2000 });
  await page.locator("#confirmHomeButton").click();
  await page.waitForSelector(".screen-start.active");

  await finishGameAndExpectStarsAndNoStaminaAgain(page);

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
  await page.locator(".level-card").first().click();
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
  if (
    toolbarSeparators.beforeDisplay !== "none" ||
    toolbarSeparators.afterDisplay !== "none" ||
    toolbarSeparators.beforeContent !== "none" ||
    toolbarSeparators.afterContent !== "none"
  ) {
    throw new Error(`Expected toolbar dotted separators to be removed, got ${JSON.stringify(toolbarSeparators)}.`);
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

async function expectMobileResultDesignSystem(page) {
  const shellCount = await page.locator(".screen-result.active.mobile-result-shell").count();
  const cardCount = await page.locator(".screen-result.active .candy-result-card").count();
  const badgeSource = await page.locator(".screen-result.active .result-badge-art").getAttribute("src");
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
  const resultSummaryVisible = await page.locator(".screen-result.active #resultSummary").isVisible();
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
  if (resultSummaryVisible) {
    throw new Error("Expected result summary text below success/failure title to be hidden.");
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

async function expectHintToolBreathes(page) {
  const animation = await page
    .locator(".screen-game.active .tool-button--hint .tool-art")
    .evaluate((node) => getComputedStyle(node).animationName);
  if (!animation.includes("tool-breathe")) {
    throw new Error(`Expected hint tool button to use breathing animation, got ${animation}.`);
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
