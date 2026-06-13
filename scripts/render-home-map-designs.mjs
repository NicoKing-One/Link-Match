import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import Module from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const bundledModules =
  process.env.WORKSPACE_NODE_MODULES ??
  "C:\\Users\\youzi\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules";
process.env.NODE_PATH = [bundledModules, join(bundledModules, ".pnpm", "node_modules"), process.env.NODE_PATH]
  .filter(Boolean)
  .join(";");
Module._initPaths();

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const draftDir = join(root, "docs", "ui-design-drafts");
const template = join(draftDir, "home-map-theme-template.html");
const browserExecutable = findBrowserExecutable();

const themes = [
  ["fruit", "home-map-ui-design-fruit-forest-aligned.png"],
  ["candy", "home-map-ui-design-candy-garden-aligned.png"],
  ["jelly", "home-map-ui-design-jelly-castle-aligned.png"],
];

if (!existsSync(template)) {
  throw new Error(`Template not found: ${template}`);
}

for (const background of [
  "home-map-bg-fruit-forest.png",
  "home-map-bg-candy-garden.png",
  "home-map-bg-jelly-castle.png",
]) {
  const target = join(draftDir, background);
  if (!existsSync(target)) {
    throw new Error(`Background not found: ${target}`);
  }
}

await mkdir(draftDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  ...(browserExecutable ? { executablePath: browserExecutable } : {}),
});

try {
  for (const [theme, filename] of themes) {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
    });

    await page.goto(`${pathToFileURL(template).href}?theme=${theme}`, { waitUntil: "networkidle" });

    const metrics = await page.evaluate(() => {
      const cards = [...document.querySelectorAll(".resource-card")].map((card) => {
        const rect = card.getBoundingClientRect();
        return {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      });
      const tabs = [...document.querySelectorAll(".chapter-tab")].map((tab) => {
        const rect = tab.getBoundingClientRect();
        return {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      });
      const cta = document.querySelector(".cta").getBoundingClientRect();
      return {
        cards,
        cardGaps: [cards[1].x - (cards[0].x + cards[0].width), cards[2].x - (cards[1].x + cards[1].width)],
        tabs,
        cta: {
          x: Math.round(cta.x),
          y: Math.round(cta.y),
          width: Math.round(cta.width),
          height: Math.round(cta.height),
        },
      };
    });

    if (metrics.cardGaps.some((gap) => gap !== 10)) {
      throw new Error(`${theme} resource card gaps should be 10px, got ${JSON.stringify(metrics.cardGaps)}`);
    }

    await page.screenshot({
      path: join(draftDir, filename),
      fullPage: false,
    });

    await page.close();
    console.log(`${filename}: ${JSON.stringify(metrics)}`);
  }
} finally {
  await browser.close();
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
