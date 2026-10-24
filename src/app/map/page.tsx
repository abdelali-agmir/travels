import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { cities, countries, places } from "@/db/schema";
import { MapView, type MapPlace } from "@/components/map-view";

export const metadata: Metadata = {
  title: "World map",
  description: "Explore every place in the Wanderly database on an interactive map — attractions, hotels, food, transport hubs and emergency services.",
};

export const dynamic = "force-dynamic";

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; focus?: string }>;
}) {
  const params = await searchParams;
  const [placeRows, cityRows] = await Promise.all([
    db
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
      .innerJoin(countries, eq(cities.countryId, countries.id)),
    db
      .select({ id: cities.id, name: cities.name, lat: cities.lat, lng: cities.lng, countryName: countries.name })
      .from(cities)
      .innerJoin(countries, eq(cities.countryId, countries.id)),
  ]);

  return (
    <MapView
      places={placeRows as MapPlace[]}
      cities={cityRows}
      initialCityId={params.city ? Number(params.city) : undefined}
      focusPlaceId={params.focus ? Number(params.focus) : undefined}
    />
  );
}
