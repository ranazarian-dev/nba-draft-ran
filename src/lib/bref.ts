import * as cheerio from "cheerio";
import type { Player } from "@/lib/types";
import { pickRangeLabel } from "@/lib/analytics";

const USER_AGENT =
  "Mozilla/5.0 (compatible; NBA-Draft-Analysis/1.0; personal research)";

function num(v: string | undefined): number | null {
  if (v == null) return null;
  const s = v.replace(/,/g, "").trim();
  if (!s || s === "-" || s === "—") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export type BrefDraftRow = {
  year: number;
  pick: number;
  team: string;
  player: string;
  college: string | null;
  seasons: number | null;
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
};

export function draftUrl(year: number): string {
  return `https://www.basketball-reference.com/draft/NBA_${year}.html`;
}

/** Basketball-Reference sometimes wraps tables in HTML comments. */
function unwrapCommentedTables(html: string): string {
  return html.replace(
    /<!--([\s\S]*?<table[\s\S]*?<\/table>[\s\S]*?)-->/gi,
    "$1"
  );
}

export function parseDraftHtml(html: string, year: number): BrefDraftRow[] {
  const $ = cheerio.load(unwrapCommentedTables(html));
  const table = $("#stats");
  if (!table.length) {
    throw new Error(`No #stats draft table found for ${year}`);
  }

  const rows: BrefDraftRow[] = [];
  table.find("tbody tr").each((_, el) => {
    const tr = $(el);
    if (tr.hasClass("thead") || tr.hasClass("over_header")) return;
    const pick = num(tr.find('[data-stat="pick_overall"]').text());
    const player =
      tr.find('[data-stat="player"] a').first().text().trim() ||
      tr.find('[data-stat="player"]').text().trim();
    if (pick == null || !player) return;

    const team =
      tr.find('[data-stat="team_id"] a').first().text().trim() ||
      tr.find('[data-stat="team_id"]').text().trim();
    const collegeRaw = tr.find('[data-stat="college_name"]').text().trim();

    rows.push({
      year,
      pick: Math.round(pick),
      team,
      player,
      college: collegeRaw || null,
      seasons: num(tr.find('[data-stat="seasons"]').text()),
      games: num(tr.find('[data-stat="g"]').text()),
      mp: num(tr.find('[data-stat="mp"]').text()),
      pts: num(tr.find('[data-stat="pts"]').text()),
      trb: num(tr.find('[data-stat="trb"]').text()),
      ast: num(tr.find('[data-stat="ast"]').text()),
      fgPct: num(tr.find('[data-stat="fg_pct"]').text()),
      fg3Pct: num(tr.find('[data-stat="fg3_pct"]').text()),
      ftPct: num(tr.find('[data-stat="ft_pct"]').text()),
      mpPg: num(tr.find('[data-stat="mp_per_g"]').text()),
      ptsPg: num(tr.find('[data-stat="pts_per_g"]').text()),
      trbPg: num(tr.find('[data-stat="trb_per_g"]').text()),
      astPg: num(tr.find('[data-stat="ast_per_g"]').text()),
      ws: num(tr.find('[data-stat="ws"]').text()),
      ws48: num(tr.find('[data-stat="ws_per_48"]').text()),
      bpm: num(tr.find('[data-stat="bpm"]').text()),
      vorp: num(tr.find('[data-stat="vorp"]').text()),
    });
  });

  return rows;
}

export async function fetchDraftYear(year: number): Promise<BrefDraftRow[]> {
  const res = await fetch(draftUrl(year), {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html,application/xhtml+xml",
    },
    // Avoid Next fetch caching stale draft stats
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Basketball-Reference ${year}: HTTP ${res.status}`);
  }
  const html = await res.text();
  return parseDraftHtml(html, year);
}

function clauseOf(row: Pick<BrefDraftRow, "ptsPg" | "trbPg" | "astPg">): number | null {
  if (row.ptsPg == null || row.trbPg == null || row.astPg == null) return null;
  return Math.round((row.ptsPg + row.trbPg + 1.5 * row.astPg) * 100) / 100;
}

function toPlayer(row: BrefDraftRow, prior?: Player): Player {
  const pickRange = Math.floor((row.pick - 1) / 5) + 1;
  return {
    id: `${row.year}-${row.pick}`,
    year: row.year,
    pick: row.pick,
    round: row.pick <= 30 ? 1 : 2,
    // Preserve opening-night team assignment & trade note from existing data.
    team: prior?.team ?? row.team,
    tradedFrom: prior?.tradedFrom ?? null,
    player: row.player,
    college: row.college,
    games: row.games,
    mp: row.mp,
    pts: row.pts,
    trb: row.trb,
    ast: row.ast,
    fgPct: row.fgPct,
    fg3Pct: row.fg3Pct,
    ftPct: row.ftPct,
    mpPg: row.mpPg,
    ptsPg: row.ptsPg,
    trbPg: row.trbPg,
    astPg: row.astPg,
    ws: row.ws,
    ws48: row.ws48,
    bpm: row.bpm,
    vorp: row.vorp,
    // Preserve subjective RN Value; rookies / new players stay null.
    rnValue: prior?.rnValue ?? null,
    clause: clauseOf(row),
    pickRange,
    pickRangeLabel: pickRangeLabel(row.pick),
  };
}

export type RefreshResult = {
  years: number[];
  updated: number;
  inserted: number;
  players: Player[];
  errors: { year: number; message: string }[];
};

/**
 * Merge BRef stats into the working dataset.
 * Keeps RN Value and opening-night team / tradedFrom from `existing`.
 */
export function mergeBrefIntoPlayers(
  existing: Player[],
  fetched: BrefDraftRow[]
): { players: Player[]; updated: number; inserted: number } {
  const byId = new Map(existing.map((p) => [p.id, p]));
  let updated = 0;
  let inserted = 0;

  for (const row of fetched) {
    const id = `${row.year}-${row.pick}`;
    const prior = byId.get(id);
    // Also try name+year match if pick identity drifted (rare).
    const priorByName =
      prior ??
      existing.find(
        (p) =>
          p.year === row.year &&
          p.player.toLowerCase() === row.player.toLowerCase()
      );
    if (priorByName) updated += 1;
    else inserted += 1;
    byId.set(id, toPlayer(row, priorByName));
  }

  const players = [...byId.values()].sort((a, b) =>
    a.year !== b.year ? b.year - a.year : a.pick - b.pick
  );
  return { players, updated, inserted };
}

export async function refreshYears(
  existing: Player[],
  years: number[],
  delayMs = 1200
): Promise<RefreshResult> {
  const allRows: BrefDraftRow[] = [];
  const errors: { year: number; message: string }[] = [];

  for (let i = 0; i < years.length; i++) {
    const year = years[i]!;
    try {
      const rows = await fetchDraftYear(year);
      allRows.push(...rows);
    } catch (e) {
      errors.push({
        year,
        message: e instanceof Error ? e.message : String(e),
      });
    }
    if (i < years.length - 1) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  const { players, updated, inserted } = mergeBrefIntoPlayers(existing, allRows);
  return { years, updated, inserted, players, errors };
}
