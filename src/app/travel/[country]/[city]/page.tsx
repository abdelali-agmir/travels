import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { cities, communityPosts, countries, creatorStories, places, users } from "@/db/schema";
import { Badge, SectionHeading, SourceLine } from "@/components/ui";
import { SaveButton } from "@/components/save-button";
import { getWeather, weatherLabel } from "@/lib/providers";
import { formatUsd, PLACE_TYPE_LABELS, timeAgo } from "@/lib/utils";

export const revalidate = 300;

async function getCity(countrySlug: string, citySlug: string) {
  const rows = await db
    .select({ city: cities, country: countries })
    .from(cities)
    .innerJoin(countries, eq(cities.countryId, countries.id))
    .where(and(eq(cities.slug, citySlug), eq(countries.slug, countrySlug)))
    .limit(1);
  return rows[0] ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ country: string; city: string }> }): Promise<Metadata> {
  const { country, city } = await params;
  const row = await getCity(country, city);
  if (!row) return { title: "Destination not found" };
  return {
    title: `${row.city.name}, ${row.country.name} — travel guide`,
    description: row.city.summary ?? undefined,
  };
}

function PlaceCard({ place }: { place: typeof places.$inferSelect }) {
  return (
    <Link href={`/places/${place.slug}`} className="card-hover flex flex-col rounded-xl border border-stone-200 bg-white p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold leading-snug">{place.name}</p>
        {place.rating != null && <Badge tone="amber">★ {place.rating}</Badge>}
      </div>
      <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-stone-400">
        {PLACE_TYPE_LABELS[place.type]} {place.area ? `· ${place.area}` : ""}
      </p>
      <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-stone-500">{place.description}</p>
      <div className="mt-auto flex items-center justify-between pt-2.5 text-xs">
        <span className="font-semibold text-brand-700">{place.estCostUsd ? formatUsd(place.estCostUsd) : place.estCostUsd === 0 ? "Free" : "—"}</span>
        {place.openingHours && <span className="truncate pl-2 text-stone-400">{place.openingHours}</span>}
      </div>
    </Link>
  );
}

export default async function CityPage({ params }: { params: Promise<{ country: string; city: string }> }) {
  const { country: countrySlug, city: citySlug } = await params;
  const row = await getCity(countrySlug, citySlug);
  if (!row) notFound();
  const { city, country } = row;

  const [cityPlaces, stories, posts, weather] = await Promise.all([
    db.select().from(places).where(eq(places.cityId, city.id)),
    db.select({ story: creatorStories, author: users.name }).from(creatorStories).innerJoin(users, eq(creatorStories.userId, users.id)).where(eq(creatorStories.cityId, city.id)),
    db.select({ post: communityPosts, author: users.name }).from(communityPosts).innerJoin(users, eq(communityPosts.userId, users.id)).where(eq(communityPosts.cityId, city.id)).orderBy(desc(communityPosts.likesCount)).limit(3),
    getWeather(city.lat, city.lng),
  ]);

  const byTypes = (types: string[]) => cityPlaces.filter((p) => types.includes(p.type)).sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  const attractions = byTypes(["attraction", "museum", "park", "market", "viewpoint", "neighborhood", "beach", "activity", "nightlife"]);
  const food = byTypes(["restaurant", "cafe", "street_food"]);
  const stay = byTypes(["hotel", "hostel"]);
  const transportHubs = byTypes(["airport", "train_station", "bus_station", "ferry_port"]);
  const essential = byTypes(["hospital", "police", "embassy"]);

  return (
    <div>
      {/* Hero */}
      <section className="relative">
        <div className="relative h-72 sm:h-96">
          {city.heroImage || country.heroImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={city.heroImage ?? country.heroImage!} alt={city.name} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full bg-gradient-to-br from-brand-800 to-brand-950" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
        </div>
        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto max-w-7xl px-4 pb-6 sm:px-6">
            <nav aria-label="Breadcrumb" className="mb-1 text-xs text-white/70">
              <Link href="/explore" className="hover:underline">Explore</Link> /{" "}
              <Link href={`/travel/${country.slug}`} className="hover:underline">{country.name}</Link>
            </nav>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="font-display text-4xl font-semibold text-white">{city.name}</h1>
                <p className="mt-1 max-w-xl text-sm text-white/80">{city.summary}</p>
              </div>
              <div className="flex gap-2">
                <SaveButton cityId={city.id} className="border-white/30 bg-white/10 text-white backdrop-blur hover:border-white" />
                <Link href={`/map?city=${city.id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-sm font-medium text-white backdrop-blur transition hover:border-white">
                  🗺️ Map
                </Link>
                <Link href="/plan" className="inline-flex items-center rounded-lg bg-accent-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-600">
                  Plan a trip here
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Quick facts + live weather */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-[var(--shadow-card)]">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">Daily budget</p>
            <p className="mt-1 font-display text-xl font-semibold">~{formatUsd(city.avgDailyBudgetUsd)}</p>
            <p className="text-xs text-stone-400">mid-range, per person</p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-[var(--shadow-card)]">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">Best time</p>
            <p className="mt-1 text-sm font-medium leading-snug">{city.bestTime ?? country.bestTime ?? "—"}</p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-[var(--shadow-card)]">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">Currency · Time zone</p>
            <p className="mt-1 text-sm font-medium">{country.currencyCode} · {city.timezone ?? country.timezone}</p>
            <Link href={`/guide/currency?from=USD&to=${country.currencyCode}`} className="text-xs font-medium text-brand-700 hover:underline">Convert →</Link>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">Weather now</p>
              {weather.live ? <Badge tone="green">Live</Badge> : <Badge tone="amber">Offline</Badge>}
            </div>
            {weather.current ? (
              <>
                <p className="mt-1 font-display text-xl font-semibold">{Math.round(weather.current.temperatureC)}°C</p>
                <p className="text-xs text-stone-500">{weatherLabel(weather.current.weatherCode)} · wind {Math.round(weather.current.windKmh)} km/h</p>
              </>
            ) : (
              <p className="mt-1 text-xs text-stone-400">Provider unreachable — no invented data shown.</p>
            )}
          </div>
        </div>
        {weather.live && weather.daily.length > 0 && (
          <div className="mt-3 rounded-xl border border-stone-200 bg-white p-4 shadow-[var(--shadow-card)]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">7-day forecast</p>
              <SourceLine name="Open-Meteo (live)" url="https://open-meteo.com" />
            </div>
            <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
              {weather.daily.map((d) => (
                <div key={d.date} className="min-w-[92px] rounded-lg bg-stone-50 p-2.5 text-center">
                  <p className="text-[10px] font-medium text-stone-400">
                    {new Date(d.date + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric" })}
                  </p>
                  <p className="mt-1 text-sm font-semibold">{Math.round(d.maxC)}° <span className="font-normal text-stone-400">{Math.round(d.minC)}°</span></p>
                  <p className="mt-0.5 text-[10px] text-stone-500">{weatherLabel(d.weatherCode)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Things to do */}
        <section className="mt-12 scroll-mt-24" id="do">
          <SectionHeading title={`Things to do in ${city.name}`} subtitle={`${attractions.length} verified places · attractions, museums, markets, nightlife`} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {attractions.map((p) => <PlaceCard key={p.id} place={p} />)}
          </div>
        </section>

        {/* Food */}
        {food.length > 0 && (
          <section className="mt-12 scroll-mt-24" id="food">
            <SectionHeading title="Where to eat" subtitle="From street food to fine dining" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {food.map((p) => <PlaceCard key={p.id} place={p} />)}
            </div>
          </section>
        )}

        {/* Stay */}
        {stay.length > 0 && (
          <section className="mt-12 scroll-mt-24" id="stay">
            <SectionHeading title="Places to stay" subtitle="Live availability & pricing arrive when an accommodation provider is connected" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {stay.map((p) => (
                <Link key={p.id} href={`/places/${p.slug}`} className="card-hover rounded-xl border border-stone-200 bg-white p-4 shadow-[var(--shadow-card)]">
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-semibold">{p.name}</p>
                    {p.rating != null && <Badge tone="amber">★ {p.rating}</Badge>}
                  </div>
                  <p className="mt-0.5 text-[11px] uppercase tracking-wide text-stone-400">{PLACE_TYPE_LABELS[p.type]} · {p.area}</p>
                  <p className="mt-1.5 line-clamp-2 text-xs text-stone-500">{p.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(p.amenities ?? []).slice(0, 4).map((a) => (
                      <span key={a} className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] text-stone-500">{a}</span>
                    ))}
                  </div>
                  <p className="mt-2 text-xs">
                    <span className="font-semibold text-brand-700">{formatUsd(p.estCostUsd)}</span>
                    <span className="text-stone-400"> /night · reference price</span>
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Getting there & around */}
        {transportHubs.length > 0 && (
          <section className="mt-12 scroll-mt-24" id="transport">
            <SectionHeading title="Getting there & around" subtitle="Airports, stations and ports" />
            <div className="grid gap-3 sm:grid-cols-2">
              {transportHubs.map((p) => (
                <Link key={p.id} href={`/places/${p.slug}`} className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-4 shadow-[var(--shadow-card)] transition hover:border-brand-300">
                  <span className="text-2xl" aria-hidden>
                    {p.type === "airport" ? "✈️" : p.type === "train_station" ? "🚆" : p.type === "ferry_port" ? "⛴️" : "🚌"}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{p.name}</p>
                    <p className="text-xs text-stone-500">{p.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Essential services */}
        {essential.length > 0 && (
          <section className="mt-12 scroll-mt-24" id="safety">
            <SectionHeading title="Essential services" subtitle="Hospitals, police and emergency contacts" />
            <div className="grid gap-3 sm:grid-cols-2">
              {essential.map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50/40 p-4">
                  <span className="text-2xl" aria-hidden>{p.type === "hospital" ? "🏥" : p.type === "police" ? "👮" : "🏛️"}</span>
                  <div>
                    <p className="text-sm font-semibold">{p.name}</p>
                    <p className="text-xs text-stone-600">{p.description} {p.openingHours ? `· ${p.openingHours}` : ""}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-stone-500">
              National emergency numbers for {country.name}:{" "}
              {Object.entries(country.emergency ?? {}).map(([k, v]) => `${k} ${v}`).join(" · ")}
            </p>
          </section>
        )}

        {/* Creator stories */}
        {stories.length > 0 && (
          <section className="mt-12 scroll-mt-24" id="stories">
            <SectionHeading title={`Creator journeys in ${city.name}`} subtitle="Real spending, real mistakes, real tips" action={{ href: "/creators", label: "Creator hub" }} />
            <div className="grid gap-4 md:grid-cols-2">
              {stories.map(({ story, author }) => (
                <Link key={story.id} href="/creators" className="card-hover overflow-hidden rounded-xl border border-stone-200 bg-white shadow-[var(--shadow-card)]">
                  {story.coverImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={story.coverImage} alt="" className="h-36 w-full object-cover" loading="lazy" />
                  )}
                  <div className="p-4">
                    <p className="font-display text-base font-semibold">{story.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-stone-500">{story.summary}</p>
                    <p className="mt-2 text-xs text-stone-400">
                      by {author} · {story.days} days · spent {formatUsd(story.totalSpendUsd)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Community */}
        {posts.length > 0 && (
          <section className="mt-12" id="community">
            <SectionHeading title="From the community" action={{ href: "/community", label: "All posts" }} />
            <div className="grid gap-3 md:grid-cols-3">
              {posts.map(({ post, author }) => (
                <Link key={post.id} href={`/community/${post.id}`} className="card-hover rounded-xl border border-stone-200 bg-white p-4 shadow-[var(--shadow-card)]">
                  <Badge tone="neutral" className="capitalize">{post.type}</Badge>
                  <p className="mt-2 text-sm font-semibold leading-snug">{post.title}</p>
                  <p className="mt-2 text-xs text-stone-400">{author} · ♥ {post.likesCount} · {timeAgo(post.createdAt)}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
