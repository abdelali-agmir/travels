import Link from "next/link";
import type { Metadata } from "next";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { checklistItems, cities, countries, trips } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { Badge, EmptyState, SectionHeading } from "@/components/ui";
import { formatDateRange, formatUsd, tripLengthDays } from "@/lib/utils";

export const metadata: Metadata = { title: "My trips" };
export const dynamic = "force-dynamic";

export default async function TripsPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState
          icon="🧳"
          title="Sign in to see your trips"
          description="Your itineraries, budgets and checklists live here — synced to your account."
          action={
            <div className="flex gap-2">
              <Link href="/login?next=/trips" className="rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800">Sign in</Link>
              <Link href="/register" className="rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50">Create account</Link>
            </div>
          }
        />
      </div>
    );
  }

  const rows = await db
    .select({ trip: trips, city: cities, country: countries })
    .from(trips)
    .innerJoin(cities, eq(trips.destinationCityId, cities.id))
    .innerJoin(countries, eq(cities.countryId, countries.id))
    .where(eq(trips.userId, user.id))
    .orderBy(desc(trips.createdAt));

  const tripIds = rows.map((r) => r.trip.id);
  const checklist = tripIds.length
    ? await db.select().from(checklistItems).where(inArray(checklistItems.tripId, tripIds))
    : [];
  const progress = (tripId: number) => {
    const items = checklist.filter((c) => c.tripId === tripId);
    if (!items.length) return 0;
    return Math.round((items.filter((c) => c.done).length / items.length) * 100);
  };

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = rows.filter((r) => r.trip.endDate >= today && r.trip.status !== "draft");
  const past = rows.filter((r) => r.trip.endDate < today);
  const drafts = rows.filter((r) => r.trip.status === "draft");

  function TripCard({ trip, city, country }: (typeof rows)[number]) {
    const pct = progress(trip.id);
    return (
      <Link href={`/trips/${trip.id}`} className="card-hover overflow-hidden rounded-xl border border-stone-200 bg-white shadow-[var(--shadow-card)]">
        <div className="relative h-32">
          {city.heroImage ?? country.heroImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={city.heroImage ?? country.heroImage!} alt="" className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex h-full items-center justify-center bg-brand-50 text-4xl">{country.flagEmoji}</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
            <p className="text-sm font-semibold text-white">{city.name}, {country.name}</p>
            <Badge tone={trip.status === "completed" ? "neutral" : trip.status === "active" ? "green" : "brand"} className="capitalize">{trip.status}</Badge>
          </div>
        </div>
        <div className="p-4">
          <p className="text-xs text-stone-500">{formatDateRange(trip.startDate, trip.endDate)} · {tripLengthDays(trip.startDate, trip.endDate)} days · {trip.travelers} traveler{trip.travelers > 1 ? "s" : ""}</p>
          <div className="mt-2.5 flex items-center justify-between text-xs">
            <span className="font-medium text-stone-600">Budget {trip.budgetUsd ? formatUsd(trip.budgetUsd) : "—"}</span>
            <span className="capitalize text-stone-400">{trip.travelStyle}</span>
          </div>
          <div className="mt-2.5 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone-100">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[10px] text-stone-400">{pct}% ready</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">My trips</h1>
          <p className="mt-1 text-sm text-stone-500">Welcome back, {user.name.split(" ")[0]} — pick up where you left off.</p>
        </div>
        <Link href="/plan" className="rounded-lg bg-accent-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-600">
          ＋ Plan a new trip
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon="🗺️"
            title="No trips yet"
            description="Build your first trip — a full itinerary, budget and checklist in under a minute."
            action={<Link href="/plan" className="rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800">Plan a trip</Link>}
          />
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <section className="mt-8">
              <SectionHeading title="Upcoming trips" subtitle="Continue planning" />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {upcoming.map((r) => <TripCard key={r.trip.id} {...r} />)}
              </div>
            </section>
          )}
          {drafts.length > 0 && (
            <section className="mt-10">
              <SectionHeading title="Drafts" />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {drafts.map((r) => <TripCard key={r.trip.id} {...r} />)}
              </div>
            </section>
          )}
          {past.length > 0 && (
            <section className="mt-10">
              <SectionHeading title="Past trips" />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {past.map((r) => <TripCard key={r.trip.id} {...r} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
