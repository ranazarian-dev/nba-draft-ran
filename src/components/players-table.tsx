"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useData } from "@/components/data-provider";
import { RatingsSyncBar } from "@/components/ratings-sync-bar";
import { YearFilters, type FilterState } from "@/components/year-filters";
import { filterPlayers } from "@/lib/analytics";
import { fmt } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { RatedPlayer } from "@/lib/types";

type SortKey =
  | "year"
  | "pick"
  | "team"
  | "player"
  | "effectiveRn"
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

  const filtered = useMemo(() => {
    let list = filterPlayers(players, {
      yearFrom: filters.yearFrom,
      yearTo: filters.yearTo,
      rounds: filters.rounds,
      search: filters.search || undefined,
    });
    if (editedOnly) list = list.filter((p) => p.id in overrides);
    const sorted = [...list].sort((a, b) => {
      const av = a[sortKey as keyof RatedPlayer];
      const bv = b[sortKey as keyof RatedPlayer];
      const base = cmp(av, bv);
      if (base !== 0) return sortDir === "asc" ? base : -base;
      // stable tie-breakers
      if (a.year !== b.year) return b.year - a.year;
      return a.pick - b.pick;
    });
    return sorted;
  }, [players, filters, editedOnly, overrides, sortKey, sortDir]);

  function SortHeader({
    label,
    column,
  }: {
    label: string;
    column: SortKey;
  }) {
    const active = sortKey === column;
    return (
      <th className="px-3 py-2">
        <button
          type="button"
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
          Edit RN Value inline — changes save to the shared store for every
          device. Click a player name for career / yearly stats and same-pick
          comparisons.
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
              <SortHeader label="WS" column="ws" />
              <SortHeader label="VORP" column="vorp" />
              <SortHeader label="Claus" column="claus" />
              <th className="px-3 py-2 uppercase tracking-wide">Notes</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const edited = p.id in overrides;
              return (
                <tr
                  key={p.id}
                  className={`border-t border-[var(--line)] ${edited ? "bg-[var(--accent-soft)]/40" : ""}`}
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
