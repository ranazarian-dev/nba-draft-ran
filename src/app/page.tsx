import { HitRateExplorer } from "@/components/hit-rate-explorer";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <section className="max-w-3xl">
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">
          Pick value explorer
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-4xl text-[var(--ink)] sm:text-5xl">
          How often does a draft slot produce a real player?
        </h1>
        <p className="mt-3 text-[var(--ink-soft)]">
          Hit rates use your RN Value scale: useful (&gt;3), starter (&gt;4),
          All-Star (&gt;6), All-NBA (&gt;7), Hall of Fame track (&gt;8). Toggle WS,
          VORP, or Claus for objective secondary views.
        </p>
      </section>
      <HitRateExplorer />
    </div>
  );
}
