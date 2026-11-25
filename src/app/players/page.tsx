import { PlayersTable } from "@/components/players-table";

export default function PlayersPage() {
  return (
    <div className="space-y-6">
      <section className="max-w-3xl">
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">
          Players & ratings
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-4xl text-[var(--ink)] sm:text-5xl">
          Edit RN Values live
        </h1>
        <p className="mt-3 text-[var(--ink-soft)]">
          Young / incomplete careers are intentional guesstimates. Leave rookies
          blank until you&apos;re ready to rate them. Use{" "}
          <strong className="font-semibold text-[var(--ink)]">Consist.</strong>{" "}
          as a second opinion for internal consistency with your anti-WS /
          injury-credit philosophy.
        </p>
      </section>
      <PlayersTable />
    </div>
  );
}
