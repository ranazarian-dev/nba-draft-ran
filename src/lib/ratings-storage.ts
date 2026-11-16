const KEY = "nba-draft-rn-overrides-v1";

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
