import type { Metadata } from "next";
import { CurrencyConverter } from "@/components/currency-converter";
import { SectionHeading } from "@/components/ui";

export const metadata: Metadata = {
  title: "Currency converter & exchange rates",
  description: "Live exchange rates via ECB reference data, with trip budget conversion.",
};

export default async function CurrencyPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const params = await searchParams;
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Currency tools</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-500">
        Live rates from the European Central Bank reference feed (via Frankfurter — no API key required).
        If the live feed is unreachable, Wanderly falls back to a clearly-labeled cached reference snapshot.
      </p>
      <div className="mt-8">
        <CurrencyConverter
          initialFrom={params.from?.toUpperCase().slice(0, 3) || "USD"}
          initialTo={params.to?.toUpperCase().slice(0, 3) || "EUR"}
        />
      </div>
      <div className="mt-12">
        <SectionHeading title="Popular pairs for travelers" />
        <div className="grid gap-3 sm:grid-cols-3">
          {[["MAD", "EUR"], ["MAD", "USD"], ["JPY", "MAD"], ["USD", "THB"], ["EUR", "TRY"], ["GBP", "AED"]].map(([f, t]) => (
            <a key={`${f}${t}`} href={`/guide/currency?from=${f}&to=${t}`} className="card-hover rounded-xl border border-stone-200 bg-white p-4 text-sm font-semibold shadow-[var(--shadow-card)]">
              {f} → {t}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
