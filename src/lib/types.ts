export type Player = {
  id: string;
  year: number;
  pick: number;
  round: number;
  team: string;
  tradedFrom: string | null;
  player: string;
  college: string | null;
  games: number | null;
  mp: number | null;
  pts: number | null;
  trb: number | null;
  ast: number | null;
  fgPct: number | null;
  fg3Pct: number | null;
  ftPct: number | null;
  mpPg: number | null;
  ptsPg: number | null;
  trbPg: number | null;
  astPg: number | null;
  ws: number | null;
  ws48: number | null;
  bpm: number | null;
  vorp: number | null;
  rnValue: number | null;
  claus: number | null;
  pickRange: number;
  pickRangeLabel: string;
};

export type Meta = {
  years: number[];
  source: string;
  tradeRule: string;
  ratingScale: { min: number; label: string; gt?: boolean }[];
  thresholds: number[];
  teams: string[];
  teamNames: Record<string, string>;
  continuityNotes: string[];
};

export type RatedPlayer = Player & {
  effectiveRn: number | null;
  /** Injury-aware consistency model (0–10 continuous) */
  consistencyRn: number | null;
  /** Nearest whole-number consistency band */
  consistencyRnRounded: number | null;
  /** Your RN − consistencyRn (positive = you rate higher) */
  consistencyDelta: number | null;
  /** Model applied soft injury credit */
  consistencyInjuryCredit: boolean;
};

export type HitRateRow = {
  key: string;
  label: string;
  n: number;
  rated: number;
  meanRn: number | null;
  medianRn: number | null;
  meanWs: number | null;
  meanVorp: number | null;
  meanClaus: number | null;
  rates: Record<string, number | null>;
};

export type TeamSummary = {
  team: string;
  name: string;
  picks: number;
  rated: number;
  meanRn: number | null;
  meanFirstRound: number | null;
  top5Picks: number;
  top10Picks: number;
  allStars: number;
  starters: number;
  useful: number;
  byRange: Record<string, { n: number; meanRn: number | null }>;
};
