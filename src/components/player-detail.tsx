"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
import { filterPlayers } from "@/lib/analytics";
import { mean, fmt } from "@/lib/utils";
import type { SeasonLine } from "@/lib/bref-player";

type ProfileResponse = {
  player: {
    id: string;
    player: string;
    year: number;
    pick: number;
    team: string;
    tradedFrom: string | null;
    college: string | null;
    ptsPg: number | null;
    trbPg: number | null;
    astPg: number | null;
    ws: number | null;
    vorp: number | null;
    claus: number | null;
    effectiveRn?: number | null;
    rnValue: number | null;
  };
  profile: {
    brefUrl: string;
    seasons: SeasonLine[];
    career: SeasonLine | null;
  } | null;
  error?: string;
};

export function PlayerDetail({ id }: { id: string }) {
  const { players, analysisSpan, meta } = useData();
  const local = players.find((p) => p.id === id);
  const [data, setData] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/player-bref?id=${encodeURIComponent(id)}`)
      .then(async (res) => {
        const json = (await res.json()) as ProfileResponse;
        if (!res.ok && !json.player) {
          throw new Error(json.error || "Failed to load player");
        }
        if (!cancelled) {
          setData(json);
          if (json.error && !json.profile) setError(json.error);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const player = data?.player ?? local;

  const samePickPeers = useMemo(() => {
    if (!player) return [];
    return filterPlayers(players, {
      yearFrom: analysisSpan.yearFrom,
      yearTo: analysisSpan.yearTo,
      rounds: analysisSpan.rounds,
    }).filter((p) => p.pick === player.pick && p.id !== player.id);
  }, [players, player, analysisSpan]);

  const peerMeans = useMemo(() => {
    const pts = samePickPeers
      .map((p) => p.ptsPg)
      .filter((v): v is number => v != null);
    const reb = samePickPeers
      .map((p) => p.trbPg)
      .filter((v): v is number => v != null);
    const ast = samePickPeers
      .map((p) => p.astPg)
      .filter((v): v is number => v != null);
    return {
      ptsPg: mean(pts),
      trbPg: mean(reb),
      astPg: mean(ast),
      n: samePickPeers.length,
    };
  }, [samePickPeers]);

  const comparisonChart = useMemo(() => {
    if (!player) return [];
    return [
      {
        stat: "PPG",
        player: player.ptsPg,
        pickAvg: peerMeans.ptsPg,
      },
      {
        stat: "RPG",
        player: player.trbPg,
        pickAvg: peerMeans.trbPg,
      },
      {
        stat: "APG",
        player: player.astPg,
        pickAvg: peerMeans.astPg,
      },
    ];
  }, [player, peerMeans]);

  if (!player && loading) {
    return <p className="text-[var(--muted)]">Loading player…</p>;
  }
  if (!player) {
    return (
      <div>
        <Link href="/players" className="text-sm text-[var(--accent-deep)]">
          ← Players
        </Link>
        <p className="mt-3">Player not found.</p>
      </div>
    );
  }

  const seasons = data?.profile?.seasons ?? [];
  const career = data?.profile?.career;
  const teamName = meta.teamNames[player.team] ?? player.team;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/players" className="text-sm text-[var(--accent-deep)]">
          ← Players &amp; Ratings
        </Link>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
          {player.player}
        </h1>
        <p className="text-sm text-[var(--ink-soft)]">
          {player.year} · Pick #{player.pick} · {teamName}
          {player.tradedFrom ? ` (via ${player.tradedFrom})` : ""}
          {player.college ? ` · ${player.college}` : ""}
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <StatChip label="RN" value={fmt(local?.effectiveRn ?? player.rnValue, 0)} />
          <StatChip
            label="Consist."
            value={
              local?.consistencyRn == null
                ? "—"
                : `${fmt(local.consistencyRn, 1)}${
                    local.consistencyInjuryCredit ? "*" : ""
                  }`
            }
          />
          <StatChip
            label="Δ RN−Consist."
            value={
              local?.consistencyDelta == null
                ? "—"
                : `${local.consistencyDelta > 0 ? "+" : ""}${fmt(local.consistencyDelta, 1)}`
            }
          />
          <StatChip label="Career PPG" value={fmt(player.ptsPg, 1)} />
          <StatChip label="RPG" value={fmt(player.trbPg, 1)} />
          <StatChip label="APG" value={fmt(player.astPg, 1)} />
          <StatChip label="WS" value={fmt(player.ws, 1)} />
          <StatChip label="VORP" value={fmt(player.vorp, 1)} />
          <StatChip label="Claus" value={fmt(player.claus, 1)} />
        </div>
        {local?.consistencyRn != null && (
          <p className="mt-2 max-w-2xl text-xs text-[var(--muted)]">
            Consist. v2: rate-first + soft longevity, plus seeded defense
            {local.consistencyDefense
              ? ` (${local.consistencyDefense}/10)`
              : ""}
            {local.consistencyChampionships
              ? `, ${local.consistencyChampionships} title${local.consistencyChampionships > 1 ? "s" : ""}`
              : ""}
            {local.consistencyFinals
              ? `, ${local.consistencyFinals} Finals`
              : ""}
            {local.consistencyInjuryCredit ? "; injury credit applied" : ""}.
            No 10 without a championship.
          </p>
        )}
        {data?.profile?.brefUrl && (
          <a
            href={data.profile.brefUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-xs text-[var(--accent-deep)] hover:underline"
          >
            Basketball-Reference profile ↗
          </a>
        )}
      </div>

      <section className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4 sm:p-5">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          Same pick comparison
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Career PPG / RPG / APG vs other #{player.pick} picks from{" "}
          {analysisSpan.yearFrom}–{analysisSpan.yearTo} (Pick Value page span) ·{" "}
          {peerMeans.n} peers
        </p>
        <div className="mt-4 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonChart}>
              <CartesianGrid stroke="var(--line)" vertical={false} />
              <XAxis dataKey="stat" tick={{ fill: "var(--muted)", fontSize: 12 }} />
              <YAxis tick={{ fill: "var(--muted)", fontSize: 11 }} width={36} />
              <Tooltip
                contentStyle={{
                  background: "var(--paper)",
                  border: "1px solid var(--line)",
                  borderRadius: 8,
                }}
              />
              <Legend />
              <Bar
                dataKey="player"
                name={player.player}
                fill="var(--accent)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="pickAvg"
                name={`#${player.pick} avg`}
                fill="var(--hardwood)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {samePickPeers.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase text-[var(--muted)]">
                <tr>
                  <th className="px-2 py-1">Player</th>
                  <th className="px-2 py-1">Year</th>
                  <th className="px-2 py-1">PPG</th>
                  <th className="px-2 py-1">RPG</th>
                  <th className="px-2 py-1">APG</th>
                  <th className="px-2 py-1">RN</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-[var(--line)] font-medium">
                  <td className="px-2 py-1">{player.player}</td>
                  <td className="px-2 py-1">{player.year}</td>
                  <td className="px-2 py-1">{fmt(player.ptsPg, 1)}</td>
                  <td className="px-2 py-1">{fmt(player.trbPg, 1)}</td>
                  <td className="px-2 py-1">{fmt(player.astPg, 1)}</td>
                  <td className="px-2 py-1">
                    {fmt(local?.effectiveRn ?? player.rnValue, 0)}
                  </td>
                </tr>
                {samePickPeers
                  .slice()
                  .sort((a, b) => b.year - a.year)
                  .map((p) => (
                    <tr key={p.id} className="border-t border-[var(--line)]">
                      <td className="px-2 py-1">
                        <Link
                          href={`/players/${p.id}`}
                          className="text-[var(--accent-deep)] hover:underline"
                        >
                          {p.player}
                        </Link>
                      </td>
                      <td className="px-2 py-1">{p.year}</td>
                      <td className="px-2 py-1">{fmt(p.ptsPg, 1)}</td>
                      <td className="px-2 py-1">{fmt(p.trbPg, 1)}</td>
                      <td className="px-2 py-1">{fmt(p.astPg, 1)}</td>
                      <td className="px-2 py-1">{fmt(p.effectiveRn, 0)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4 sm:p-5">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          Year-by-year (per game)
        </h2>
        {loading && (
          <p className="mt-2 text-sm text-[var(--muted)]">
            Loading Basketball-Reference seasons…
          </p>
        )}
        {error && (
          <p className="mt-2 text-sm text-red-700">
            Couldn’t load yearly lines: {error}. Career totals from the draft
            table are still shown above.
          </p>
        )}
        {!loading && !error && seasons.length === 0 && (
          <p className="mt-2 text-sm text-[var(--muted)]">
            No NBA season lines found yet (common for brand-new draftees).
          </p>
        )}
        {seasons.length > 0 && (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[var(--panel)] text-xs uppercase text-[var(--muted)]">
                <tr>
                  <th className="px-2 py-2">Season</th>
                  <th className="px-2 py-2">Age</th>
                  <th className="px-2 py-2">Tm</th>
                  <th className="px-2 py-2">G</th>
                  <th className="px-2 py-2">MPG</th>
                  <th className="px-2 py-2">PPG</th>
                  <th className="px-2 py-2">RPG</th>
                  <th className="px-2 py-2">APG</th>
                  <th className="px-2 py-2">FG%</th>
                  <th className="px-2 py-2">3P%</th>
                  <th className="px-2 py-2">Awards</th>
                </tr>
              </thead>
              <tbody>
                {seasons.map((s) => (
                  <tr key={s.season + (s.team ?? "")} className="border-t border-[var(--line)]">
                    <td className="px-2 py-1.5 font-medium">{s.season}</td>
                    <td className="px-2 py-1.5">{fmt(s.age, 0)}</td>
                    <td className="px-2 py-1.5">{s.team ?? "—"}</td>
                    <td className="px-2 py-1.5">{fmt(s.games, 0)}</td>
                    <td className="px-2 py-1.5">{fmt(s.mpPg, 1)}</td>
                    <td className="px-2 py-1.5">{fmt(s.ptsPg, 1)}</td>
                    <td className="px-2 py-1.5">{fmt(s.trbPg, 1)}</td>
                    <td className="px-2 py-1.5">{fmt(s.astPg, 1)}</td>
                    <td className="px-2 py-1.5">
                      {s.fgPct != null ? s.fgPct.toFixed(3) : "—"}
                    </td>
                    <td className="px-2 py-1.5">
                      {s.fg3Pct != null ? s.fg3Pct.toFixed(3) : "—"}
                    </td>
                    <td className="px-2 py-1.5 text-xs text-[var(--muted)]">
                      {s.awards || "—"}
                    </td>
                  </tr>
                ))}
                {career && (
                  <tr className="border-t-2 border-[var(--ink)]/20 bg-[var(--panel)] font-semibold">
                    <td className="px-2 py-1.5">Career</td>
                    <td className="px-2 py-1.5">—</td>
                    <td className="px-2 py-1.5">{career.team ?? "—"}</td>
                    <td className="px-2 py-1.5">{fmt(career.games, 0)}</td>
                    <td className="px-2 py-1.5">{fmt(career.mpPg, 1)}</td>
                    <td className="px-2 py-1.5">{fmt(career.ptsPg, 1)}</td>
                    <td className="px-2 py-1.5">{fmt(career.trbPg, 1)}</td>
                    <td className="px-2 py-1.5">{fmt(career.astPg, 1)}</td>
                    <td className="px-2 py-1.5">
                      {career.fgPct != null ? career.fgPct.toFixed(3) : "—"}
                    </td>
                    <td className="px-2 py-1.5">
                      {career.fg3Pct != null ? career.fg3Pct.toFixed(3) : "—"}
                    </td>
                    <td className="px-2 py-1.5">—</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-[var(--panel)] px-2.5 py-1">
      <div className="text-[10px] uppercase tracking-wide text-[var(--muted)]">
        {label}
      </div>
      <div className="font-semibold text-[var(--ink)]">{value}</div>
    </div>
  );
}
