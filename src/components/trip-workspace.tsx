"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast";
import { Badge, buttonStyles } from "@/components/ui";
import { cn, formatUsd, formatDateRange, tripLengthDays } from "@/lib/utils-client";

/* ── Types mirroring the API payload ── */
type Place = { id: number; name: string; slug: string; type: string; area: string | null; openingHours: string | null } | null;
type Item = {
  id: number; orderIndex: number; title: string; kind: string; startTime: string | null;
  durationMin: number | null; estCostUsd: number | null; transportMode: string | null;
  transportMin: number | null; transportKm: number | null; notes: string | null; place: Place;
};
type Day = { id: number; dayIndex: number; date: string; title: string; items: Item[] };
type BudgetItem = { id: number; category: string; label: string; amountUsd: number; isEstimate: boolean };
type ChecklistItem = { id: number; category: string; label: string; done: boolean };
export type TripPayload = {
  id: number; title: string; originLabel: string | null; startDate: string; endDate: string;
  travelers: number; budgetUsd: number | null; travelStyle: string; status: string;
  nationalityCode: string | null; interests: string[] | null;
  destination: { id: number; name: string; slug: string; heroImage: string | null; country: { name: string; slug: string; flagEmoji: string; code: string; currencyCode: string } };
  days: Day[]; budgetItems: BudgetItem[]; checklistItems: ChecklistItem[];
};

const TRANSPORT_ICON: Record<string, string> = { walk: "🚶", metro: "🚇", taxi: "🚕", train: "🚆", bus: "🚌", ferry: "⛴️" };
const KIND_ICON: Record<string, string> = { transport: "✈️", hotel: "🏨", food: "🍽️", sight: "🏛️", activity: "🎟️", nightlife: "🌙" };
const CATEGORY_META: Record<string, { label: string; icon: string; color: string }> = {
  flights: { label: "Flights", icon: "✈️", color: "bg-sky-500" },
  accommodation: { label: "Accommodation", icon: "🏨", color: "bg-brand-600" },
  food: { label: "Food", icon: "🍽️", color: "bg-amber-500" },
  transport: { label: "Transport", icon: "🚇", color: "bg-violet-500" },
  activities: { label: "Activities", icon: "🎟️", color: "bg-emerald-500" },
  visa: { label: "Visa", icon: "🛂", color: "bg-rose-400" },
  insurance: { label: "Insurance", icon: "🛡️", color: "bg-stone-400" },
  sim: { label: "SIM / eSIM", icon: "📶", color: "bg-cyan-500" },
  shopping: { label: "Shopping", icon: "🛍️", color: "bg-pink-500" },
  emergency: { label: "Emergency buffer", icon: "🆘", color: "bg-red-500" },
  other: { label: "Other", icon: "📦", color: "bg-stone-500" },
};

export function TripWorkspace({ initial }: { initial: TripPayload }) {
  const [trip, setTrip] = useState(initial);
  const [tab, setTab] = useState<"itinerary" | "budget" | "checklist">("itinerary");
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [dragging, setDragging] = useState<{ dayId: number; itemId: number } | null>(null);
  const { success, error } = useToast();
  const router = useRouter();

  const days = tripLengthDays(trip.startDate, trip.endDate);
  const itineraryCost = trip.days.reduce((s, d) => s + d.items.reduce((x, i) => x + (i.estCostUsd ?? 0), 0), 0);
  const budgetTotal = trip.budgetItems.reduce((s, b) => s + b.amountUsd, 0);
  const doneCount = trip.checklistItems.filter((c) => c.done).length;
  const checklistPct = trip.checklistItems.length ? Math.round((doneCount / trip.checklistItems.length) * 100) : 0;

  async function reload() {
    const res = await fetch(`/api/trips/${trip.id}`);
    if (res.ok) {
      const data = await res.json();
      setTrip(data.trip);
    }
  }

  async function runAction(action: string, extra: Record<string, unknown> = {}, label?: string) {
    setBusy(action + JSON.stringify(extra));
    try {
      const res = await fetch(`/api/trips/${trip.id}/itinerary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      if (!res.ok) throw new Error();
      await reload();
      success(label ?? "Itinerary updated");
    } catch {
      error("Action failed", "Please try again.");
    } finally {
      setBusy(null);
    }
  }

  async function removeItem(item: Item) {
    const prev = trip;
    setTrip({ ...trip, days: trip.days.map((d) => ({ ...d, items: d.items.filter((i) => i.id !== item.id) })) });
    const res = await fetch(`/api/trips/${trip.id}/items`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: item.id }),
    });
    if (!res.ok) {
      setTrip(prev);
      error("Couldn't remove activity");
    } else {
      success("Activity removed", `“${item.title}” was removed from the plan.`);
    }
  }

  async function reorder(dayId: number, fromId: number, toId: number) {
    if (fromId === toId) return;
    const day = trip.days.find((d) => d.id === dayId);
    if (!day) return;
    const ids = day.items.map((i) => i.id);
    const from = ids.indexOf(fromId);
    const to = ids.indexOf(toId);
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    const newItems = ids.map((id, idx) => ({ ...day.items.find((i) => i.id === id)!, orderIndex: idx }));
    setTrip({ ...trip, days: trip.days.map((d) => (d.id === dayId ? { ...d, items: newItems } : d)) });
    await fetch(`/api/trips/${trip.id}/items`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reorder: { dayId, itemIds: ids } }),
    });
  }

  async function updateItemField(itemId: number, field: "startTime" | "estCostUsd", value: string) {
    const body: Record<string, unknown> = { itemId };
    body[field] = field === "estCostUsd" ? Number(value) : value;
    await fetch(`/api/trips/${trip.id}/items`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setTrip({
      ...trip,
      days: trip.days.map((d) => ({
        ...d,
        items: d.items.map((i) => (i.id === itemId ? { ...i, [field]: field === "estCostUsd" ? Number(value) : value } : i)),
      })),
    });
  }

  async function toggleChecklist(item: ChecklistItem) {
    setTrip({ ...trip, checklistItems: trip.checklistItems.map((c) => (c.id === item.id ? { ...c, done: !c.done } : c)) });
    await fetch(`/api/trips/${trip.id}/checklist`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: item.id, done: !item.done }),
    });
  }

  async function updateBudget(itemId: number, amount: number) {
    setTrip({ ...trip, budgetItems: trip.budgetItems.map((b) => (b.id === itemId ? { ...b, amountUsd: amount, isEstimate: false } : b)) });
    await fetch(`/api/trips/${trip.id}/budget`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, amountUsd: amount }),
    });
  }

  async function deleteTrip() {
    const res = await fetch(`/api/trips/${trip.id}`, { method: "DELETE" });
    if (res.ok) {
      success("Trip deleted");
      router.push("/trips");
      router.refresh();
    } else {
      error("Couldn't delete trip");
    }
  }

  const budgetByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of trip.budgetItems) map.set(b.category, (map.get(b.category) ?? 0) + b.amountUsd);
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [trip.budgetItems]);

  const checklistByCategory = useMemo(() => {
    const map = new Map<string, ChecklistItem[]>();
    for (const c of trip.checklistItems) {
      const list = map.get(c.category) ?? [];
      list.push(c);
      map.set(c.category, list);
    }
    return [...map.entries()];
  }, [trip.checklistItems]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <nav aria-label="Breadcrumb" className="text-xs text-stone-400">
            <Link href="/trips" className="hover:text-brand-700">My trips</Link> / {trip.destination.name}
          </nav>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
            {trip.destination.country.flagEmoji} {trip.title}
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            {trip.originLabel ? `${trip.originLabel} → ` : ""}{trip.destination.name}, {trip.destination.country.name} ·{" "}
            {formatDateRange(trip.startDate, trip.endDate)} · {trip.travelers} traveler{trip.travelers > 1 ? "s" : ""} ·{" "}
            <span className="capitalize">{trip.travelStyle}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/travel/${trip.destination.country.slug}/${trip.destination.slug}`} className={buttonStyles.secondary}>
            Destination guide
          </Link>
          <button onClick={() => setConfirmDelete(true)} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50">
            Delete
          </button>
        </div>
      </div>

      {/* Progress stats */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-[var(--shadow-card)]">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">Trip length</p>
          <p className="mt-1 font-display text-xl font-semibold">{days} days</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-[var(--shadow-card)]">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">Estimated budget</p>
          <p className="mt-1 font-display text-xl font-semibold">{formatUsd(budgetTotal)}</p>
          <p className="text-xs text-stone-400">{formatUsd(Math.round(budgetTotal / days))}/day avg</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-[var(--shadow-card)]">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">Your budget</p>
          <p className="mt-1 font-display text-xl font-semibold">{trip.budgetUsd ? formatUsd(trip.budgetUsd) : "—"}</p>
          {trip.budgetUsd ? (
            <p className={cn("text-xs font-medium", budgetTotal > trip.budgetUsd ? "text-red-600" : "text-emerald-600")}>
              {budgetTotal > trip.budgetUsd ? `${formatUsd(budgetTotal - trip.budgetUsd)} over` : `${formatUsd(trip.budgetUsd - budgetTotal)} headroom`}
            </p>
          ) : <p className="text-xs text-stone-400">not set</p>}
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-[var(--shadow-card)]">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">Checklist</p>
          <p className="mt-1 font-display text-xl font-semibold">{checklistPct}%</p>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-stone-100">
            <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${checklistPct}%` }} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8 flex gap-1 border-b border-stone-200" role="tablist">
        {([["itinerary", "🗓️ Itinerary"], ["budget", "💰 Budget"], ["checklist", "✅ Checklist"]] as const).map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cn(
              "-mb-px rounded-t-lg border-b-2 px-4 py-2.5 text-sm font-semibold transition",
              tab === key ? "border-brand-700 text-brand-800" : "border-transparent text-stone-500 hover:text-ink",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Itinerary tab ── */}
      {tab === "itinerary" && (
        <div className="mt-6">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => runAction("optimize-all", {}, "Routes optimized geographically")} disabled={busy !== null} className={buttonStyles.small}>
              🧭 Optimize route
            </button>
            <button onClick={() => runAction("reduce-cost", {}, "Costs reduced ~25%")} disabled={busy !== null} className={buttonStyles.small}>
              💸 Reduce cost
            </button>
            <button onClick={() => runAction("regenerate", { emphasize: "experiences" }, "Rebuilt with more experiences")} disabled={busy !== null} className={buttonStyles.small}>
              ✨ Add experiences
            </button>
            <button onClick={() => runAction("regenerate", { pace: "slow" }, "Rebuilt at a slower pace")} disabled={busy !== null} className={buttonStyles.small}>
              🐢 Slow down
            </button>
            <button onClick={() => runAction("regenerate", { emphasize: "nightlife" }, "Rebuilt with nightlife")} disabled={busy !== null} className={buttonStyles.small}>
              🌙 Add nightlife
            </button>
            <button onClick={() => runAction("regenerate", { emphasize: "food" }, "Rebuilt with a food focus")} disabled={busy !== null} className={buttonStyles.small}>
              🍜 Add food
            </button>
            <button onClick={() => runAction("regenerate", { emphasize: "nature" }, "Rebuilt with more nature")} disabled={busy !== null} className={buttonStyles.small}>
              🌿 Add nature
            </button>
            <button onClick={() => runAction("regenerate", {}, "Fresh itinerary generated")} disabled={busy !== null} className={cn(buttonStyles.small, "border-brand-300 text-brand-700")}>
              🔄 Regenerate all
            </button>
          </div>
          {busy?.startsWith("regenerate") && (
            <div className="mt-4 space-y-3">
              {[0, 1, 2].map((i) => <div key={i} className="skeleton h-24 rounded-xl" />)}
            </div>
          )}
          <p className="mt-3 text-xs text-stone-400">
            Drag activities to reorder · itinerary items estimate {formatUsd(itineraryCost)} of on-the-ground spending
          </p>

          <div className="mt-4 space-y-6">
            {trip.days.map((day) => (
              <section key={day.id} className="rounded-2xl border border-stone-200 bg-white shadow-[var(--shadow-card)]" aria-label={`Day ${day.dayIndex + 1}`}>
                <header className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-700 font-display text-sm font-bold text-white">
                      {day.dayIndex + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{day.title}</p>
                      <p className="text-xs text-stone-400">
                        {new Date(day.date + "T00:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-400">{formatUsd(day.items.reduce((s, i) => s + (i.estCostUsd ?? 0), 0))}</span>
                    <button onClick={() => runAction("optimize", { dayId: day.id }, `Day ${day.dayIndex + 1} route optimized`)} disabled={busy !== null} className={buttonStyles.small}>
                      🧭 Optimize day
                    </button>
                  </div>
                </header>
                <ol className="px-3 py-2 sm:px-5">
                  {day.items.length === 0 && (
                    <li className="py-6 text-center text-xs text-stone-400">Free day — add activities from any destination page.</li>
                  )}
                  {day.items.map((item) => (
                    <li
                      key={item.id}
                      draggable
                      onDragStart={() => setDragging({ dayId: day.id, itemId: item.id })}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (dragging && dragging.dayId === day.id) reorder(day.id, dragging.itemId, item.id);
                        setDragging(null);
                      }}
                      className={cn(
                        "group relative rounded-xl transition",
                        dragging?.itemId === item.id && "opacity-40",
                      )}
                    >
                      {item.transportMode && (
                        <div className="flex items-center gap-2 py-1 pl-12 text-[11px] text-stone-400">
                          <span className="h-4 w-px bg-stone-200" aria-hidden />
                          <span aria-hidden>{TRANSPORT_ICON[item.transportMode] ?? "🚗"}</span>
                          {item.transportMin} min {item.transportMode}{item.transportKm ? ` · ${item.transportKm} km` : ""}
                        </div>
                      )}
                      <div className="flex items-start gap-3 rounded-xl px-2 py-2.5 transition hover:bg-stone-50">
                        <span className="cursor-grab pt-1 text-stone-300 transition group-hover:text-stone-400" title="Drag to reorder" aria-hidden>⠿</span>
                        <span className="pt-0.5 text-lg" aria-hidden>{KIND_ICON[item.kind] ?? "📍"}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {item.place ? (
                              <Link href={`/places/${item.place.slug}`} className="text-sm font-semibold text-ink hover:text-brand-700 hover:underline">
                                {item.title}
                              </Link>
                            ) : (
                              <p className="text-sm font-semibold">{item.title}</p>
                            )}
                            {item.place?.area && <Badge tone="neutral">{item.place.area}</Badge>}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
                            <label className="flex items-center gap-1">
                              <span aria-hidden>🕒</span>
                              <input
                                type="time"
                                defaultValue={item.startTime ?? "09:00"}
                                onBlur={(e) => updateItemField(item.id, "startTime", e.target.value)}
                                className="rounded border border-transparent bg-transparent px-0.5 outline-none transition hover:border-stone-300 focus:border-brand-400"
                                aria-label={`Start time for ${item.title}`}
                              />
                            </label>
                            {item.durationMin && <span>{Math.round((item.durationMin / 60) * 10) / 10}h</span>}
                            <label className="flex items-center gap-0.5">
                              <span aria-hidden>💵 $</span>
                              <input
                                type="number"
                                min={0}
                                defaultValue={item.estCostUsd ?? 0}
                                onBlur={(e) => updateItemField(item.id, "estCostUsd", e.target.value)}
                                className="w-14 rounded border border-transparent bg-transparent px-0.5 outline-none transition hover:border-stone-300 focus:border-brand-400"
                                aria-label={`Estimated cost for ${item.title}`}
                              />
                            </label>
                            {item.place?.openingHours && <span className="hidden text-stone-400 sm:inline">🚪 {item.place.openingHours}</span>}
                          </div>
                          {item.notes && <p className="mt-1 text-xs italic text-stone-400">{item.notes}</p>}
                        </div>
                        <button
                          onClick={() => removeItem(item)}
                          aria-label={`Remove ${item.title}`}
                          className="rounded-lg p-1.5 text-stone-300 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                        >
                          ✕
                        </button>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
        </div>
      )}

      {/* ── Budget tab ── */}
      {tab === "budget" && (
        <div className="mt-6 grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-[var(--shadow-card)]">
              <h2 className="text-sm font-semibold">Category breakdown</h2>
              <div className="mt-4 space-y-3">
                {budgetByCategory.map(([cat, amount]) => {
                  const meta = CATEGORY_META[cat] ?? CATEGORY_META.other;
                  const pct = budgetTotal ? Math.round((amount / budgetTotal) * 100) : 0;
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-stone-600">{meta.icon} {meta.label}</span>
                        <span className="text-stone-500">{formatUsd(amount)} · {pct}%</span>
                      </div>
                      <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-stone-100">
                        <div className={cn("h-full rounded-full transition-all", meta.color)} style={{ width: `${Math.max(2, pct)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-4">
                <p className="text-sm font-semibold">Estimated total · {trip.travelers} traveler{trip.travelers > 1 ? "s" : ""}</p>
                <p className="font-display text-xl font-semibold">{formatUsd(budgetTotal)}</p>
              </div>
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-[var(--shadow-card)]">
              <h2 className="text-sm font-semibold">Line items <span className="font-normal text-stone-400">(click amounts to edit)</span></h2>
              <ul className="mt-3 divide-y divide-stone-100">
                {trip.budgetItems.map((b) => (
                  <li key={b.id} className="flex items-center justify-between gap-2 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm">{b.label}</p>
                      <p className="text-[10px] uppercase tracking-wide text-stone-400">
                        {(CATEGORY_META[b.category] ?? CATEGORY_META.other).label} {b.isEstimate ? "· estimate" : "· manual"}
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5 text-sm">
                      <span className="text-stone-400">$</span>
                      <input
                        type="number"
                        min={0}
                        defaultValue={Math.round(b.amountUsd)}
                        onBlur={(e) => updateBudget(b.id, Number(e.target.value) || 0)}
                        className="w-20 rounded border border-transparent bg-transparent px-1 py-0.5 text-right font-medium outline-none transition hover:border-stone-300 focus:border-brand-400"
                        aria-label={`Amount for ${b.label}`}
                      />
                    </div>
                  </li>
                ))}
              </ul>
              <AddBudgetItem tripId={trip.id} onAdded={reload} />
            </div>
          </div>
        </div>
      )}

      {/* ── Checklist tab ── */}
      {tab === "checklist" && (
        <div className="mt-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-stone-100">
              <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${checklistPct}%` }} />
            </div>
            <span className="text-sm font-semibold text-stone-600">{doneCount}/{trip.checklistItems.length} done</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {checklistByCategory.map(([category, items]) => (
              <div key={category} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-[var(--shadow-card)]">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400">{category}</h3>
                <ul className="mt-2 space-y-1">
                  {items.map((c) => (
                    <li key={c.id}>
                      <label className="flex cursor-pointer items-start gap-2.5 rounded-lg px-2 py-1.5 transition hover:bg-stone-50">
                        <input
                          type="checkbox"
                          checked={c.done}
                          onChange={() => toggleChecklist(c)}
                          className="mt-0.5 h-4 w-4 rounded border-stone-300 accent-brand-700"
                        />
                        <span className={cn("text-sm", c.done && "text-stone-400 line-through")}>{c.label}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <AddChecklistItem tripId={trip.id} onAdded={reload} />
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Confirm deletion">
          <div className="animate-rise w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <p className="text-lg font-semibold">Delete this trip?</p>
            <p className="mt-1 text-sm text-stone-500">
              “{trip.title}” and its itinerary, budget and checklist will be permanently removed.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setConfirmDelete(false)} className={buttonStyles.secondary}>Cancel</button>
              <button onClick={deleteTrip} className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700">
                Delete trip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AddBudgetItem({ tripId, onAdded }: { tripId: number; onAdded: () => void }) {
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("other");
  const { error } = useToast();
  async function add(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/trips/${tripId}/budget`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, amountUsd: Number(amount), category }),
    });
    if (!res.ok) {
      const d = await res.json();
      error("Couldn't add item", d.error);
      return;
    }
    setLabel("");
    setAmount("");
    onAdded();
  }
  return (
    <form onSubmit={add} className="mt-3 flex gap-2 border-t border-stone-100 pt-3">
      <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Add expense…" required className="h-9 min-w-0 flex-1 rounded-lg border border-stone-300 px-2.5 text-sm outline-none focus:border-brand-500" aria-label="Expense label" />
      <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-9 rounded-lg border border-stone-300 px-1.5 text-xs outline-none" aria-label="Category">
        {Object.entries(CATEGORY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
      </select>
      <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" min={0} placeholder="$" required className="h-9 w-20 rounded-lg border border-stone-300 px-2.5 text-sm outline-none focus:border-brand-500" aria-label="Amount in USD" />
      <button type="submit" className="h-9 rounded-lg bg-brand-700 px-3 text-sm font-semibold text-white transition hover:bg-brand-800">Add</button>
    </form>
  );
}

function AddChecklistItem({ tripId, onAdded }: { tripId: number; onAdded: () => void }) {
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState("Documents");
  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    await fetch(`/api/trips/${tripId}/checklist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, category }),
    });
    setLabel("");
    onAdded();
  }
  return (
    <form onSubmit={add} className="mt-4 flex max-w-xl gap-2">
      <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Add checklist item…" className="h-10 min-w-0 flex-1 rounded-lg border border-stone-300 px-3 text-sm outline-none focus:border-brand-500" aria-label="New checklist item" />
      <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-10 rounded-lg border border-stone-300 px-2 text-sm outline-none" aria-label="Checklist category">
        {["Documents", "Money", "Clothes", "Electronics", "Health", "Toiletries", "Travel gear", "Connectivity", "Other"].map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>
      <button type="submit" className="h-10 rounded-lg bg-brand-700 px-4 text-sm font-semibold text-white transition hover:bg-brand-800">Add</button>
    </form>
  );
}
