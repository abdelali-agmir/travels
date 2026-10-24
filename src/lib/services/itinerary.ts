import "server-only";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  budgetItems,
  checklistItems,
  itineraryDays,
  itineraryItems,
  places,
  trips,
} from "@/db/schema";
import { addMinutes, haversineKm, tripLengthDays } from "@/lib/utils";

type Place = typeof places.$inferSelect;
type Trip = typeof trips.$inferSelect;

const FOOD_TYPES = ["restaurant", "cafe", "street_food"];
const SIGHT_TYPES = ["attraction", "museum", "park", "market", "viewpoint", "beach", "neighborhood", "activity"];

const STYLE_COST_MULTIPLIER: Record<string, number> = {
  backpacker: 0.55,
  budget: 0.7,
  "mid-range": 1,
  luxury: 1.9,
  adventure: 1,
  culture: 0.95,
  food: 1.15,
  nature: 0.85,
  beach: 0.9,
  nightlife: 1.2,
  family: 1.1,
  couple: 1.15,
  solo: 0.9,
  business: 1.4,
  photography: 0.9,
};

function interestScore(place: Place, interests: string[]): number {
  if (!interests.length) return 0;
  const tags = (place.tags ?? []).map((t) => t.toLowerCase());
  let score = 0;
  for (const interest of interests) {
    const key = interest.toLowerCase();
    if (tags.some((t) => t.includes(key) || key.includes(t))) score += 2;
    if (key === "museums" && place.type === "museum") score += 3;
    if (key === "beaches" && place.type === "beach") score += 3;
    if (key === "nightlife" && place.type === "nightlife") score += 3;
    if (key === "food" && FOOD_TYPES.includes(place.type)) score += 2;
    if (key === "nature" && (place.type === "park" || place.type === "beach")) score += 2;
    if (key === "local markets" && place.type === "market") score += 3;
    if (key === "history" && (place.type === "attraction" || place.type === "museum")) score += 1.5;
  }
  return score;
}

function transportFor(km: number): { mode: string; minutes: number } {
  if (km <= 1.2) return { mode: "walk", minutes: Math.max(4, Math.round(km * 14)) };
  if (km <= 6) return { mode: "metro", minutes: Math.round(8 + km * 3) };
  if (km <= 15) return { mode: "taxi", minutes: Math.round(10 + km * 2.4) };
  return { mode: "train", minutes: Math.round(15 + km * 1.6) };
}

/** Nearest-neighbour ordering so each day flows geographically. */
function orderByProximity<T extends { lat: number; lng: number }>(items: T[], start?: { lat: number; lng: number }): T[] {
  if (items.length <= 2) return items;
  const remaining = [...items];
  const ordered: T[] = [];
  let cursor = start ?? remaining[0];
  if (!start) ordered.push(remaining.shift()!);
  while (remaining.length) {
    let bestIdx = 0;
    let bestDist = Infinity;
    remaining.forEach((p, i) => {
      const d = haversineKm(cursor.lat, cursor.lng, p.lat, p.lng);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    });
    const next = remaining.splice(bestIdx, 1)[0];
    ordered.push(next);
    cursor = next;
  }
  return ordered;
}

function dateForIndex(start: string, index: number): string {
  const d = new Date(start + "T00:00:00");
  d.setDate(d.getDate() + index);
  return d.toISOString().slice(0, 10);
}

export type GenerateOptions = {
  emphasize?: "food" | "nightlife" | "nature" | "experiences";
  pace?: "normal" | "slow";
};

/**
 * Builds a full itinerary from verified places in the destination city.
 * Activities are grouped by area (nearest-neighbour routing) and estimated
 * costs are scaled by travel style. This uses only data present in the
 * Wanderly database — it never invents places.
 */
export async function generateItinerary(tripId: number, options: GenerateOptions = {}): Promise<void> {
  const trip = await db.query.trips.findFirst({ where: eq(trips.id, tripId) });
  if (!trip) throw new Error("Trip not found");

  const cityPlaces = await db
    .select()
    .from(places)
    .where(eq(places.cityId, trip.destinationCityId));

  // wipe existing itinerary
  const existingDays = await db
    .select({ id: itineraryDays.id })
    .from(itineraryDays)
    .where(eq(itineraryDays.tripId, tripId));
  if (existingDays.length) {
    await db.delete(itineraryItems).where(
      inArray(itineraryItems.dayId, existingDays.map((d) => d.id)),
    );
    await db.delete(itineraryDays).where(eq(itineraryDays.tripId, tripId));
  }

  const numDays = tripLengthDays(trip.startDate, trip.endDate);
  const interests = trip.interests ?? [];
  const multiplier = STYLE_COST_MULTIPLIER[trip.travelStyle] ?? 1;
  const perDaySights = options.pace === "slow" ? 2 : 3;

  const hotel = cityPlaces
    .filter((p) => (trip.travelStyle === "backpacker" || trip.travelStyle === "budget" ? p.type === "hostel" || p.type === "hotel" : p.type === "hotel"))
    .sort((a, b) => {
      const target = trip.travelStyle === "luxury" ? 4 : trip.travelStyle === "backpacker" ? 1 : 2.5;
      return Math.abs((a.priceLevel ?? 2) - target) - Math.abs((b.priceLevel ?? 2) - target);
    })[0];

  const airport = cityPlaces.find((p) => p.type === "airport");

  let sights = cityPlaces
    .filter((p) => SIGHT_TYPES.includes(p.type))
    .map((p) => ({ place: p, score: (p.rating ?? 3) + interestScore(p, interests) + Math.random() * 0.8 }))
    .sort((a, b) => b.score - a.score)
    .map((s) => s.place);

  if (options.emphasize === "nature") {
    sights = [
      ...sights.filter((p) => p.type === "park" || p.type === "beach"),
      ...sights.filter((p) => p.type !== "park" && p.type !== "beach"),
    ];
  }
  if (options.emphasize === "experiences") {
    sights = [
      ...sights.filter((p) => p.type === "activity"),
      ...sights.filter((p) => p.type !== "activity"),
    ];
  }

  const foodPool = cityPlaces
    .filter((p) => FOOD_TYPES.includes(p.type))
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  const nightlifePool = cityPlaces
    .filter((p) => p.type === "nightlife")
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

  let sightCursor = 0;
  let foodCursor = 0;
  let nightCursor = 0;
  let lastFoodId: number | null = null;
  // Each food spot appears at most twice per trip; never twice in a row.
  const nextFood = () => {
    if (!foodPool.length || foodCursor >= foodPool.length * 2) return null;
    let candidate = foodPool[foodCursor % foodPool.length];
    if (candidate.id === lastFoodId && foodPool.length > 1) {
      foodCursor++;
      candidate = foodPool[foodCursor % foodPool.length];
    }
    foodCursor++;
    lastFoodId = candidate.id;
    return candidate;
  };
  const nextNight = () =>
    nightlifePool.length && nightCursor < nightlifePool.length * 2
      ? nightlifePool[nightCursor++ % nightlifePool.length]
      : null;

  for (let dayIdx = 0; dayIdx < numDays; dayIdx++) {
    const isArrival = dayIdx === 0;
    const isDeparture = dayIdx === numDays - 1 && numDays > 2;

    const [day] = await db
      .insert(itineraryDays)
      .values({
        tripId,
        dayIndex: dayIdx,
        date: dateForIndex(trip.startDate, dayIdx),
        title: isArrival ? "Arrival day" : isDeparture ? "Departure day" : `Day ${dayIdx + 1}`,
      })
      .returning();

    type Draft = {
      placeId: number | null;
      title: string;
      kind: string;
      durationMin: number;
      estCostUsd: number;
      lat?: number;
      lng?: number;
      notes?: string;
    };
    const drafts: Draft[] = [];

    if (isArrival && airport) {
      drafts.push({
        placeId: airport.id,
        title: `Arrive at ${airport.name}`,
        kind: "transport",
        durationMin: 60,
        estCostUsd: 0,
        lat: airport.lat,
        lng: airport.lng,
        notes: "Immigration, baggage and SIM pickup.",
      });
    }
    if (isArrival && hotel) {
      drafts.push({
        placeId: hotel.id,
        title: `Check in — ${hotel.name}`,
        kind: "hotel",
        durationMin: 45,
        estCostUsd: Math.round((hotel.estCostUsd ?? 80) * multiplier),
        lat: hotel.lat,
        lng: hotel.lng,
      });
    }

    const sightCount = isArrival || isDeparture ? Math.max(1, perDaySights - 1) : perDaySights;
    const daySights: Place[] = [];
    for (let i = 0; i < sightCount && sightCursor < sights.length; i++) {
      daySights.push(sights[sightCursor++]);
    }
    const anchor = hotel ?? daySights[0];
    const routed = orderByProximity(daySights, anchor ? { lat: anchor.lat, lng: anchor.lng } : undefined);

    const lunch = nextFood();
    const insertLunchAfter = Math.min(1, routed.length);
    routed.forEach((p, i) => {
      if (i === insertLunchAfter && lunch) {
        drafts.push({
          placeId: lunch.id,
          title: `Lunch — ${lunch.name}`,
          kind: "food",
          durationMin: 75,
          estCostUsd: Math.round((lunch.estCostUsd ?? 15) * multiplier),
          lat: lunch.lat,
          lng: lunch.lng,
        });
      }
      drafts.push({
        placeId: p.id,
        title: p.name,
        kind: p.type === "activity" ? "activity" : "sight",
        durationMin: p.durationMin ?? 90,
        estCostUsd: Math.round((p.estCostUsd ?? 0) * multiplier),
        lat: p.lat,
        lng: p.lng,
      });
    });
    if (routed.length === 0 && lunch) {
      drafts.push({
        placeId: lunch.id,
        title: `Lunch — ${lunch.name}`,
        kind: "food",
        durationMin: 75,
        estCostUsd: Math.round((lunch.estCostUsd ?? 15) * multiplier),
        lat: lunch.lat,
        lng: lunch.lng,
      });
    }

    const dinner = options.emphasize === "food" ? nextFood() : nextFood();
    if (dinner && !isDeparture) {
      drafts.push({
        placeId: dinner.id,
        title: `Dinner — ${dinner.name}`,
        kind: "food",
        durationMin: 90,
        estCostUsd: Math.round((dinner.estCostUsd ?? 20) * multiplier),
        lat: dinner.lat,
        lng: dinner.lng,
      });
    }

    const wantsNight =
      options.emphasize === "nightlife" ||
      trip.travelStyle === "nightlife" ||
      interests.some((i) => i.toLowerCase().includes("night"));
    if (wantsNight && !isArrival && !isDeparture) {
      const night = nextNight();
      if (night) {
        drafts.push({
          placeId: night.id,
          title: night.name,
          kind: "nightlife",
          durationMin: 120,
          estCostUsd: Math.round((night.estCostUsd ?? 25) * multiplier),
          lat: night.lat,
          lng: night.lng,
        });
      }
    }

    if (isDeparture && airport) {
      drafts.push({
        placeId: airport.id,
        title: `Depart from ${airport.name}`,
        kind: "transport",
        durationMin: 120,
        estCostUsd: 0,
        lat: airport.lat,
        lng: airport.lng,
        notes: "Arrive 3h before an international flight.",
      });
    }

    // compute times + transport legs
    let clock = isArrival ? "11:00" : "09:00";
    let prev: { lat: number; lng: number } | null = hotel ? { lat: hotel.lat, lng: hotel.lng } : null;
    for (let i = 0; i < drafts.length; i++) {
      const d = drafts[i];
      let transportMode: string | null = null;
      let transportMin: number | null = null;
      let transportKm: number | null = null;
      if (prev && d.lat != null && d.lng != null) {
        const km = haversineKm(prev.lat, prev.lng, d.lat, d.lng);
        if (km > 0.15) {
          const t = transportFor(km);
          transportMode = t.mode;
          transportMin = t.minutes;
          transportKm = Math.round(km * 10) / 10;
          clock = addMinutes(clock, t.minutes);
        }
      }
      await db.insert(itineraryItems).values({
        dayId: day.id,
        orderIndex: i,
        placeId: d.placeId,
        title: d.title,
        kind: d.kind,
        startTime: clock,
        durationMin: d.durationMin,
        estCostUsd: d.estCostUsd,
        transportMode,
        transportMin,
        transportKm,
        notes: d.notes ?? null,
      });
      clock = addMinutes(clock, d.durationMin + 15);
      if (d.lat != null && d.lng != null) prev = { lat: d.lat, lng: d.lng };
    }
  }
}

/** Re-orders a single day's items geographically and recomputes legs/times. */
export async function optimizeDayRoute(dayId: number): Promise<void> {
  const items = await db
    .select({ item: itineraryItems, place: places })
    .from(itineraryItems)
    .leftJoin(places, eq(itineraryItems.placeId, places.id))
    .where(eq(itineraryItems.dayId, dayId))
    .orderBy(asc(itineraryItems.orderIndex));
  if (items.length < 3) return;

  const fixedStart = items.filter((r) => r.item.kind === "transport" && r.item.orderIndex === 0);
  const fixedEnd = items.filter(
    (r) => r.item.kind === "transport" && r.item.orderIndex === items.length - 1,
  );
  const movable = items.filter((r) => !fixedStart.includes(r) && !fixedEnd.includes(r));
  const located = movable.filter((r) => r.place);
  const unlocated = movable.filter((r) => !r.place);

  const routed = orderByProximity(
    located.map((r) => ({ lat: r.place!.lat, lng: r.place!.lng, row: r })),
  ).map((x) => x.row);

  const finalOrder = [...fixedStart, ...routed, ...unlocated, ...fixedEnd];

  let clock = "09:00";
  let prev: { lat: number; lng: number } | null = null;
  for (let i = 0; i < finalOrder.length; i++) {
    const { item, place } = finalOrder[i];
    let transportMode: string | null = null;
    let transportMin: number | null = null;
    let transportKm: number | null = null;
    if (prev && place) {
      const km = haversineKm(prev.lat, prev.lng, place.lat, place.lng);
      if (km > 0.15) {
        const t = transportFor(km);
        transportMode = t.mode;
        transportMin = t.minutes;
        transportKm = Math.round(km * 10) / 10;
        clock = addMinutes(clock, t.minutes);
      }
    }
    await db
      .update(itineraryItems)
      .set({ orderIndex: i, startTime: clock, transportMode, transportMin, transportKm })
      .where(eq(itineraryItems.id, item.id));
    clock = addMinutes(clock, (item.durationMin ?? 60) + 15);
    if (place) prev = { lat: place.lat, lng: place.lng };
  }
}

/** Scales estimated costs down (cheaper food/activity choices). */
export async function reduceTripCost(tripId: number): Promise<void> {
  const days = await db
    .select({ id: itineraryDays.id })
    .from(itineraryDays)
    .where(eq(itineraryDays.tripId, tripId));
  if (!days.length) return;
  const items = await db
    .select()
    .from(itineraryItems)
    .where(inArray(itineraryItems.dayId, days.map((d) => d.id)));
  for (const item of items) {
    if (item.estCostUsd && item.estCostUsd > 0 && item.kind !== "hotel") {
      await db
        .update(itineraryItems)
        .set({ estCostUsd: Math.max(0, Math.round(item.estCostUsd * 0.75)) })
        .where(eq(itineraryItems.id, item.id));
    }
  }
}

/* ───────────── Budget + checklist generation ───────────── */

export async function generateBudget(tripId: number): Promise<void> {
  const trip = await db.query.trips.findFirst({
    where: eq(trips.id, tripId),
    with: { destination: { with: { country: true } } },
  });
  if (!trip) return;
  await db.delete(budgetItems).where(and(eq(budgetItems.tripId, tripId), eq(budgetItems.isEstimate, true)));

  const nights = Math.max(1, tripLengthDays(trip.startDate, trip.endDate) - 1);
  const days = tripLengthDays(trip.startDate, trip.endDate);
  const travelers = trip.travelers;
  const daily = trip.destination?.avgDailyBudgetUsd ?? trip.destination?.country?.avgDailyBudgetUsd ?? 80;
  const mult = STYLE_COST_MULTIPLIER[trip.travelStyle] ?? 1;

  const rows: Array<{ category: typeof budgetItems.$inferInsert["category"]; label: string; amountUsd: number }> = [
    { category: "flights", label: "Round-trip flights (estimate)", amountUsd: Math.round(450 * mult) * travelers },
    { category: "accommodation", label: `${nights} nights (estimate)`, amountUsd: Math.round(daily * 0.45 * mult * nights) * Math.max(1, Math.ceil(travelers / 2)) },
    { category: "food", label: `Meals · ${days} days`, amountUsd: Math.round(daily * 0.3 * mult * days) * travelers },
    { category: "transport", label: "Local transport", amountUsd: Math.round(daily * 0.1 * mult * days) * travelers },
    { category: "activities", label: "Activities & entry fees", amountUsd: Math.round(daily * 0.15 * mult * days) * travelers },
    { category: "sim", label: "SIM / eSIM", amountUsd: 15 * travelers },
    { category: "insurance", label: "Travel insurance", amountUsd: Math.round(2.5 * days) * travelers },
    { category: "emergency", label: "Emergency buffer (10%)", amountUsd: Math.round(daily * days * 0.1 * mult) },
  ];
  await db.insert(budgetItems).values(rows.map((r) => ({ ...r, tripId, isEstimate: true })));
}

export async function generateChecklist(tripId: number): Promise<void> {
  const trip = await db.query.trips.findFirst({
    where: eq(trips.id, tripId),
    with: { destination: { with: { country: true } } },
  });
  if (!trip) return;
  const existing = await db
    .select({ id: checklistItems.id })
    .from(checklistItems)
    .where(eq(checklistItems.tripId, tripId));
  if (existing.length) return;

  const days = tripLengthDays(trip.startDate, trip.endDate);
  const country = trip.destination?.country;
  const interests = (trip.interests ?? []).map((i) => i.toLowerCase());

  const rows: Array<{ category: string; label: string }> = [
    { category: "Documents", label: "Passport valid 6+ months beyond return date" },
    { category: "Documents", label: `Check visa requirements for ${country?.name ?? "your destination"}` },
    { category: "Documents", label: "Travel insurance policy + printed copy" },
    { category: "Documents", label: "Flight confirmations & hotel bookings offline" },
    { category: "Money", label: `Notify bank · get some ${country?.currencyCode ?? "local currency"} cash` },
    { category: "Money", label: "Backup card stored separately" },
    { category: "Electronics", label: "Universal power adapter" },
    { category: "Electronics", label: "Power bank + cables" },
    { category: "Electronics", label: "Download offline maps for the trip area" },
    { category: "Health", label: "Personal medication + basic first-aid kit" },
    { category: "Health", label: "Check recommended vaccinations (official source)" },
    { category: "Connectivity", label: "Order eSIM or plan SIM pickup at arrival airport" },
    { category: "Clothes", label: `Pack for ${days} days (check the trip weather forecast)` },
    { category: "Toiletries", label: "Liquids under 100 ml for carry-on" },
  ];
  if (interests.includes("hiking") || trip.travelStyle === "adventure" || trip.travelStyle === "nature") {
    rows.push({ category: "Travel gear", label: "Hiking shoes + rain layer" });
  }
  if (interests.includes("beaches") || trip.travelStyle === "beach") {
    rows.push({ category: "Travel gear", label: "Swimwear, reef-safe sunscreen, sandals" });
  }
  if (interests.includes("photography") || trip.travelStyle === "photography") {
    rows.push({ category: "Electronics", label: "Camera, spare batteries, memory cards" });
  }
  if (trip.travelers > 2 || trip.travelStyle === "family") {
    rows.push({ category: "Documents", label: "Children's documents / consent letters if applicable" });
  }
  await db.insert(checklistItems).values(rows.map((r) => ({ ...r, tripId })));
}
