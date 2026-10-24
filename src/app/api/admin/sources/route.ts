import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sources } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return Response.json({ error: "Admin access required." }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const id = Number(body?.id);
  const status = String(body?.verificationStatus ?? "");
  if (!id || !["verified", "needs_review", "expired", "disputed"].includes(status)) {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  await db
    .update(sources)
    .set({
      verificationStatus: status as "verified" | "needs_review" | "expired" | "disputed",
      lastCheckedAt: new Date(),
    })
    .where(eq(sources.id, id));
  return Response.json({ ok: true });
}
