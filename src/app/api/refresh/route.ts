import { NextResponse } from "next/server";
import { refreshYears } from "@/lib/bref";
import { getMeta, readPlayers, updateMetaYears, writePlayers } from "@/lib/data-store";

export const dynamic = "force-dynamic";
/** Vercel hobby/pro cap serverless maxDuration at 60s (enterprise higher). */
export const maxDuration = 60;

type Body = {
  years?: number[];
  year?: number;
  /** Pull every year already in the dataset, plus optional extras. */
  all?: boolean;
};

export async function POST(req: Request) {
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    body = {};
  }

  const existing = await readPlayers();
  const meta = getMeta();
  const knownYears = [
    ...new Set([
      ...meta.years,
      ...existing.map((p) => p.year),
    ]),
  ].sort((a, b) => a - b);

  let years: number[] = [];
  if (body.year != null) years = [body.year];
  else if (body.years?.length) years = body.years;
  else if (body.all) years = knownYears;
  else {
    return NextResponse.json(
      { error: "Provide year, years, or all: true" },
      { status: 400 }
    );
  }

  years = [...new Set(years)].sort((a, b) => a - b);

  // Guardrail: NBA draft pages exist from 1947; keep this tool to modern era by default.
  for (const y of years) {
    if (y < 1980 || y > new Date().getFullYear() + 1) {
      return NextResponse.json(
        { error: `Year out of supported range: ${y}` },
        { status: 400 }
      );
    }
  }

  const result = await refreshYears(existing, years);
  const persisted = await writePlayers(result.players);
  const allYears = [...new Set(result.players.map((p) => p.year))].sort(
    (a, b) => a - b
  );
  await updateMetaYears(allYears);

  return NextResponse.json({
    ok: result.errors.length === 0,
    persisted,
    updated: result.updated,
    inserted: result.inserted,
    years: result.years,
    errors: result.errors,
    playerCount: result.players.length,
    players: result.players,
    note: persisted
      ? "Basketball-Reference stats written to src/data/players.json. RN ratings and opening-night teams were preserved."
      : "Filesystem is read-only here, so stats were refreshed in-memory only. Download/export or run locally to persist into the project files.",
  });
}
