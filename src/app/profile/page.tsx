import Link from "next/link";
import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { countries } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { Badge, EmptyState } from "@/components/ui";
import { ProfileForm } from "@/components/profile-form";

export const metadata: Metadata = { title: "Profile & preferences" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState
          icon="👤"
          title="Sign in to manage your profile"
          description="Preferences personalize your itineraries, budgets and visa checks."
          action={<Link href="/login?next=/profile" className="rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800">Sign in</Link>}
        />
      </div>
    );
  }
  const countryRows = await db
    .select({ code: countries.code, name: countries.name, flagEmoji: countries.flagEmoji })
    .from(countries)
    .orderBy(asc(countries.name));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100 font-display text-2xl font-bold text-brand-800">
          {user.name.slice(0, 1)}
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">{user.name}</h1>
          <p className="text-sm text-stone-500">{user.email}</p>
          <div className="mt-1 flex gap-1.5">
            <Badge tone="brand" className="capitalize">{user.role}</Badge>
            {user.profile?.isCreator && <Badge tone="amber">Creator</Badge>}
          </div>
        </div>
      </div>
      <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-[var(--shadow-card)]">
        <ProfileForm profile={user.profile} countries={countryRows} />
      </div>
    </div>
  );
}
