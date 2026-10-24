import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ user: null });
  return Response.json({ user });
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Not authenticated" }, { status: 401 });
  const body = await req.json().catch(() => ({}));

  const update: Partial<typeof profiles.$inferInsert> = {};
  if (typeof body.homeCountryCode === "string") update.homeCountryCode = body.homeCountryCode.toUpperCase().slice(0, 2) || null;
  if (typeof body.nationalityCode === "string") update.nationalityCode = body.nationalityCode.toUpperCase().slice(0, 2) || null;
  if (typeof body.travelStyle === "string") update.travelStyle = body.travelStyle.slice(0, 40);
  if (typeof body.budgetPreference === "string") update.budgetPreference = body.budgetPreference.slice(0, 40);
  if (typeof body.bio === "string") update.bio = body.bio.slice(0, 500);
  if (Array.isArray(body.interests)) update.interests = body.interests.slice(0, 12).map(String);
  if (body.socials && typeof body.socials === "object") {
    update.socials = {
      youtube: body.socials.youtube ? String(body.socials.youtube).slice(0, 200) : undefined,
      tiktok: body.socials.tiktok ? String(body.socials.tiktok).slice(0, 200) : undefined,
      instagram: body.socials.instagram ? String(body.socials.instagram).slice(0, 200) : undefined,
      website: body.socials.website ? String(body.socials.website).slice(0, 200) : undefined,
    };
    update.isCreator = Object.values(update.socials).some(Boolean);
  }

  if (Object.keys(update).length === 0) {
    return Response.json({ error: "Nothing to update." }, { status: 400 });
  }

  const existing = await db.select().from(profiles).where(eq(profiles.userId, user.id)).limit(1);
  if (existing.length) {
    await db.update(profiles).set(update).where(eq(profiles.userId, user.id));
  } else {
    await db.insert(profiles).values({ userId: user.id, ...update });
  }
  return Response.json({ ok: true });
}
