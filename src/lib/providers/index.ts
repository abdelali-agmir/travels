import "server-only";

/**
 * Wanderly provider adapter layer.
 *
 * Every external data domain (flights, hotels, weather, currency, maps/places,
 * visa) is accessed through an adapter interface. Adapters can be swapped by
 * changing environment configuration — application code never talks to a
 * vendor API directly.
 *
 * Connected today (no API key required):
 *   - WeatherProvider  → Open-Meteo (live)
 *   - CurrencyProvider → Frankfurter / ECB reference rates (live)
 *
 * Prepared, waiting for credentials (.env):
 *   - FlightProvider   → FLIGHTS_API_KEY   (e.g. Amadeus, Duffel, Kiwi)
 *   - HotelProvider    → HOTELS_API_KEY    (e.g. Booking, Amadeus, Expedia)
 *   - PlacesProvider   → PLACES_API_KEY    (e.g. Google Places, Foursquare)
 *   - VisaProvider     → VISA_API_KEY      (e.g. Sherpa, Travelperk)
 */

export type ProviderStatus =
  | { connected: true; provider: string }
  | { connected: false; provider: string; reason: string };

/* ───────────── Weather (Open-Meteo, live, keyless) ───────────── */

export type WeatherNow = {
  temperatureC: number;
  apparentC: number;
  humidity: number;
  windKmh: number;
  precipitationMm: number;
  weatherCode: number;
  isDay: boolean;
};

export type WeatherDay = {
  date: string;
  minC: number;
  maxC: number;
  precipitationMm: number;
  weatherCode: number;
  sunrise: string;
  sunset: string;
};

export type WeatherResult = {
  live: boolean;
  source: { name: string; url: string };
  fetchedAt: string;
  current: WeatherNow | null;
  daily: WeatherDay[];
};

export const WEATHER_CODE_LABELS: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Rime fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  80: "Rain showers",
  81: "Rain showers",
  82: "Violent showers",
  95: "Thunderstorm",
  96: "Thunderstorm w/ hail",
  99: "Thunderstorm w/ hail",
};

export function weatherLabel(code: number): string {
  return WEATHER_CODE_LABELS[code] ?? "—";
}

export async function getWeather(lat: number, lng: number): Promise<WeatherResult> {
  const source = { name: "Open-Meteo", url: "https://open-meteo.com" };
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,precipitation,weather_code,is_day` +
      `&daily=temperature_2m_min,temperature_2m_max,precipitation_sum,weather_code,sunrise,sunset&timezone=auto&forecast_days=7`;
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) throw new Error(`open-meteo ${res.status}`);
    const data = await res.json();
    const current: WeatherNow | null = data.current
      ? {
          temperatureC: data.current.temperature_2m,
          apparentC: data.current.apparent_temperature,
          humidity: data.current.relative_humidity_2m,
          windKmh: data.current.wind_speed_10m,
          precipitationMm: data.current.precipitation,
          weatherCode: data.current.weather_code,
          isDay: data.current.is_day === 1,
        }
      : null;
    const daily: WeatherDay[] = (data.daily?.time ?? []).map(
      (date: string, i: number) => ({
        date,
        minC: data.daily.temperature_2m_min[i],
        maxC: data.daily.temperature_2m_max[i],
        precipitationMm: data.daily.precipitation_sum[i],
        weatherCode: data.daily.weather_code[i],
        sunrise: data.daily.sunrise[i],
        sunset: data.daily.sunset[i],
      }),
    );
    return { live: true, source, fetchedAt: new Date().toISOString(), current, daily };
  } catch {
    return { live: false, source, fetchedAt: new Date().toISOString(), current: null, daily: [] };
  }
}

/* ───────────── Currency (Frankfurter / ECB, live, keyless) ───────────── */

export type RateResult = {
  base: string;
  quote: string;
  rate: number;
  live: boolean;
  source: { name: string; url: string };
  updatedAt: string;
};

export async function getExchangeRate(base: string, quote: string): Promise<RateResult | null> {
  const source = { name: "Frankfurter (ECB reference rates)", url: "https://frankfurter.dev" };
  if (base === quote) {
    return { base, quote, rate: 1, live: true, source, updatedAt: new Date().toISOString() };
  }
  try {
    const res = await fetch(
      `https://api.frankfurter.dev/v1/latest?base=${encodeURIComponent(base)}&symbols=${encodeURIComponent(quote)}`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) throw new Error(`frankfurter ${res.status}`);
    const data = await res.json();
    const rate = data?.rates?.[quote];
    if (typeof rate !== "number") throw new Error("pair unavailable");
    return { base, quote, rate, live: true, source, updatedAt: data.date ?? new Date().toISOString() };
  } catch {
    // Fall back to DB reference table (seeded, clearly non-live).
    try {
      const { db } = await import("@/db");
      const { exchangeRates } = await import("@/db/schema");
      const { and, eq } = await import("drizzle-orm");
      const rows = await db
        .select()
        .from(exchangeRates)
        .where(and(eq(exchangeRates.base, base), eq(exchangeRates.quote, quote)))
        .limit(1);
      if (rows[0]) {
        return {
          base,
          quote,
          rate: rows[0].rate,
          live: false,
          source: { name: `${rows[0].sourceName} (cached reference)`, url: "" },
          updatedAt: rows[0].updatedAt.toISOString(),
        };
      }
    } catch {
      /* ignore */
    }
    return null;
  }
}

/* ───────────── Flights / Hotels / Places / Visa (key-gated) ───────────── */

export function flightProviderStatus(): ProviderStatus {
  if (process.env.FLIGHTS_API_KEY) {
    return { connected: true, provider: process.env.FLIGHTS_PROVIDER ?? "Custom flight provider" };
  }
  return {
    connected: false,
    provider: "Flight provider",
    reason: "Set FLIGHTS_API_KEY in .env to enable live fares (Amadeus, Duffel, Kiwi…).",
  };
}

export function hotelProviderStatus(): ProviderStatus {
  if (process.env.HOTELS_API_KEY) {
    return { connected: true, provider: process.env.HOTELS_PROVIDER ?? "Custom hotel provider" };
  }
  return {
    connected: false,
    provider: "Accommodation provider",
    reason: "Set HOTELS_API_KEY in .env to enable live availability and pricing.",
  };
}

export function placesProviderStatus(): ProviderStatus {
  if (process.env.PLACES_API_KEY) {
    return { connected: true, provider: process.env.PLACES_PROVIDER ?? "Custom places provider" };
  }
  return {
    connected: false,
    provider: "Places provider",
    reason: "Set PLACES_API_KEY in .env to sync global POI data (Google Places, Foursquare…).",
  };
}

export function visaProviderStatus(): ProviderStatus {
  if (process.env.VISA_API_KEY) {
    return { connected: true, provider: process.env.VISA_PROVIDER ?? "Custom visa provider" };
  }
  return {
    connected: false,
    provider: "Visa data provider",
    reason: "Set VISA_API_KEY in .env to enable automated visa-rule sync (e.g. Sherpa°).",
  };
}

export function aiProviderStatus(): ProviderStatus {
  if (process.env.OPENAI_API_KEY) {
    return { connected: true, provider: "OpenAI" };
  }
  return {
    connected: false,
    provider: "LLM provider",
    reason:
      "Set OPENAI_API_KEY in .env to enable free-form reasoning. The assistant currently answers only from Wanderly's verified database.",
  };
}
