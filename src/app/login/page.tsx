import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/trips");
  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:px-6">
      <div className="rounded-2xl border border-stone-200 bg-white p-7 shadow-[var(--shadow-card)]">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="mt-1 text-sm text-stone-500">Sign in to your trips, saved places and preferences.</p>
        <div className="mt-6">
          <Suspense fallback={<div className="skeleton h-64 rounded-xl" />}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
