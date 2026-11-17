import Link from "next/link";
import { MethodologyContent } from "@/components/methodology-content";

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-[var(--line)] bg-[linear-gradient(145deg,#0C2340_0%,#236192_55%,#0C2340_100%)] px-6 py-12 text-center sm:px-10 sm:py-16">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(120,190,32,0.35), transparent 45%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.08), transparent 40%)",
          }}
        />
        <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/timberwolves-logo.svg"
            alt="Minnesota Timberwolves logo"
            width={160}
            height={160}
            className="h-28 w-28 drop-shadow-lg sm:h-40 sm:w-40"
          />
          <h1 className="font-[family-name:var(--font-display)] text-3xl leading-tight text-white sm:text-5xl">
            Welcome to the Wolves Report Draft Value Analyis.
          </h1>
          <p className="max-w-xl text-sm text-white/80 sm:text-base">
            Pick-slot hit rates, team report cards, and editable RN ratings —
            built around opening-night draft credit.
          </p>
          <Link
            href="/pick-value"
            className="rounded-md bg-[#78BE20] px-5 py-2.5 text-sm font-semibold text-[#0C2340] transition hover:bg-[#8fd12e]"
          >
            Open Pick Value explorer
          </Link>
        </div>
      </section>

      <MethodologyContent />
    </div>
  );
}
