"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useData } from "@/components/data-provider";
import { YearFilters, type FilterState } from "@/components/year-filters";
import {
  HIT_THRESHOLDS,
  filterPlayers,
  hitRatesByPick,
  hitRatesByRange,
} from "@/lib/analytics";
import { fmt, pct } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Mode = "range" | "pick";
type Metric = "hit" | "meanRn" | "ws" | "vorp" | "claus";

export function HitRateExplorer() {
  const { players, meta, analysisSpan, setAnalysisSpan } = useData();
  const years = meta.years;
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<Mode>("range");
  const [metric, setMetric] = useState<Metric>("hit");
  const [thresholdKey, setThresholdKey] = useState<string>("gt4");

  const filters: FilterState = {
    yearFrom: analysisSpan.yearFrom,
    yearTo: analysisSpan.yearTo,
    rounds: analysisSpan.rounds,
    search,
  };

  const filtered = useMemo(
    () =>
      filterPlayers(players, {
        yearFrom: filters.yearFrom,
        yearTo: filters.yearTo,
        rounds: filters.rounds,
        search: filters.search || undefined,
      }),
    [players, filters.yearFrom, filters.yearTo, filters.rounds, filters.search]
  );

  const rows = useMemo(
    () =>
      mode === "range" ? hitRatesByRange(filtered) : hitRatesByPick(filtered),
    [filtered, mode]
  );

  const chartData = useMemo(
    () =>
      rows.map((r) => ({
        label: r.label,
        hit: r.rates[thresholdKey] != null ? r.rates[thresholdKey]! * 100 : null,
        meanRn: r.meanRn,
        ws: r.meanWs,
        vorp: r.meanVorp,
        claus: r.meanClaus,
        n: r.rated,
      })),
    [rows, thresholdKey]
  );

  const thresholdLabel =
    HIT_THRESHOLDS.find((t) => t.key === thresholdKey)?.label ?? thresholdKey;

  const yKey =
    metric === "hit"
      ? "hit"
      : metric === "meanRn"
        ? "meanRn"
        : metric === "ws"
          ? "ws"
          : metric === "vorp"
            ? "vorp"
            : "claus";

  const yLabel =
    metric === "hit"
      ? `% ${thresholdLabel}`
      : metric === "meanRn"
        ? "Mean RN"
        : metric === "ws"
          ? "Mean WS"
          : metric === "vorp"
            ? "Mean VORP"
            : "Mean Claus";

  return (
    <div className="space-y-5">
      <YearFilters
        minYear={minYear}
        maxYear={maxYear}
        value={filters}
        onChange={(next) => {
          setAnalysisSpan({
            yearFrom: next.yearFrom,
            yearTo: next.yearTo,
            rounds: next.rounds,
          });
          setSearch(next.search);
        }}
      />
      <p className="text-xs text-[var(--muted)]">
        Year span here is shared with player pages (same-pick comparisons).
      </p>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={mode === "range" ? "default" : "outline"}
          onClick={() => setMode("range")}
        >
          Pick ranges (5)
        </Button>
        <Button
          size="sm"
          variant={mode === "pick" ? "default" : "outline"}
          onClick={() => setMode("pick")}
        >
          Individual picks
        </Button>
        <span className="mx-1 hidden h-8 w-px bg-[var(--line)] sm:inline-block" />
        {(
          [
            ["hit", "Hit rate"],
            ["meanRn", "Mean RN"],
            ["ws", "WS"],
            ["vorp", "VORP"],
            ["claus", "Claus"],
          ] as const
        ).map(([k, label]) => (
          <Button
            key={k}
            size="sm"
            variant={metric === k ? "accent" : "outline"}
            onClick={() => setMetric(k)}
          >
            {label}
          </Button>
        ))}
      </div>

      {metric === "hit" && (
        <div className="flex flex-wrap gap-2">
          {HIT_THRESHOLDS.map((t) => (
            <Button
              key={t.key}
              size="sm"
              variant={thresholdKey === t.key ? "default" : "ghost"}
              onClick={() => setThresholdKey(t.key)}
            >
              {t.label}
            </Button>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-3 sm:p-5">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
            {yLabel} by {mode === "range" ? "range" : "pick"}
          </h2>
          <div className="text-xs text-[var(--muted)]">
            {filtered.length} players in filter
          </div>
        </div>
        <div className="h-72 w-full sm:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
            >
              <CartesianGrid stroke="var(--line)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "var(--muted)", fontSize: 11 }}
                interval={mode === "pick" ? 4 : 0}
              />
              <YAxis
                tick={{ fill: "var(--muted)", fontSize: 11 }}
                width={48}
                tickFormatter={(v) =>
                  metric === "hit" ? `${v}%` : Number(v).toFixed(1)
                }
              />
              <Tooltip
                contentStyle={{
                  background: "var(--paper)",
                  border: "1px solid var(--line)",
                  borderRadius: 8,
                }}
                formatter={(value) => {
                  const n = typeof value === "number" ? value : Number(value);
                  if (!Number.isFinite(n)) return ["—", yLabel];
                  return [
                    metric === "hit" ? `${n.toFixed(1)}%` : n.toFixed(2),
                    yLabel,
                  ];
                }}
              />
              <Legend />
              <Bar
                dataKey={yKey}
                name={yLabel}
                fill="var(--accent)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[var(--line)]">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[var(--panel)] text-xs uppercase tracking-wide text-[var(--muted)]">
            <tr>
              <th className="px-3 py-2">
                {mode === "range" ? "Range" : "Pick"}
              </th>
              <th className="px-3 py-2">N</th>
              <th className="px-3 py-2">Mean RN</th>
              <th className="px-3 py-2">Med RN</th>
              {HIT_THRESHOLDS.map((t) => (
                <th key={t.key} className="px-3 py-2">
                  &gt;{t.threshold}
                </th>
              ))}
              <th className="px-3 py-2">WS</th>
              <th className="px-3 py-2">VORP</th>
              <th className="px-3 py-2">Claus</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-t border-[var(--line)]">
                <td className="px-3 py-2 font-medium">{r.label}</td>
                <td className="px-3 py-2">{r.rated}</td>
                <td className="px-3 py-2">{fmt(r.meanRn, 2)}</td>
                <td className="px-3 py-2">{fmt(r.medianRn, 2)}</td>
                {HIT_THRESHOLDS.map((t) => (
                  <td key={t.key} className="px-3 py-2">
                    {pct(r.rates[t.key], 0)}
                  </td>
                ))}
                <td className="px-3 py-2">{fmt(r.meanWs, 1)}</td>
                <td className="px-3 py-2">{fmt(r.meanVorp, 1)}</td>
                <td className="px-3 py-2">{fmt(r.meanClaus, 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
