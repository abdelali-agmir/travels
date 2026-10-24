import Link from "next/link";
import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { cities, countries } from "@/db/schema";
import { Badge, SampleDataBadge, SectionHeading } from "@/components/ui";
import { cn, formatUsd } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Explore the world",
  description: "Browse countries, cities and islands with budgets, visa accessibility, best seasons and safety at a glance.",
};

export const revalidate = 300;

const CONTINENTS = ["All", "Africa", "Europe", "Asia", "North America", "South America", "Oceania", "Antarctica"];
const BUDGETS = [
  { key: "any", label: "Any budget" },
  { key: "budget", label: "Under $80/day" },
  { key: "mid", label: "$80–150/day" },
  { key: "high", label: "$150+/day" },
];

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ continent?: string; budget?: string }>;
}) {
  const params = await searchParams;
  const continent = params.continent && CONTINENTS.includes(params.continent) ? params.continent : "All";
  const budget = params.budget ?? "any";

  const [countryRows, cityRows] = await Promise.all([
    db.select().from(countries).orderBy(asc(countries.name)),
    db.select({ city: cities, countryId: cities.countryId }).from(cities),
  ]);

  const citiesByCountry = new Map<number, string[]>();
  for (const { city } of cityRows) {
    const list = citiesByCountry.get(city.countryId) ?? [];
    list.push(city.name);
    citiesByCountry.set(city.countryId, list);
  }

  const filtered = countryRows.filter((c) => {
    if (continent !== "All" && c.continent !== continent) return false;
    const daily = c.avgDailyBudgetUsd ?? 0;
    if (budget === "budget" && daily >= 80) return false;
    if (budget === "mid" && (daily < 80 || daily > 150)) return false;
    if (budget === "high" && daily <= 150) return false;
    return true;
  });

  const qs = (c: string, b: string) => {
    const p = new URLSearchParams();
    if (c !== "All") p.set("continent", c);
    if (b !== "any") p.set("budget", b);
    const str = p.toString();
    return str ? `/explore?${str}` : "/explore";
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Explore the world</h1>
          <p className="mt-1 text-sm text-stone-500">
            Compare countries by budget, season, visa openness and safety — then dive into city guides.
          </p>
        </div>
        <SampleDataBadge />
      </div>

      {/* Continent filter */}
      <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto pb-1" role="navigation" aria-label="Filter by continent">
        {CONTINENTS.map((c) => (
          <Link
            key={c}
            href={qs(c, budget)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition",
              c === continent ? "border-brand-700 bg-brand-700 text-white" : "border-stone-300 bg-white text-stone-600 hover:border-brand-400",
            )}
          >
            {c}
          </Link>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2" role="navigation" aria-label="Filter by budget">
        {BUDGETS.map((b) => (
          <Link
            key={b.key}
            href={qs(continent, b.key)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition",
              b.key === budget ? "border-accent-500 bg-accent-500/10 text-accent-600" : "border-stone-200 bg-white text-stone-500 hover:border-accent-400",
            )}
          >
            {b.label}
          </Link>
        ))}
      </div>

      {/* Country cards */}
      {filtered.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-stone-300 bg-white/60 p-12 text-center">
          <p className="text-3xl" aria-hidden>🗺️</p>
          <h2 className="mt-3 font-semibold">No countries match those filters yet</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-stone-500">
            Wanderly currently ships with a 12-country sample dataset. The schema and pipelines are built for full global coverage — filters will fill in as data lands.
          </p>
          <Link href="/explore" className="mt-4 inline-block text-sm font-semibold text-brand-700 hover:underline">
            Clear filters
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Link
              key={c.id}
              href={`/travel/${c.slug}`}
              className="card-hover group overflow-hidden rounded-xl border border-stone-200 bg-white shadow-[var(--shadow-card)]"
            >
              {c.heroImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.heroImage} alt="" className="h-36 w-full object-cover transition duration-500 group-hover:scale-[1.02]" loading="lazy" />
              ) : (
                <div className="flex h-36 items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100 text-6xl">{c.flagEmoji}</div>
              )}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-semibold">
                    {c.flagEmoji} {c.name}
                  </h2>
                  <Badge tone="neutral">{c.continent}</Badge>
                </div>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-stone-500">{c.summary}</p>
                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                  <div className="flex justify-between border-b border-stone-100 pb-1">
                    <dt className="text-stone-400">Capital</dt>
                    <dd className="font-medium text-stone-700">{c.capital}</dd>
                  </div>
                  <div className="flex justify-between border-b border-stone-100 pb-1">
                    <dt className="text-stone-400">Currency</dt>
                    <dd className="font-medium text-stone-700">{c.currencyCode}</dd>
                  </div>
                  <div className="flex justify-between border-b border-stone-100 pb-1">
                    <dt className="text-stone-400">Daily budget</dt>
                    <dd className="font-medium text-stone-700">~{formatUsd(c.avgDailyBudgetUsd)}</dd>
                  </div>
                  <div className="flex justify-between border-b border-stone-100 pb-1">
                    <dt className="text-stone-400">Language</dt>
                    <dd className="truncate pl-2 font-medium text-stone-700">{c.languages[0]}</dd>
                  </div>
                </dl>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {(citiesByCountry.get(c.id) ?? []).slice(0, 3).map((name) => (
                    <span key={name} className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-stone-500">{name}</span>
                  ))}
                  {c.bestTime && <span className="ml-auto text-[10px] text-stone-400">Best: {c.bestTime.split("&")[0].trim()}</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-12">
        <SectionHeading title="How coverage grows" subtitle="Wanderly's data model already supports every country, city, island, airport, station, port and point of interest — content lands continent by continent with verified sources." />
      </div>
    </div>
  );
}
