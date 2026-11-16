"use client";

import { useMemo, useState } from "react";
import { useData } from "@/components/data-provider";
import { YearFilters, type FilterState } from "@/components/year-filters";
import { filterPlayers } from "@/lib/analytics";
import { fmt } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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

  const filtered = useMemo(() => {
    let list = filterPlayers(players, {
      yearFrom: filters.yearFrom,
      yearTo: filters.yearTo,
      rounds: filters.rounds,
      search: filters.search || undefined,
    });
    if (editedOnly) list = list.filter((p) => p.id in overrides);
    return [...list].sort((a, b) =>
      a.year !== b.year ? b.year - a.year : a.pick - b.pick
    );
  }, [players, filters, editedOnly, overrides]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-sm text-[var(--ink-soft)]">
          Edit RN Value inline. Changes save in this browser (localStorage) and
          feed every chart. Rookies / blank scores stay empty until you rate
          them.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={editedOnly ? "default" : "outline"}
            onClick={() => setEditedOnly((v) => !v)}
          >
            Edited only ({dirtyCount})
          </Button>
          <Button size="sm" variant="outline" onClick={resetRatings} disabled={!dirtyCount}>
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
          <thead className="bg-[var(--panel)] text-xs uppercase tracking-wide text-[var(--muted)]">
            <tr>
              <th className="px-3 py-2">Year</th>
              <th className="px-3 py-2">Pk</th>
              <th className="px-3 py-2">Team</th>
              <th className="px-3 py-2">Player</th>
              <th className="px-3 py-2">RN</th>
              <th className="px-3 py-2">WS</th>
              <th className="px-3 py-2">VORP</th>
              <th className="px-3 py-2">Clause</th>
              <th className="px-3 py-2">Trade</th>
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
                    <div className="font-medium">{p.player}</div>
                    {p.college && (
                      <div className="text-xs text-[var(--muted)]">{p.college}</div>
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
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === "") setRn(p.id, null);
                        else setRn(p.id, Number(raw));
                      }}
                    />
                  </td>
                  <td className="px-3 py-1.5">{fmt(p.ws, 1)}</td>
                  <td className="px-3 py-1.5">{fmt(p.vorp, 1)}</td>
                  <td className="px-3 py-1.5">{fmt(p.clause, 1)}</td>
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
