import type { Metadata } from "next";
import { Barlow_Condensed, Source_Sans_3 } from "next/font/google";
import { SiteNav } from "@/components/site-nav";
import { DataProvider } from "@/components/data-provider";
import { getMeta, getSeedPlayers } from "@/lib/data-store";
import "./globals.css";

const display = Barlow_Condensed({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const body = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Wolves Report · Draft Value Analysis",
  description:
    "Minnesota Timberwolves Draft Value Analysis — pick hit rates, team report cards, and editable RN ratings.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const players = getSeedPlayers();
  const meta = getMeta();

  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} antialiased`}>
        <DataProvider initialPlayers={players} meta={meta}>
          <SiteNav />
          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        </DataProvider>
      </body>
    </html>
  );
}
