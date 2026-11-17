import { NextResponse } from "next/server";
import { fetchPlayerBrefProfile } from "@/lib/bref-player";
import { readPlayers } from "@/lib/data-store";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required (e.g. 2014-41)" }, { status: 400 });
  }

  const players = await readPlayers();
  const player = players.find((p) => p.id === id);
  if (!player) {
    return NextResponse.json({ error: `Player not found: ${id}` }, { status: 404 });
  }

  try {
    const profile = await fetchPlayerBrefProfile(
      player.year,
      player.pick,
      player.player
    );
    return NextResponse.json({ player, profile });
  } catch (e) {
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : String(e),
        player,
        profile: null,
      },
      { status: 502 }
    );
  }
}
