export function MethodologyContent() {
  return (
    <article className="prose-draft max-w-3xl space-y-6 text-[var(--ink-soft)]">
      <header>
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">
          Methodology
        </p>
        <h2 className="mt-1 font-[family-name:var(--font-display)] text-3xl text-[var(--ink)] sm:text-4xl">
          How Draft Value is measured
        </h2>
      </header>

      <section className="space-y-2">
        <h3 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          Purpose
        </h3>
        <p>
          Estimate how valuable a draft position (or a 5-pick range) is by the
          chance it yields a certain caliber of player — not just average win
          shares. A #8 and a #22 can then be compared on useful / starter /
          All-Star / All-NBA hit rates.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          Source data
        </h3>
        <p>
          Factual columns come from Basketball-Reference draft tables (two
          rounds, no undrafted players). The in-app{" "}
          <strong>Update Data</strong> button re-pulls those tables on demand.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          Opening-night trade rule
        </h3>
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
        <h3 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          RN Value scale
        </h3>
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
        <p>
          Manual RN edits are saved to a shared store so phones, tablets, and
          desktops stay in sync. Anyone using the site can change RN ratings.
          The first visit from a browser that still has older local-only edits
          will upload those into the shared store.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          Consistency column (Consist.)
        </h3>
        <p>
          Players &amp; Ratings also shows an injury-aware model score
          calibrated to this RN scale. It is rate-first (WS/48, BPM, Claus, PPG)
          with soft longevity credit and only a light weight on raw career Win
          Shares — so teammate-inflated compilers stay muted and truncated peaks
          keep more value.
        </p>
        <p>
          v2 also folds in seeded{" "}
          <strong className="font-semibold text-[var(--ink)]">defense</strong>{" "}
          (0–10 impact ladder for known two-way players) and{" "}
          <strong className="font-semibold text-[var(--ink)]">
            Finals / championship
          </strong>{" "}
          history. Titles give a ceiling bump; Finals losses a smaller one.
          Hard rule: Consist. cannot reach 10 without a championship. Tags on
          the column: <em>inj</em> = injury credit, <em>D</em> = defense ≥ 7,{" "}
          <em>ring</em> = champion. Δ = your RN − Consist.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          Claus Metric
        </h3>
        <p>
          Objective companion score named for Claus: per-game PTS + REB +
          1.5×AST. Useful as a secondary lens beside RN, WS, and VORP.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          Ranges &amp; teams
        </h3>
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
