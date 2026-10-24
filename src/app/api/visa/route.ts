import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { countries, sources, visaRules } from "@/db/schema";
import { visaProviderStatus } from "@/lib/providers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const from = (searchParams.get("from") ?? "").toUpperCase().slice(0, 2);
  const to = (searchParams.get("to") ?? "").toUpperCase().slice(0, 2);
  if (!from || !to) return Response.json({ error: "from and to country codes are required." }, { status: 400 });

  const rows = await db
    .select({ rule: visaRules, source: sources })
    .from(visaRules)
    .leftJoin(sources, eq(visaRules.sourceId, sources.id))
    .where(and(eq(visaRules.fromCountryCode, from), eq(visaRules.toCountryCode, to)))
    .limit(1);

  const [fromCountry, toCountry] = await Promise.all([
    db.query.countries.findFirst({ where: eq(countries.code, from) }),
    db.query.countries.findFirst({ where: eq(countries.code, to) }),
  ]);

  return Response.json({
    rule: rows[0] ?? null,
    fromCountry: fromCountry ?? null,
    toCountry: toCountry ?? null,
    provider: visaProviderStatus(),
    disclaimer:
      "Wanderly stores visa rules with source and verification metadata but this is a sample dataset. Always confirm with the official government source before booking.",
  });
}
