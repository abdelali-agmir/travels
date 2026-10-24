import Link from "next/link";
import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { cities, communityPosts, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { Badge, EmptyState } from "@/components/ui";
import { CommunityComposer } from "@/components/community-composer";
import { cn, timeAgo } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Community",
  description: "Travel stories, honest budgets, routes, tips and questions from Wanderly travelers.",
};

export const dynamic = "force-dynamic";

export default async function CommunityPage({ searchParams }: { searchParams: Promise<{ sort?: string }> }) {
  const params = await searchParams;
  const sort = params.sort === "trending" ? "trending" : "latest";
  const user = await getCurrentUser();

  const [posts, cityRows] = await Promise.all([
    db
      .select({ post: communityPosts, author: { id: users.id, name: users.name }, city: cities })
      .from(communityPosts)
      .innerJoin(users, eq(communityPosts.userId, users.id))
      .leftJoin(cities, eq(communityPosts.cityId, cities.id))
      .orderBy(sort === "trending" ? desc(communityPosts.likesCount) : desc(communityPosts.createdAt))
      .limit(30),
    db.select({ id: cities.id, name: cities.name }).from(cities),
  ]);

  const typeTone: Record<string, "brand" | "amber" | "blue" | "green" | "neutral"> = {
    story: "brand", tip: "green", question: "blue", route: "amber", budget: "amber", review: "neutral",
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Community</h1>
          <p className="mt-1 text-sm text-stone-500">Real budgets, honest mistakes, and tips that survive contact with reality.</p>
        </div>
        <div className="flex rounded-lg border border-stone-300 bg-white p-0.5">
          {(["latest", "trending"] as const).map((s) => (
            <Link
              key={s}
              href={`/community?sort=${s}`}
              className={cn(
                "rounded-md px-3.5 py-1.5 text-sm font-medium capitalize transition",
                sort === s ? "bg-brand-700 text-white" : "text-stone-600 hover:text-ink",
              )}
            >
              {s}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <CommunityComposer cities={cityRows} signedIn={Boolean(user)} />
      </div>

      {posts.length === 0 ? (
        <div className="mt-8">
          <EmptyState icon="✍️" title="No posts yet" description="Be the first to share a story, tip or question." />
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {posts.map(({ post, author, city }) => (
            <Link key={post.id} href={`/community/${post.id}`} className="card-hover block rounded-2xl border border-stone-200 bg-white p-5 shadow-[var(--shadow-card)]">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-800">
                  {author.name.slice(0, 1)}
                </span>
                <div>
                  <p className="text-sm font-semibold">{author.name}</p>
                  <p className="text-xs text-stone-400">{timeAgo(post.createdAt)} {city ? `· ${city.name}` : ""}</p>
                </div>
                <Badge tone={typeTone[post.type] ?? "neutral"} className="ml-auto capitalize">{post.type}</Badge>
              </div>
              <h2 className="mt-3 font-display text-lg font-semibold leading-snug">{post.title}</h2>
              <p className="mt-1.5 line-clamp-3 whitespace-pre-line text-sm leading-relaxed text-stone-600">{post.body}</p>
              {post.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.image} alt="" className="mt-3 h-52 w-full rounded-xl object-cover" loading="lazy" />
              )}
              <div className="mt-3 flex items-center gap-4 text-xs text-stone-400">
                <span>♥ {post.likesCount} likes</span>
                <span>💬 {post.commentsCount} comments</span>
                <span className="ml-auto font-medium text-brand-700">Read & reply →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
