import { MAX_STAMINA } from "./game-rules.js";
import { createInitialProgress } from "./progression.js";

export const CURRENT_DATA_RESET_VERSION = "2026-06-26-all-data-reset";
export const DATA_RESET_VERSION_KEY = "lianliankan.dataResetVersion";
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

function createFullStaminaState(now) {
  return { stamina: MAX_STAMINA, updatedAt: now, adClaims: 0 };
}
