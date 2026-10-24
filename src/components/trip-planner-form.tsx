"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast";
import { buttonStyles, Badge } from "@/components/ui";
import { INTEREST_OPTIONS, TRAVEL_STYLES, cn } from "@/lib/utils-client";

export type CityOption = {
  id: number;
  name: string;
  countryName: string;
  countryCode: string;
  flagEmoji: string;
};

export type CountryOption = { code: string; name: string; flagEmoji: string };

function todayPlus(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function TripPlannerForm({
  cities,
  countries,
  compact = false,
  defaultCityId,
}: {
  cities: CityOption[];
  countries: CountryOption[];
  compact?: boolean;
  defaultCityId?: number;
}) {
  const router = useRouter();
  const { success, error } = useToast();
  const [origin, setOrigin] = useState("");
  const [cityId, setCityId] = useState<number | "">(defaultCityId ?? "");
  const [startDate, setStartDate] = useState(todayPlus(30));
  const [endDate, setEndDate] = useState(todayPlus(37));
  const [travelers, setTravelers] = useState(2);
  const [budget, setBudget] = useState<string>("2500");
  const [style, setStyle] = useState("mid-range");
  const [nationality, setNationality] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const sortedCities = useMemo(
    () => [...cities].sort((a, b) => a.name.localeCompare(b.name)),
    [cities],
  );

  function toggleInterest(i: string) {
    setInterests((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i].slice(0, 6)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!cityId) {
      error("Choose a destination", "Pick one of the destinations currently in the Wanderly dataset.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destinationCityId: cityId,
          originLabel: origin || null,
          startDate,
          endDate,
          travelers,
          budgetUsd: budget ? Number(budget) : null,
          travelStyle: style,
          interests,
          nationalityCode: nationality || null,
        }),
      });
      const data = await res.json();
      if (res.status === 401) {
        error("Sign in to build your trip", "Your plan details are one login away.");
        router.push("/login?next=/plan");
        return;
      }
      if (!res.ok) {
        error("Couldn't create trip", data.error ?? "Please try again.");
        return;
      }
      success("Trip created", "Your itinerary, budget and checklist are ready.");
      router.push(`/trips/${data.tripId}`);
    } catch {
      error("Network problem", "Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const field = "flex flex-col gap-1.5";
  const label = "text-[11px] font-semibold uppercase tracking-wider text-stone-500";
  const input =
    "h-11 rounded-lg border border-stone-300 bg-white px-3 text-sm text-ink shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

  return (
    <form
      onSubmit={submit}
      className={cn(
        "rounded-2xl border border-stone-200 bg-white p-5 shadow-[var(--shadow-card-hover)]",
        compact ? "" : "sm:p-6",
      )}
      aria-label="Trip planner"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className={field}>
          <label htmlFor="tp-from" className={label}>From</label>
          <input
            id="tp-from"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            placeholder="e.g. Casablanca, Morocco"
            className={input}
          />
        </div>
        <div className={field}>
          <label htmlFor="tp-to" className={label}>To</label>
          <select
            id="tp-to"
            value={cityId}
            onChange={(e) => setCityId(e.target.value ? Number(e.target.value) : "")}
            className={input}
            required
          >
            <option value="">Choose destination…</option>
            {sortedCities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.flagEmoji} {c.name}, {c.countryName}
              </option>
            ))}
          </select>
        </div>
        <div className={cn(field, "sm:col-span-2 lg:col-span-1")}>
          <span className={label}>Dates</span>
          <div className="grid grid-cols-2 gap-2">
            <input
              aria-label="Start date"
              type="date"
              value={startDate}
              min={todayPlus(0)}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (e.target.value > endDate) setEndDate(e.target.value);
              }}
              className={input}
              required
            />
            <input
              aria-label="End date"
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={input}
              required
            />
          </div>
        </div>
        <div className={field}>
          <label htmlFor="tp-travelers" className={label}>Travelers</label>
          <input
            id="tp-travelers"
            type="number"
            min={1}
            max={20}
            value={travelers}
            onChange={(e) => setTravelers(Number(e.target.value))}
            className={input}
          />
        </div>
        <div className={field}>
          <label htmlFor="tp-budget" className={label}>Budget (USD, total)</label>
          <input
            id="tp-budget"
            type="number"
            min={0}
            step={100}
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="2500"
            className={input}
          />
        </div>
        <div className={field}>
          <label htmlFor="tp-style" className={label}>Travel style</label>
          <select id="tp-style" value={style} onChange={(e) => setStyle(e.target.value)} className={input}>
            {TRAVEL_STYLES.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
        {!compact && (
          <div className={field}>
            <label htmlFor="tp-nationality" className={label}>Nationality (for visa checks)</label>
            <select id="tp-nationality" value={nationality} onChange={(e) => setNationality(e.target.value)} className={input}>
              <option value="">Select…</option>
              {countries.map((c) => (
                <option key={c.code} value={c.code}>{c.flagEmoji} {c.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {!compact && (
        <div className="mt-4">
          <p className={label}>Interests <span className="font-normal normal-case text-stone-400">(up to 6)</span></p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {INTEREST_OPTIONS.map((i) => (
              <button
                type="button"
                key={i}
                onClick={() => toggleInterest(i)}
                aria-pressed={interests.includes(i)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                  interests.includes(i)
                    ? "border-brand-600 bg-brand-700 text-white"
                    : "border-stone-300 bg-white text-stone-600 hover:border-brand-400 hover:text-brand-700",
                )}
              >
                {i}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Badge tone="blue" className="self-start">Sample dataset · {cities.length} destinations live, built to scale globally</Badge>
        <button type="submit" disabled={submitting} className={cn(buttonStyles.accent, "h-12 px-8 text-base")}>
          {submitting ? "Building your trip…" : "Build my trip →"}
        </button>
      </div>
    </form>
  );
}
