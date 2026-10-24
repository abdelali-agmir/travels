import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { itineraryDays, trips } from "@/db/schema";
import { getCurrentUser, unauthorized } from "@/lib/auth";
import {
  generateItinerary,
  optimizeDayRoute,
  reduceTripCost,
} from "@/lib/services/itinerary";

export const dynamic = "force-dynamic";

/**
 * POST actions:
 *  { action: "regenerate" }                       — rebuild the whole itinerary
 *  { action: "regenerate", emphasize, pace }      — rebuild with emphasis (food/nightlife/nature/experiences) or slow pace
 *  { action: "optimize", dayId }                  — geographic re-ordering of one day
 *  { action: "optimize-all" }                     — optimize every day
 *  { action: "reduce-cost" }                      — scale down estimated costs
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const tripId = Number(id);
  const trip = await db.query.trips.findFirst({ where: and(eq(trips.id, tripId), eq(trips.userId, user.id)) });
  if (!trip) return Response.json({ error: "Trip not found." }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const action = String(body?.action ?? "");

  try {
    if (action === "regenerate") {
      const emphasize = ["food", "nightlife", "nature", "experiences"].includes(body?.emphasize)
        ? body.emphasize
        : undefined;
      const pace = body?.pace === "slow" ? "slow" : "normal";
      await generateItinerary(tripId, { emphasize, pace });
      return Response.json({ ok: true });
    }
    if (action === "optimize") {
      const dayId = Number(body?.dayId);
      const day = await db.query.itineraryDays.findFirst({
        where: and(eq(itineraryDays.id, dayId), eq(itineraryDays.tripId, tripId)),
      });
      if (!day) return Response.json({ error: "Day not found." }, { status: 404 });
      await optimizeDayRoute(dayId);
      return Response.json({ ok: true });
    }
    if (action === "optimize-all") {
      const days = await db.select().from(itineraryDays).where(eq(itineraryDays.tripId, tripId));
      for (const d of days) await optimizeDayRoute(d.id);
      return Response.json({ ok: true });
    }
    if (action === "reduce-cost") {
      await reduceTripCost(tripId);
      return Response.json({ ok: true });
    }
    return Response.json({ error: "Unknown action." }, { status: 400 });
  } catch (e) {
    console.error("itinerary action failed", e);
    return Response.json({ error: "Action failed. Please try again." }, { status: 500 });
  }
}
