import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { countries } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { RegisterForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Create account" };
export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect("/trips");
  const countryRows = await db
    .select({ code: countries.code, name: countries.name, flagEmoji: countries.flagEmoji })
    .from(countries)
    .orderBy(asc(countries.name));
  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:px-6">
      <div className="rounded-2xl border border-stone-200 bg-white p-7 shadow-[var(--shadow-card)]">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Create your account</h1>
        <p className="mt-1 text-sm text-stone-500">One account for trips, budgets, saved places and the community.</p>
        <div className="mt-6">
          <RegisterForm countries={countryRows} />
        </div>
      </div>
    </div>
  );
}
