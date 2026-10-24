"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast";
import { buttonStyles } from "@/components/ui";

export function CommunityComposer({ cities, signedIn }: { cities: Array<{ id: number; name: string }>; signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState("story");
  const [cityId, setCityId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const { success, error } = useToast();
  const router = useRouter();

  if (!signedIn) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-[var(--shadow-card)]">
        <p className="text-sm text-stone-500">Share your own story, budget or question with the community.</p>
        <Link href="/login?next=/community" className={buttonStyles.primary}>Sign in to post</Link>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, type, cityId: cityId ? Number(cityId) : null }),
      });
      const data = await res.json();
      if (!res.ok) {
        error("Couldn't publish", data.error);
        return;
      }
      success("Published!", "Your post is live in the community.");
      setOpen(false);
      setTitle("");
      setBody("");
      router.refresh();
    } catch {
      error("Network problem");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="w-full rounded-2xl border border-dashed border-stone-300 bg-white/70 p-4 text-left text-sm text-stone-500 transition hover:border-brand-400 hover:text-brand-700">
        ✍️ Share a story, tip, route, budget or question…
      </button>
    );
  }

  const input = "w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

  return (
    <form onSubmit={submit} className="animate-rise rounded-2xl border border-stone-200 bg-white p-5 shadow-[var(--shadow-card)]">
      <div className="grid gap-3 sm:grid-cols-2">
        <select value={type} onChange={(e) => setType(e.target.value)} className={input} aria-label="Post type">
          {["story", "tip", "question", "route", "budget", "review"].map((t) => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
        <select value={cityId} onChange={(e) => setCityId(e.target.value)} className={input} aria-label="Related destination">
          <option value="">🌍 No specific destination</option>
          {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title — make it specific and useful" required minLength={8} className={`${input} mt-3`} aria-label="Post title" />
      <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Your story, numbers, mistakes, advice…" required minLength={20} rows={5} className={`${input} mt-3 resize-y`} aria-label="Post body" />
      <div className="mt-3 flex justify-end gap-2">
        <button type="button" onClick={() => setOpen(false)} className={buttonStyles.secondary}>Cancel</button>
        <button type="submit" disabled={busy} className={buttonStyles.primary}>{busy ? "Publishing…" : "Publish"}</button>
      </div>
    </form>
  );
}
