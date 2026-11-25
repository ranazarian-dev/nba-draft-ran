import type { Player } from "@/lib/types";
import playerContext from "@/data/player-context.json";

/**
 * Consistency RN v2 — injury-aware, defense-aware, championship-gated.
 *
 * Base: rate-first (WS/48, BPM, Claus, PPG) + soft longevity, calibrated to
 * subjective RN. Then apply seeded defense / Finals / title adjustments.
 * Hard rule: nobody reaches 10 without a championship.
 */
const CAL_A = 1.061786920078246;
const CAL_B = 0.49013200598804535;
const CAL_C = 0.007447273232161322;

type ContextRow = {
  player?: string;
  championships?: number;
  finalsAppearances?: number;
  defense?: number;
};

const CONTEXT: Record<string, ContextRow> = (
  playerContext as { players: Record<string, ContextRow> }
).players;

export type ConsistencyBreakdown = {
  consistencyRn: number;
  consistencyRnRounded: number;
  rate: number;
  score: number;
  injuryCredit: boolean;
  effectiveGames: number;
  delta: number | null;
  defense: number;
  championships: number;
  finalsAppearances: number;
};

function n(v: number | null | undefined): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function ctxFor(player: Player): Required<
  Pick<ContextRow, "championships" | "finalsAppearances" | "defense">
> {
  const row = CONTEXT[player.id];
  return {
    championships: Math.max(0, Math.floor(n(row?.championships))),
    finalsAppearances: Math.max(0, Math.floor(n(row?.finalsAppearances))),
    defense: Math.min(10, Math.max(0, n(row?.defense))),
  };
}

/** Defense 0–10 → RN points (elite two-way can add ~1.5). */
function defenseBump(defense: number): number {
  if (defense <= 0) return 0;
  // Mild until 5; steeper for true stoppers (7–10)
  if (defense <= 5) return defense * 0.08;
  return 0.4 + (defense - 5) * 0.22;
}

/**
 * Winning bump: titles matter more than Finals losses; both are ceiling/
 * tie-break energy rather than compiler padding.
 */
function winningBump(championships: number, finalsAppearances: number): number {
  const rings = Math.min(championships, 4);
  const losses = Math.min(
    Math.max(finalsAppearances - championships, 0),
    3
  );
  return rings * 0.45 + losses * 0.15;
}

export function consistencyScore(player: Player): {
  rate: number;
  score: number;
  injuryCredit: boolean;
  effectiveGames: number;
  consistencyRn: number;
  defense: number;
  championships: number;
  finalsAppearances: number;
} {
  const games = Math.max(n(player.games), 0);
  const ws = Math.max(n(player.ws), 0);
  const ws48 = n(player.ws48);
  const bpm = n(player.bpm);
  const ppg = n(player.ptsPg);
  const rpg = n(player.trbPg);
  const apg = n(player.astPg);
  const claus =
    player.claus != null && Number.isFinite(player.claus)
      ? player.claus
      : ppg + rpg + 1.5 * apg;

  const { championships, finalsAppearances, defense } = ctxFor(player);

  const rate =
    2.2 * Math.max(ws48, 0) * 10 +
    0.55 * Math.max(bpm, -2) +
    0.12 * claus +
    0.08 * ppg +
    // Fold a slice of defense into the rate term so stoppers aren't
    // pure post-hoc bumps on empty offensive resumes.
    defense * 0.08;

  const injuryCredit = games < 450 && rate > 3.5 && player.year <= 2018;
  const effectiveGames = games + (injuryCredit ? 220 : 0);
  const career = Math.log1p(effectiveGames) / Math.log1p(1000);
  const score =
    0.62 * rate + 0.28 * (career * Math.max(rate, 0)) + 0.1 * Math.log1p(ws);

  let raw = CAL_A + CAL_B * score + CAL_C * score * score;
  raw += defenseBump(defense) + winningBump(championships, finalsAppearances);

  // Hard gate: no 10 without a title.
  if (championships < 1) {
    raw = Math.min(raw, 9.45);
  } else if (championships >= 1 && defense >= 7 && raw >= 9.0) {
    // Two-way champions can sit on the top shelf (Kawhi / peak Draymond-adjacent).
    raw = Math.max(raw, Math.min(10, raw));
  }

  const consistencyRn = Math.min(10, Math.max(0, raw));

  return {
    rate,
    score,
    injuryCredit,
    effectiveGames,
    consistencyRn,
    defense,
    championships,
    finalsAppearances,
  };
}

export function consistencyBreakdown(
  player: Player,
  effectiveRn: number | null
): ConsistencyBreakdown | null {
  if ((player.games ?? 0) < 25 && (effectiveRn == null || effectiveRn < 5)) {
    return null;
  }
  const base = consistencyScore(player);
  const rounded = Math.round(base.consistencyRn);
  return {
    ...base,
    consistencyRnRounded: Math.min(10, Math.max(0, rounded)),
    delta:
      effectiveRn == null
        ? null
        : Math.round((effectiveRn - base.consistencyRn) * 10) / 10,
  };
}

export function getPlayerContext(playerId: string): ContextRow | null {
  return CONTEXT[playerId] ?? null;
}
