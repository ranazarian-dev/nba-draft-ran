import { promises as fs } from "fs";
import path from "path";
import type { Meta, Player } from "@/lib/types";
import playersSeed from "@/data/players.json";
import metaSeed from "@/data/meta.json";

const DATA_DIR = path.join(process.cwd(), "src", "data");
const PLAYERS_PATH = path.join(DATA_DIR, "players.json");
const META_PATH = path.join(DATA_DIR, "meta.json");

export function getSeedPlayers(): Player[] {
  return playersSeed as Player[];
}

export function getMeta(): Meta {
  return metaSeed as Meta;
}

export async function readPlayers(): Promise<Player[]> {
  try {
    const raw = await fs.readFile(PLAYERS_PATH, "utf8");
    return JSON.parse(raw) as Player[];
  } catch {
    return getSeedPlayers();
  }
}

export async function writePlayers(players: Player[]): Promise<boolean> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(PLAYERS_PATH, JSON.stringify(players, null, 2) + "\n", "utf8");
    return true;
  } catch {
    // Published / read-only hosts can't persist to disk — caller still gets JSON back.
    return false;
  }
}

export async function updateMetaYears(years: number[]): Promise<void> {
  try {
    const meta = { ...getMeta(), years: [...years].sort((a, b) => a - b) };
    await fs.writeFile(META_PATH, JSON.stringify(meta, null, 2) + "\n", "utf8");
  } catch {
    // ignore on read-only FS
  }
}
