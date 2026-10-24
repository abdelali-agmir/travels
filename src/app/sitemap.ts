import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { cities, countries, places } from "@/db/schema";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const [countryRows, cityRows, placeRows] = await Promise.all([
    db.select({ slug: countries.slug }).from(countries),
    db.select({ slug: cities.slug, countrySlug: countries.slug }).from(cities).innerJoin(countries, eq(cities.countryId, countries.id)),
    db.select({ slug: places.slug }).from(places),
  ]);

  const staticPages = ["", "/explore", "/plan", "/map", "/visa", "/guide", "/guide/currency", "/alerts", "/community", "/creators", "/assistant"].map((p) => ({
    url: `${base}${p}`,
    changeFrequency: "daily" as const,
    priority: p === "" ? 1 : 0.8,
  }));

  return [
    ...staticPages,
    ...countryRows.map((c) => ({ url: `${base}/travel/${c.slug}`, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...cityRows.map((c) => ({ url: `${base}/travel/${c.countrySlug}/${c.slug}`, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...placeRows.map((p) => ({ url: `${base}/places/${p.slug}`, changeFrequency: "monthly" as const, priority: 0.5 })),
  ];
}
