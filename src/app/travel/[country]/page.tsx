import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { countries, phrases, sources, travelAlerts, travelFacts, visaRules } from "@/db/schema";
import { Badge, SectionHeading, SourceLine, VerificationBadge } from "@/components/ui";
import { formatUsd, formatDate } from "@/lib/utils";

export const revalidate = 300;

async function getCountry(slug: string) {
  return db.query.countries.findFirst({
    where: eq(countries.slug, slug),
    with: { cities: true, source: true },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ country: string }> }): Promise<Metadata> {
  const { country: slug } = await params;
  const country = await getCountry(slug);
  if (!country) return { title: "Destination not found" };
  return {
    title: `${country.name} travel guide — visas, budget, cities`,
    description: country.summary ?? `Plan your trip to ${country.name} with Wanderly.`,
  };
}

export default async function CountryPage({ params }: { params: Promise<{ country: string }> }) {
  const { country: slug } = await params;
  const country = await getCountry(slug);
  if (!country) notFound();

  const [facts, phraseRows, alerts, visaTo] = await Promise.all([
    db.select({ fact: travelFacts, source: sources }).from(travelFacts).leftJoin(sources, eq(travelFacts.sourceId, sources.id)).where(eq(travelFacts.countryId, country.id)),
    db.select().from(phrases).where(eq(phrases.countryId, country.id)).limit(8),
    db.select({ alert: travelAlerts, source: sources }).from(travelAlerts).leftJoin(sources, eq(travelAlerts.sourceId, sources.id)).where(eq(travelAlerts.countryId, country.id)),
    db.select({ rule: visaRules, source: sources }).from(visaRules).leftJoin(sources, eq(visaRules.sourceId, sources.id)).where(eq(visaRules.toCountryCode, country.code)).limit(5),
  ]);

  const safetyLabel = country.safetyLevel
    ? ["", "Very safe", "Generally safe", "Increased caution", "Reconsider some areas", "High risk"][country.safetyLevel]
    : "Not rated";

  const factsByCat = (cats: string[]) => facts.filter((f) => cats.includes(f.fact.category));

  return (
    <div>
      {/* Hero */}
      <section className="relative">
        {country.heroImage ? (
          <div className="relative h-64 sm:h-80">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={country.heroImage} alt={country.name} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          </div>
        ) : (
          <div className="h-40 bg-gradient-to-br from-brand-800 to-brand-950" />
        )}
        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto max-w-7xl px-4 pb-6 sm:px-6">
            <nav aria-label="Breadcrumb" className="mb-1 text-xs text-white/70">
              <Link href="/explore" className="hover:underline">Explore</Link> / {country.continent}
            </nav>
            <h1 className="font-display text-3xl font-semibold text-white sm:text-4xl">
              {country.flagEmoji} {country.name}
            </h1>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <p className="max-w-3xl text-sm leading-relaxed text-stone-600 sm:text-base">{country.summary}</p>
        {country.source && (
          <SourceLine className="mt-2" name={country.source.name} url={country.source.url} checkedAt={country.source.lastCheckedAt} status={country.source.verificationStatus} />
        )}

        {/* Key facts grid */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: "Capital", value: country.capital },
            { label: "Currency", value: `${country.currencyCode} · ${country.currencyName}` },
            { label: "Languages", value: country.languages.join(", ") },
            { label: "Time zone", value: country.timezone },
            { label: "Daily budget", value: `~${formatUsd(country.avgDailyBudgetUsd)}` },
            { label: "Safety", value: safetyLabel },
          ].map((f) => (
            <div key={f.label} className="rounded-xl border border-stone-200 bg-white p-3 shadow-[var(--shadow-card)]">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">{f.label}</p>
              <p className="mt-1 text-sm font-medium leading-snug text-ink">{f.value}</p>
            </div>
          ))}
        </div>

        {/* Best time + emergency */}
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-[var(--shadow-card)]">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">Best time to visit</p>
            <p className="mt-1 text-sm font-medium">{country.bestTime ?? "—"}</p>
          </div>
          <div className="rounded-xl border border-red-100 bg-red-50/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-red-400">Emergency numbers</p>
            <p className="mt-1 text-sm font-medium text-red-900">
              {Object.entries(country.emergency ?? {}).map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`).join(" · ") || "—"}
            </p>
          </div>
        </div>

        {/* Cities */}
        <section className="mt-12" id="cities">
          <SectionHeading title={`Cities & islands in ${country.name}`} subtitle="Each destination has a full guide with places, weather and safety" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {country.cities.map((city) => (
              <Link key={city.id} href={`/travel/${country.slug}/${city.slug}`} className="card-hover overflow-hidden rounded-xl border border-stone-200 bg-white shadow-[var(--shadow-card)]">
                {city.heroImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={city.heroImage} alt="" className="h-32 w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-32 items-center justify-center bg-brand-50 text-4xl">{city.kind === "island" ? "🏝️" : "🌆"}</div>
                )}
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{city.name}</h3>
                    {city.kind === "island" && <Badge tone="blue">Island</Badge>}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-stone-500">{city.summary}</p>
                  <p className="mt-2 text-xs font-medium text-brand-700">~{formatUsd(city.avgDailyBudgetUsd)}/day</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Visa rules into this country */}
        <section className="mt-12" id="visa">
          <SectionHeading title="Entry & visa rules" subtitle="Stored with official sources and verification status — sample matrix, expand per nationality" action={{ href: "/visa", label: "Full visa checker" }} />
          {visaTo.length === 0 ? (
            <p className="rounded-xl border border-dashed border-stone-300 bg-white/60 p-6 text-sm text-stone-500">
              No visa rules stored for {country.name} yet. Wanderly never invents entry requirements — check the official government source.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {visaTo.map(({ rule, source }) => (
                <div key={rule.id} className="rounded-xl border border-stone-200 bg-white p-4 shadow-[var(--shadow-card)]">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">
                      From {rule.fromCountryCode} · {rule.visaType.replace(/_/g, " ")}
                    </p>
                    <VerificationBadge status={rule.verificationStatus} />
                  </div>
                  {rule.maxStayDays && <p className="mt-1 text-xs text-stone-500">Max stay: {rule.maxStayDays} days</p>}
                  {rule.notes && <p className="mt-1.5 text-xs leading-relaxed text-stone-600">{rule.notes}</p>}
                  {source && <SourceLine className="mt-2" name={source.name} url={source.url} checkedAt={rule.lastVerifiedAt} />}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Know before you go */}
        {facts.length > 0 && (
          <section className="mt-12" id="tips">
            <SectionHeading title="Know before you go" subtitle="Money, SIM, laws, scams and local knowledge — with sources" />
            <div className="grid gap-3 md:grid-cols-2">
              {factsByCat(["money", "sim", "internet", "transport", "law", "scam", "safety", "health", "tip", "food"]).map(({ fact, source }) => (
                <div key={fact.id} className="rounded-xl border border-stone-200 bg-white p-4 shadow-[var(--shadow-card)]">
                  <div className="flex items-center gap-2">
                    <Badge tone={fact.category === "scam" || fact.category === "safety" ? "red" : fact.category === "food" ? "amber" : "brand"} className="capitalize">{fact.category}</Badge>
                    <p className="text-sm font-semibold">{fact.title}</p>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-stone-600">{fact.body}</p>
                  {source && <SourceLine className="mt-2" name={source.name} url={source.url} checkedAt={source.lastCheckedAt} />}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Phrases */}
        {phraseRows.length > 0 && (
          <section className="mt-12" id="language">
            <SectionHeading title="Local phrases" subtitle={`${country.languages.join(", ")} — pronunciation included`} action={{ href: "/guide", label: "Language helper" }} />
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {phraseRows.map((p) => (
                <div key={p.id} className="rounded-lg border border-stone-200 bg-white p-3">
                  <p className="text-xs text-stone-400">{p.english}</p>
                  <p className="mt-0.5 text-sm font-semibold">{p.original}</p>
                  {p.pronunciation && <p className="text-xs italic text-stone-500">{p.pronunciation}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Alerts */}
        {alerts.length > 0 && (
          <section className="mt-12" id="alerts">
            <SectionHeading title="Travel alerts" subtitle="Sample alert system — live feeds connect via official sources" action={{ href: "/alerts", label: "All alerts" }} />
            <div className="space-y-3">
              {alerts.map(({ alert, source }) => (
                <div key={alert.id} className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={alert.severity === "warning" || alert.severity === "critical" ? "red" : "amber"} className="capitalize">{alert.severity}</Badge>
                    <Badge tone="neutral" className="capitalize">{alert.category}</Badge>
                    {alert.isSample && <Badge tone="blue">Sample — not a live alert</Badge>}
                    <span className="ml-auto text-xs text-stone-400">Published {formatDate(alert.publishedAt)}</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold">{alert.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-stone-600">{alert.body}</p>
                  {source && <SourceLine className="mt-2" name={source.name} url={source.url} checkedAt={alert.lastCheckedAt} />}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
