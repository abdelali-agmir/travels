"use client";

import { useState } from "react";
import { Badge, SourceLine, VerificationBadge, ProviderNotice } from "@/components/ui";
import { cn } from "@/lib/utils-client";

type Country = { code: string; name: string; flagEmoji: string };

type VisaResponse = {
  rule: {
    rule: {
      visaType: string;
      maxStayDays: number | null;
      requirements: string[] | null;
      notes: string | null;
      lastVerifiedAt: string | null;
      verificationStatus: string;
    };
    source: { name: string; url: string; type: string } | null;
  } | null;
  provider: { connected: boolean; provider: string; reason?: string };
  disclaimer: string;
};

const VISA_META: Record<string, { label: string; tone: "green" | "amber" | "red" | "blue" | "neutral"; icon: string; blurb: string }> = {
  visa_free: { label: "Visa free", tone: "green", icon: "🟢", blurb: "No visa needed before travel for tourism within the stated stay." },
  visa_on_arrival: { label: "Visa on arrival", tone: "blue", icon: "🛬", blurb: "A visa is issued at the border — bring the listed documents and fee." },
  evisa: { label: "eVisa", tone: "blue", icon: "💻", blurb: "Apply online before travel through the official portal." },
  visa_required: { label: "Visa required", tone: "red", icon: "🛂", blurb: "Apply at an embassy or consulate before travel." },
  transit_visa: { label: "Transit visa", tone: "amber", icon: "🔁", blurb: "Required for transiting — check airport transit exemptions." },
  special: { label: "Special requirements", tone: "amber", icon: "⚠️", blurb: "Entry uses a special scheme (e.g. ESTA/ETA) — see the notes." },
};

export function VisaChecker({ countries }: { countries: Country[] }) {
  const [from, setFrom] = useState("MA");
  const [to, setTo] = useState("JP");
  const [result, setResult] = useState<VisaResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  async function check(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setChecked(false);
    try {
      const res = await fetch(`/api/visa?from=${from}&to=${to}`);
      const data = await res.json();
      setResult(data);
      setChecked(true);
    } catch {
      setResult(null);
      setChecked(true);
    } finally {
      setLoading(false);
    }
  }

  const input = "h-11 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100";
  const meta = result?.rule ? VISA_META[result.rule.rule.visaType] : null;

  return (
    <div>
      <form onSubmit={check} className="grid gap-3 rounded-2xl border border-stone-200 bg-white p-5 shadow-[var(--shadow-card)] sm:grid-cols-[1fr_auto_1fr_auto] sm:items-end">
        <div>
          <label htmlFor="visa-from" className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">My passport</label>
          <select id="visa-from" value={from} onChange={(e) => setFrom(e.target.value)} className={cn(input, "mt-1.5")}>
            {countries.map((c) => <option key={c.code} value={c.code}>{c.flagEmoji} {c.name}</option>)}
          </select>
        </div>
        <span className="hidden pb-3 text-stone-400 sm:block" aria-hidden>→</span>
        <div>
          <label htmlFor="visa-to" className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">Traveling to</label>
          <select id="visa-to" value={to} onChange={(e) => setTo(e.target.value)} className={cn(input, "mt-1.5")}>
            {countries.map((c) => <option key={c.code} value={c.code}>{c.flagEmoji} {c.name}</option>)}
          </select>
        </div>
        <button type="submit" disabled={loading || from === to} className="h-11 rounded-lg bg-brand-700 px-6 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:opacity-50">
          {loading ? "Checking…" : "Check requirements"}
        </button>
      </form>

      {loading && (
        <div className="mt-6 space-y-3">
          <div className="skeleton h-8 w-48 rounded" />
          <div className="skeleton h-24 rounded-xl" />
        </div>
      )}

      {checked && !loading && result && (
        <div className="animate-rise mt-6">
          {result.rule && meta ? (
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-[var(--shadow-card)]">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-3xl" aria-hidden>{meta.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-2xl font-semibold">{meta.label}</h2>
                    <VerificationBadge status={result.rule.rule.verificationStatus} />
                  </div>
                  <p className="text-sm text-stone-500">{meta.blurb}</p>
                </div>
                {result.rule.rule.maxStayDays && (
                  <div className="ml-auto rounded-xl bg-brand-50 px-4 py-2 text-center">
                    <p className="font-display text-xl font-bold text-brand-800">{result.rule.rule.maxStayDays}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-600">days max stay</p>
                  </div>
                )}
              </div>
              {result.rule.rule.notes && <p className="mt-4 text-sm leading-relaxed text-stone-600">{result.rule.rule.notes}</p>}
              {(result.rule.rule.requirements ?? []).length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">Required documents</p>
                  <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
                    {result.rule.rule.requirements!.map((r) => (
                      <li key={r} className="flex items-start gap-2 text-sm text-stone-600">
                        <span className="mt-0.5 text-brand-600" aria-hidden>✓</span> {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="mt-5 border-t border-stone-100 pt-4">
                {result.rule.source && (
                  <SourceLine name={result.rule.source.name} url={result.rule.source.url} checkedAt={result.rule.rule.lastVerifiedAt} />
                )}
                <p className="mt-2 text-xs leading-relaxed text-stone-400">{result.disclaimer}</p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-white/60 p-8 text-center">
              <p className="text-3xl" aria-hidden>🛂</p>
              <h2 className="mt-2 font-semibold">No verified rule stored for this route yet</h2>
              <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-stone-500">
                Wanderly never invents visa requirements. This corridor hasn't been verified by our editorial team yet —
                check the destination's official government or embassy website.
              </p>
              <Badge tone="blue" className="mt-3">Sample dataset · 18 verified corridors seeded</Badge>
            </div>
          )}
          {!result.provider.connected && (
            <div className="mt-4">
              <ProviderNotice provider={result.provider.provider} reason={result.provider.reason ?? ""} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
