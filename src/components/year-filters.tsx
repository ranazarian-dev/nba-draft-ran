"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export type FilterState = {
  yearFrom: number;
  yearTo: number;
  rounds: number[];
  search: string;
};

export function YearFilters({
  minYear,
  maxYear,
  value,
  onChange,
}: {
  minYear: number;
  maxYear: number;
  value: FilterState;
  onChange: (next: FilterState) => void;
}) {
  function toggleRound(r: number) {
    const has = value.rounds.includes(r);
    onChange({
      ...value,
      rounds: has ? value.rounds.filter((x) => x !== r) : [...value.rounds, r],
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4 sm:flex-row sm:flex-wrap sm:items-end">
      <label className="text-sm">
        <span className="mb-1 block text-[var(--muted)]">From</span>
        <Input
          type="number"
          className="w-28"
          min={minYear}
          max={maxYear}
          value={value.yearFrom}
          onChange={(e) =>
            onChange({ ...value, yearFrom: Number(e.target.value) })
          }
        />
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-[var(--muted)]">To</span>
        <Input
          type="number"
          className="w-28"
          min={minYear}
          max={maxYear}
          value={value.yearTo}
          onChange={(e) =>
            onChange({ ...value, yearTo: Number(e.target.value) })
          }
        />
      </label>
      <div className="text-sm">
        <span className="mb-1 block text-[var(--muted)]">Rounds</span>
        <div className="flex gap-2">
          {[1, 2].map((r) => (
            <Button
              key={r}
              size="sm"
              variant={value.rounds.includes(r) ? "default" : "outline"}
              onClick={() => toggleRound(r)}
            >
              R{r}
            </Button>
          ))}
        </div>
      </div>
      <label className="min-w-[12rem] flex-1 text-sm">
        <span className="mb-1 block text-[var(--muted)]">Search</span>
        <Input
          placeholder="Player, team, college…"
          value={value.search}
          onChange={(e) => onChange({ ...value, search: e.target.value })}
        />
      </label>
    </div>
  );
}
