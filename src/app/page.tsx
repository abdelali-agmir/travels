import Link from "next/link";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { cities, communityPosts, countries, places, transportRoutes, users } from "@/db/schema";
import { TripPlannerForm } from "@/components/trip-planner-form";
import { SectionHeading, Badge } from "@/components/ui";
import { formatUsd, timeAgo } from "@/lib/utils";

export const revalidate = 300;

const HERO_IMAGE =
  "https://images.pexels.com/photos/35126795/pexels-photo-35126795.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200";

export default async function HomePage() {
  const [cityRows, countryRows, popularCities, experiences, stories, routes] = await Promise.all([
    db
      .select({ id: cities.id, name: cities.name, countryName: countries.name, countryCode: countries.code, flagEmoji: countries.flagEmoji })
      .from(cities)
      .innerJoin(countries, eq(cities.countryId, countries.id)),
    db.select({ code: countries.code, name: countries.name, flagEmoji: countries.flagEmoji }).from(countries),
    db
      .select({ city: cities, country: countries })
      .from(cities)
      .innerJoin(countries, eq(cities.countryId, countries.id))
      .where(eq(cities.popular, true))
      .limit(8),
    db
      .select({ place: places, city: cities, country: countries })
      .from(places)
      .innerJoin(cities, eq(places.cityId, cities.id))
      .innerJoin(countries, eq(cities.countryId, countries.id))
      .where(inArray(places.type, ["activity", "viewpoint"]))
      .orderBy(desc(places.rating))
      .limit(6),
    db
      .select({ post: communityPosts, author: users.name, city: cities.name })
      .from(communityPosts)
      .innerJoin(users, eq(communityPosts.userId, users.id))
      .leftJoin(cities, eq(communityPosts.cityId, cities.id))
      .orderBy(desc(communityPosts.likesCount))
      .limit(3),
    db.select().from(transportRoutes).limit(6),
  ]);

  const cityById = new Map(cityRows.map((c) => [c.id, c]));

  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={HERO_IMAGE} alt="" aria-hidden className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-brand-950/80 via-brand-950/60 to-paper" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-16 sm:px-6 sm:pt-24">
          <div className="max-w-2xl">
            <Badge tone="brand" className="mb-4 border-white/20 bg-white/10 text-white backdrop-blur">
              🌍 Global travel platform · verified sources · live data
            </Badge>
            <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl lg:text-[3.4rem]">
              Travel the world. Plan everything in one place.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
              Discover destinations, compare ways to get there, understand entry requirements, find places
              to stay, build your itinerary and manage your entire trip with Wanderly.
            </p>
          </div>
          <div className="mt-8 max-w-4xl">
            <TripPlannerForm cities={cityRows} countries={countryRows} compact />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* ── Popular destinations ── */}
        <section className="mt-14" aria-labelledby="popular-destinations">
          <SectionHeading
            title="Popular destinations"
            subtitle="Deep-verified places, budgets and guides"
            action={{ href: "/explore", label: "Explore all" }}
          />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {popularCities.map(({ city, country }) => (
              <Link
                key={city.id}
                href={`/travel/${country.slug}/${city.slug}`}
                className="card-hover group relative overflow-hidden rounded-xl border border-stone-200 bg-white shadow-[var(--shadow-card)]"
              >
                <div className="relative h-40 overflow-hidden sm:h-48">
                  {city.heroImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={city.heroImage} alt={city.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-brand-50 text-5xl">{country.flagEmoji}</div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                    <p className="text-sm font-semibold text-white">{city.name}</p>
                    <p className="text-xs text-white/70">{country.flagEmoji} {country.name}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between px-3 py-2.5 text-xs text-stone-500">
                  <span>~{formatUsd(city.avgDailyBudgetUsd)}/day</span>
                  <span className="font-medium text-brand-700 opacity-0 transition group-hover:opacity-100">View guide →</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Best experiences ── */}
        <section className="mt-14" aria-labelledby="experiences">
          <SectionHeading
            title="Best experiences"
            subtitle="Top-rated activities from the Wanderly database"
            action={{ href: "/map", label: "See on map" }}
          />
          <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
            {experiences.map(({ place, city, country }) => (
              <Link
                key={place.id}
                href={`/places/${place.slug}`}
                className="card-hover w-64 shrink-0 snap-start rounded-xl border border-stone-200 bg-white p-4 shadow-[var(--shadow-card)] sm:w-auto"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold leading-snug text-ink">{place.name}</p>
                  {place.rating && <Badge tone="amber">★ {place.rating}</Badge>}
                </div>
                <p className="mt-1 text-xs text-stone-500">{city.name}, {country.name}</p>
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-stone-500">{place.description}</p>
                <p className="mt-3 text-xs font-semibold text-brand-700">
                  {place.estCostUsd ? `From ${formatUsd(place.estCostUsd)}` : "Free"}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Popular routes ── */}
        <section className="mt-14" aria-labelledby="routes">
          <SectionHeading title="Popular routes" subtitle="Typical duration and fare ranges by mode — provider-ready for live pricing" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {routes.map((r) => {
              const from = cityById.get(r.fromCityId);
              const to = cityById.get(r.toCityId);
              const icons: Record<string, string> = { flight: "✈️", train: "🚆", bus: "🚌", ferry: "⛴️" };
              return (
                <div key={r.id} className="rounded-xl border border-stone-200 bg-white p-4 shadow-[var(--shadow-card)]">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-ink">
                      {from?.name} → {to?.name}
                    </p>
                    <span className="text-lg" aria-hidden>{icons[r.mode] ?? "🚏"}</span>
                  </div>
                  <p className="mt-1 text-xs text-stone-500">{r.operator}</p>
                  <div className="mt-3 flex items-center gap-3 text-xs text-stone-600">
                    <span>⏱ {r.typicalDurationMin ? `${Math.floor(r.typicalDurationMin / 60)}h${r.typicalDurationMin % 60 ? ` ${r.typicalDurationMin % 60}m` : ""}` : "—"}</span>
                    <span>💵 {formatUsd(r.typicalPriceUsdMin)}–{formatUsd(r.typicalPriceUsdMax)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Travel stories ── */}
        <section className="mt-14" aria-labelledby="stories">
          <SectionHeading title="Travel stories" subtitle="Real budgets, honest mistakes, community-tested tips" action={{ href: "/community", label: "Join the community" }} />
          <div className="grid gap-4 md:grid-cols-3">
            {stories.map(({ post, author, city }) => (
              <Link key={post.id} href={`/community/${post.id}`} className="card-hover flex flex-col rounded-xl border border-stone-200 bg-white shadow-[var(--shadow-card)]">
                {post.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.image} alt="" className="h-36 w-full rounded-t-xl object-cover" loading="lazy" />
                )}
                <div className="flex flex-1 flex-col p-4">
                  <Badge tone="neutral" className="self-start capitalize">{post.type}</Badge>
                  <p className="mt-2 text-sm font-semibold leading-snug text-ink">{post.title}</p>
                  <p className="mt-1.5 line-clamp-2 text-xs text-stone-500">{post.body}</p>
                  <p className="mt-auto pt-3 text-xs text-stone-400">
                    {author} · {city ?? "Global"} · ♥ {post.likesCount} · {timeAgo(post.createdAt)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Trust strip ── */}
        <section className="mt-16 rounded-2xl border border-stone-200 bg-white p-6 shadow-[var(--shadow-card)] sm:p-8">
          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <p className="text-2xl" aria-hidden>🛂</p>
              <h3 className="mt-2 font-display text-lg font-semibold">Sourced, not guessed</h3>
              <p className="mt-1 text-sm leading-relaxed text-stone-500">
                Visa rules, safety notes and key facts carry source links, verification status and last-checked dates. We never present AI output as authority.
              </p>
            </div>
            <div>
              <p className="text-2xl" aria-hidden>📡</p>
              <h3 className="mt-2 font-display text-lg font-semibold">Live where it matters</h3>
              <p className="mt-1 text-sm leading-relaxed text-stone-500">
                Weather via Open-Meteo and FX rates via ECB are live today. Flight, hotel and places providers plug in through clean adapters.
              </p>
            </div>
            <div>
              <p className="text-2xl" aria-hidden>🧭</p>
              <h3 className="mt-2 font-display text-lg font-semibold">Route-aware planning</h3>
              <p className="mt-1 text-sm leading-relaxed text-stone-500">
                Itineraries are grouped geographically with real distances, transport modes and time estimates — not random lists.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
