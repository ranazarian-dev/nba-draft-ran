"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useData } from "@/components/data-provider";
import { fmt } from "@/lib/utils";

export function TeamDetail({ code }: { code: string }) {
  const { players, meta } = useData();
  const team = code.toUpperCase();
  const name = meta.teamNames[team] ?? team;

  const list = useMemo(
    () =>
      players
        .filter((p) => p.team === team)
        .sort((a, b) => (a.year !== b.year ? b.year - a.year : a.pick - b.pick)),
    [players, team]
  );

  const rated = list.filter((p) => p.effectiveRn != null);
  const mean =
    rated.length === 0
      ? null
      : rated.reduce((s, p) => s + (p.effectiveRn ?? 0), 0) / rated.length;

  return (
    <div className="space-y-5">
      <div>
        <Link href="/teams" className="text-sm text-[var(--accent-deep)]">
          ← All teams
        </Link>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
          {name}
        </h1>
        <p className="text-sm text-[var(--muted)]">
          {list.length} picks · avg RN {fmt(mean, 2)} · opening-night assignees
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[var(--line)]">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[var(--panel)] text-xs uppercase tracking-wide text-[var(--muted)]">
            <tr>
              <th className="px-3 py-2">Year</th>
              <th className="px-3 py-2">Pk</th>
              <th className="px-3 py-2">Player</th>
              <th className="px-3 py-2">RN</th>
              <th className="px-3 py-2">WS</th>
              <th className="px-3 py-2">VORP</th>
              <th className="px-3 py-2">Via</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id} className="border-t border-[var(--line)]">
                <td className="px-3 py-2">{p.year}</td>
                <td className="px-3 py-2">{p.pick}</td>
                <td className="px-3 py-2 font-medium">{p.player}</td>
                <td className="px-3 py-2">{fmt(p.effectiveRn, 0)}</td>
                <td className="px-3 py-2">{fmt(p.ws, 1)}</td>
                <td className="px-3 py-2">{fmt(p.vorp, 1)}</td>
                <td className="px-3 py-2 text-[var(--muted)]">
                  {p.tradedFrom ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
