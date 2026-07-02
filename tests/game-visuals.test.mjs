import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const styles = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");

test("tile fruit art uses the requested 125 percent scale inside compact mobile tiles", () => {
  const tileArtRule = getRule(".tile-art");
  const widthPercent = readPercentDeclaration(tileArtRule, "width");
  const heightPercent = readPercentDeclaration(tileArtRule, "height");

  assert.equal(widthPercent, 125);
  assert.equal(heightPercent, 125);
  assert.match(tileArtRule, /object-fit:\s*contain;/);
});

function getRule(selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = styles.match(new RegExp(`${escapedSelector}\\s*\\{(?<body>[^}]*)\\}`, "m"));
  assert.ok(match?.groups?.body, `Expected to find ${selector} rule`);
  return match.groups.body;
}

function readPercentDeclaration(ruleBody, propertyName) {
  const escapedPropertyName = propertyName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = ruleBody.match(new RegExp(`${escapedPropertyName}\\s*:\\s*(?<value>[\\d.]+)%\\s*;`));
  assert.ok(match?.groups?.value, `Expected ${propertyName} to be declared as a percentage.`);
  return Number.parseFloat(match.groups.value);
}
