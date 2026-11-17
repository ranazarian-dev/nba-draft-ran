"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/pick-value", label: "Pick Value" },
  { href: "/teams", label: "Teams" },
  { href: "/players", label: "Players & Ratings" },
  { href: "/data", label: "Update Data" },
];

export function SiteNav() {
  const pathname = usePathname();
  return (
    <header className="border-b border-[var(--line)] bg-[var(--paper)]/90 backdrop-blur sticky top-0 z-40">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-end sm:justify-between">
        <Link href="/" className="group">
          <div className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--ink)] sm:text-4xl">
            Wolves Report
          </div>
          <div className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
            Draft Value Analysis · 2008–present
          </div>
        </Link>
        <nav className="flex flex-wrap gap-1">
          {LINKS.map((l) => {
            const active =
              l.href === "/"
                ? pathname === "/"
                : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-[var(--ink)] text-[var(--paper)]"
                    : "text-[var(--ink-soft)] hover:bg-[var(--panel)]"
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
