import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { budgetItems, trips } from "@/db/schema";
import { getCurrentUser, unauthorized } from "@/lib/auth";

export const dynamic = "force-dynamic";

const CATEGORIES = ["flights", "accommodation", "food", "transport", "activities", "visa", "insurance", "sim", "shopping", "emergency", "other"];

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
  const category = CATEGORIES.includes(body?.category) ? body.category : "other";
  const label = String(body?.label ?? "").trim().slice(0, 160);
  const amountUsd = Number(body?.amountUsd);
  if (!label || !Number.isFinite(amountUsd) || amountUsd < 0) {
    return Response.json({ error: "Please provide a label and a valid amount." }, { status: 400 });
  }
  const [item] = await db
    .insert(budgetItems)
    .values({ tripId, category, label, amountUsd: Math.min(1000000, amountUsd), isEstimate: false })
    .returning();
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
  const amountUsd = Number(body?.amountUsd);
  if (!itemId || !Number.isFinite(amountUsd) || amountUsd < 0) {
    return Response.json({ error: "Invalid update." }, { status: 400 });
  }
  const rows = await db
    .select({ id: budgetItems.id })
    .from(budgetItems)
    .where(and(eq(budgetItems.id, itemId), eq(budgetItems.tripId, tripId)))
    .limit(1);
  if (!rows.length) return Response.json({ error: "Item not found." }, { status: 404 });
  await db
    .update(budgetItems)
    .set({ amountUsd: Math.min(1000000, amountUsd), isEstimate: false })
    .where(eq(budgetItems.id, itemId));
  return Response.json({ ok: true });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const tripId = Number(id);
  if (!(await assertOwnership(user.id, tripId))) return Response.json({ error: "Trip not found." }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const itemId = Number(body?.itemId);
  await db.delete(budgetItems).where(and(eq(budgetItems.id, itemId), eq(budgetItems.tripId, tripId)));
  return Response.json({ ok: true });
}
