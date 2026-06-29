import assert from "node:assert/strict";
import test from "node:test";

import {
  CURRENT_DATA_RESET_VERSION,
  applyVersionedDataReset,
} from "../src/storage-reset.js";
import { MAX_STAMINA } from "../src/game-rules.js";

test("resets all persisted player data when reset version changes", () => {
  const now = 1_782_489_600_000;
  const storage = createMemoryStorage({
    "lianliankan.dataResetVersion": "2026-06-13-full-stamina-baseline",
    "lianliankan.progress": JSON.stringify({
      highestUnlockedLevel: 38,
      coins: 512,
      playerName: "Old",
      records: {
        1: { completed: true, bestScore: 900, bestStars: 3 },
      },
    }),
    "lianliankan.stamina": JSON.stringify({ stamina: 9, updatedAt: 123, adClaims: 2 }),
  });

  assert.equal(applyVersionedDataReset(storage, now), true);
  assert.equal(storage.getItem("lianliankan.dataResetVersion"), CURRENT_DATA_RESET_VERSION);
  assert.deepEqual(JSON.parse(storage.getItem("lianliankan.progress")), {
    highestUnlockedLevel: 1,
    coins: 0,
    playerName: JSON.parse(storage.getItem("lianliankan.progress")).playerName,
    records: {},
  });
  assert.ok(JSON.parse(storage.getItem("lianliankan.progress")).playerName.length > 0);
  assert.deepEqual(JSON.parse(storage.getItem("lianliankan.stamina")), {
    stamina: MAX_STAMINA,
    updatedAt: now,
    adClaims: 0,
  });
});

test("keeps persisted player data when reset version already matches", () => {
  const storedProgress = {
    highestUnlockedLevel: 8,
    coins: 42,
    playerName: "Player",
    records: {
      1: { completed: true, bestScore: 900, bestStars: 3 },
    },
  };
  const storedStamina = { stamina: 18, updatedAt: 123, adClaims: 1 };
  const storage = createMemoryStorage({
    "lianliankan.dataResetVersion": CURRENT_DATA_RESET_VERSION,
    "lianliankan.progress": JSON.stringify(storedProgress),
    "lianliankan.stamina": JSON.stringify(storedStamina),
  });

  assert.equal(applyVersionedDataReset(storage, 1_782_489_600_000), false);
  assert.deepEqual(JSON.parse(storage.getItem("lianliankan.progress")), storedProgress);
  assert.deepEqual(JSON.parse(storage.getItem("lianliankan.stamina")), storedStamina);
});

function createMemoryStorage(initialValues = {}) {
  const values = new Map(Object.entries(initialValues));
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
  };
}
