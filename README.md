# Wolves Report — Draft Value Analysis

Minnesota Timberwolves draft-value tool for measuring **how valuable an NBA draft pick or pick range is**, based on subjective **RN Value** ratings plus Basketball-Reference career stats.

## What’s included

- **Home / Methodology** — Wolves branding plus the full measurement methodology
- **Pick Value explorer** (`/pick-value`) — hit rates by pick or 5-pick range (useful / starter / All-Star / All-NBA / HoF track), with WS, VORP, and Claus toggles
- **Team report cards** — average draft value by franchise over a year span
- **Editable RN ratings** — inline edits stored in the browser (`localStorage`)
- **One-click BRef refresh** — `/data` pulls fresh draft tables from Basketball-Reference and merges them without wiping ratings or opening-night trade assignments

## Run locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:3457](http://127.0.0.1:3457).

```bash
npm run build && npm start
```

## Update Basketball-Reference data

In the UI: **Update Data** → choose a year (or update all).

Or via API:

```bash
curl -X POST http://127.0.0.1:3457/api/refresh \
  -H 'content-type: application/json' \
  -d '{"year":2024}'
```

```bash
curl -X POST http://127.0.0.1:3457/api/refresh \
  -H 'content-type: application/json' \
  -d '{"all":true}'
```

When the filesystem is writable (local / this cloud VM), refreshed players are written to `src/data/players.json`. RN Value and opening-night teams are preserved. On read-only hosts, the response still returns the merged dataset for in-session use / export.

## Data notes

- Seeded from the DraftX workbook (drafts **2008–2024**, two rounds)
- **Trade rule:** draft night through opening night → credit the acquiring team
- **RN Value:** subjective 0–10; rookies unrated; young careers are guesstimates
- **Claus Metric:** PTS + REB + 1.5×AST (per game)

## Vercel / private hosting

This is a standard Next.js app. For a private family site, deploy to Vercel and restrict access (Vercel Deployment Protection, or Cursor private publish). Rating edits currently live in each browser; shared multi-device rating sync would need a small database later.
