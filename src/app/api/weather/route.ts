import { eq } from "drizzle-orm";
import { db } from "@/db";
import { cities } from "@/db/schema";
import { getWeather } from "@/lib/providers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cityId = Number(searchParams.get("cityId"));
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));

  let coords: { lat: number; lng: number } | null = null;
  if (Number.isInteger(cityId)) {
    const city = await db.query.cities.findFirst({ where: eq(cities.id, cityId) });
    if (city) coords = { lat: city.lat, lng: city.lng };
  } else if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
    coords = { lat, lng };
  }
  if (!coords) return Response.json({ error: "Provide cityId or lat/lng." }, { status: 400 });

  const weather = await getWeather(coords.lat, coords.lng);
  return Response.json(weather);
}
