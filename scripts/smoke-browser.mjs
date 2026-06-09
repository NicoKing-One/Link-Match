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

const browser = await chromium.launch({
  headless: true,
  ...(browserExecutable ? { executablePath: browserExecutable } : {}),
});
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "开始游戏" }).click();
  await page.waitForSelector(".screen-game.active .tile:not(.empty)");
  await page.getByRole("button", { name: "主页" }).waitFor({ timeout: 2000 });
  const tileCount = await page.locator(".screen-game.active .tile:not(.empty)").count();
  const hudText = await page.locator(".hud").innerText();

  const firstAspect = await getFirstTileAspect(page);
  await clickInvalidPair(page);
  await page.waitForSelector(".toast.show", { timeout: 2000 });
  const toastText = await page.locator(".toast.show").innerText();
  const selectedAfterMismatch = await page.locator(".tile.selected").count();
  if (!toastText.includes("不能连接")) {
    throw new Error(`Expected mismatch warning, got: ${toastText}`);
  }
  if (selectedAfterMismatch !== 0) {
    throw new Error(`Expected mismatch to clear selection, got ${selectedAfterMismatch} selected tile(s).`);
  }

  await clearPairs(page, 10);
  const laterAspect = await getFirstTileAspect(page);
  await page.getByRole("button", { name: "暂停" }).click();
  await page.getByRole("button", { name: "继续游戏" }).click();
  await page.screenshot({ path: join(outputDir, "smoke-mobile.png"), fullPage: true });
  await page.getByRole("button", { name: "主页" }).click();
  await page.waitForSelector(".screen-start.active");

  if (tileCount <= 0 || !hudText.includes("时间") || !hudText.includes("得分")) {
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
      symbol: tile.textContent.trim(),
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

async function clearPairs(page, maxPairs) {
  for (let index = 0; index < maxPairs; index += 1) {
    const pair = await page.evaluate(async () => {
      const module = await import(new URL("./engine.js", window.location.href).href);
      const tiles = [...document.querySelectorAll(".tile")];
      const rows = Math.max(...tiles.map((tile) => Number(tile.dataset.row))) + 1;
      const cols = Math.max(...tiles.map((tile) => Number(tile.dataset.col))) + 1;
      const board = Array.from({ length: rows }, () => Array(cols).fill(null));
      tiles.forEach((tile) => {
        if (!tile.classList.contains("empty")) {
          board[Number(tile.dataset.row)][Number(tile.dataset.col)] = tile.textContent.trim();
        }
      });
      return module.findAvailablePair(board);
    });

    if (!pair) return;
    await clickTile(page, pair.from);
    await clickTile(page, pair.to);
    await page.waitForTimeout(260);
  }
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
