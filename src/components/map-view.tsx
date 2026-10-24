"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Map as LeafletMap, LayerGroup } from "leaflet";
import { Badge } from "@/components/ui";
import { SaveButton } from "@/components/save-button";
import { cn, formatUsd, PLACE_TYPE_LABELS } from "@/lib/utils-client";
import "leaflet/dist/leaflet.css";

export type MapPlace = {
  id: number;
  slug: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  rating: number | null;
  estCostUsd: number | null;
  area: string | null;
  image: string | null;
  description: string | null;
  openingHours: string | null;
  cityName: string;
  citySlug: string;
  countrySlug: string;
  countryName: string;
};

export type MapCity = { id: number; name: string; lat: number; lng: number; countryName: string };

const FILTER_GROUPS: Array<{ key: string; label: string; icon: string; types: string[] }> = [
  { key: "sights", label: "Attractions", icon: "🏛️", types: ["attraction", "museum", "viewpoint", "neighborhood"] },
  { key: "nature", label: "Nature & beaches", icon: "🏖️", types: ["park", "beach"] },
  { key: "food", label: "Food & cafés", icon: "🍽️", types: ["restaurant", "cafe", "street_food", "market"] },
  { key: "stay", label: "Stay", icon: "🏨", types: ["hotel", "hostel"] },
  { key: "night", label: "Nightlife", icon: "🌙", types: ["nightlife"] },
  { key: "activity", label: "Activities", icon: "🎟️", types: ["activity"] },
  { key: "transport", label: "Transport", icon: "✈️", types: ["airport", "train_station", "bus_station", "ferry_port"] },
  { key: "safety", label: "Emergency", icon: "🏥", types: ["hospital", "police", "embassy"] },
];

const TYPE_ICON: Record<string, string> = {
  attraction: "🏛️", museum: "🖼️", hotel: "🏨", hostel: "🛏️", restaurant: "🍽️", cafe: "☕",
  street_food: "🥡", activity: "🎟️", beach: "🏖️", park: "🌳", market: "🧺", nightlife: "🌙",
  viewpoint: "🌄", neighborhood: "🏘️", airport: "✈️", train_station: "🚆", bus_station: "🚌",
  ferry_port: "⛴️", hospital: "🏥", police: "👮", embassy: "🏛️",
};

export function MapView({
  places,
  cities,
  initialCityId,
  focusPlaceId,
}: {
  places: MapPlace[];
  cities: MapCity[];
  initialCityId?: number;
  focusPlaceId?: number;
}) {
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>(FILTER_GROUPS.map((g) => g.key).filter((k) => k !== "safety"));
  const [selected, setSelected] = useState<MapPlace | null>(places.find((p) => p.id === focusPlaceId) ?? null);
  const [cityId, setCityId] = useState<number | "all">(initialCityId ?? "all");
  const [ready, setReady] = useState(false);

  const visibleTypes = useMemo(() => {
    const set = new Set<string>();
    for (const g of FILTER_GROUPS) if (activeFilters.includes(g.key)) g.types.forEach((t) => set.add(t));
    return set;
  }, [activeFilters]);

  const visiblePlaces = useMemo(
    () =>
      places.filter((p) => {
        if (!visibleTypes.has(p.type)) return false;
        if (cityId !== "all") {
          const city = cities.find((c) => c.id === cityId);
          if (city && (Math.abs(p.lat - city.lat) > 1.5 || Math.abs(p.lng - city.lng) > 1.5)) return false;
        }
        return true;
      }),
    [places, visibleTypes, cityId, cities],
  );

  // init map
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;
      const map = L.map(containerRef.current, { zoomControl: true, attributionControl: true });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);
      map.setView([30, 10], 2.4);
      mapRef.current = map;
      layerRef.current = L.layerGroup().addTo(map);
      setReady(true);
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // render markers
  useEffect(() => {
    if (!ready || !mapRef.current || !layerRef.current) return;
    (async () => {
      const L = (await import("leaflet")).default;
      const layer = layerRef.current!;
      layer.clearLayers();
      for (const p of visiblePlaces) {
        const icon = L.divIcon({
          className: "",
          html: `<div style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;background:white;border:2px solid #257170;border-radius:50% 50% 50% 4px;box-shadow:0 2px 6px rgba(0,0,0,.25);font-size:14px;transform:rotate(0deg);cursor:pointer">${TYPE_ICON[p.type] ?? "📍"}</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 28],
        });
        const marker = L.marker([p.lat, p.lng], { icon, title: p.name });
        marker.on("click", () => setSelected(p));
        marker.addTo(layer);
      }
    })();
  }, [visiblePlaces, ready]);

  // fly to city / focus
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    if (focusPlaceId) {
      const p = places.find((x) => x.id === focusPlaceId);
      if (p) {
        mapRef.current.setView([p.lat, p.lng], 14);
        return;
      }
    }
    if (cityId !== "all") {
      const city = cities.find((c) => c.id === cityId);
      if (city) mapRef.current.setView([city.lat, city.lng], 12);
    }
  }, [cityId, ready, focusPlaceId, places, cities]);

  function toggleFilter(key: string) {
    setActiveFilters((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  return (
    <div className="relative h-[calc(100vh-4rem)] w-full overflow-hidden">
      <div ref={containerRef} className="h-full w-full" role="application" aria-label="Interactive world map" />

      {/* Controls */}
      <div className="absolute left-3 right-3 top-3 z-[400] flex flex-col gap-2 sm:right-auto sm:w-80">
        <select
          value={cityId}
          onChange={(e) => setCityId(e.target.value === "all" ? "all" : Number(e.target.value))}
          className="h-11 rounded-lg border border-stone-300 bg-white px-3 text-sm shadow-lg outline-none"
          aria-label="Jump to city"
        >
          <option value="all">🌍 Whole world ({places.length} places)</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>{c.name}, {c.countryName}</option>
          ))}
        </select>
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
          {FILTER_GROUPS.map((g) => (
            <button
              key={g.key}
              onClick={() => toggleFilter(g.key)}
              aria-pressed={activeFilters.includes(g.key)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm transition",
                activeFilters.includes(g.key)
                  ? "border-brand-700 bg-brand-700 text-white"
                  : "border-stone-300 bg-white text-stone-600",
              )}
            >
              {g.icon} {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* Place panel */}
      {selected && (
        <aside className="animate-rise absolute bottom-4 left-3 right-3 z-[400] max-h-[55%] overflow-y-auto rounded-2xl border border-stone-200 bg-white shadow-2xl sm:left-auto sm:right-4 sm:w-96" aria-label={`Details for ${selected.name}`}>
          {selected.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={selected.image} alt="" className="h-36 w-full rounded-t-2xl object-cover" />
          )}
          <div className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge tone="brand">{PLACE_TYPE_LABELS[selected.type] ?? selected.type}</Badge>
                  {selected.rating != null && <Badge tone="amber">★ {selected.rating}</Badge>}
                </div>
                <h2 className="mt-1.5 font-display text-lg font-semibold leading-snug">{selected.name}</h2>
                <p className="text-xs text-stone-500">{selected.cityName}, {selected.countryName} {selected.area ? `· ${selected.area}` : ""}</p>
              </div>
              <button onClick={() => setSelected(null)} aria-label="Close panel" className="rounded-full p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700">✕</button>
            </div>
            {selected.description && <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-stone-600">{selected.description}</p>}
            <div className="mt-2 flex items-center gap-3 text-xs text-stone-500">
              <span className="font-semibold text-brand-700">{selected.estCostUsd ? formatUsd(selected.estCostUsd) : selected.estCostUsd === 0 ? "Free" : ""}</span>
              {selected.openingHours && <span>🕒 {selected.openingHours}</span>}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href={`/places/${selected.slug}`} className="inline-flex items-center rounded-lg bg-brand-700 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-brand-800">
                Full details
              </Link>
              <SaveButton placeId={selected.id} className="!px-3 !py-2 !text-xs" />
              <a
                href={`https://www.openstreetmap.org/directions?to=${selected.lat},${selected.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-lg border border-stone-300 px-3.5 py-2 text-xs font-medium text-stone-600 transition hover:border-brand-400"
              >
                Directions ↗
              </a>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
