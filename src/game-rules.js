export const MAX_STAMINA = 50;
export const START_STAMINA_COST = 3;
export const STAMINA_RECOVERY_INTERVAL_MS = 3 * 60 * 1000;
export const AD_STAMINA_REWARD = 30;
export const MAX_AD_STAMINA_CLAIMS = 3;

export function calculateStarCount(remainingSeconds, level) {
  const ratio = remainingSeconds / level.durationSeconds;

  if (ratio >= 0.7) return 3;
  if (ratio >= 0.35) return 2;
  return 1;
}

export function calculateRecoveredStamina(state, now = Date.now()) {
  const safeState = normalizeStaminaState(state, now);
  if (isDifferentLocalDay(safeState.updatedAt, now)) {
    return { stamina: MAX_STAMINA, updatedAt: now, adClaims: 0 };
  }

  if (safeState.stamina >= MAX_STAMINA) {
    return safeState;
  }

  const elapsed = Math.max(0, now - safeState.updatedAt);
  const recovered = Math.floor(elapsed / STAMINA_RECOVERY_INTERVAL_MS);
  if (recovered <= 0) return safeState;

  return {
    ...safeState,
    stamina: Math.min(MAX_STAMINA, safeState.stamina + recovered),
    updatedAt: safeState.updatedAt + recovered * STAMINA_RECOVERY_INTERVAL_MS,
  };
}

export function spendStartStamina(state, now = Date.now()) {
  const safeState = normalizeStaminaState(state, now);
  if (safeState.stamina < START_STAMINA_COST) {
    return { ok: false, state: safeState };
  }

  return {
    ok: true,
    state: {
      ...safeState,
      stamina: safeState.stamina - START_STAMINA_COST,
      updatedAt: now,
    },
  };
}

export function claimAdStamina(state) {
  const safeState = normalizeStaminaState(state);
  if (safeState.adClaims >= MAX_AD_STAMINA_CLAIMS) {
    return { ok: false, state: safeState };
  }

  return {
    ok: true,
    state: {
      ...safeState,
      stamina: safeState.stamina + AD_STAMINA_REWARD,
      adClaims: safeState.adClaims + 1,
    },
  };
}

export function claimPurchasedStamina(state) {
  const safeState = normalizeStaminaState(state);
  return {
    ...safeState,
    stamina: safeState.stamina + AD_STAMINA_REWARD,
  };
}

export function calculateNextStaminaCountdown(state, now = Date.now()) {
  const safeState = normalizeStaminaState(state, now);
  if (safeState.stamina < MAX_STAMINA) {
    const elapsed = Math.max(0, now - safeState.updatedAt);
    const remaining = STAMINA_RECOVERY_INTERVAL_MS - (elapsed % STAMINA_RECOVERY_INTERVAL_MS);
    return { type: "recover", remainingMs: remaining };
  }

  return { type: "reset", remainingMs: nextLocalMidnight(now) - now };
}

export function normalizeStaminaState(state, now = Date.now()) {
  return {
    stamina: clampNumber(state?.stamina, 0, Number.MAX_SAFE_INTEGER, MAX_STAMINA),
    updatedAt: Number.isFinite(state?.updatedAt) ? state.updatedAt : now,
    adClaims: clampNumber(state?.adClaims, 0, MAX_AD_STAMINA_CLAIMS, 0),
  };
}

function isDifferentLocalDay(firstMs, secondMs) {
  const first = new Date(firstMs);
  const second = new Date(secondMs);
  return (
    first.getFullYear() !== second.getFullYear() ||
    first.getMonth() !== second.getMonth() ||
    first.getDate() !== second.getDate()
  );
}

function nextLocalMidnight(now) {
  const date = new Date(now);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 0, 0, 0, 0).getTime();
}

function clampNumber(value, min, max, fallback) {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(value)));
}
