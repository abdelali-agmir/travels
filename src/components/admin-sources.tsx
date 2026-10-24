"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast";
import { VerificationBadge } from "@/components/ui";
import { formatDate } from "@/lib/utils-client";

type Source = {
  id: number;
  name: string;
  url: string;
  type: string;
  verificationStatus: string;
  confidence: number;
  lastCheckedAt: string | null;
};

export function AdminSources({ sources }: { sources: Source[] }) {
  const [rows, setRows] = useState(sources);
  const [busyId, setBusyId] = useState<number | null>(null);
  const { success, error } = useToast();
  const router = useRouter();

  async function setStatus(id: number, verificationStatus: string) {
    setBusyId(id);
    try {
      const res = await fetch("/api/admin/sources", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, verificationStatus }),
      });
      if (!res.ok) throw new Error();
      setRows((prev) => prev.map((s) => (s.id === id ? { ...s, verificationStatus, lastCheckedAt: new Date().toISOString() } : s)));
      success("Source updated");
      router.refresh();
    } catch {
      error("Couldn't update source");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-[var(--shadow-card)]">
      <table className="w-full min-w-[720px] text-left text-sm">
        <caption className="sr-only">Source registry</caption>
        <thead>
          <tr className="border-b border-stone-100 text-[11px] uppercase tracking-wider text-stone-400">
            <th className="px-4 py-3 font-semibold">Source</th>
            <th className="px-4 py-3 font-semibold">Type</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Confidence</th>
            <th className="px-4 py-3 font-semibold">Last checked</th>
            <th className="px-4 py-3 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-50">
          {rows.map((s) => (
            <tr key={s.id} className="transition hover:bg-stone-50/60">
              <td className="px-4 py-3">
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-medium text-ink hover:text-brand-700 hover:underline">
                  {s.name}
                </a>
              </td>
              <td className="px-4 py-3 text-xs capitalize text-stone-500">{s.type.replace(/_/g, " ")}</td>
              <td className="px-4 py-3"><VerificationBadge status={s.verificationStatus} /></td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-stone-100">
                    <div className="h-full rounded-full bg-brand-600" style={{ width: `${s.confidence}%` }} />
                  </div>
                  <span className="text-xs text-stone-500">{s.confidence}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-xs text-stone-500">{s.lastCheckedAt ? formatDate(s.lastCheckedAt) : "never"}</td>
              <td className="px-4 py-3">
                <div className="flex gap-1.5">
                  <button
                    disabled={busyId === s.id}
                    onClick={() => setStatus(s.id, "verified")}
                    className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                  >
                    ✓ Verify
                  </button>
                  <button
                    disabled={busyId === s.id}
                    onClick={() => setStatus(s.id, "needs_review")}
                    className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
                  >
                    ⟳ Review
                  </button>
                  <button
                    disabled={busyId === s.id}
                    onClick={() => setStatus(s.id, "expired")}
                    className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                  >
                    ! Expire
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
