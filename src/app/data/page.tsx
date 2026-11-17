import { RefreshPanel } from "@/components/refresh-panel";

export default function DataPage() {
  return (
    <div className="space-y-6">
      <section className="max-w-3xl">
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">
          Data pipeline
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-4xl text-[var(--ink)] sm:text-5xl">
          Refresh Basketball-Reference with one click
        </h1>
        <p className="mt-3 text-[var(--ink-soft)]">
          Replaces the old spreadsheet scrape script: the app fetches each draft
          class page, parses the stats table, and merges it into the working
          dataset without overwriting your subjective ratings or opening-night
          trade mapping.
        </p>
      </section>
      <RefreshPanel />
      <section className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5 text-sm text-[var(--ink-soft)]">
        <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
          What gets updated
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Games, minutes, counting stats, shooting, WS, WS/48, BPM, VORP</li>
          <li>Claus Metric recomputed as PTS + REB + 1.5×AST (per game)</li>
          <li>New draft years can be pulled in (RN starts blank)</li>
        </ul>
        <h2 className="mt-4 font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
          What is preserved
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>RN Value (your ratings)</li>
          <li>Opening-night team credit and &quot;traded from&quot; notes</li>
          <li>Browser rating edits in localStorage</li>
        </ul>
      </section>
    </div>
  );
}
