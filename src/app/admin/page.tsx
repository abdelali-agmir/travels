import Link from "next/link";
import type { Metadata } from "next";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  cities, communityPosts, countries, places, savedPlaces, sources, trips, users, visaRules,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { Badge, EmptyState, SectionHeading, Stat } from "@/components/ui";
import { AdminSources } from "@/components/admin-sources";
import { flightProviderStatus, hotelProviderStatus, placesProviderStatus, visaProviderStatus, aiProviderStatus } from "@/lib/providers";

export const metadata: Metadata = { title: "Admin dashboard" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState
          icon="🔐"
          title="Admin access required"
          description="Sign in with an administrator account to manage users, content, sources and data health. Demo admin: admin@wanderly.app / admin1234."
          action={<Link href="/login?next=/admin" className="rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800">Sign in</Link>}
        />
      </div>
    );
  }

  const [[counts], sourceRows, topDestinations, recentUsers] = await Promise.all([
    db
      .select({
        users: sql<number>`(select count(*) from ${users})`,
        trips: sql<number>`(select count(*) from ${trips})`,
        countries: sql<number>`(select count(*) from ${countries})`,
        cities: sql<number>`(select count(*) from ${cities})`,
        places: sql<number>`(select count(*) from ${places})`,
        posts: sql<number>`(select count(*) from ${communityPosts})`,
        saved: sql<number>`(select count(*) from ${savedPlaces})`,
        visaTotal: sql<number>`(select count(*) from ${visaRules})`,
        visaVerified: sql<number>`(select count(*) from ${visaRules} where verification_status = 'verified')`,
        sourcesTotal: sql<number>`(select count(*) from ${sources})`,
        sourcesVerified: sql<number>`(select count(*) from ${sources} where verification_status = 'verified')`,
        placesSourced: sql<number>`(select count(*) from ${places} where source_id is not null)`,
      })
      .from(sql`(select 1) as t`),
    db.select().from(sources).orderBy(desc(sources.confidence)),
    db
      .select({ name: cities.name, count: sql<number>`count(${trips.id})` })
      .from(trips)
      .innerJoin(cities, eq(trips.destinationCityId, cities.id))
      .groupBy(cities.name)
      .orderBy(desc(sql`count(${trips.id})`))
      .limit(5),
    db.select({ id: users.id, name: users.name, email: users.email, role: users.role, createdAt: users.createdAt }).from(users).orderBy(desc(users.createdAt)).limit(8),
  ]);

  const pct = (a: number, b: number) => (Number(b) ? Math.round((Number(a) / Number(b)) * 100) : 0);
  const visaPct = pct(counts.visaVerified, counts.visaTotal);
  const sourcesPct = pct(counts.sourcesVerified, counts.sourcesTotal);
  const placesPct = pct(counts.placesSourced, counts.places);

  const providers = [
    { name: "Weather (Open-Meteo)", status: { connected: true, provider: "Open-Meteo" } as const, live: true },
    { name: "Currency (ECB/Frankfurter)", status: { connected: true, provider: "Frankfurter" } as const, live: true },
    { name: "Flights", status: flightProviderStatus(), live: false },
    { name: "Hotels", status: hotelProviderStatus(), live: false },
    { name: "Places sync", status: placesProviderStatus(), live: false },
    { name: "Visa sync", status: visaProviderStatus(), live: false },
    { name: "LLM reasoning", status: aiProviderStatus(), live: false },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Admin dashboard</h1>
          <p className="mt-1 text-sm text-stone-500">Platform metrics, data health and the source verification registry.</p>
        </div>
        <Badge tone="brand">Signed in as {user.name}</Badge>
      </div>

      {/* Metrics */}
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <Stat label="Users" value={Number(counts.users)} />
        <Stat label="Trips created" value={Number(counts.trips)} />
        <Stat label="Countries" value={Number(counts.countries)} />
        <Stat label="Cities" value={Number(counts.cities)} />
        <Stat label="Places" value={Number(counts.places)} />
        <Stat label="Community posts" value={Number(counts.posts)} />
        <Stat label="Saved places" value={Number(counts.saved)} />
      </div>

      {/* Data health */}
      <section className="mt-12">
        <SectionHeading title="Data health" subtitle="Verification coverage across critical data domains" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: "Visa data", pct: visaPct, detail: `${counts.visaVerified}/${counts.visaTotal} rules verified` },
            { label: "Sources", pct: sourcesPct, detail: `${counts.sourcesVerified}/${counts.sourcesTotal} verified` },
            { label: "Places sourced", pct: placesPct, detail: `${counts.placesSourced}/${counts.places} with source` },
          ].map((d) => (
            <div key={d.label} className="rounded-xl border border-stone-200 bg-white p-4 shadow-[var(--shadow-card)]">
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">{d.label}</p>
              <p className="mt-1 font-display text-2xl font-semibold">{d.pct}%</p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-100">
                <div className={`h-full rounded-full ${d.pct >= 80 ? "bg-emerald-500" : d.pct >= 50 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${d.pct}%` }} />
              </div>
              <p className="mt-1.5 text-xs text-stone-400">{d.detail}</p>
            </div>
          ))}
          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-[var(--shadow-card)]">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">Weather</p>
            <p className="mt-1 font-display text-2xl font-semibold text-emerald-600">Live</p>
            <p className="mt-1.5 text-xs text-stone-400">Open-Meteo, no key required</p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-[var(--shadow-card)]">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">Currency</p>
            <p className="mt-1 font-display text-2xl font-semibold text-emerald-600">Live</p>
            <p className="mt-1.5 text-xs text-stone-400">ECB reference via Frankfurter</p>
          </div>
        </div>
      </section>

      {/* Providers */}
      <section className="mt-12">
        <SectionHeading title="Provider integrations" subtitle="Adapters are in place — connect credentials in .env to go live" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {providers.map((p) => (
            <div key={p.name} className="rounded-xl border border-stone-200 bg-white p-4 shadow-[var(--shadow-card)]">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{p.name}</p>
                {p.status.connected ? <Badge tone="green">Connected</Badge> : <Badge tone="neutral">Not connected</Badge>}
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-stone-500">
                {p.status.connected ? `Serving live data via ${p.status.provider}.` : ("reason" in p.status ? p.status.reason : "")}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-12 grid gap-8 lg:grid-cols-3">
        {/* Popular destinations */}
        <section>
          <SectionHeading title="Popular destinations" subtitle="By trips created" />
          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-[var(--shadow-card)]">
            {topDestinations.length === 0 ? (
              <p className="py-6 text-center text-sm text-stone-400">No trips yet.</p>
            ) : (
              <ul className="divide-y divide-stone-50">
                {topDestinations.map((d, i) => (
                  <li key={d.name} className="flex items-center justify-between py-2.5 text-sm">
                    <span><span className="mr-2 text-stone-300">#{i + 1}</span>{d.name}</span>
                    <Badge tone="brand">{Number(d.count)} trips</Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Users */}
        <section className="lg:col-span-2">
          <SectionHeading title="Recent users" />
          <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-[var(--shadow-card)]">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-stone-100 text-[11px] uppercase tracking-wider text-stone-400">
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {recentUsers.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-2.5 font-medium">{u.name}</td>
                    <td className="px-4 py-2.5 text-stone-500">{u.email}</td>
                    <td className="px-4 py-2.5"><Badge tone={u.role === "admin" ? "red" : u.role === "creator" ? "amber" : "neutral"} className="capitalize">{u.role}</Badge></td>
                    <td className="px-4 py-2.5 text-xs text-stone-400">{u.createdAt.toLocaleDateString("en-GB")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Sources */}
      <section className="mt-12">
        <SectionHeading title="Source registry" subtitle="Every fact on the platform traces back to one of these — manage verification status here" />
        <AdminSources
          sources={sourceRows.map((s) => ({
            id: s.id,
            name: s.name,
            url: s.url,
            type: s.type,
            verificationStatus: s.verificationStatus,
            confidence: s.confidence,
            lastCheckedAt: s.lastCheckedAt ? s.lastCheckedAt.toISOString() : null,
          }))}
        />
      </section>
    </div>
  );
}
