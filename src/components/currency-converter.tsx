"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui";

const COMMON = ["USD", "EUR", "GBP", "MAD", "JPY", "THB", "TRY", "AED", "SAR", "BRL", "CHF", "CAD", "AUD", "CNY", "INR"];

export function CurrencyConverter({ initialFrom = "USD", initialTo = "EUR" }: { initialFrom?: string; initialTo?: string }) {
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [amount, setAmount] = useState("100");
  const [result, setResult] = useState<{ converted: number; rate: number; live: boolean; source: { name: string; url: string }; updatedAt: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const convert = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/currency?from=${from}&to=${to}&amount=${amount || 0}`);
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error ?? "Conversion unavailable.");
        setResult(null);
      } else {
        setResult(data);
      }
    } catch {
      setErr("Network problem — please retry.");
    } finally {
      setLoading(false);
    }
  }, [from, to, amount]);

  useEffect(() => {
    const t = setTimeout(convert, 250);
    return () => clearTimeout(t);
  }, [convert]);

  const input = "h-11 rounded-lg border border-stone-300 bg-white px-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-[var(--shadow-card)]">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr_1fr]">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="cc-amount" className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">Amount</label>
          <input id="cc-amount" type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} className={input} />
        </div>
        <button
          onClick={() => { setFrom(to); setTo(from); }}
          className="self-end rounded-lg border border-stone-300 px-3 py-2.5 text-sm transition hover:border-brand-400"
          aria-label="Swap currencies"
        >
          ⇄
        </button>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="cc-from" className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">From</label>
          <select id="cc-from" value={from} onChange={(e) => setFrom(e.target.value)} className={input}>
            {COMMON.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="cc-to" className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">To</label>
          <select id="cc-to" value={to} onChange={(e) => setTo(e.target.value)} className={input}>
            {COMMON.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="mt-6 min-h-24 rounded-xl bg-stone-50 p-5">
        {loading && <div className="skeleton h-10 w-64 rounded" />}
        {!loading && err && <p className="text-sm text-amber-700">⚠️ {err}</p>}
        {!loading && result && (
          <>
            <p className="font-display text-3xl font-semibold tracking-tight">
              {Number(amount || 0).toLocaleString()} {from} ={" "}
              <span className="text-brand-700">{result.converted.toLocaleString(undefined, { maximumFractionDigits: 2 })} {to}</span>
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-stone-500">
              <span>1 {from} = {result.rate.toLocaleString(undefined, { maximumFractionDigits: 6 })} {to}</span>
              {result.live ? <Badge tone="green">Live rate</Badge> : <Badge tone="amber">Cached reference — provider offline</Badge>}
              <span>· {result.source.name}</span>
              <span>· updated {new Date(result.updatedAt).toLocaleDateString("en-GB")}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
