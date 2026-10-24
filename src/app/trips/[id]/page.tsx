import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { itineraryDays, itineraryItems, trips } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { EmptyState } from "@/components/ui";
import { TripWorkspace, type TripPayload } from "@/components/trip-workspace";

export const metadata: Metadata = { title: "Trip workspace" };
export const dynamic = "force-dynamic";

export default async function TripPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  const { id } = await params;
  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState
          icon="🔒"
          title="Sign in to open this trip"
          description="Trips are private to their owner."
          action={<Link href={`/login?next=/trips/${id}`} className="rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800">Sign in</Link>}
        />
      </div>
    );
  }

  const trip = await db.query.trips.findFirst({
    where: and(eq(trips.id, Number(id)), eq(trips.userId, user.id)),
    with: {
      destination: { with: { country: true } },
      days: {
        orderBy: asc(itineraryDays.dayIndex),
        with: { items: { orderBy: asc(itineraryItems.orderIndex), with: { place: true } } },
      },
      budgetItems: true,
      checklistItems: true,
    },
  });
  if (!trip) notFound();

  return <TripWorkspace initial={trip as unknown as TripPayload} />;
}
