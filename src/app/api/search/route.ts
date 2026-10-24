import { ilike, or, eq, and, inArray } from "drizzle-orm";
import { db } from "@/db";
import { cities, countries, places } from "@/db/schema";
import { PLACE_TYPE_LABELS } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SearchResult = {
  kind: string;
  label: string;
  sublabel: string;
  href: string;
  emoji: string;
};

const TYPE_EMOJI: Record<string, string> = {
  attraction: "🏛️",
  museum: "🖼️",
  hotel: "🏨",
  hostel: "🛏️",
  restaurant: "🍽️",
  cafe: "☕",
  street_food: "🥡",
  activity: "🎟️",
  beach: "🏖️",
  park: "🌳",
  market: "🧺",
  nightlife: "🌙",
  viewpoint: "🌄",
  neighborhood: "🏘️",
  airport: "✈️",
  train_station: "🚆",
  bus_station: "🚌",
  ferry_port: "⛴️",
  hospital: "🏥",
  police: "👮",
  embassy: "🏛️",
};

const TYPE_ALIASES: Record<string, string[]> = {
  hotel: ["hotel", "hotels", "stay", "accommodation"],
  hostel: ["hostel", "hostels"],
  restaurant: ["restaurant", "restaurants", "food", "eat", "eating"],
  cafe: ["cafe", "cafes", "coffee"],
  attraction: ["attraction", "attractions", "sightseeing", "things to do"],
  activity: ["activity", "activities", "experience", "experiences"],
  airport: ["airport", "airports", "flight", "flights"],
  train_station: ["train", "trains", "station", "stations", "rail"],
  bus_station: ["bus", "buses"],
  ferry_port: ["ferry", "ferries", "port", "ports"],
  beach: ["beach", "beaches"],
  museum: ["museum", "museums"],
  market: ["market", "markets"],
  nightlife: ["nightlife", "clubs", "bars"],
  hospital: ["hospital", "hospitals", "medical"],
  police: ["police"],
  embassy: ["embassy", "embassies", "consulate", "consulates"],
};

function detectPlaceType(query: string): string | null {
  const normalized = query.toLowerCase();

  for (const [type, aliases] of Object.entries(TYPE_ALIASES)) {
    if (aliases.some((alias) => normalized.includes(alias))) {
      return type;
    }
  }

  return null;
}

function removeTypeWords(query: string): string {
  let result = query.toLowerCase();

  for (const aliases of Object.values(TYPE_ALIASES)) {
    for (const alias of aliases) {
      result = result.replace(new RegExp(`\\b${escapeRegExp(alias)}\\b`, "gi"), " ");
    }
  }

  return result.replace(/\s+/g, " ").trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function uniqueResults(results: SearchResult[]): SearchResult[] {
  const seen = new Set<string>();

  return results.filter((result) => {
    const key = `${result.kind}:${result.href}`;

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const rawQuery = (searchParams.get("q") ?? "").trim().slice(0, 80);

  if (!rawQuery) {
    return Response.json({ results: [] });
  }

  const pattern = `%${rawQuery}%`;
  const placeType = detectPlaceType(rawQuery);
  const locationQuery = removeTypeWords(rawQuery);
  const locationPattern = `%${locationQuery || rawQuery}%`;

  try {
    const [countryRows, cityRows, placeRows] = await Promise.all([
      db
        .select()
        .from(countries)
        .where(
          or(
            ilike(countries.name, pattern),
            ilike(countries.capital, pattern),
            ilike(countries.code, pattern),
          ),
        )
        .limit(6),

      db
        .select({ city: cities, country: countries })
        .from(cities)
        .innerJoin(countries, eq(cities.countryId, countries.id))
        .where(
          or(
            ilike(cities.name, pattern),
            ilike(countries.name, pattern),
          ),
        )
        .limit(8),

      placeType
        ? db
            .select({ place: places, city: cities, country: countries })
            .from(places)
            .innerJoin(cities, eq(places.cityId, cities.id))
            .innerJoin(countries, eq(cities.countryId, countries.id))
            .where(
              and(
                eq(places.type, placeType as never),
                or(
                  ilike(places.name, locationPattern),
                  ilike(cities.name, locationPattern),
                  ilike(countries.name, locationPattern),
                ),
              ),
            )
            .limit(10)
        : db
            .select({ place: places, city: cities, country: countries })
            .from(places)
            .innerJoin(cities, eq(places.cityId, cities.id))
            .innerJoin(countries, eq(cities.countryId, countries.id))
            .where(
              or(
                ilike(places.name, pattern),
                ilike(cities.name, pattern),
                ilike(countries.name, pattern),
              ),
            )
            .limit(10),
    ]);

    const results: SearchResult[] = [
      ...countryRows.map((country) => ({
        kind: "Country",
        label: `${country.flagEmoji} ${country.name}`,
        sublabel: `${country.continent} · Capital: ${country.capital}`,
        href: `/travel/${country.slug}`,
        emoji: "🌍",
      })),

      ...cityRows.map(({ city, country }) => ({
        kind: city.kind === "island" ? "Island" : "City",
        label: `${city.name}, ${country.name}`,
        sublabel: city.summary?.slice(0, 90) ?? country.name,
        href: `/travel/${country.slug}/${city.slug}`,
        emoji: city.kind === "island" ? "🏝️" : "🌆",
      })),

      ...placeRows.map(({ place, city, country }) => ({
        kind: PLACE_TYPE_LABELS[place.type] ?? "Place",
        label: place.name,
        sublabel: `${city.name}, ${country.name}`,
        href: `/places/${place.slug}`,
        emoji: TYPE_EMOJI[place.type] ?? "📍",
      })),
    ];

    // Helpful contextual shortcuts when the query identifies a city.
    const contextualCity = cityRows[0];

    if (contextualCity) {
      const { city, country } = contextualCity;

      results.push(
        {
          kind: "Guide",
          label: `${city.name} Travel Guide`,
          sublabel: `${country.name} · Complete destination guide`,
          href: `/travel/${country.slug}/${city.slug}`,
          emoji: "🗺️",
        },
        {
          kind: "Hotels",
          label: `Hotels in ${city.name}`,
          sublabel: "Places to stay",
          href: `/travel/${country.slug}/${city.slug}#stay`,
          emoji: "🏨",
        },
        {
          kind: "Food",
          label: `Restaurants in ${city.name}`,
          sublabel: "Where to eat",
          href: `/travel/${country.slug}/${city.slug}#food`,
          emoji: "🍽️",
        },
        {
          kind: "Things to do",
          label: `Things to do in ${city.name}`,
          sublabel: "Attractions & activities",
          href: `/travel/${country.slug}/${city.slug}#do`,
          emoji: "🎟️",
        },
      );
    }

    // If the query is a country, offer its country guide.
    const contextualCountry = countryRows[0];

    if (contextualCountry) {
      results.push({
        kind: "Guide",
        label: `${contextualCountry.name} Travel Guide`,
        sublabel: `${contextualCountry.continent} · Country guide`,
        href: `/travel/${contextualCountry.slug}`,
        emoji: "📖",
      });
    }

    return Response.json({
      results: uniqueResults(results).slice(0, 18),
      meta: {
        query: rawQuery,
        detectedType: placeType,
      },
    });
  } catch (error) {
    console.error("Global search failed:", error);

    return Response.json(
      {
        results: [],
        error: "Search temporarily unavailable",
      },
      { status: 500 },
    );
  }
}