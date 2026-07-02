import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";

test("game board frame stays horizontally centered when runtime layout narrows it", async () => {
  const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
  const boardWrapRules = [...styles.matchAll(/\.board-wrap\s*{[^}]+}/g)].map((match) => match[0]);
  const boardWrapRule = boardWrapRules.find((rule) => rule.includes("position: relative")) ?? "";

  assert.match(boardWrapRule, /align-self:\s*center;/);
  assert.match(boardWrapRule, /margin:\s*auto;/);
  assert.equal(
    boardWrapRules.some((rule) => /margin:\s*auto\s+0\s*;/.test(rule)),
    false,
    "Narrowed board frames must not keep horizontal margins at 0.",
  );
});
