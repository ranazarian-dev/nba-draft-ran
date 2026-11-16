"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useData } from "@/components/data-provider";
import { YearFilters, type FilterState } from "@/components/year-filters";
import { filterPlayers, teamSummaries } from "@/lib/analytics";
import { fmt } from "@/lib/utils";

export function TeamReportCards() {
  const { players, meta } = useData();
  const minYear = Math.min(...meta.years);
  const maxYear = Math.max(...meta.years);
  const [filters, setFilters] = useState<FilterState>({
    yearFrom: minYear,
    yearTo: maxYear,
    rounds: [1, 2],
    search: "",
  });

  const filtered = useMemo(
    () =>
      filterPlayers(players, {
        yearFrom: filters.yearFrom,
        yearTo: filters.yearTo,
        rounds: filters.rounds,
      }),
    [players, filters]
  );

  const teams = useMemo(
    () => teamSummaries(filtered, meta.teamNames),
    [filtered, meta.teamNames]
  );

  return (
    <div className="space-y-5">
      <YearFilters
        minYear={minYear}
        maxYear={maxYear}
        value={filters}
        onChange={setFilters}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {teams.map((t, idx) => (
          <Link
            key={t.team}
            href={`/teams/${t.team}`}
            className="group rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4 transition-transform hover:-translate-y-0.5 hover:border-[var(--accent)]"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                  #{idx + 1} · {t.team}
                </div>
                <div className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
                  {t.name}
                </div>
              </div>
              <div className="rounded-md bg-[var(--panel)] px-2 py-1 text-right">
                <div className="text-[10px] uppercase text-[var(--muted)]">
                  Avg RN
                </div>
                <div className="text-lg font-semibold text-[var(--accent-deep)]">
                  {fmt(t.meanRn, 2)}
                </div>
              </div>
            </div>
            <dl className="mt-4 grid grid-cols-3 gap-2 text-sm">
              <div>
                <dt className="text-[var(--muted)]">Picks</dt>
                <dd className="font-medium">{t.picks}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">Useful</dt>
                <dd className="font-medium">{t.useful}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">All-Stars</dt>
                <dd className="font-medium">{t.allStars}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">Starters</dt>
                <dd className="font-medium">{t.starters}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">Top 5</dt>
                <dd className="font-medium">{t.top5Picks}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">1st rnd avg</dt>
                <dd className="font-medium">{fmt(t.meanFirstRound, 2)}</dd>
              </div>
            </dl>
          </Link>
        ))}
      </div>
    </div>
  );
}
