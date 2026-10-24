import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { itineraryDays, itineraryItems, places, trips } from "@/db/schema";
import { getCurrentUser, unauthorized } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function assertOwnership(userId: number, tripId: number) {
  return db.query.trips.findFirst({ where: and(eq(trips.id, tripId), eq(trips.userId, userId)) });
}

async function assertDay(tripId: number, dayId: number) {
  return db.query.itineraryDays.findFirst({
    where: and(eq(itineraryDays.id, dayId), eq(itineraryDays.tripId, tripId)),
  });
}

/** POST — add an item to a day. Body: { dayId, placeId? , title?, startTime?, estCostUsd?, durationMin? } */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const tripId = Number(id);
  if (!(await assertOwnership(user.id, tripId))) return Response.json({ error: "Trip not found." }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const dayId = Number(body?.dayId);
  const day = await assertDay(tripId, dayId);
  if (!day) return Response.json({ error: "Day not found." }, { status: 404 });

  let title = String(body?.title ?? "").trim().slice(0, 200);
  let kind = "activity";
  let estCostUsd: number | null = body?.estCostUsd != null ? Math.max(0, Number(body.estCostUsd) || 0) : null;
  let durationMin: number | null = body?.durationMin != null ? Math.max(5, Number(body.durationMin) || 60) : 60;
  let placeId: number | null = null;

  if (body?.placeId) {
    const place = await db.query.places.findFirst({ where: eq(places.id, Number(body.placeId)) });
    if (place) {
      placeId = place.id;
      title = title || place.name;
      estCostUsd = estCostUsd ?? place.estCostUsd ?? 0;
      durationMin = place.durationMin ?? durationMin;
      kind = ["restaurant", "cafe", "street_food"].includes(place.type) ? "food" : place.type === "nightlife" ? "nightlife" : place.type === "hotel" || place.type === "hostel" ? "hotel" : "sight";
    }
  }
  if (!title) return Response.json({ error: "Please provide an activity title." }, { status: 400 });

  const existing = await db
    .select({ orderIndex: itineraryItems.orderIndex })
    .from(itineraryItems)
    .where(eq(itineraryItems.dayId, dayId))
    .orderBy(asc(itineraryItems.orderIndex));
  const nextIndex = existing.length ? existing[existing.length - 1].orderIndex + 1 : 0;

  const startTime = typeof body?.startTime === "string" && /^\d{2}:\d{2}$/.test(body.startTime) ? body.startTime : null;

  const [item] = await db
    .insert(itineraryItems)
    .values({ dayId, orderIndex: nextIndex, placeId, title, kind, startTime, durationMin, estCostUsd })
    .returning();
  return Response.json({ ok: true, item });
}

/** PATCH — reorder or update items. Body: { reorder: { dayId, itemIds: number[] } } | { itemId, startTime?, estCostUsd?, durationMin?, notes? } */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const tripId = Number(id);
  if (!(await assertOwnership(user.id, tripId))) return Response.json({ error: "Trip not found." }, { status: 404 });

  const body = await req.json().catch(() => ({}));

  if (body?.reorder) {
    const dayId = Number(body.reorder.dayId);
    const day = await assertDay(tripId, dayId);
    if (!day) return Response.json({ error: "Day not found." }, { status: 404 });
    const itemIds: number[] = Array.isArray(body.reorder.itemIds) ? body.reorder.itemIds.map(Number) : [];
    const valid = await db
      .select({ id: itineraryItems.id })
      .from(itineraryItems)
      .where(and(eq(itineraryItems.dayId, dayId), inArray(itineraryItems.id, itemIds.length ? itemIds : [-1])));
    const validSet = new Set(valid.map((v) => v.id));
    let idx = 0;
    for (const itemId of itemIds) {
      if (validSet.has(itemId)) {
        await db.update(itineraryItems).set({ orderIndex: idx++ }).where(eq(itineraryItems.id, itemId));
      }
    }
    return Response.json({ ok: true });
  }

  const itemId = Number(body?.itemId);
  if (!itemId) return Response.json({ error: "itemId required." }, { status: 400 });
  const item = await db
    .select({ item: itineraryItems, day: itineraryDays })
    .from(itineraryItems)
    .innerJoin(itineraryDays, eq(itineraryItems.dayId, itineraryDays.id))
    .where(and(eq(itineraryItems.id, itemId), eq(itineraryDays.tripId, tripId)))
    .limit(1);
  if (!item.length) return Response.json({ error: "Item not found." }, { status: 404 });

  const update: Partial<typeof itineraryItems.$inferInsert> = {};
  if (typeof body.startTime === "string" && /^\d{2}:\d{2}$/.test(body.startTime)) update.startTime = body.startTime;
  if (body.estCostUsd != null) update.estCostUsd = Math.max(0, Math.min(100000, Number(body.estCostUsd) || 0));
  if (body.durationMin != null) update.durationMin = Math.max(5, Math.min(1440, Number(body.durationMin) || 60));
  if (typeof body.notes === "string") update.notes = body.notes.slice(0, 500);
  if (typeof body.title === "string" && body.title.trim()) update.title = body.title.trim().slice(0, 200);
  if (Object.keys(update).length === 0) return Response.json({ error: "Nothing to update." }, { status: 400 });

  await db.update(itineraryItems).set(update).where(eq(itineraryItems.id, itemId));
  return Response.json({ ok: true });
}

/** DELETE — remove an item. Body: { itemId } */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const tripId = Number(id);
  if (!(await assertOwnership(user.id, tripId))) return Response.json({ error: "Trip not found." }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const itemId = Number(body?.itemId);
  const rows = await db
    .select({ id: itineraryItems.id })
    .from(itineraryItems)
    .innerJoin(itineraryDays, eq(itineraryItems.dayId, itineraryDays.id))
    .where(and(eq(itineraryItems.id, itemId), eq(itineraryDays.tripId, tripId)))
    .limit(1);
  if (!rows.length) return Response.json({ error: "Item not found." }, { status: 404 });
  await db.delete(itineraryItems).where(eq(itineraryItems.id, itemId));
  return Response.json({ ok: true });
}
