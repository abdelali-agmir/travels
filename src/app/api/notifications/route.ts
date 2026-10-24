import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { getCurrentUser, unauthorized } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(20);
  return Response.json({ notifications: rows });
}

export async function PATCH() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  await db.update(notifications).set({ read: true }).where(eq(notifications.userId, user.id));
  return Response.json({ ok: true });
}
