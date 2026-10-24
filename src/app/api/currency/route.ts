import { getExchangeRate } from "@/lib/providers";

export const dynamic = "force-dynamic";

const CODE = /^[A-Z]{3}$/;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const base = (searchParams.get("from") ?? "USD").toUpperCase();
  const quote = (searchParams.get("to") ?? "EUR").toUpperCase();
  const amount = Math.max(0, Math.min(1e9, Number(searchParams.get("amount")) || 1));

  if (!CODE.test(base) || !CODE.test(quote)) {
    return Response.json({ error: "Invalid currency code." }, { status: 400 });
  }

  const rate = await getExchangeRate(base, quote);
  if (!rate) {
    return Response.json(
      { error: `Rate ${base} → ${quote} is unavailable right now. The live provider may not support this pair.` },
      { status: 502 },
    );
  }
  return Response.json({ ...rate, amount, converted: amount * rate.rate });
}
