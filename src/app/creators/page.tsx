import Link from "next/link";
import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { cities, countries, creatorStories, profiles, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { Badge, SectionHeading } from "@/components/ui";
import { formatUsd } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Creator hub",
  description: "Destination journeys from travel creators: real spending, honest mistakes and lessons learned — connected to their YouTube, TikTok and Instagram.",
};

export const dynamic = "force-dynamic";

export default async function CreatorsPage() {
  const [stories, creators, user] = await Promise.all([
    db
      .select({ story: creatorStories, author: users.name, authorId: users.id, city: cities, country: countries })
      .from(creatorStories)
      .innerJoin(users, eq(creatorStories.userId, users.id))
      .innerJoin(cities, eq(creatorStories.cityId, cities.id))
      .innerJoin(countries, eq(cities.countryId, countries.id))
      .orderBy(desc(creatorStories.createdAt)),
    db
      .select({ user: users, profile: profiles })
      .from(profiles)
      .innerJoin(users, eq(profiles.userId, users.id))
      .where(eq(profiles.isCreator, true)),
    getCurrentUser(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="rounded-2xl bg-brand-900 p-8 text-white sm:p-10">
        <Badge tone="brand" className="border-white/20 bg-white/10 text-white">🎬 Creator hub</Badge>
        <h1 className="mt-3 max-w-xl font-display text-3xl font-semibold leading-tight sm:text-4xl">
          Your journeys, documented. Your audience, connected.
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/70">
          Creators publish destination journeys on Wanderly — real spending, hotels, restaurants, mistakes and lessons —
          linked to their YouTube, TikTok and Instagram so their audience can travel their exact route.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href={user ? "/profile" : "/register"} className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-brand-900 transition hover:bg-brand-50">
            {user ? "Connect your channels" : "Become a creator"}
          </Link>
          <Link href="/community" className="rounded-lg border border-white/30 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">
            Browse community
          </Link>
        </div>
      </div>

      {/* Creators */}
      <section className="mt-12">
        <SectionHeading title="Featured creators" />
        <div className="grid gap-4 sm:grid-cols-2">
          {creators.map(({ user: u, profile }) => (
            <div key={u.id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-[var(--shadow-card)]">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-500/15 text-lg font-bold text-accent-600">
                  {u.name.slice(0, 1)}
                </span>
                <div>
                  <p className="font-semibold">{u.name}</p>
                  <p className="text-xs capitalize text-stone-400">{profile.travelStyle} traveler</p>
                </div>
              </div>
              {profile.bio && <p className="mt-3 text-sm leading-relaxed text-stone-600">{profile.bio}</p>}
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {profile.socials?.youtube && <a className="rounded-full bg-red-50 px-3 py-1 font-medium text-red-600 hover:bg-red-100" href={profile.socials.youtube} target="_blank" rel="noopener noreferrer">▶ YouTube</a>}
                {profile.socials?.instagram && <a className="rounded-full bg-pink-50 px-3 py-1 font-medium text-pink-600 hover:bg-pink-100" href={profile.socials.instagram} target="_blank" rel="noopener noreferrer">📷 Instagram</a>}
                {profile.socials?.tiktok && <a className="rounded-full bg-stone-100 px-3 py-1 font-medium text-stone-700 hover:bg-stone-200" href={profile.socials.tiktok} target="_blank" rel="noopener noreferrer">🎵 TikTok</a>}
                {profile.socials?.website && <a className="rounded-full bg-brand-50 px-3 py-1 font-medium text-brand-700 hover:bg-brand-100" href={profile.socials.website} target="_blank" rel="noopener noreferrer">🌐 Website</a>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stories */}
      <section className="mt-12">
        <SectionHeading title="Destination journeys" subtitle="Videos, real spending, hotels, mistakes and what they learned" />
        <div className="space-y-6">
          {stories.map(({ story, author, city, country }) => (
            <article key={story.id} className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[var(--shadow-card)] md:flex">
              {story.coverImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={story.coverImage} alt="" className="h-52 w-full object-cover md:h-auto md:w-72" loading="lazy" />
              )}
              <div className="flex-1 p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="brand">{country.flagEmoji} {city.name}</Badge>
                  {story.days && <Badge tone="neutral">{story.days} days</Badge>}
                  {story.totalSpendUsd && <Badge tone="amber">Spent {formatUsd(story.totalSpendUsd)}</Badge>}
                </div>
                <h3 className="mt-2 font-display text-xl font-semibold">{story.title}</h3>
                <p className="mt-1 text-xs text-stone-400">by {author}</p>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">{story.summary}</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {(story.highlights ?? []).length > 0 && (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">Highlights</p>
                      <ul className="mt-1.5 space-y-1 text-xs text-stone-600">
                        {story.highlights!.map((h) => <li key={h} className="flex gap-1.5"><span aria-hidden>✓</span>{h}</li>)}
                      </ul>
                    </div>
                  )}
                  {(story.mistakes ?? []).length > 0 && (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-red-500">Mistakes to avoid</p>
                      <ul className="mt-1.5 space-y-1 text-xs text-stone-600">
                        {story.mistakes!.map((m) => <li key={m} className="flex gap-1.5"><span aria-hidden>✗</span>{m}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {story.videoUrl && (
                    <a href={story.videoUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-red-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-red-700">
                      ▶ Watch the journey
                    </a>
                  )}
                  <Link href={`/travel/${country.slug}/${city.slug}`} className="rounded-lg border border-stone-300 px-3.5 py-2 text-xs font-semibold text-stone-700 transition hover:border-brand-400">
                    {city.name} guide →
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
