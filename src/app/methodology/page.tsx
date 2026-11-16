export default function MethodologyPage() {
  return (
    <article className="prose-draft max-w-3xl space-y-6 text-[var(--ink-soft)]">
      <header>
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">
          Methodology
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-4xl text-[var(--ink)] sm:text-5xl">
          How Draft Value is measured
        </h1>
      </header>

      <section className="space-y-2">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          Purpose
        </h2>
        <p>
          Estimate how valuable a draft position (or a 5-pick range) is by the
          chance it yields a certain caliber of player — not just average win
          shares. A #8 and a #22 can then be compared on useful / starter /
          All-Star / All-NBA hit rates.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          Source data
        </h2>
        <p>
          Factual columns come from Basketball-Reference draft tables (two
          rounds, no undrafted players). The in-app{" "}
          <strong>Update Data</strong> button re-pulls those tables on demand.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          Opening-night trade rule
        </h2>
        <p>
          If a player is traded on draft night or anytime before opening night,
          credit goes to the acquiring team — as if they drafted him. Example:
          Andrew Wiggins counts for Minnesota, not Cleveland. The original team
          is retained as a &quot;via&quot; note when available.
        </p>
        <p>
          Basketball-Reference itself credits the team that made the pick. On
          refresh, stats update from BRef but the opening-night team mapping in
          this project is preserved.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          RN Value scale
        </h2>
        <p>
          RN Value is a subjective career-outcome rating (0–10). Rough bands:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>&gt; 3 — useful rotation player</li>
          <li>&gt; 4 — starter</li>
          <li>&gt; 6 — All-Star</li>
          <li>&gt; 7 — All-NBA</li>
          <li>&gt; 8 — Hall of Fame possible</li>
        </ul>
        <p>
          Young / incomplete careers are guesstimates based partly on potential.
          Current rookies are left unrated until there is enough signal.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          Clause Metric
        </h2>
        <p>
          Objective companion score: per-game PTS + REB + 1.5×AST. Useful as a
          secondary lens beside RN, WS, and VORP.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          Ranges & teams
        </h2>
        <p>
          Pick ranges are buckets of five (1–5, 6–10, …, 56–60). Team report
          cards show average RN over the selected span. Franchise continuity
          follows the workbook coding (OKC / Sonics lineage, BRK Nets, CHO
          Bobcats/Hornets, NOP Pelicans/Hornets history, etc.). GM-era splits
          are not in the data yet.
        </p>
      </section>
    </article>
  );
}
