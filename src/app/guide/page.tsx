import Link from "next/link";
import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { countries, phrases, sources, travelFacts } from "@/db/schema";
import { Badge, ProviderNotice, SectionHeading, SourceLine } from "@/components/ui";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Travel guide — safety, language, SIM & money",
  description: "Country-by-country practical knowledge: emergency numbers, scams to avoid, local phrases, SIM/eSIM options and money tips.",
};

export const revalidate = 300;

export default async function GuidePage({ searchParams }: { searchParams: Promise<{ country?: string }> }) {
  const params = await searchParams;
  const countryRows = await db.select().from(countries).orderBy(asc(countries.name));
  const selected = countryRows.find((c) => c.slug === params.country) ?? countryRows.find((c) => c.slug === "japan") ?? countryRows[0];

  const [facts, phraseRows] = await Promise.all([
    db.select({ fact: travelFacts, source: sources }).from(travelFacts).leftJoin(sources, eq(travelFacts.sourceId, sources.id)).where(eq(travelFacts.countryId, selected.id)),
    db.select().from(phrases).where(eq(phrases.countryId, selected.id)),
  ]);

  const byCat = (cats: string[]) => facts.filter((f) => cats.includes(f.fact.category));
  const simFacts = byCat(["sim", "internet"]);
  const safetyFacts = byCat(["safety", "scam", "law", "health"]);
  const moneyFacts = byCat(["money"]);
  const foodFacts = byCat(["food"]);
  const transportFacts = byCat(["transport", "tip"]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Travel guide</h1>
          <p className="mt-1 text-sm text-stone-500">Practical, sourced knowledge for life on the road.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/guide/currency" className="rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-sm font-medium text-stone-700 transition hover:border-brand-400">💱 Currency tools</Link>
          <Link href="/alerts" className="rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-sm font-medium text-stone-700 transition hover:border-brand-400">🚨 Alerts</Link>
        </div>
      </div>

      {/* Country selector */}
      <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto pb-1" role="navigation" aria-label="Choose country">
        {countryRows.map((c) => (
          <Link
            key={c.id}
            href={`/guide?country=${c.slug}`}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
              c.id === selected.id ? "border-brand-700 bg-brand-700 text-white" : "border-stone-300 bg-white text-stone-600 hover:border-brand-400",
            )}
          >
            {c.flagEmoji} {c.name}
          </Link>
        ))}
      </div>

      {/* Emergency strip */}
      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border border-red-100 bg-red-50/60 p-5">
        <p className="text-sm font-semibold text-red-900">🚨 Emergency in {selected.name}:</p>
        {Object.entries(selected.emergency ?? {}).map(([k, v]) => (
          <p key={k} className="text-sm text-red-800">
            <span className="capitalize text-red-500">{k}</span> <span className="font-display text-lg font-bold">{v}</span>
          </p>
        ))}
        <p className="ml-auto text-xs text-red-400">Calling code {selected.callingCode}</p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {/* Language helper */}
        <section>
          <SectionHeading title="Language helper" subtitle={`${selected.languages.join(", ")} · pronunciation guides, audio-ready`} />
          {phraseRows.length === 0 ? (
            <p className="rounded-xl border border-dashed border-stone-300 bg-white/60 p-6 text-sm text-stone-500">Phrases for {selected.name} are being added.</p>
          ) : (
            <div className="space-y-2">
              {phraseRows.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-3.5 shadow-[var(--shadow-card)]">
                  <div>
                    <p className="text-xs text-stone-400">{p.english}</p>
                    <p className="text-base font-semibold">{p.original}</p>
                    {p.pronunciation && <p className="text-xs italic text-stone-500">{p.pronunciation}</p>}
                  </div>
                  {p.category === "emergency" && <Badge tone="red">Emergency</Badge>}
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="space-y-8">
          {/* Safety */}
          <section>
            <SectionHeading title="Safety, scams & laws" subtitle="Every warning carries a source and check date" />
            {safetyFacts.length === 0 ? (
              <p className="rounded-xl border border-dashed border-stone-300 bg-white/60 p-6 text-sm text-stone-500">
                No specific warnings stored for {selected.name}. Check your government's travel advisory.
              </p>
            ) : (
              <div className="space-y-3">
                {safetyFacts.map(({ fact, source }) => (
                  <div key={fact.id} className="rounded-xl border border-stone-200 bg-white p-4 shadow-[var(--shadow-card)]">
                    <div className="flex items-center gap-2">
                      <Badge tone="red" className="capitalize">{fact.category}</Badge>
                      <p className="text-sm font-semibold">{fact.title}</p>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-stone-600">{fact.body}</p>
                    {source && <SourceLine className="mt-2" name={source.name} url={source.url} checkedAt={source.lastCheckedAt} status={source.verificationStatus} />}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* SIM / internet */}
          <section>
            <SectionHeading title="SIM, eSIM & internet" />
            {simFacts.length > 0 ? (
              <div className="space-y-3">
                {simFacts.map(({ fact, source }) => (
                  <div key={fact.id} className="rounded-xl border border-stone-200 bg-white p-4 shadow-[var(--shadow-card)]">
                    <p className="text-sm font-semibold">📶 {fact.title}</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-stone-600">{fact.body}</p>
                    {source && <SourceLine className="mt-2" name={source.name} url={source.url} checkedAt={source.lastCheckedAt} />}
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-stone-300 bg-white/60 p-5 text-sm text-stone-500">Connectivity notes for {selected.name} are being added.</p>
            )}
            <div className="mt-3">
              <ProviderNotice provider="eSIM marketplace" reason="Set ESIM_AFFILIATE_KEY in .env to surface live eSIM plans and pricing from an affiliate provider (Airalo, Holafly…)." />
            </div>
          </section>
        </div>
      </div>

      {/* Money / food / transport */}
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {[
          { title: "Money", icon: "💵", items: moneyFacts },
          { title: "What to eat", icon: "🍽️", items: foodFacts },
          { title: "Getting around", icon: "🚇", items: transportFacts },
        ].map((sec) => (
          <section key={sec.title}>
            <h2 className="font-display text-lg font-semibold">{sec.icon} {sec.title}</h2>
            {sec.items.length === 0 ? (
              <p className="mt-3 rounded-xl border border-dashed border-stone-300 bg-white/60 p-4 text-xs text-stone-500">Coming soon for {selected.name}.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {sec.items.map(({ fact, source }) => (
                  <div key={fact.id} className="rounded-xl border border-stone-200 bg-white p-4 shadow-[var(--shadow-card)]">
                    <p className="text-sm font-semibold">{fact.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-stone-600">{fact.body}</p>
                    {source && <SourceLine className="mt-2" name={source.name} url={source.url} checkedAt={source.lastCheckedAt} />}
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
