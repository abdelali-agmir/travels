import Link from "next/link";
import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { cities, countries, places, savedPlaces } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { Badge, EmptyState, SectionHeading } from "@/components/ui";
import { SaveButton } from "@/components/save-button";
import { formatUsd, PLACE_TYPE_LABELS } from "@/lib/utils";

export const metadata: Metadata = { title: "Saved places" };
export const dynamic = "force-dynamic";

export default async function SavedPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState
          icon="♡"
          title="Sign in to see saved places"
          description="Save destinations, hotels, restaurants and activities as you browse — they collect here."
          action={<Link href="/login?next=/saved" className="rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800">Sign in</Link>}
        />
      </div>
    );
  }

  const placeCity = alias(cities, "place_city");
  const placeCountry = alias(countries, "place_country");

  const rows = await db
    .select({
      saved: savedPlaces,
      place: places,
      placeCity: placeCity,
      placeCountry: placeCountry,
      city: cities,
      country: countries,
    })
    .from(savedPlaces)
    .leftJoin(places, eq(savedPlaces.placeId, places.id))
    .leftJoin(placeCity, eq(places.cityId, placeCity.id))
    .leftJoin(placeCountry, eq(placeCity.countryId, placeCountry.id))
    .leftJoin(cities, eq(savedPlaces.cityId, cities.id))
    .leftJoin(countries, eq(cities.countryId, countries.id))
    .where(eq(savedPlaces.userId, user.id))
    .orderBy(desc(savedPlaces.createdAt));

  const savedDestinations = rows.filter((r) => r.city && !r.place);
  const savedPlaceRows = rows.filter((r) => r.place);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Saved</h1>
      <p className="mt-1 text-sm text-stone-500">Your shortlist of destinations and places.</p>

      {rows.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon="♡"
            title="Nothing saved yet"
            description="Tap the heart on any destination, hotel, restaurant or attraction to keep it here."
            action={<Link href="/explore" className="rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800">Start exploring</Link>}
          />
        </div>
      ) : (
        <>
          {savedDestinations.length > 0 && (
            <section className="mt-8">
              <SectionHeading title="Destinations" />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {savedDestinations.map(({ saved, city, country }) => (
                  <div key={saved.id} className="card-hover overflow-hidden rounded-xl border border-stone-200 bg-white shadow-[var(--shadow-card)]">
                    <Link href={`/travel/${country!.slug}/${city!.slug}`}>
                      {city!.heroImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={city!.heroImage} alt="" className="h-28 w-full object-cover" loading="lazy" />
                      ) : (
                        <div className="flex h-28 items-center justify-center bg-brand-50 text-3xl">{country!.flagEmoji}</div>
                      )}
                    </Link>
                    <div className="flex items-center justify-between p-3">
                      <div>
                        <p className="text-sm font-semibold">{city!.name}</p>
                        <p className="text-xs text-stone-400">{country!.name}</p>
                      </div>
                      <SaveButton cityId={city!.id} initialSaved label={false} className="!px-2 !py-1.5" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {savedPlaceRows.length > 0 && (
            <section className="mt-10">
              <SectionHeading title="Places" />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {savedPlaceRows.map(({ saved, place, placeCity, placeCountry }) => (
                  <div key={saved.id} className="card-hover rounded-xl border border-stone-200 bg-white p-4 shadow-[var(--shadow-card)]">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link href={`/places/${place!.slug}`} className="text-sm font-semibold hover:text-brand-700 hover:underline">
                          {place!.name}
                        </Link>
                        <p className="mt-0.5 text-xs text-stone-400">
                          {PLACE_TYPE_LABELS[place!.type]} · {placeCity?.name}, {placeCountry?.name}
                        </p>
                      </div>
                      <SaveButton placeId={place!.id} initialSaved label={false} className="!px-2 !py-1.5" />
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-stone-500">
                      {place!.rating != null && <Badge tone="amber">★ {place!.rating}</Badge>}
                      <span className="font-medium text-brand-700">{place!.estCostUsd ? formatUsd(place!.estCostUsd) : "Free"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
