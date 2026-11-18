const KEY = "nba-draft-rn-overrides-v1";
const WRITE_KEY = "nba-draft-rn-write-key-v1";
const MIGRATED_KEY = "nba-draft-rn-migrated-v1";

export type RnOverrides = Record<string, number | null>;

export function loadOverrides(): RnOverrides {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    return JSON.parse(raw) as RnOverrides;
  } catch {
    return {};
  }
}

export function saveOverrides(overrides: RnOverrides) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(overrides));
}

export function clearOverrides() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

export function loadWriteKey(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.sessionStorage.getItem(WRITE_KEY) || "";
  } catch {
    return "";
  }
}

export function saveWriteKey(key: string) {
  if (typeof window === "undefined") return;
  try {
    if (key) window.sessionStorage.setItem(WRITE_KEY, key);
    else window.sessionStorage.removeItem(WRITE_KEY);
  } catch {
    // ignore
  }
}

export function hasMigratedLocalOverrides(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(MIGRATED_KEY) === "1";
  } catch {
    return false;
  }
}

export function markLocalOverridesMigrated() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MIGRATED_KEY, "1");
  } catch {
    // ignore
  }
}
