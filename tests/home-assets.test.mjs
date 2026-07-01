import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";

import {
  HOME_THEME_ASSET_SOURCES,
  preloadImageSources,
  scheduleHomeThemeAssetPreload,
} from "../src/home-assets.js";

const CRITICAL_THEME_ASSETS = [
  "background-candy-premium-v1.png",
  "background-crystal-castle-premium-v1.png",
  "start-button-candy-bg.png",
  "start-button-jelly-bg.png",
  "chapter-title-candy-bg.png",
  "chapter-title-jelly-bg.png",
  "chapter-arrow-candy-bg.png",
  "chapter-arrow-jelly-bg.png",
  "level-candy-current-bg.png",
  "level-candy-completed-bg.png",
  "level-candy-not-started-bg.png",
  "level-jelly-current-bg.png",
  "level-jelly-completed-bg.png",
  "level-jelly-not-started-bg.png",
  "road-candy-connector.png",
  "road-jelly-connector.png",
  "road-stars-1.png",
  "road-stars-2.png",
  "road-stars-3.png",
];

test("home theme preload list covers candy and castle map art", () => {
  for (const fileName of CRITICAL_THEME_ASSETS) {
    const source = `./assets/image/${fileName}`;
    assert.ok(HOME_THEME_ASSET_SOURCES.includes(source), `missing ${source}`);
    assert.equal(existsSync(new URL(`../src/assets/image/${fileName}`, import.meta.url)), true);
  }
});

test("preloadImageSources starts image requests once with low fetch priority", () => {
  const requestedImages = [];
  const createImage = () => {
    const image = { decoding: "", fetchPriority: "", src: "" };
    requestedImages.push(image);
    return image;
  };

  preloadImageSources(["./assets/image/a.png", "./assets/image/b.png"], createImage);
  preloadImageSources(["./assets/image/a.png"], createImage);

  assert.deepEqual(
    requestedImages.map((image) => image.src),
    ["./assets/image/a.png", "./assets/image/b.png"],
  );
  assert.equal(requestedImages.every((image) => image.decoding === "async"), true);
  assert.equal(requestedImages.every((image) => image.fetchPriority === "low"), true);
});

test("scheduleHomeThemeAssetPreload starts promptly after initial render", () => {
  let timeoutCalls = 0;
  let idleCalls = 0;
  const windowLike = {
    requestIdleCallback() {
      idleCalls += 1;
    },
    setTimeout() {
      timeoutCalls += 1;
    },
  };

  scheduleHomeThemeAssetPreload(windowLike);

  assert.equal(timeoutCalls, 1);
  assert.equal(idleCalls, 0);
});
