import { promises as fs } from "fs";
import path from "path";
import overridesSeed from "@/data/rn-overrides.json";
import type { RnOverrides } from "@/lib/ratings-storage";

const DATA_DIR = path.join(process.cwd(), "src", "data");
const OVERRIDES_PATH = path.join(DATA_DIR, "rn-overrides.json");
const OVERRIDES_REPO_PATH = "src/data/rn-overrides.json";

function githubConfig() {
  // Prefer RATINGS_GITHUB_TOKEN; also accept RATINGS_GH_TOKEN so a Config
  // var can be added without editing an existing Secret (avoids Vercel 2FA).
  const token =
    process.env.RATINGS_GITHUB_TOKEN?.trim() ||
    process.env.RATINGS_GH_TOKEN?.trim();
  const repo =
    process.env.RATINGS_GITHUB_REPO?.trim() || "ranazarian-dev/nba-draft-ran";
  const branch = process.env.RATINGS_GITHUB_BRANCH?.trim() || "main";
  if (!token) return null;
  return { token, repo, branch };
}

function normalize(raw: unknown): RnOverrides {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: RnOverrides = {};
  for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
    if (value === null) out[id] = null;
    else if (typeof value === "number" && Number.isFinite(value)) out[id] = value;
  }
  return out;
}

async function readFromFilesystem(): Promise<RnOverrides> {
  try {
    const raw = await fs.readFile(OVERRIDES_PATH, "utf8");
    return normalize(JSON.parse(raw));
  } catch {
    return normalize(overridesSeed);
  }
}

async function writeToFilesystem(overrides: RnOverrides): Promise<boolean> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(
      OVERRIDES_PATH,
      JSON.stringify(overrides, null, 2) + "\n",
      "utf8"
    );
    return true;
  } catch {
    return false;
  }
}

type GithubFile = { sha: string; content: RnOverrides };

async function readFromGithub(): Promise<GithubFile | null> {
  const cfg = githubConfig();
  if (!cfg) return null;
  const url = `https://api.github.com/repos/${cfg.repo}/contents/${OVERRIDES_REPO_PATH}?ref=${encodeURIComponent(cfg.branch)}`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${cfg.token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "wolves-report-ratings",
    },
    cache: "no-store",
  });
  if (res.status === 404) return { sha: "", content: {} };
  if (!res.ok) {
    throw new Error(`GitHub read failed (${res.status})`);
  }
  const data = (await res.json()) as { sha?: string; content?: string; encoding?: string };
  if (!data.content) return { sha: data.sha || "", content: {} };
  const decoded = Buffer.from(data.content, "base64").toString("utf8");
  return { sha: data.sha || "", content: normalize(JSON.parse(decoded)) };
}

async function writeToGithub(overrides: RnOverrides, sha: string): Promise<void> {
  const cfg = githubConfig();
  if (!cfg) throw new Error("RATINGS_GITHUB_TOKEN is not configured");
  const body = {
    message: "Update RN rating overrides",
    content: Buffer.from(JSON.stringify(overrides, null, 2) + "\n").toString(
      "base64"
    ),
    branch: cfg.branch,
    ...(sha ? { sha } : {}),
  };
  const url = `https://api.github.com/repos/${cfg.repo}/contents/${OVERRIDES_REPO_PATH}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${cfg.token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      "User-Agent": "wolves-report-ratings",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub write failed (${res.status}): ${text.slice(0, 200)}`);
  }
}

export function ratingsWriteAuthorized(req: Request): boolean {
  const expected = process.env.RATINGS_WRITE_KEY?.trim();
  if (!expected) return true; // local / unset — allow writes
  const header = req.headers.get("x-ratings-key")?.trim();
  return Boolean(header && header === expected);
}

export function ratingsPersistenceMode(): "github" | "filesystem" | "none" {
  if (githubConfig()) return "github";
  return "filesystem";
}

export async function loadOverridesFromStore(): Promise<RnOverrides> {
  if (githubConfig()) {
    const file = await readFromGithub();
    if (file) return file.content;
  }
  return readFromFilesystem();
}

export async function saveOverridesToStore(
  overrides: RnOverrides
): Promise<{ persisted: boolean; mode: "github" | "filesystem" | "none" }> {
  const normalized = normalize(overrides);
  if (githubConfig()) {
    const current = await readFromGithub();
    await writeToGithub(normalized, current?.sha || "");
    // Best-effort local mirror when writable (dev).
    await writeToFilesystem(normalized);
    return { persisted: true, mode: "github" };
  }
  const ok = await writeToFilesystem(normalized);
  return { persisted: ok, mode: ok ? "filesystem" : "none" };
}

export function mergeOverrides(base: RnOverrides, extra: RnOverrides): RnOverrides {
  return { ...base, ...extra };
}
