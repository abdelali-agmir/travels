import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { countries, sources, travelAlerts } from "@/db/schema";
import { Badge, ProviderNotice, SourceLine } from "@/components/ui";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Travel alerts",
  description: "Disruptions, weather warnings, border and visa changes — with sources, severity and check dates.",
};

export const revalidate = 300;

export default async function AlertsPage() {
  const alerts = await db
    .select({ alert: travelAlerts, country: countries, source: sources })
    .from(travelAlerts)
    .leftJoin(countries, eq(travelAlerts.countryId, countries.id))
    .leftJoin(sources, eq(travelAlerts.sourceId, sources.id))
    .orderBy(desc(travelAlerts.publishedAt));

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Travel alerts</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-500">
        The alert system tracks transport disruptions, weather warnings, border changes and health advisories.
        Every alert requires a source, severity and check date. Wanderly does not generate fake alerts — the entries
        below are clearly-labeled samples demonstrating the pipeline.
      </p>

      <div className="mt-6">
        <ProviderNotice
          provider="Official alert feeds"
          reason="Connect government advisory feeds (e.g. travel.state.gov, gov.uk FCDO, national met offices) via the alerts ingestion service to publish live alerts."
        />
      </div>

      <div className="mt-8 space-y-4">
        {alerts.map(({ alert, country, source }) => (
          <article key={alert.id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-[var(--shadow-card)]">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={alert.severity === "critical" ? "red" : alert.severity === "warning" ? "red" : alert.severity === "advisory" ? "amber" : "blue"} className="capitalize">
                {alert.severity}
              </Badge>
              <Badge tone="neutral" className="capitalize">{alert.category}</Badge>
              {country && <Badge tone="brand">{country.flagEmoji} {country.name}</Badge>}
              {alert.isSample && <Badge tone="blue">Sample — demonstration only</Badge>}
              <span className="ml-auto text-xs text-stone-400">Published {formatDate(alert.publishedAt)}</span>
            </div>
            <h2 className="mt-2.5 font-semibold">{alert.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-stone-600">{alert.body}</p>
            {source && <SourceLine className="mt-3" name={source.name} url={source.url} checkedAt={alert.lastCheckedAt} />}
          </article>
        ))}
      </div>
    </div>
  );
}
