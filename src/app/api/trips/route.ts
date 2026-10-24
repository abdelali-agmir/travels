import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { cities, countries, trips } from "@/db/schema";
import { getCurrentUser, unauthorized } from "@/lib/auth";
import { generateBudget, generateChecklist, generateItinerary } from "@/lib/services/itinerary";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const rows = await db
    .select({ trip: trips, city: cities, country: countries })
    .from(trips)
    .innerJoin(cities, eq(trips.destinationCityId, cities.id))
    .innerJoin(countries, eq(cities.countryId, countries.id))
    .where(eq(trips.userId, user.id))
    .orderBy(desc(trips.createdAt));
  return Response.json({ trips: rows });
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  try {
    const body = await req.json().catch(() => null);
    const destinationCityId = Number(body?.destinationCityId);
    const startDate = String(body?.startDate ?? "");
    const endDate = String(body?.endDate ?? "");
    const travelers = Math.min(20, Math.max(1, Number(body?.travelers) || 1));
    const budgetUsd = body?.budgetUsd ? Math.max(0, Math.min(1000000, Number(body.budgetUsd))) : null;
    const travelStyle = String(body?.travelStyle ?? "mid-range").slice(0, 40);
    const interests = Array.isArray(body?.interests) ? body.interests.slice(0, 12).map(String) : [];
    const originLabel = body?.originLabel ? String(body.originLabel).slice(0, 160) : null;
    const nationalityCode = body?.nationalityCode ? String(body.nationalityCode).toUpperCase().slice(0, 2) : null;

    if (!Number.isInteger(destinationCityId)) {
      return Response.json({ error: "Please choose a destination." }, { status: 400 });
    }
    if (!DATE_RE.test(startDate) || !DATE_RE.test(endDate) || endDate < startDate) {
      return Response.json({ error: "Please choose valid travel dates." }, { status: 400 });
    }
    const dayCount = (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000 + 1;
    if (dayCount > 30) {
      return Response.json({ error: "Trips longer than 30 days aren't supported yet." }, { status: 400 });
    }

    const city = await db.query.cities.findFirst({ where: eq(cities.id, destinationCityId) });
    if (!city) return Response.json({ error: "Destination not found." }, { status: 404 });

    const [trip] = await db
      .insert(trips)
      .values({
        userId: user.id,
        title: `${city.name} · ${new Date(startDate + "T00:00:00").toLocaleDateString("en-GB", { month: "short", year: "numeric" })}`,
        destinationCityId,
        originLabel,
        startDate,
        endDate,
        travelers,
        budgetUsd,
        travelStyle,
        interests,
        nationalityCode: nationalityCode ?? user.profile?.nationalityCode ?? null,
        status: "planned",
      })
      .returning();

    await generateItinerary(trip.id);
    await generateBudget(trip.id);
    await generateChecklist(trip.id);

    return Response.json({ ok: true, tripId: trip.id });
  } catch (e) {
    console.error("trip create failed", e);
    return Response.json({ error: "Could not create the trip. Please try again." }, { status: 500 });
  }
}
