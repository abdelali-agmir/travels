"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/toast";

const input =
  "h-11 w-full rounded-lg border border-stone-300 bg-white px-3.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100";
const label = "text-[11px] font-semibold uppercase tracking-wider text-stone-500";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();
  const search = useSearchParams();
  const { success } = useToast();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error ?? "Sign in failed.");
        return;
      }
      success(`Welcome back, ${data.user.name.split(" ")[0]}!`);
      router.push(search.get("next") ?? "/trips");
      router.refresh();
    } catch {
      setErr("Network problem — please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {err && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{err}</p>}
      <div>
        <label htmlFor="login-email" className={label}>Email</label>
        <input id="login-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={`${input} mt-1.5`} autoComplete="email" />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="login-password" className={label}>Password</label>
          <button type="button" className="text-xs text-brand-700 hover:underline" onClick={() => setErr("Password reset requires an email provider — set EMAIL_API_KEY in .env to enable transactional email.")}>
            Forgot password?
          </button>
        </div>
        <input id="login-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={`${input} mt-1.5`} autoComplete="current-password" />
      </div>
      <button type="submit" disabled={busy} className="h-11 w-full rounded-lg bg-brand-700 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:opacity-50">
        {busy ? "Signing in…" : "Sign in"}
      </button>
      <div className="rounded-lg bg-stone-50 p-3 text-xs text-stone-500">
        <p className="font-semibold text-stone-600">Demo accounts</p>
        <p className="mt-1">Traveler: demo@wanderly.app / demo1234</p>
        <p>Admin: admin@wanderly.app / admin1234</p>
      </div>
      <p className="text-center text-sm text-stone-500">
        New to Wanderly? <Link href="/register" className="font-semibold text-brand-700 hover:underline">Create an account</Link>
      </p>
    </form>
  );
}

export function RegisterForm({ countries }: { countries: Array<{ code: string; name: string; flagEmoji: string }> }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nationality, setNationality] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();
  const { success } = useToast();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, nationalityCode: nationality || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error ?? "Registration failed.");
        return;
      }
      success("Welcome to Wanderly! 🌍", "Your account is ready — plan your first trip.");
      router.push("/plan");
      router.refresh();
    } catch {
      setErr("Network problem — please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {err && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{err}</p>}
      <div>
        <label htmlFor="reg-name" className={label}>Full name</label>
        <input id="reg-name" required minLength={2} value={name} onChange={(e) => setName(e.target.value)} className={`${input} mt-1.5`} autoComplete="name" />
      </div>
      <div>
        <label htmlFor="reg-email" className={label}>Email</label>
        <input id="reg-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={`${input} mt-1.5`} autoComplete="email" />
      </div>
      <div>
        <label htmlFor="reg-password" className={label}>Password <span className="font-normal normal-case text-stone-400">(8+ characters)</span></label>
        <input id="reg-password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className={`${input} mt-1.5`} autoComplete="new-password" />
      </div>
      <div>
        <label htmlFor="reg-nat" className={label}>Nationality <span className="font-normal normal-case text-stone-400">(powers visa checks)</span></label>
        <select id="reg-nat" value={nationality} onChange={(e) => setNationality(e.target.value)} className={`${input} mt-1.5`}>
          <option value="">Select later…</option>
          {countries.map((c) => <option key={c.code} value={c.code}>{c.flagEmoji} {c.name}</option>)}
        </select>
      </div>
      <button type="submit" disabled={busy} className="h-11 w-full rounded-lg bg-brand-700 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:opacity-50">
        {busy ? "Creating account…" : "Create account"}
      </button>
      <p className="text-center text-sm text-stone-500">
        Already have an account? <Link href="/login" className="font-semibold text-brand-700 hover:underline">Sign in</Link>
      </p>
    </form>
  );
}
