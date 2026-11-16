import { TeamReportCards } from "@/components/team-report-cards";

export default function TeamsPage() {
  return (
    <div className="space-y-6">
      <section className="max-w-3xl">
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">
          Team report cards
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-4xl text-[var(--ink)] sm:text-5xl">
          Who extracted the most draft value?
        </h1>
        <p className="mt-3 text-[var(--ink-soft)]">
          Average RN Value over the selected span, with useful / starter /
          All-Star counts. Teams reflect opening-night ownership, including
          franchise continuity coding from the source workbook (OKC, CHO, NOP,
          BRK, etc.).
        </p>
      </section>
      <TeamReportCards />
    </div>
  );
}
