"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Meta, Player, RatedPlayer } from "@/lib/types";
import { withEffectiveRn } from "@/lib/analytics";
import {
  clearOverrides,
  hasMigratedLocalOverrides,
  loadOverrides,
  loadWriteKey,
  markLocalOverridesMigrated,
  saveOverrides,
  saveWriteKey,
  type RnOverrides,
} from "@/lib/ratings-storage";

type RefreshOptions = { year?: number; years?: number[]; all?: boolean };

export type AnalysisSpan = {
  yearFrom: number;
  yearTo: number;
  rounds: number[];
};

export type RatingsSyncStatus =
  | "loading"
  | "synced"
  | "saving"
  | "error"
  | "needs-key";

type DataContextValue = {
  players: RatedPlayer[];
  basePlayers: Player[];
  meta: Meta;
  overrides: RnOverrides;
  dirtyCount: number;
  loading: boolean;
  refreshing: boolean;
  lastRefreshNote: string | null;
  analysisSpan: AnalysisSpan;
  setAnalysisSpan: (next: AnalysisSpan) => void;
  setRn: (id: string, value: number | null) => void;
  resetRatings: () => void;
  replacePlayers: (players: Player[]) => void;
  refreshFromBref: (opts: RefreshOptions) => Promise<void>;
  ratingsSyncStatus: RatingsSyncStatus;
  ratingsSyncMessage: string | null;
  writeKeyRequired: boolean;
  setRatingsWriteKey: (key: string) => void;
  retryRatingsSave: () => void;
};

const SPAN_KEY = "nba-draft-analysis-span-v1";

const DataContext = createContext<DataContextValue | null>(null);

function authHeaders(): HeadersInit {
  const key = loadWriteKey();
  return key ? { "x-ratings-key": key } : {};
}

export function DataProvider({
  initialPlayers,
  meta,
  children,
}: {
  initialPlayers: Player[];
  meta: Meta;
  children: React.ReactNode;
}) {
  const minYear = Math.min(...meta.years);
  const maxYear = Math.max(...meta.years);
  const [basePlayers, setBasePlayers] = useState<Player[]>(initialPlayers);
  const [overrides, setOverrides] = useState<RnOverrides>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshNote, setLastRefreshNote] = useState<string | null>(null);
  const [ratingsSyncStatus, setRatingsSyncStatus] =
    useState<RatingsSyncStatus>("loading");
  const [ratingsSyncMessage, setRatingsSyncMessage] = useState<string | null>(
    null
  );
  const [writeKeyRequired, setWriteKeyRequired] = useState(false);
  const [analysisSpan, setAnalysisSpanState] = useState<AnalysisSpan>({
    yearFrom: minYear,
    yearTo: maxYear,
    rounds: [1, 2],
  });
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const overridesRef = useRef<RnOverrides>({});

  useEffect(() => {
    overridesRef.current = overrides;
  }, [overrides]);

  const persistToServer = useCallback(async (next: RnOverrides, mode: "put" | "merge" = "put") => {
    setRatingsSyncStatus("saving");
    setRatingsSyncMessage(null);
    try {
      const res = await fetch("/api/ratings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify(
          mode === "merge" ? { merge: next } : { overrides: next }
        ),
      });
      const data = await res.json();
      if (res.status === 401) {
        setWriteKeyRequired(true);
        setRatingsSyncStatus("needs-key");
        setRatingsSyncMessage("Enter the ratings write key to save across devices.");
        return false;
      }
      if (!res.ok) {
        setRatingsSyncStatus("error");
        setRatingsSyncMessage(data.error || "Failed to save ratings");
        return false;
      }
      if (data.overrides && typeof data.overrides === "object") {
        setOverrides(data.overrides);
        saveOverrides(data.overrides);
      } else {
        saveOverrides(next);
      }
      setRatingsSyncStatus("synced");
      setRatingsSyncMessage(
        data.mode === "github"
          ? "Saved — synced for all devices."
          : data.mode === "filesystem"
            ? "Saved on this server."
            : "Saved."
      );
      return true;
    } catch (e) {
      setRatingsSyncStatus("error");
      setRatingsSyncMessage(e instanceof Error ? e.message : "Save failed");
      return false;
    }
  }, []);

  const queueSave = useCallback(
    (next: RnOverrides) => {
      saveOverrides(next);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        void persistToServer(next, "put");
      }, 600);
    },
    [persistToServer]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = window.localStorage.getItem(SPAN_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as AnalysisSpan;
          if (
            typeof parsed.yearFrom === "number" &&
            typeof parsed.yearTo === "number" &&
            Array.isArray(parsed.rounds)
          ) {
            setAnalysisSpanState({
              yearFrom: Math.max(minYear, Math.min(maxYear, parsed.yearFrom)),
              yearTo: Math.max(minYear, Math.min(maxYear, parsed.yearTo)),
              rounds: parsed.rounds.length ? parsed.rounds : [1, 2],
            });
          }
        }
      } catch {
        // ignore
      }

      try {
        const res = await fetch("/api/ratings", { cache: "no-store" });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(data.error || "Failed to load ratings");

        setWriteKeyRequired(Boolean(data.writeKeyRequired));
        const serverOverrides = (data.overrides || {}) as RnOverrides;
        const local = loadOverrides();
        const localKeys = Object.keys(local);
        const serverKeys = Object.keys(serverOverrides);
        // Upload browser-only edits when the shared store is missing them
        // (first-time migrate, or recover after an empty/wiped server file).
        const missingOnServer = localKeys.filter((k) => !(k in serverOverrides));
        const needsMigrate =
          localKeys.length > 0 &&
          (serverKeys.length === 0 ||
            missingOnServer.length > 0 ||
            !hasMigratedLocalOverrides());

        if (needsMigrate && missingOnServer.length > 0) {
          const merged = { ...serverOverrides, ...local };
          setOverrides(merged);
          saveOverrides(merged);
          const ok = await persistToServer(local, "merge");
          if (ok) {
            markLocalOverridesMigrated();
            setRatingsSyncMessage(
              `Uploaded ${missingOnServer.length} local rating edit(s) to the shared store.`
            );
          }
        } else {
          // Prefer shared store when present; fall back to local cache.
          const next = serverKeys.length > 0 ? serverOverrides : local;
          setOverrides(next);
          saveOverrides(next);
          setRatingsSyncStatus("synced");
          setRatingsSyncMessage(
            serverKeys.length
              ? "Loaded shared ratings."
              : localKeys.length
                ? "Using local ratings (shared store empty)."
                : "No shared rating edits yet."
          );
          if (serverKeys.length > 0) markLocalOverridesMigrated();
        }
      } catch (e) {
        if (cancelled) return;
        const local = loadOverrides();
        setOverrides(local);
        setRatingsSyncStatus("error");
        setRatingsSyncMessage(
          e instanceof Error
            ? e.message
            : "Could not reach shared ratings store; using local cache."
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [minYear, maxYear, persistToServer]);

  const setAnalysisSpan = useCallback((next: AnalysisSpan) => {
    setAnalysisSpanState(next);
    try {
      window.localStorage.setItem(SPAN_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  const setRn = useCallback(
    (id: string, value: number | null) => {
      setOverrides((prev) => {
        const next = { ...prev, [id]: value };
        queueSave(next);
        return next;
      });
    },
    [queueSave]
  );

  const resetRatings = useCallback(() => {
    clearOverrides();
    setOverrides({});
    void persistToServer({}, "put");
  }, [persistToServer]);

  const replacePlayers = useCallback((players: Player[]) => {
    setBasePlayers(players);
  }, []);

  const setRatingsWriteKey = useCallback(
    (key: string) => {
      saveWriteKey(key.trim());
      void persistToServer(overridesRef.current, "put");
    },
    [persistToServer]
  );

  const retryRatingsSave = useCallback(() => {
    void persistToServer(overridesRef.current, "put");
  }, [persistToServer]);

  const refreshFromBref = useCallback(async (opts: RefreshOptions) => {
    setRefreshing(true);
    setLastRefreshNote(null);
    try {
      const res = await fetch("/api/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(opts),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Refresh failed");
      }
      if (Array.isArray(data.players)) {
        setBasePlayers(data.players);
      }
      const errText =
        data.errors?.length > 0
          ? ` Errors: ${data.errors.map((e: { year: number; message: string }) => `${e.year} (${e.message})`).join("; ")}`
          : "";
      setLastRefreshNote(
        `Updated ${data.updated} picks, added ${data.inserted}.${data.persisted ? " Saved to project data." : " In-memory only (host FS read-only)."}` +
          errText
      );
    } catch (e) {
      setLastRefreshNote(e instanceof Error ? e.message : String(e));
      throw e;
    } finally {
      setRefreshing(false);
    }
  }, []);

  const players = useMemo(
    () => withEffectiveRn(basePlayers as RatedPlayer[], overrides),
    [basePlayers, overrides]
  );

  const dirtyCount = useMemo(() => Object.keys(overrides).length, [overrides]);

  const value: DataContextValue = {
    players,
    basePlayers,
    meta,
    overrides,
    dirtyCount,
    loading,
    refreshing,
    lastRefreshNote,
    analysisSpan,
    setAnalysisSpan,
    setRn,
    resetRatings,
    replacePlayers,
    refreshFromBref,
    ratingsSyncStatus,
    ratingsSyncMessage,
    writeKeyRequired,
    setRatingsWriteKey,
    retryRatingsSave,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
