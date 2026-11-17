import * as cheerio from "cheerio";
import { draftUrl } from "@/lib/bref";

const USER_AGENT =
  "Mozilla/5.0 (compatible; NBA-Draft-Analysis/1.0; personal research)";

function unwrapCommentedTables(html: string): string {
  return html.replace(
    /<!--([\s\S]*?<table[\s\S]*?<\/table>[\s\S]*?)-->/gi,
    "$1"
  );
}

function num(v: string | undefined): number | null {
  if (v == null) return null;
  const s = v.replace(/,/g, "").trim();
  if (!s || s === "-" || s === "—") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export type SeasonLine = {
  season: string;
  age: number | null;
  team: string | null;
  pos: string | null;
  games: number | null;
  gamesStarted: number | null;
  mpPg: number | null;
  ptsPg: number | null;
  trbPg: number | null;
  astPg: number | null;
  fgPct: number | null;
  fg3Pct: number | null;
  ftPct: number | null;
  stlPg: number | null;
  blkPg: number | null;
  tovPg: number | null;
  awards: string | null;
};

export type PlayerBrefProfile = {
  brefUrl: string;
  brefPath: string;
  seasons: SeasonLine[];
  career: SeasonLine | null;
};

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`BRef fetch failed (${res.status}) for ${url}`);
  return res.text();
}

/** Resolve Basketball-Reference player path from a draft year + pick. */
export async function resolveBrefPath(
  draftYear: number,
  pick: number,
  playerName: string
): Promise<string | null> {
  const html = unwrapCommentedTables(await fetchHtml(draftUrl(draftYear)));
  const $ = cheerio.load(html);
  const table = $("#stats");
  let path: string | null = null;

  table.find("tbody tr").each((_, el) => {
    const tr = $(el);
    const pk = num(tr.find('[data-stat="pick_overall"]').text());
    if (pk !== pick) return;
    const href =
      tr.find('[data-stat="player"] a').attr("href") ||
      tr.find('a[href*="/players/"]').attr("href");
    if (href) path = href;
  });

  if (path) return path;

  // Fallback: match by name anywhere on the draft page.
  const needle = playerName.toLowerCase();
  $("a[href*='/players/']").each((_, el) => {
    const a = $(el);
    const text = a.text().trim().toLowerCase();
    const href = a.attr("href");
    if (!href || !href.includes("/players/")) return;
    if (
      text === needle ||
      needle.includes(text) ||
      text.split(" ").some((part) => part.length > 2 && needle.includes(part))
    ) {
      if (!path) path = href;
    }
  });

  return path;
}

export function parsePerGameSeasons(html: string): {
  seasons: SeasonLine[];
  career: SeasonLine | null;
} {
  const $ = cheerio.load(unwrapCommentedTables(html));
  const table = $("#per_game_stats").length
    ? $("#per_game_stats")
    : $("#per_game");
  const seasons: SeasonLine[] = [];
  let career: SeasonLine | null = null;

  const readRow = ($tr: ReturnType<typeof $>): SeasonLine | null => {
    const season =
      $tr.find('[data-stat="year_id"]').text().trim() ||
      $tr.find('[data-stat="season"]').text().trim();
    if (!season) return null;
    const team =
      $tr.find('[data-stat="team_name_abbr"] a').first().text().trim() ||
      $tr.find('[data-stat="team_name_abbr"]').text().trim() ||
      null;
    // Skip non-NBA / "Did not play" lines without games.
    const games = num($tr.find('[data-stat="games"]').text());
    if (games == null && !/^career$/i.test(season)) return null;

    return {
      season,
      age: num($tr.find('[data-stat="age"]').text()),
      team,
      pos: $tr.find('[data-stat="pos"]').text().trim() || null,
      games,
      gamesStarted: num($tr.find('[data-stat="games_started"]').text()),
      mpPg: num($tr.find('[data-stat="mp_per_g"]').text()),
      ptsPg: num($tr.find('[data-stat="pts_per_g"]').text()),
      trbPg: num($tr.find('[data-stat="trb_per_g"]').text()),
      astPg: num($tr.find('[data-stat="ast_per_g"]').text()),
      fgPct: num($tr.find('[data-stat="fg_pct"]').text()),
      fg3Pct: num($tr.find('[data-stat="fg3_pct"]').text()),
      ftPct: num($tr.find('[data-stat="ft_pct"]').text()),
      stlPg: num($tr.find('[data-stat="stl_per_g"]').text()),
      blkPg: num($tr.find('[data-stat="blk_per_g"]').text()),
      tovPg: num($tr.find('[data-stat="tov_per_g"]').text()),
      awards: $tr.find('[data-stat="awards"]').text().trim() || null,
    };
  };

  table.find("tbody tr").each((_, el) => {
    const $tr = $(el);
    if ($tr.hasClass("thead")) return;
    const line = readRow($tr);
    if (!line) return;
    if (/^career$/i.test(line.season)) career = line;
    else if (line.games != null) seasons.push(line);
  });

  // Some pages put Career in tfoot
  table.find("tfoot tr").each((_, el) => {
    const line = readRow($(el));
    if (line && /^career$/i.test(line.season)) career = line;
  });

  return { seasons, career };
}

export async function fetchPlayerBrefProfile(
  draftYear: number,
  pick: number,
  playerName: string
): Promise<PlayerBrefProfile> {
  const path = await resolveBrefPath(draftYear, pick, playerName);
  if (!path) {
    throw new Error(
      `No Basketball-Reference player page found for ${playerName} (${draftYear} #${pick})`
    );
  }
  const brefPath = path.startsWith("http")
    ? new URL(path).pathname
    : path;
  const brefUrl = `https://www.basketball-reference.com${brefPath}`;
  const html = await fetchHtml(brefUrl);
  const { seasons, career } = parsePerGameSeasons(html);
  return { brefUrl, brefPath, seasons, career };
}
