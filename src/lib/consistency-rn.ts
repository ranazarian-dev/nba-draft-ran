import type { Player } from "@/lib/types";

/**
 * Injury-aware consistency rating calibrated to the subjective RN scale.
 *
 * Rate-first (WS/48, BPM, Claus) so teammate-inflated career WS and
 * injury-shortened peaks don't dominate the way raw Win Shares do.
 * Soft longevity credit only when the per-possession rate was actually good.
 *
 * Calibrated on 2008–2020 rated players (MAE ≈ 0.85 vs RN).
 */
const CAL_A = 1.061786920078246;
const CAL_B = 0.49013200598804535;
const CAL_C = 0.007447273232161322;

export type ConsistencyBreakdown = {
  /** Continuous model score clipped to 0–10 */
  consistencyRn: number;
  /** Nearest whole RN band (0–10) */
  consistencyRnRounded: number;
  rate: number;
  score: number;
  injuryCredit: boolean;
  effectiveGames: number;
  /** Your RN − consistency (positive = you rate higher than the model) */
  delta: number | null;
};

function n(v: number | null | undefined): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

export function consistencyScore(player: Player): {
  rate: number;
  score: number;
  injuryCredit: boolean;
  effectiveGames: number;
  consistencyRn: number;
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

  const rate =
    2.2 * Math.max(ws48, 0) * 10 +
    0.55 * Math.max(bpm, -2) +
    0.12 * claus +
    0.08 * ppg;

  const injuryCredit = games < 450 && rate > 3.5 && player.year <= 2018;
  const effectiveGames = games + (injuryCredit ? 220 : 0);
  const career = Math.log1p(effectiveGames) / Math.log1p(1000);
  const score =
    0.62 * rate + 0.28 * (career * Math.max(rate, 0)) + 0.1 * Math.log1p(ws);

  const raw = CAL_A + CAL_B * score + CAL_C * score * score;
  const consistencyRn = Math.min(10, Math.max(0, raw));

  return { rate, score, injuryCredit, effectiveGames, consistencyRn };
}

export function consistencyBreakdown(
  player: Player,
  effectiveRn: number | null
): ConsistencyBreakdown | null {
  // Too little sample for a meaningful consistency read
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
