"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast";
import { buttonStyles } from "@/components/ui";

type TripOption = { trip: { id: number; title: string }; city: { id: number; name: string } };

export function AddToTrip({ placeId, cityId }: { placeId: number; cityId: number }) {
  const [open, setOpen] = useState(false);
  const [trips, setTrips] = useState<TripOption[] | null>(null);
  const [busy, setBusy] = useState(false);
  const { success, error } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!open || trips) return;
    fetch("/api/trips")
      .then(async (r) => {
        if (r.status === 401) {
          error("Sign in to add places to trips");
          router.push("/login");
          return null;
        }
        return r.json();
      })
      .then((d) => d && setTrips((d.trips ?? []).filter((t: TripOption) => t.city.id === cityId)))
      .catch(() => setTrips([]));
  }, [open, trips, cityId, error, router]);

  async function add(tripId: number) {
    setBusy(true);
    try {
      const tripRes = await fetch(`/api/trips/${tripId}`);
      const tripData = await tripRes.json();
      const days = tripData?.trip?.days ?? [];
      if (!days.length) throw new Error("no days");
      const dayId = days[days.length > 1 ? 1 : 0].id;
      const res = await fetch(`/api/trips/${tripId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dayId, placeId }),
      });
      if (!res.ok) throw new Error();
      success("Added to trip", "Open the itinerary to reorder or optimize the route.");
      setOpen(false);
    } catch {
      error("Couldn't add to trip");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className={buttonStyles.primary} aria-expanded={open}>
        ＋ Add to trip
      </button>
      {open && (
        <div className="animate-rise absolute left-0 top-12 z-20 w-64 rounded-xl border border-stone-200 bg-white p-2 shadow-[var(--shadow-card-hover)]">
          {trips === null ? (
            <div className="space-y-2 p-2">
              <div className="skeleton h-8 rounded" />
              <div className="skeleton h-8 rounded" />
            </div>
          ) : trips.length === 0 ? (
            <div className="p-3 text-center">
              <p className="text-xs text-stone-500">No trips to this destination yet.</p>
              <button
                onClick={() => router.push("/plan")}
                className="mt-2 text-xs font-semibold text-brand-700 hover:underline"
              >
                Plan a trip here →
              </button>
            </div>
          ) : (
            trips.map((t) => (
              <button
                key={t.trip.id}
                disabled={busy}
                onClick={() => add(t.trip.id)}
                className="block w-full rounded-lg px-3 py-2 text-left text-sm transition hover:bg-brand-50 disabled:opacity-50"
              >
                {t.trip.title}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
