import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { trips } from "@/db/schema";
import { getCurrentUser, unauthorized } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function ownTrip(userId: number, tripId: number) {
  return db.query.trips.findFirst({ where: and(eq(trips.id, tripId), eq(trips.userId, userId)) });
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const trip = await db.query.trips.findFirst({
    where: and(eq(trips.id, Number(id)), eq(trips.userId, user.id)),
    with: {
      destination: { with: { country: true } },
      days: { with: { items: { with: { place: true } } } },
      budgetItems: true,
      checklistItems: true,
    },
  });
  if (!trip) return Response.json({ error: "Trip not found." }, { status: 404 });
  return Response.json({ trip });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const trip = await ownTrip(user.id, Number(id));
  if (!trip) return Response.json({ error: "Trip not found." }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const update: Partial<typeof trips.$inferInsert> = {};
  if (typeof body.title === "string" && body.title.trim()) update.title = body.title.trim().slice(0, 180);
  if (typeof body.status === "string" && ["draft", "planned", "active", "completed"].includes(body.status)) {
    update.status = body.status;
  }
  if (body.budgetUsd != null) update.budgetUsd = Math.max(0, Math.min(1000000, Number(body.budgetUsd) || 0));
  if (Object.keys(update).length === 0) return Response.json({ error: "Nothing to update." }, { status: 400 });

  await db.update(trips).set(update).where(eq(trips.id, trip.id));
  return Response.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const trip = await ownTrip(user.id, Number(id));
  if (!trip) return Response.json({ error: "Trip not found." }, { status: 404 });
  await db.delete(trips).where(eq(trips.id, trip.id));
  return Response.json({ ok: true });
}
