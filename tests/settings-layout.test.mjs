import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const styles = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");

test("settings rows use responsive columns without fixed toggle width", () => {
  const rowRule = getRule(".settings-row");
  const toggleRule = getRule(".settings-toggle");

  assert.match(rowRule, /display:\s*grid;/);
  assert.match(rowRule, /grid-template-columns:\s*max-content\s+max-content\s+minmax\(/);
  assert.match(rowRule, /justify-content:\s*center;/);
  assert.match(rowRule, /padding-left:\s*6cqw;/);
  assert.match(toggleRule, /width:\s*80%;/);
  assert.match(toggleRule, /min-height:\s*9cqw;/);
  assert.doesNotMatch(toggleRule, /min-width:\s*\d+px/);
  assert.doesNotMatch(toggleRule, /flex:\s*0\s+0\s+auto/);
});

test("settings page size properties use container query width units", () => {
  const selectors = [
    ".settings-layout .secondary-back-button",
    ".settings-layout .secondary-title",
    ".settings-panel",
    ".settings-flower",
    ".settings-row",
    ".settings-icon",
    ".settings-toggle",
    ".settings-toggle::after",
    ".settings-toggle:not(.is-on)::after",
  ];

  for (const selector of selectors) {
    const rule = getRules(selector).join("\n");
    const sizeLines = rule
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => /(?:^|-)width:|(?:^|-)height:|grid-template-columns:|right:/.test(line));

    assert.ok(sizeLines.length > 0, `Expected ${selector} to define size-related properties`);
    assert.doesNotMatch(sizeLines.join("\n"), /\d+(?:\.\d+)?px\b/, `${selector} should not use px for sizing`);
  }
});

function getRule(selector) {
  const rules = getRules(selector);
  assert.ok(rules[0], `Expected to find ${selector} rule`);
  return rules[0];
}

function getRules(selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return [...styles.matchAll(new RegExp(`${escapedSelector}\\s*\\{(?<body>[^}]*)\\}`, "gm"))].map(
    (match) => match.groups.body,
  );
}
