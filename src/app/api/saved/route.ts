import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { cities, countries, places, savedPlaces } from "@/db/schema";
import { getCurrentUser, unauthorized } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const rows = await db
    .select({ saved: savedPlaces, place: places, city: cities, country: countries })
    .from(savedPlaces)
    .leftJoin(places, eq(savedPlaces.placeId, places.id))
    .leftJoin(cities, eq(savedPlaces.cityId, cities.id))
    .leftJoin(countries, eq(cities.countryId, countries.id))
    .where(eq(savedPlaces.userId, user.id))
    .orderBy(desc(savedPlaces.createdAt));
  return Response.json({ saved: rows });
}

/** POST { placeId } or { cityId } — toggles save state. */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const body = await req.json().catch(() => ({}));
  const placeId = body?.placeId ? Number(body.placeId) : null;
  const cityId = body?.cityId ? Number(body.cityId) : null;
  if (!placeId && !cityId) return Response.json({ error: "placeId or cityId required." }, { status: 400 });

  const where = placeId
    ? and(eq(savedPlaces.userId, user.id), eq(savedPlaces.placeId, placeId))
    : and(eq(savedPlaces.userId, user.id), eq(savedPlaces.cityId, cityId!), isNull(savedPlaces.placeId));

  const existing = await db.select({ id: savedPlaces.id }).from(savedPlaces).where(where).limit(1);
  if (existing.length) {
    await db.delete(savedPlaces).where(eq(savedPlaces.id, existing[0].id));
    return Response.json({ ok: true, saved: false });
  }
  await db.insert(savedPlaces).values({ userId: user.id, placeId, cityId });
  return Response.json({ ok: true, saved: true });
}
