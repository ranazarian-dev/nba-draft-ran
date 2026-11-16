import { mean, median } from "@/lib/utils";
import type { HitRateRow, RatedPlayer, TeamSummary } from "@/lib/types";

export const HIT_THRESHOLDS = [
  { key: "gt3", threshold: 3, label: "Useful (RN > 3)" },
  { key: "gt4", threshold: 4, label: "Starter (RN > 4)" },
  { key: "gt5", threshold: 5, label: "High starter (RN > 5)" },
  { key: "gt6", threshold: 6, label: "All-Star (RN > 6)" },
  { key: "gt7", threshold: 7, label: "All-NBA (RN > 7)" },
  { key: "gt8", threshold: 8, label: "HoF track (RN > 8)" },
] as const;

export function pickRangeLabel(pick: number): string {
  const start = Math.floor((pick - 1) / 5) * 5 + 1;
  return `${start}-${start + 4}`;
}

export function withEffectiveRn(
  players: RatedPlayer[],
  overrides: Record<string, number | null>
): RatedPlayer[] {
  return players.map((p) => ({
    ...p,
    effectiveRn:
      p.id in overrides ? overrides[p.id]! : p.rnValue,
  }));
}

function rateAbove(rated: number[], threshold: number): number | null {
  if (!rated.length) return null;
  return rated.filter((v) => v > threshold).length / rated.length;
}

export function hitRatesByPick(players: RatedPlayer[]): HitRateRow[] {
  const byPick = new Map<number, RatedPlayer[]>();
  for (const p of players) {
    const list = byPick.get(p.pick) ?? [];
    list.push(p);
    byPick.set(p.pick, list);
  }
  return [...byPick.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([pick, list]) => summarize(`pick-${pick}`, `#${pick}`, list));
}

export function hitRatesByRange(players: RatedPlayer[]): HitRateRow[] {
  const byRange = new Map<string, RatedPlayer[]>();
  for (const p of players) {
    const label = p.pickRangeLabel || pickRangeLabel(p.pick);
    const list = byRange.get(label) ?? [];
    list.push(p);
    byRange.set(label, list);
  }
  return [...byRange.entries()]
    .sort((a, b) => Number(a[0].split("-")[0]) - Number(b[0].split("-")[0]))
    .map(([label, list]) => summarize(`range-${label}`, label, list));
}

function summarize(key: string, label: string, list: RatedPlayer[]): HitRateRow {
  const ratedVals = list
    .map((p) => p.effectiveRn)
    .filter((v): v is number => v != null);
  const ws = list.map((p) => p.ws).filter((v): v is number => v != null);
  const vorp = list.map((p) => p.vorp).filter((v): v is number => v != null);
  const clause = list
    .map((p) => p.clause)
    .filter((v): v is number => v != null);

  const rates: Record<string, number | null> = {};
  for (const t of HIT_THRESHOLDS) {
    rates[t.key] = rateAbove(ratedVals, t.threshold);
  }

  return {
    key,
    label,
    n: list.length,
    rated: ratedVals.length,
    meanRn: mean(ratedVals),
    medianRn: median(ratedVals),
    meanWs: mean(ws),
    meanVorp: mean(vorp),
    meanClause: mean(clause),
    rates,
  };
}

export function teamSummaries(
  players: RatedPlayer[],
  teamNames: Record<string, string>
): TeamSummary[] {
  const byTeam = new Map<string, RatedPlayer[]>();
  for (const p of players) {
    if (!p.team) continue;
    const list = byTeam.get(p.team) ?? [];
    list.push(p);
    byTeam.set(p.team, list);
  }

  return [...byTeam.entries()]
    .map(([team, list]) => {
      const rated = list.filter((p) => p.effectiveRn != null);
      const ratedVals = rated.map((p) => p.effectiveRn!);
      const first = rated.filter((p) => p.round === 1).map((p) => p.effectiveRn!);
      const rangeAccum = new Map<string, { n: number; vals: number[] }>();
      for (const p of list) {
        const label = p.pickRangeLabel || pickRangeLabel(p.pick);
        const bucket = rangeAccum.get(label) ?? { n: 0, vals: [] };
        bucket.n += 1;
        if (p.effectiveRn != null) bucket.vals.push(p.effectiveRn);
        rangeAccum.set(label, bucket);
      }
      const byRange: TeamSummary["byRange"] = {};
      for (const [label, bucket] of rangeAccum) {
        byRange[label] = { n: bucket.n, meanRn: mean(bucket.vals) };
      }

      return {
        team,
        name: teamNames[team] ?? team,
        picks: list.length,
        rated: rated.length,
        meanRn: mean(ratedVals),
        meanFirstRound: mean(first),
        top5Picks: list.filter((p) => p.pick <= 5).length,
        top10Picks: list.filter((p) => p.pick <= 10).length,
        allStars: rated.filter((p) => p.effectiveRn! > 6).length,
        starters: rated.filter((p) => p.effectiveRn! > 4).length,
        useful: rated.filter((p) => p.effectiveRn! > 3).length,
        byRange,
      };
    })
    .sort((a, b) => (b.meanRn ?? -1) - (a.meanRn ?? -1));
}

export function filterPlayers(
  players: RatedPlayer[],
  opts: {
    yearFrom?: number;
    yearTo?: number;
    rounds?: number[];
    teams?: string[];
    search?: string;
  }
): RatedPlayer[] {
  return players.filter((p) => {
    if (opts.yearFrom != null && p.year < opts.yearFrom) return false;
    if (opts.yearTo != null && p.year > opts.yearTo) return false;
    if (opts.rounds?.length && !opts.rounds.includes(p.round)) return false;
    if (opts.teams?.length && !opts.teams.includes(p.team)) return false;
    if (opts.search) {
      const q = opts.search.toLowerCase();
      if (
        !p.player.toLowerCase().includes(q) &&
        !p.team.toLowerCase().includes(q) &&
        !(p.college ?? "").toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });
}
