"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useData } from "@/components/data-provider";
import { RatingsSyncBar } from "@/components/ratings-sync-bar";
import { YearFilters, type FilterState } from "@/components/year-filters";
import { filterPlayers } from "@/lib/analytics";
import { cn, fmt } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { RatedPlayer } from "@/lib/types";

type SortKey =
  | "year"
  | "pick"
  | "team"
  | "player"
  | "effectiveRn"
  | "consistencyRn"
  | "consistencyDelta"
  | "ws"
  | "vorp"
  | "claus";

type SortDir = "asc" | "desc";

function cmp(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), undefined, { sensitivity: "base" });
}

function deltaClass(delta: number | null): string {
  if (delta == null) return "text-[var(--muted)]";
  if (Math.abs(delta) >= 3) return "text-amber-800 font-semibold";
  if (Math.abs(delta) >= 2) return "text-amber-700";
  return "text-[var(--ink-soft)]";
}

export function PlayersTable() {
  const { players, meta, dirtyCount, setRn, resetRatings, overrides } = useData();
  const minYear = Math.min(...meta.years);
  const maxYear = Math.max(...meta.years);
  const [filters, setFilters] = useState<FilterState>({
    yearFrom: minYear,
    yearTo: maxYear,
    rounds: [1, 2],
    search: "",
  });
  const [editedOnly, setEditedOnly] = useState(false);
  const [gapOnly, setGapOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("effectiveRn");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "player" || key === "team" ? "asc" : "desc");
    }
  }

  function applyFilters(list: RatedPlayer[]): RatedPlayer[] {
    let next = filterPlayers(list, {
      yearFrom: filters.yearFrom,
      yearTo: filters.yearTo,
      rounds: filters.rounds,
      search: filters.search || undefined,
    });
    if (editedOnly) next = next.filter((p) => p.id in overrides);
    if (gapOnly) {
      next = next.filter(
        (p) => p.consistencyDelta != null && Math.abs(p.consistencyDelta) >= 2
      );
    }
    return next;
  }

  function sortPlayers(list: RatedPlayer[]): RatedPlayer[] {
    return [...list].sort((a, b) => {
      const av = a[sortKey as keyof RatedPlayer];
      const bv = b[sortKey as keyof RatedPlayer];
      const base = cmp(av, bv);
      if (base !== 0) return sortDir === "asc" ? base : -base;
      if (a.year !== b.year) return b.year - a.year;
      return a.pick - b.pick;
    });
  }

  // Membership of the filtered set (not values). RN edits that don't add/remove
  // rows leave this key unchanged, so we don't re-sort under the user's cursor.
  const memberKey = useMemo(() => {
    return applyFilters(players)
      .map((p) => p.id)
      .sort()
      .join("|");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: track filter membership only
  }, [players, filters, editedOnly, gapOnly, overrides]);

  const playersRef = useRef(players);
  playersRef.current = players;

  const [displayOrder, setDisplayOrder] = useState<string[]>([]);

  useLayoutEffect(() => {
    const sorted = sortPlayers(applyFilters(playersRef.current));
    setDisplayOrder(sorted.map((p) => p.id));
    // Re-sort only when the user changes sort/filters, on reload, or when the
    // filtered ID set changes — not when a manual RN value alone changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortKey, sortDir, filters, editedOnly, gapOnly, memberKey]);

  const byId = useMemo(() => {
    const map = new Map<string, RatedPlayer>();
    for (const p of players) map.set(p.id, p);
    return map;
  }, [players]);

  const filtered = useMemo(() => {
    const rows = displayOrder
      .map((id) => byId.get(id))
      .filter((p): p is RatedPlayer => Boolean(p));
    // If filters newly include IDs not yet in the frozen order, append them
    // (stable) until the next explicit re-sort.
    if (rows.length === memberKey.split("|").filter(Boolean).length) return rows;
    const seen = new Set(rows.map((p) => p.id));
    for (const p of applyFilters(players)) {
      if (!seen.has(p.id)) rows.push(p);
    }
    return rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayOrder, byId, memberKey, players, filters, editedOnly, gapOnly, overrides]);

  function SortHeader({
    label,
    column,
    title,
  }: {
    label: string;
    column: SortKey;
    title?: string;
  }) {
    const active = sortKey === column;
    return (
      <th className="px-3 py-2">
        <button
          type="button"
          title={title}
          onClick={() => toggleSort(column)}
          className="inline-flex items-center gap-1 uppercase tracking-wide hover:text-[var(--ink)]"
        >
          {label}
          {active ? (
            sortDir === "asc" ? (
              <ArrowUp className="h-3.5 w-3.5" />
            ) : (
              <ArrowDown className="h-3.5 w-3.5" />
            )
          ) : (
            <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
          )}
        </button>
      </th>
    );
  }

  return (
    <div className="space-y-5">
      <RatingsSyncBar />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-sm text-[var(--ink-soft)]">
          <strong className="font-semibold text-[var(--ink)]">Consist.</strong>{" "}
          is an injury-aware model score (rate-first, soft longevity) calibrated
          to your RN scale — what the rating “should” be for internal
          consistency. Δ = your RN − Consist. (amber when |Δ| ≥ 2).
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={editedOnly ? "default" : "outline"}
            onClick={() => setEditedOnly((v) => !v)}
          >
            Edited only ({dirtyCount})
          </Button>
          <Button
            size="sm"
            variant={gapOnly ? "default" : "outline"}
            onClick={() => setGapOnly((v) => !v)}
          >
            |Δ| ≥ 2
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={resetRatings}
            disabled={!dirtyCount}
          >
            Reset edits
          </Button>
        </div>
      </div>

      <YearFilters
        minYear={minYear}
        maxYear={maxYear}
        value={filters}
        onChange={setFilters}
      />

      <div className="overflow-x-auto rounded-2xl border border-[var(--line)]">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[var(--panel)] text-xs text-[var(--muted)]">
            <tr>
              <SortHeader label="Year" column="year" />
              <SortHeader label="Pk" column="pick" />
              <SortHeader label="Team" column="team" />
              <SortHeader label="Player" column="player" />
              <SortHeader label="RN" column="effectiveRn" />
              <SortHeader
                label="Consist."
                column="consistencyRn"
                title="Injury-aware consistency model (0–10)"
              />
              <SortHeader
                label="Δ"
                column="consistencyDelta"
                title="Your RN minus consistency score"
              />
              <SortHeader label="WS" column="ws" />
              <SortHeader label="VORP" column="vorp" />
              <SortHeader label="Claus" column="claus" />
              <th className="px-3 py-2 uppercase tracking-wide">Notes</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const edited = p.id in overrides;
              const bigGap =
                p.consistencyDelta != null && Math.abs(p.consistencyDelta) >= 2;
              return (
                <tr
                  key={p.id}
                  className={cn(
                    "border-t border-[var(--line)]",
                    edited && "bg-[var(--accent-soft)]/40",
                    !edited && bigGap && "bg-amber-50/80"
                  )}
                >
                  <td className="px-3 py-1.5">{p.year}</td>
                  <td className="px-3 py-1.5">{p.pick}</td>
                  <td className="px-3 py-1.5 font-medium">{p.team}</td>
                  <td className="px-3 py-1.5">
                    <Link
                      href={`/players/${p.id}`}
                      className="font-medium text-[var(--accent-deep)] hover:underline"
                    >
                      {p.player}
                    </Link>
                    {p.college && (
                      <div className="text-xs text-[var(--muted)]">
                        {p.college}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-1.5">
                    <Input
                      type="number"
                      min={0}
                      max={10}
                      step={1}
                      className="h-8 w-20"
                      value={p.effectiveRn ?? ""}
                      placeholder="—"
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === "") setRn(p.id, null);
                        else setRn(p.id, Number(raw));
                      }}
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    {p.consistencyRn == null ? (
                      <span className="text-[var(--muted)]">—</span>
                    ) : (
                      <span
                        title={[
                          `Rounded band ${p.consistencyRnRounded}`,
                          p.consistencyDefense
                            ? `Defense seed ${p.consistencyDefense}/10`
                            : null,
                          p.consistencyChampionships
                            ? `Titles ${p.consistencyChampionships}`
                            : null,
                          p.consistencyFinals
                            ? `Finals ${p.consistencyFinals}`
                            : null,
                          p.consistencyInjuryCredit
                            ? "Soft injury credit"
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      >
                        {fmt(p.consistencyRn, 1)}
                        {p.consistencyInjuryCredit ? (
                          <span className="ml-1 text-[10px] uppercase tracking-wide text-[var(--muted)]">
                            inj
                          </span>
                        ) : null}
                        {p.consistencyDefense >= 7 ? (
                          <span className="ml-1 text-[10px] uppercase tracking-wide text-[var(--muted)]">
                            D
                          </span>
                        ) : null}
                        {p.consistencyChampionships > 0 ? (
                          <span className="ml-1 text-[10px] uppercase tracking-wide text-[var(--muted)]">
                            ring
                          </span>
                        ) : null}
                      </span>
                    )}
                  </td>
                  <td
                    className={cn(
                      "px-3 py-1.5 tabular-nums",
                      deltaClass(p.consistencyDelta)
                    )}
                  >
                    {p.consistencyDelta == null
                      ? "—"
                      : `${p.consistencyDelta > 0 ? "+" : ""}${fmt(p.consistencyDelta, 1)}`}
                  </td>
                  <td className="px-3 py-1.5">{fmt(p.ws, 1)}</td>
                  <td className="px-3 py-1.5">{fmt(p.vorp, 1)}</td>
                  <td className="px-3 py-1.5">{fmt(p.claus, 1)}</td>
                  <td className="px-3 py-1.5 text-xs text-[var(--muted)]">
                    {p.tradedFrom ? `via ${p.tradedFrom}` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
