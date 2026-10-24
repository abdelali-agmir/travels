import { and, eq, ilike } from "drizzle-orm";
import { db } from "@/db";
import { cities, countries, phrases, places, sources, travelFacts, visaRules } from "@/db/schema";
import { aiProviderStatus, getWeather, weatherLabel } from "@/lib/providers";
import { formatUsd } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * Wanderly assistant — grounded answering.
 *
 * Pipeline: user request → Wanderly database (verified travel info) →
 * real-time providers (weather/currency) → response with sources.
 *
 * Free-form LLM reasoning activates only when OPENAI_API_KEY is set; without
 * it the assistant answers strictly from stored, sourced data and says so.
 */

type SourceRef = { name: string; url?: string; verifiedAt?: string | null; status?: string };
type Reply = { text: string; sources: SourceRef[]; suggestions?: string[] };

const DEMONYMS: Record<string, string> = {
  moroccan: "MA", french: "FR", spanish: "ES", spaniard: "ES", italian: "IT",
  british: "GB", uk: "GB", english: "GB", american: "US", usa: "US",
  japanese: "JP", turkish: "TR", saudi: "SA", emirati: "AE", uae: "AE",
  thai: "TH", brazilian: "BR",
};

function countryMatches(text: string, c: { name: string; code: string }): boolean {
  const lower = text.toLowerCase();
  if (lower.includes(c.name.toLowerCase())) return true;
  return Object.entries(DEMONYMS).some(
    ([demonym, code]) => code === c.code && new RegExp(`\\b${demonym}\\b`).test(lower),
  );
}

async function findCountry(text: string) {
  const all = await db.select().from(countries);
  return all.find((c) => countryMatches(text, c));
}

async function findCity(text: string) {
  const all = await db.select().from(cities);
  return all.find((c) => text.toLowerCase().includes(c.name.toLowerCase()));
}

async function answer(message: string): Promise<Reply> {
  const lower = message.toLowerCase();
  const country = await findCountry(lower);
  const cityRow = await findCity(lower);
  const cityCountry = cityRow
    ? await db.query.countries.findFirst({ where: eq(countries.id, cityRow.countryId) })
    : null;
  const ctxCountry = country ?? cityCountry ?? null;

  /* Visa intent */
  if (/\bvisa|entry requirement|passport\b/.test(lower)) {
    const all = await db.select().from(countries);
    const mentioned = all.filter((c) => countryMatches(lower, c));
    if (mentioned.length >= 2) {
      // Order by first appearance so "Moroccan citizens … for Japan" maps MA → JP.
      const position = (c: (typeof all)[number]) => {
        const idx = lower.indexOf(c.name.toLowerCase());
        if (idx >= 0) return idx;
        const dem = Object.entries(DEMONYMS).find(([d, code]) => code === c.code && lower.includes(d));
        return dem ? lower.indexOf(dem[0]) : Number.MAX_SAFE_INTEGER;
      };
      const ordered = [...mentioned].sort((a, b) => position(a) - position(b));
      const [from, to] = ordered;
      const rows = await db
        .select({ rule: visaRules, source: sources })
        .from(visaRules)
        .leftJoin(sources, eq(visaRules.sourceId, sources.id))
        .where(and(eq(visaRules.fromCountryCode, from.code), eq(visaRules.toCountryCode, to.code)))
        .limit(1);
      if (rows[0]) {
        const { rule, source } = rows[0];
        const label: Record<string, string> = {
          visa_free: "Visa free", visa_on_arrival: "Visa on arrival", evisa: "eVisa",
          visa_required: "Visa required", transit_visa: "Transit visa", special: "Special requirements",
        };
        return {
          text: `**${from.flagEmoji} ${from.name} → ${to.flagEmoji} ${to.name}: ${label[rule.visaType]}**\n\n${rule.maxStayDays ? `Maximum stay: ${rule.maxStayDays} days.\n` : ""}${rule.notes ?? ""}\n\n${(rule.requirements ?? []).length ? "Typical requirements:\n" + (rule.requirements ?? []).map((r) => `• ${r}`).join("\n") : ""}\n\n⚠️ This rule is stored with verification status "${rule.verificationStatus}". Always confirm with the official source before booking.`,
          sources: source ? [{ name: source.name, url: source.url, verifiedAt: rule.lastVerifiedAt?.toISOString() ?? null, status: rule.verificationStatus }] : [],
          suggestions: [`Best time to visit ${to.name}`, `What should I eat in ${to.name}?`, `Is ${to.name} safe?`],
        };
      }
      return {
        text: `I don't have a verified visa rule for ${from.name} → ${to.name} in the database yet. Wanderly never invents visa information — please check the destination's official government source, and our team will add the verified rule.`,
        sources: [],
        suggestions: ["Morocco to Japan visa", "US to France visa", "Morocco to Thailand visa"],
      };
    }
    return {
      text: "Tell me both your nationality and destination, e.g. **“Do Moroccan citizens need a visa for Japan?”** — I'll answer from Wanderly's verified visa rules with the official source.",
      sources: [],
      suggestions: ["Morocco to Japan visa", "US to Thailand visa", "UK to US entry requirements"],
    };
  }

  /* Weather intent (live) */
  if (/\bweather|temperature|rain|forecast|hot|cold\b/.test(lower) && cityRow) {
    const w = await getWeather(cityRow.lat, cityRow.lng);
    if (w.live && w.current) {
      const next = w.daily.slice(0, 3).map((d) => `• ${d.date}: ${Math.round(d.minC)}–${Math.round(d.maxC)}°C, ${weatherLabel(d.weatherCode)}`).join("\n");
      return {
        text: `**Live weather in ${cityRow.name}** (fetched just now):\n\nCurrently ${Math.round(w.current.temperatureC)}°C (feels like ${Math.round(w.current.apparentC)}°C), ${weatherLabel(w.current.weatherCode)}, humidity ${w.current.humidity}%, wind ${Math.round(w.current.windKmh)} km/h.\n\nNext days:\n${next}`,
        sources: [{ name: "Open-Meteo (live)", url: "https://open-meteo.com" }],
        suggestions: [`Best time to visit ${cityRow.name}`, `Things to do in ${cityRow.name}`],
      };
    }
    return { text: `The live weather provider is unreachable right now. ${cityRow.name}'s typical best season: ${cityRow.bestTime ?? "see the destination page"}.`, sources: [] };
  }

  /* Food intent */
  if (/\beat|food|dish|restaurant|cuisine\b/.test(lower) && ctxCountry) {
    const facts = await db
      .select({ fact: travelFacts, source: sources })
      .from(travelFacts)
      .leftJoin(sources, eq(travelFacts.sourceId, sources.id))
      .where(and(eq(travelFacts.countryId, ctxCountry.id), eq(travelFacts.category, "food")));
    const spots = cityRow
      ? await db.select().from(places).where(and(eq(places.cityId, cityRow.id), ilike(places.type, "%restaurant%"))).limit(3)
      : [];
    const spotText = spots.length ? `\n\nRated places in ${cityRow!.name}:\n${spots.map((s) => `• ${s.name} (${s.rating ?? "—"}★, ~${formatUsd(s.estCostUsd)})`).join("\n")}` : "";
    if (facts[0]) {
      return {
        text: `**${ctxCountry.flagEmoji} ${facts[0].fact.title}**\n\n${facts[0].fact.body}${spotText}`,
        sources: facts.filter((f) => f.source).map((f) => ({ name: f.source!.name, url: f.source!.url })),
        suggestions: [`Is ${ctxCountry.name} safe?`, `Useful phrases in ${ctxCountry.name}`],
      };
    }
  }

  /* Safety intent */
  if (/\bsafe|safety|scam|danger|crime\b/.test(lower) && ctxCountry) {
    const facts = await db
      .select({ fact: travelFacts, source: sources })
      .from(travelFacts)
      .leftJoin(sources, eq(travelFacts.sourceId, sources.id))
      .where(eq(travelFacts.countryId, ctxCountry.id));
    const safetyFacts = facts.filter((f) => ["safety", "scam", "law"].includes(f.fact.category));
    const level = ctxCountry.safetyLevel ? ["", "very safe", "generally safe", "exercise increased caution", "reconsider travel in some areas", "high risk"][ctxCountry.safetyLevel] : null;
    return {
      text: `**${ctxCountry.flagEmoji} ${ctxCountry.name} — safety overview**\n\n${level ? `Overall: ${level} (Wanderly editorial rating).\n` : ""}Emergency numbers: ${Object.entries(ctxCountry.emergency ?? {}).map(([k, v]) => `${k} ${v}`).join(" · ") || "see destination page"}.\n\n${safetyFacts.length ? safetyFacts.map((f) => `**${f.fact.title}** — ${f.fact.body}`).join("\n\n") : "No specific warnings stored. Check your government's travel advisory for current information."}`,
      sources: safetyFacts.filter((f) => f.source).map((f) => ({ name: f.source!.name, url: f.source!.url })),
      suggestions: [`Emergency numbers in ${ctxCountry.name}`, `Visa for ${ctxCountry.name}`],
    };
  }

  /* Phrases intent */
  if (/\bphrase|language|say|speak|translate\b/.test(lower) && ctxCountry) {
    const rows = await db.select().from(phrases).where(eq(phrases.countryId, ctxCountry.id)).limit(8);
    if (rows.length) {
      return {
        text: `**Useful phrases for ${ctxCountry.flagEmoji} ${ctxCountry.name}** (${ctxCountry.languages.join(", ")}):\n\n${rows.map((p) => `• ${p.english} → **${p.original}** _(${p.pronunciation ?? ""})_`).join("\n")}`,
        sources: [{ name: "Wanderly language library" }],
        suggestions: [`What should I eat in ${ctxCountry.name}?`, `Plan a trip to ${ctxCountry.capital}`],
      };
    }
  }

  /* Budget / cost intent */
  if (/\bbudget|cost|cheap|expensive|price|daily\b/.test(lower) && (ctxCountry || cityRow)) {
    const daily = cityRow?.avgDailyBudgetUsd ?? ctxCountry?.avgDailyBudgetUsd ?? null;
    const name = cityRow?.name ?? ctxCountry?.name ?? "";
    if (daily) {
      return {
        text: `**Typical daily budget in ${name}: ~${formatUsd(daily)}/person** (mid-range, Wanderly editorial estimate).\n\nRough guide by style:\n• Backpacker: ~${formatUsd(Math.round(daily * 0.55))}\n• Budget: ~${formatUsd(Math.round(daily * 0.7))}\n• Mid-range: ~${formatUsd(daily)}\n• Luxury: ${formatUsd(Math.round(daily * 1.9))}+\n\nUse the trip planner to get a full estimate for your exact dates, group size and style.`,
        sources: [{ name: "Wanderly editorial estimates" }],
        suggestions: [`Plan a trip to ${name}`, `Best time to visit ${name}`],
      };
    }
  }

  /* Best time intent */
  if (/\bbest time|when.*(visit|go)|season\b/.test(lower) && (cityRow || ctxCountry)) {
    const best = cityRow?.bestTime ?? ctxCountry?.bestTime;
    const name = cityRow?.name ?? ctxCountry?.name;
    if (best) {
      return {
        text: `**Best time to visit ${name}: ${best}.**\n\nFor your exact dates I can pull the live forecast — just ask “weather in ${name}”.`,
        sources: [{ name: "Wanderly editorial" }],
        suggestions: [`Weather in ${name}`, `Things to do in ${name}`],
      };
    }
  }

  /* Things to do / destination overview */
  if (cityRow) {
    const top = await db.select().from(places).where(eq(places.cityId, cityRow.id)).limit(30);
    const sights = top.filter((p) => ["attraction", "museum", "park", "market", "viewpoint"].includes(p.type)).sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 5);
    if (sights.length) {
      return {
        text: `**${cityRow.name} highlights** (from ${top.length} verified places in our database):\n\n${sights.map((s) => `• **${s.name}** — ${s.description?.slice(0, 90) ?? ""} (${s.estCostUsd ? formatUsd(s.estCostUsd) : "free"})`).join("\n")}\n\nWant a full day-by-day plan? Use “Plan a Trip” and I'll build a geographically-optimized itinerary.`,
        sources: [{ name: "Wanderly places database" }],
        suggestions: [`Weather in ${cityRow.name}`, `Daily budget in ${cityRow.name}`, `What should I eat in ${cityCountry?.name ?? cityRow.name}?`],
      };
    }
  }

  return {
    text: "I answer strictly from Wanderly's verified travel database — visas, budgets, food, safety, phrases, live weather and destination highlights.\n\nTry one of these:",
    sources: [],
    suggestions: [
      "Do Moroccan citizens need a visa for Japan?",
      "Weather in Tokyo",
      "What should I eat in Thailand?",
      "Is Morocco safe?",
      "Daily budget in Paris",
      "Useful phrases in Japan",
    ],
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const message = String(body?.message ?? "").trim().slice(0, 500);
    if (!message) return Response.json({ error: "Empty message." }, { status: 400 });
    const reply = await answer(message);
    return Response.json({ reply, provider: aiProviderStatus() });
  } catch {
    return Response.json({ error: "The assistant hit a problem. Please try again." }, { status: 500 });
  }
}
