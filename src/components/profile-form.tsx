"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast";
import { buttonStyles } from "@/components/ui";
import { cn, INTEREST_OPTIONS, TRAVEL_STYLES } from "@/lib/utils-client";

type Profile = {
  homeCountryCode: string | null;
  nationalityCode: string | null;
  travelStyle: string | null;
  budgetPreference: string | null;
  bio: string | null;
  interests: string[] | null;
  socials: { youtube?: string; tiktok?: string; instagram?: string; website?: string } | null;
};

export function ProfileForm({
  profile,
  countries,
}: {
  profile: Profile | null;
  countries: Array<{ code: string; name: string; flagEmoji: string }>;
}) {
  const [home, setHome] = useState(profile?.homeCountryCode ?? "");
  const [nationality, setNationality] = useState(profile?.nationalityCode ?? "");
  const [style, setStyle] = useState(profile?.travelStyle ?? "mid-range");
  const [budgetPref, setBudgetPref] = useState(profile?.budgetPreference ?? "balanced");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [interests, setInterests] = useState<string[]>(profile?.interests ?? []);
  const [socials, setSocials] = useState(profile?.socials ?? {});
  const [busy, setBusy] = useState(false);
  const { success, error } = useToast();
  const router = useRouter();

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeCountryCode: home,
          nationalityCode: nationality,
          travelStyle: style,
          budgetPreference: budgetPref,
          bio,
          interests,
          socials,
        }),
      });
      if (!res.ok) throw new Error();
      success("Profile saved");
      router.refresh();
    } catch {
      error("Couldn't save profile");
    } finally {
      setBusy(false);
    }
  }

  const input = "h-11 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100";
  const label = "text-[11px] font-semibold uppercase tracking-wider text-stone-500";

  return (
    <form onSubmit={save} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="pf-home" className={label}>Home country</label>
          <select id="pf-home" value={home} onChange={(e) => setHome(e.target.value)} className={`${input} mt-1.5`}>
            <option value="">Select…</option>
            {countries.map((c) => <option key={c.code} value={c.code}>{c.flagEmoji} {c.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="pf-nat" className={label}>Nationality (visa checks)</label>
          <select id="pf-nat" value={nationality} onChange={(e) => setNationality(e.target.value)} className={`${input} mt-1.5`}>
            <option value="">Select…</option>
            {countries.map((c) => <option key={c.code} value={c.code}>{c.flagEmoji} {c.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="pf-style" className={label}>Default travel style</label>
          <select id="pf-style" value={style} onChange={(e) => setStyle(e.target.value)} className={`${input} mt-1.5`}>
            {TRAVEL_STYLES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="pf-budget" className={label}>Budget preference</label>
          <select id="pf-budget" value={budgetPref} onChange={(e) => setBudgetPref(e.target.value)} className={`${input} mt-1.5`}>
            {["shoestring", "balanced", "comfortable", "no-limits"].map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="pf-bio" className={label}>Bio</label>
        <textarea id="pf-bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={500} className={`${input} mt-1.5 h-auto resize-y py-2.5`} placeholder="Tell other travelers about yourself…" />
      </div>

      <div>
        <p className={label}>Interests</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {INTEREST_OPTIONS.map((i) => (
            <button
              key={i}
              type="button"
              aria-pressed={interests.includes(i)}
              onClick={() => setInterests((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]))}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                interests.includes(i) ? "border-brand-600 bg-brand-700 text-white" : "border-stone-300 bg-white text-stone-600 hover:border-brand-400",
              )}
            >
              {i}
            </button>
          ))}
        </div>
      </div>

      <fieldset className="rounded-xl border border-stone-200 p-4">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-stone-500">Creator channels</legend>
        <p className="text-xs text-stone-400">Connect a channel to unlock the Creator Hub and publish destination journeys.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {(["youtube", "instagram", "tiktok", "website"] as const).map((k) => (
            <div key={k}>
              <label htmlFor={`pf-${k}`} className={label}>{k}</label>
              <input
                id={`pf-${k}`}
                type="url"
                value={socials[k] ?? ""}
                onChange={(e) => setSocials({ ...socials, [k]: e.target.value })}
                placeholder={`https://${k === "website" ? "your-site.com" : k + ".com/@you"}`}
                className={`${input} mt-1.5`}
              />
            </div>
          ))}
        </div>
      </fieldset>

      <button type="submit" disabled={busy} className={buttonStyles.primary}>
        {busy ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
