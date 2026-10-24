export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatUsd(amount: number | null | undefined, digits = 0): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: digits,
  }).format(amount);
}

export function formatDateRange(start: string, end: string): string {
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  const sameYear = s.getFullYear() === e.getFullYear();
  const startStr = s.toLocaleDateString("en-GB", opts);
  const endStr = e.toLocaleDateString("en-GB", {
    ...opts,
    year: sameYear ? undefined : "numeric",
  });
  return `${startStr} — ${endStr}${sameYear ? `, ${e.getFullYear()}` : ""}`;
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function tripLengthDays(start: string, end: string): number {
  const s = new Date(start + "T00:00:00").getTime();
  const e = new Date(end + "T00:00:00").getTime();
  return Math.max(1, Math.round((e - s) / 86400000) + 1);
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function addMinutes(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

export const PLACE_TYPE_LABELS: Record<string, string> = {
  attraction: "Attraction",
  museum: "Museum",
  hotel: "Hotel",
  hostel: "Hostel",
  restaurant: "Restaurant",
  cafe: "Café",
  street_food: "Street food",
  activity: "Activity",
  beach: "Beach",
  park: "Park",
  market: "Market",
  nightlife: "Nightlife",
  viewpoint: "Viewpoint",
  neighborhood: "Neighborhood",
  airport: "Airport",
  train_station: "Train station",
  bus_station: "Bus station",
  ferry_port: "Ferry port",
  hospital: "Hospital",
  police: "Police",
  embassy: "Embassy",
};

export const TRAVEL_STYLES = [
  "backpacker",
  "budget",
  "mid-range",
  "luxury",
  "adventure",
  "culture",
  "food",
  "nature",
  "beach",
  "nightlife",
  "family",
  "couple",
  "solo",
  "business",
  "photography",
] as const;

export const INTEREST_OPTIONS = [
  "History",
  "Food",
  "Nature",
  "Beaches",
  "Museums",
  "Nightlife",
  "Photography",
  "Shopping",
  "Architecture",
  "Local markets",
  "Hiking",
  "Art",
] as const;
