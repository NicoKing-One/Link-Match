export const HOME_THEME_ASSET_SOURCES = Object.freeze([
  "./assets/image/background-fruit-full.png",
  "./assets/image/background-candy-full.png",
  "./assets/image/background-jelly-full.png",
  "./assets/image/start-button-fruit-bg.png",
  "./assets/image/start-button-candy-bg.png",
  "./assets/image/start-button-jelly-bg.png",
  "./assets/image/chapter-title-fruit-bg.png",
  "./assets/image/chapter-title-candy-bg.png",
  "./assets/image/chapter-title-jelly-bg.png",
  "./assets/image/level-fruit-current-bg.png",
  "./assets/image/level-fruit-completed-bg.png",
  "./assets/image/level-fruit-not-started-bg.png",
  "./assets/image/level-candy-current-bg.png",
  "./assets/image/level-candy-completed-bg.png",
  "./assets/image/level-candy-not-started-bg.png",
  "./assets/image/level-jelly-current-bg.png",
  "./assets/image/level-jelly-completed-bg.png",
  "./assets/image/level-jelly-not-started-bg.png",
  "./assets/image/road-vine-connector.png",
  "./assets/image/road-candy-connector.png",
  "./assets/image/road-jelly-connector.png",
  "./assets/image/road-stars-1.png",
  "./assets/image/road-stars-2.png",
  "./assets/image/road-stars-3.png",
]);

const preloadedSources = new Set();
const preloadedImages = [];

export function preloadImageSources(sources = HOME_THEME_ASSET_SOURCES, createImage = () => new Image()) {
  for (const source of sources) {
    if (!source || preloadedSources.has(source)) continue;

    const image = createImage();
    image.decoding = "async";
    image.fetchPriority = "low";
    image.src = source;
    preloadedSources.add(source);
    preloadedImages.push(image);
  }

  return preloadedImages;
}

export function scheduleHomeThemeAssetPreload(windowLike = globalThis) {
  const run = () => preloadImageSources();

  if (typeof windowLike.setTimeout === "function") {
    windowLike.setTimeout(run, 0);
    return;
  }

  run();
}
