import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const staminaModalCopy = "开始一关需要3点体力，可以看广告获取或去商城购买体力。";

test("stamina modal uses the approved no-stamina copy", async () => {
  const [html, gameScript] = await Promise.all([
    readFile(new URL("../src/index.html", import.meta.url), "utf8"),
    readFile(new URL("../src/game.js", import.meta.url), "utf8"),
  ]);

  assert.match(html, new RegExp(`<p id="staminaMessage">${staminaModalCopy}</p>`));
  assert.match(gameScript, new RegExp(`message = "${staminaModalCopy}"`));
  assert.match(gameScript, new RegExp(`openStaminaModal\\(\\s*"体力不足",\\s*"${staminaModalCopy}"`));
});
