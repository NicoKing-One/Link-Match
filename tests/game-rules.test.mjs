import assert from "node:assert/strict";
import test from "node:test";

import {
  AD_STAMINA_REWARD,
  MAX_AD_STAMINA_CLAIMS,
  MAX_STAMINA,
  START_STAMINA_COST,
  BEST_SCORE_STAR_COUNT,
  applyDailyStaminaReset,
  calculateStarCount,
  claimAdStamina,
  claimPurchasedStamina,
  normalizeStaminaState,
  spendStartStamina,
} from "../src/game-rules.js";

const level = { rows: 6, cols: 6, durationSeconds: 180 };

test("awards stars from remaining time instead of score", () => {
  assert.equal(calculateStarCount(1, level), 1);
  assert.equal(calculateStarCount(72, level), 2);
  assert.equal(calculateStarCount(126, level), 3);
});

test("best score display uses a stable full star count", () => {
  assert.equal(BEST_SCORE_STAR_COUNT, 3);
});

test("new or reset stamina data starts at full stamina", () => {
  assert.equal(MAX_STAMINA, 60);
  assert.deepEqual(normalizeStaminaState(null, 1_000), {
    stamina: MAX_STAMINA,
    updatedAt: 1_000,
    adClaims: 0,
  });
});

test("does not recover stamina over elapsed time before the next local day", () => {
  assert.deepEqual(applyDailyStaminaReset({ stamina: 10, updatedAt: 1_000 }, 181_000), {
    stamina: 10,
    updatedAt: 1_000,
    adClaims: 0,
  });
  assert.deepEqual(applyDailyStaminaReset({ stamina: 49, updatedAt: 1_000 }, 541_000), {
    stamina: 49,
    updatedAt: 1_000,
    adClaims: 0,
  });
});

test("keeps bonus stamina above max until the next local day reset", () => {
  const sameDay = new Date(2026, 5, 9, 12, 0, 0).getTime();
  const nextDay = new Date(2026, 5, 10, 0, 1, 0).getTime();

  assert.deepEqual(applyDailyStaminaReset({ stamina: 70, updatedAt: sameDay, adClaims: 2 }, sameDay + 60_000), {
    stamina: 70,
    updatedAt: sameDay,
    adClaims: 2,
  });
  assert.deepEqual(applyDailyStaminaReset({ stamina: 70, updatedAt: sameDay, adClaims: 2 }, nextDay), {
    stamina: MAX_STAMINA,
    updatedAt: nextDay,
    adClaims: 0,
  });
});

test("spends stamina when starting a level", () => {
  assert.deepEqual(spendStartStamina({ stamina: 5, updatedAt: 1_000, adClaims: 0 }, 9_000), {
    ok: true,
    state: { stamina: 5 - START_STAMINA_COST, updatedAt: 9_000, adClaims: 0 },
  });
  assert.deepEqual(spendStartStamina({ stamina: 2, updatedAt: 1_000, adClaims: 0 }), {
    ok: false,
    state: { stamina: 2, updatedAt: 1_000, adClaims: 0 },
  });
});

test("spending full stamina records the latest spend time without starting a recovery timer", () => {
  const staleTime = 1_000;
  const now = 20 * 60 * 1000;
  const result = spendStartStamina({ stamina: MAX_STAMINA, updatedAt: staleTime, adClaims: 0 }, now);

  assert.deepEqual(result, {
    ok: true,
    state: { stamina: MAX_STAMINA - START_STAMINA_COST, updatedAt: now, adClaims: 0 },
  });
  assert.deepEqual(applyDailyStaminaReset(result.state, now + 60_000), {
    stamina: MAX_STAMINA - START_STAMINA_COST,
    updatedAt: now,
    adClaims: 0,
  });
});

test("claims ad stamina up to three times", () => {
  assert.deepEqual(claimAdStamina({ stamina: 40, updatedAt: 1_000, adClaims: 2 }), {
    ok: true,
    state: { stamina: 40 + AD_STAMINA_REWARD, updatedAt: 1_000, adClaims: 3 },
  });
  assert.deepEqual(claimAdStamina({ stamina: 10, updatedAt: 1_000, adClaims: MAX_AD_STAMINA_CLAIMS }), {
    ok: false,
    state: { stamina: 10, updatedAt: 1_000, adClaims: MAX_AD_STAMINA_CLAIMS },
  });
});

test("purchased stamina can exceed max without using ad claims", () => {
  assert.deepEqual(claimPurchasedStamina({ stamina: 45, updatedAt: 1_000, adClaims: 3 }), {
    stamina: 45 + AD_STAMINA_REWARD,
    updatedAt: 1_000,
    adClaims: 3,
  });
});
