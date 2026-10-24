import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { checklistItems, trips } from "@/db/schema";
import { getCurrentUser, unauthorized } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function assertOwnership(userId: number, tripId: number) {
  return db.query.trips.findFirst({ where: and(eq(trips.id, tripId), eq(trips.userId, userId)) });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const tripId = Number(id);
  if (!(await assertOwnership(user.id, tripId))) return Response.json({ error: "Trip not found." }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const label = String(body?.label ?? "").trim().slice(0, 200);
  const category = String(body?.category ?? "Other").trim().slice(0, 60) || "Other";
  if (!label) return Response.json({ error: "Please enter an item." }, { status: 400 });
  const [item] = await db.insert(checklistItems).values({ tripId, label, category }).returning();
  return Response.json({ ok: true, item });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const tripId = Number(id);
  if (!(await assertOwnership(user.id, tripId))) return Response.json({ error: "Trip not found." }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const itemId = Number(body?.itemId);
  const done = Boolean(body?.done);
  const rows = await db
    .select({ id: checklistItems.id })
    .from(checklistItems)
    .where(and(eq(checklistItems.id, itemId), eq(checklistItems.tripId, tripId)))
    .limit(1);
  if (!rows.length) return Response.json({ error: "Item not found." }, { status: 404 });
  await db.update(checklistItems).set({ done }).where(eq(checklistItems.id, itemId));
  return Response.json({ ok: true });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const tripId = Number(id);
  if (!(await assertOwnership(user.id, tripId))) return Response.json({ error: "Trip not found." }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  await db
    .delete(checklistItems)
    .where(and(eq(checklistItems.id, Number(body?.itemId)), eq(checklistItems.tripId, tripId)));
  return Response.json({ ok: true });
}
