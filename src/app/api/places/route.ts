import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { cities, countries, places } from "@/db/schema";

export const dynamic = "force-dynamic";

const VALID_TYPES = [
  "attraction", "museum", "hotel", "hostel", "restaurant", "cafe", "street_food",
  "activity", "beach", "park", "market", "nightlife", "viewpoint", "neighborhood",
  "airport", "train_station", "bus_station", "ferry_port", "hospital", "police", "embassy",
] as const;

/** Map + listing data source. Query: ?cityId=&types=a,b,c */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cityId = searchParams.get("cityId") ? Number(searchParams.get("cityId")) : null;
  const typesParam = searchParams.get("types");
  const types = typesParam
    ? (typesParam.split(",").filter((t) => (VALID_TYPES as readonly string[]).includes(t)) as (typeof VALID_TYPES)[number][])
    : null;

  const conditions = [];
  if (cityId && Number.isInteger(cityId)) conditions.push(eq(places.cityId, cityId));
  if (types && types.length) conditions.push(inArray(places.type, types));

  const rows = await db
    .select({
      id: places.id,
      slug: places.slug,
      name: places.name,
      type: places.type,
      lat: places.lat,
      lng: places.lng,
      rating: places.rating,
      estCostUsd: places.estCostUsd,
      area: places.area,
      image: places.image,
      description: places.description,
      openingHours: places.openingHours,
      cityName: cities.name,
      citySlug: cities.slug,
      countrySlug: countries.slug,
      countryName: countries.name,
    })
    .from(places)
    .innerJoin(cities, eq(places.cityId, cities.id))
    .innerJoin(countries, eq(cities.countryId, countries.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .limit(500);

  return Response.json({ places: rows });
}
