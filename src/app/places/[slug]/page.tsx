import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { places, reviews, users } from "@/db/schema";
import { Badge, SectionHeading, SourceLine } from "@/components/ui";
import { SaveButton } from "@/components/save-button";
import { AddToTrip } from "@/components/add-to-trip";
import { formatUsd, PLACE_TYPE_LABELS, timeAgo } from "@/lib/utils";

export const revalidate = 300;

async function getPlace(slug: string) {
  return db.query.places.findFirst({
    where: eq(places.slug, slug),
    with: { city: { with: { country: true } }, source: true },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const place = await getPlace(slug);
  if (!place) return { title: "Place not found" };
  return {
    title: `${place.name} — ${place.city.name}, ${place.city.country.name}`,
    description: place.description ?? undefined,
  };
}

export default async function PlacePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const place = await getPlace(slug);
  if (!place) notFound();

  const reviewRows = await db
    .select({ review: reviews, author: users.name })
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .where(eq(reviews.placeId, place.id))
    .orderBy(desc(reviews.createdAt))
    .limit(10);

  const country = place.city.country;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <nav aria-label="Breadcrumb" className="text-xs text-stone-400">
        <Link href="/explore" className="hover:text-brand-700">Explore</Link> /{" "}
        <Link href={`/travel/${country.slug}`} className="hover:text-brand-700">{country.name}</Link> /{" "}
        <Link href={`/travel/${country.slug}/${place.city.slug}`} className="hover:text-brand-700">{place.city.name}</Link>
      </nav>

      <div className="mt-4 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[var(--shadow-card)]">
        {place.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={place.image} alt={place.name} className="h-64 w-full object-cover sm:h-80" />
        )}
        <div className="p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="brand">{PLACE_TYPE_LABELS[place.type]}</Badge>
                {place.area && <Badge tone="neutral">{place.area}</Badge>}
                {place.rating != null && <Badge tone="amber">★ {place.rating} ({place.reviewCount || reviewRows.length} reviews)</Badge>}
              </div>
              <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">{place.name}</h1>
              <p className="mt-1 text-sm text-stone-500">
                {place.city.name}, {country.flagEmoji} {country.name}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <SaveButton placeId={place.id} />
              <AddToTrip placeId={place.id} cityId={place.cityId} />
            </div>
          </div>

          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-stone-600">{place.description}</p>

          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Typical cost", value: place.estCostUsd != null ? (place.estCostUsd === 0 ? "Free" : formatUsd(place.estCostUsd)) : "—" },
              { label: "Suggested duration", value: place.durationMin ? `${Math.round(place.durationMin / 60 * 10) / 10}h` : "—" },
              { label: "Opening hours", value: place.openingHours ?? "—" },
              { label: "Coordinates", value: `${place.lat.toFixed(4)}, ${place.lng.toFixed(4)}` },
            ].map((f) => (
              <div key={f.label} className="rounded-lg bg-stone-50 p-3">
                <dt className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">{f.label}</dt>
                <dd className="mt-0.5 text-sm font-medium leading-snug">{f.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link href={`/map?city=${place.cityId}&focus=${place.id}`} className="text-sm font-semibold text-brand-700 hover:underline">
              View on Wanderly map →
            </Link>
            <a
              href={`https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lng}#map=17/${place.lat}/${place.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-stone-500 underline decoration-stone-300 underline-offset-2 hover:text-brand-700"
            >
              Open in OpenStreetMap
            </a>
            {place.website && (
              <a href={place.website} target="_blank" rel="noopener noreferrer" className="text-sm text-stone-500 underline decoration-stone-300 underline-offset-2 hover:text-brand-700">
                Official website
              </a>
            )}
          </div>

          {(place.tags ?? []).length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {(place.tags ?? []).map((t) => (
                <span key={t} className="rounded-full bg-brand-50 px-2.5 py-1 text-xs text-brand-700">#{t}</span>
              ))}
            </div>
          )}

          {(place.amenities ?? []).length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">Amenities</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {(place.amenities ?? []).map((a) => (
                  <span key={a} className="rounded bg-stone-100 px-2 py-1 text-xs text-stone-600">{a}</span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 border-t border-stone-100 pt-4">
            {place.source ? (
              <SourceLine
                name={place.source.name}
                url={place.source.url}
                checkedAt={place.source.lastCheckedAt}
                status={place.source.verificationStatus}
              />
            ) : (
              <p className="text-xs text-stone-400">No source recorded yet — flagged for editorial verification.</p>
            )}
            <p className="mt-1 text-xs text-stone-400">
              Prices and hours are reference values. Live pricing/availability arrives when a places provider is connected.
            </p>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-10">
        <SectionHeading title="Traveler reviews" subtitle={reviewRows.length ? undefined : "No reviews yet — be the first after your trip"} />
        {reviewRows.length > 0 && (
          <div className="space-y-3">
            {reviewRows.map(({ review, author }) => (
              <div key={review.id} className="rounded-xl border border-stone-200 bg-white p-4 shadow-[var(--shadow-card)]">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-800">
                    {author.slice(0, 1)}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{author}</p>
                    <p className="text-xs text-stone-400">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)} · {timeAgo(review.createdAt)}</p>
                  </div>
                </div>
                {review.body && <p className="mt-2 text-sm leading-relaxed text-stone-600">{review.body}</p>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
