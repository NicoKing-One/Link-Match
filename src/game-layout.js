export function calculateBoardFrameWidth({
  availableWidth,
  availableHeight,
  rows,
  cols,
  frameHorizontalChrome,
  frameVerticalChrome,
}) {
  if (availableWidth <= 0 || availableHeight <= 0 || rows <= 0 || cols <= 0) return 0;

  const heightLimitedWidth =
    Math.max(0, availableHeight - frameVerticalChrome) * (cols / rows) + frameHorizontalChrome;

  return Math.min(availableWidth, heightLimitedWidth);
}
