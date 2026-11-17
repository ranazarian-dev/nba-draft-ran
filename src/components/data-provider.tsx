"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Meta, Player, RatedPlayer } from "@/lib/types";
import { withEffectiveRn } from "@/lib/analytics";
import {
  clearOverrides,
  loadOverrides,
  saveOverrides,
  type RnOverrides,
} from "@/lib/ratings-storage";

type RefreshOptions = { year?: number; years?: number[]; all?: boolean };

export type AnalysisSpan = {
  yearFrom: number;
  yearTo: number;
  rounds: number[];
};

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
};

const SPAN_KEY = "nba-draft-analysis-span-v1";

const DataContext = createContext<DataContextValue | null>(null);

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
  const [analysisSpan, setAnalysisSpanState] = useState<AnalysisSpan>({
    yearFrom: minYear,
    yearTo: maxYear,
    rounds: [1, 2],
  });

  useEffect(() => {
    setOverrides(loadOverrides());
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
    setLoading(false);
  }, [minYear, maxYear]);

  const setAnalysisSpan = useCallback((next: AnalysisSpan) => {
    setAnalysisSpanState(next);
    try {
      window.localStorage.setItem(SPAN_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  const setRn = useCallback((id: string, value: number | null) => {
    setOverrides((prev) => {
      const next = { ...prev, [id]: value };
      saveOverrides(next);
      return next;
    });
  }, []);

  const resetRatings = useCallback(() => {
    clearOverrides();
    setOverrides({});
  }, []);

  const replacePlayers = useCallback((players: Player[]) => {
    setBasePlayers(players);
  }, []);

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
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
