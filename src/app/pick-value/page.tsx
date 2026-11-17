import { HitRateExplorer } from "@/components/hit-rate-explorer";

export default function PickValuePage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">
          Explorer
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)] sm:text-5xl">
          Pick Value
        </h1>
        <p className="mt-2 max-w-2xl text-[var(--ink-soft)]">
          Hit rates by exact pick and five-pick ranges across the selected draft
          span. Thresholds follow the RN Value bands (&gt;3 useful, &gt;4 starter,
          &gt;6 All-Star, &gt;7 All-NBA).
        </p>
      </header>
      <HitRateExplorer />
    </div>
  );
}
