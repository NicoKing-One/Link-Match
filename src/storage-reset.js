import { MAX_STAMINA } from "./game-rules.js";
import { createInitialProgress } from "./progression.js";

export const CURRENT_DATA_RESET_VERSION = "2026-07-01-lock-all-levels-reset";
export const CURRENT_STAMINA_REFILL_VERSION = "2026-06-29-refill-current-stamina-60";
export const DATA_RESET_VERSION_KEY = "lianliankan.dataResetVersion";
export const STAMINA_REFILL_VERSION_KEY = "lianliankan.staminaRefillVersion";
export const PROGRESS_STORAGE_KEY = "lianliankan.progress";
export const STAMINA_STORAGE_KEY = "lianliankan.stamina";

export function applyVersionedDataReset(storage, now = Date.now()) {
  if (!storage || storage.getItem(DATA_RESET_VERSION_KEY) === CURRENT_DATA_RESET_VERSION) {
    return false;
  }

  storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(createInitialProgress()));
  storage.setItem(STAMINA_STORAGE_KEY, JSON.stringify(createFullStaminaState(now)));
  storage.setItem(DATA_RESET_VERSION_KEY, CURRENT_DATA_RESET_VERSION);
  return true;
}

export function applyOneTimeStaminaRefill(storage, now = Date.now()) {
  if (!storage || storage.getItem(STAMINA_REFILL_VERSION_KEY) === CURRENT_STAMINA_REFILL_VERSION) {
    return false;
  }

  if (readStoredStaminaValue(storage) !== 0) {
    return false;
  }

  storage.setItem(STAMINA_STORAGE_KEY, JSON.stringify(createFullStaminaState(now)));
  storage.setItem(STAMINA_REFILL_VERSION_KEY, CURRENT_STAMINA_REFILL_VERSION);
  return true;
}

function createFullStaminaState(now) {
  return { stamina: MAX_STAMINA, updatedAt: now, adClaims: 0 };
}

function readStoredStaminaValue(storage) {
  try {
    const state = JSON.parse(storage.getItem(STAMINA_STORAGE_KEY));
    return Number.isFinite(state?.stamina) ? Math.floor(state.stamina) : null;
  } catch {
    return null;
  }
}
