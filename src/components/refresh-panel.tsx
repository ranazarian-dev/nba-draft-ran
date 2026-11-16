"use client";

import { useMemo, useState } from "react";
import { RefreshCw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useData } from "@/components/data-provider";

export function RefreshPanel() {
  const {
    meta,
    basePlayers,
    refreshing,
    lastRefreshNote,
    refreshFromBref,
  } = useData();
  const maxYear = useMemo(() => {
    const fromData = Math.max(...basePlayers.map((p) => p.year), ...meta.years);
    return Math.max(fromData, new Date().getFullYear());
  }, [basePlayers, meta.years]);
  const [year, setYear] = useState(String(maxYear));
  const [status, setStatus] = useState<string | null>(null);

  async function run(opts: { year?: number; all?: boolean }) {
    setStatus(null);
    try {
      await refreshFromBref(opts);
      setStatus("Done.");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Refresh failed");
    }
  }

  function downloadJson() {
    const blob = new Blob([JSON.stringify(basePlayers, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "players.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
            Update from Basketball-Reference
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-[var(--ink-soft)]">
            Pulls career totals / advanced stats for a draft class (or every
            year in the dataset). Your RN ratings and opening-night trade
            assignments are kept; only BRef factual columns refresh.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={downloadJson}>
          <Download className="h-4 w-4" />
          Export JSON
        </Button>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--muted)]">Draft year</span>
          <Input
            type="number"
            min={1980}
            max={maxYear + 1}
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="w-36"
          />
        </label>
        <Button
          variant="accent"
          disabled={refreshing}
          onClick={() => run({ year: Number(year) })}
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Updating…" : "Update this year"}
        </Button>
        <Button
          variant="outline"
          disabled={refreshing}
          onClick={() => run({ all: true })}
        >
          Update all years
        </Button>
      </div>

      <p className="mt-3 text-xs text-[var(--muted)]">
        Requests are paced (~1.2s apart) to be polite to Basketball-Reference.
        Adding a brand-new draft year creates unrated rookies (RN blank) using
        BRef&apos;s drafting team until you edit trades/ratings.
      </p>

      {(lastRefreshNote || status) && (
        <div className="mt-4 rounded-lg border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm text-[var(--ink-soft)]">
          {lastRefreshNote || status}
        </div>
      )}
    </section>
  );
}
