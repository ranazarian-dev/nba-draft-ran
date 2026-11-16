import { NextResponse } from "next/server";
import { getMeta, readPlayers } from "@/lib/data-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const players = await readPlayers();
  return NextResponse.json({ players, meta: getMeta() });
}
