import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { countries, sources, visaRules } from "@/db/schema";
import { VisaChecker } from "@/components/visa-checker";
import { SectionHeading, SourceLine, VerificationBadge } from "@/components/ui";

export const metadata: Metadata = {
  title: "Visa & entry requirements",
  description: "Check visa requirements between countries — every rule carries an official source, verification status and last-checked date.",
};

export const revalidate = 300;

export default async function VisaPage() {
  const [countryRows, recentRules] = await Promise.all([
    db.select({ code: countries.code, name: countries.name, flagEmoji: countries.flagEmoji }).from(countries).orderBy(asc(countries.name)),
    db.select({ rule: visaRules, source: sources }).from(visaRules).leftJoin(sources, eq(visaRules.sourceId, sources.id)).limit(8),
  ]);
  const byCode = new Map(countryRows.map((c) => [c.code, c]));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Visa & entry requirements</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-500">
        Requirements depend on your nationality, destination and purpose of travel. Every rule in Wanderly stores its
        official source, verification status and the date we last checked it — and we say clearly when we don't know.
      </p>

      <div className="mt-8">
        <VisaChecker countries={countryRows} />
      </div>

      <section className="mt-14">
        <SectionHeading title="Recently verified corridors" subtitle="A sample of the visa-rule database" />
        <div className="grid gap-3 md:grid-cols-2">
          {recentRules.map(({ rule, source }) => {
            const from = byCode.get(rule.fromCountryCode);
            const to = byCode.get(rule.toCountryCode);
            return (
              <div key={rule.id} className="rounded-xl border border-stone-200 bg-white p-4 shadow-[var(--shadow-card)]">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">
                    {from?.flagEmoji} {from?.name ?? rule.fromCountryCode} → {to?.flagEmoji} {to?.name ?? rule.toCountryCode}
                  </p>
                  <VerificationBadge status={rule.verificationStatus} />
                </div>
                <p className="mt-1 text-xs capitalize text-stone-600">
                  {rule.visaType.replace(/_/g, " ")}{rule.maxStayDays ? ` · up to ${rule.maxStayDays} days` : ""}
                </p>
                {source && <SourceLine className="mt-2" name={source.name} url={source.url} checkedAt={rule.lastVerifiedAt} />}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
