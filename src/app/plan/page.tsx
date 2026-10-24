import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { cities, countries } from "@/db/schema";
import { TripPlannerForm } from "@/components/trip-planner-form";

export const metadata: Metadata = {
  title: "Plan a trip",
  description: "Build a complete day-by-day trip plan: itinerary, budget, checklist and route-optimized activities.",
};

export const revalidate = 300;

export default async function PlanPage() {
  const [cityRows, countryRows] = await Promise.all([
    db
      .select({ id: cities.id, name: cities.name, countryName: countries.name, countryCode: countries.code, flagEmoji: countries.flagEmoji })
      .from(cities)
      .innerJoin(countries, eq(cities.countryId, countries.id)),
    db.select({ code: countries.code, name: countries.name, flagEmoji: countries.flagEmoji }).from(countries),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Plan a trip</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-500">
        Tell Wanderly where you're going and how you like to travel. We'll generate a geographically
        optimized day-by-day itinerary from verified places, plus a budget breakdown and a personalized
        packing checklist — all editable afterwards.
      </p>
      <div className="mt-8">
        <TripPlannerForm cities={cityRows} countries={countryRows} />
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          { icon: "🗓️", title: "Day-by-day itinerary", text: "Arrival logistics, sights grouped by area, meals and evenings — with times, costs and transport legs." },
          { icon: "💰", title: "Budget engine", text: "Estimates scaled by style and group size across 11 categories. Edit any line manually." },
          { icon: "✅", title: "Smart checklist", text: "Documents, money, gear and health items adapted to destination, season and activities." },
        ].map((f) => (
          <div key={f.title} className="rounded-xl border border-stone-200 bg-white p-4 shadow-[var(--shadow-card)]">
            <p className="text-xl" aria-hidden>{f.icon}</p>
            <p className="mt-2 text-sm font-semibold">{f.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-stone-500">{f.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
