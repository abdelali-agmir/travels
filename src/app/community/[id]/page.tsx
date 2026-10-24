import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { communityPosts, postLikes } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { Badge } from "@/components/ui";
import { PostInteractions } from "@/components/post-interactions";
import { timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await db.query.communityPosts.findFirst({
    where: eq(communityPosts.id, Number(id)),
    with: {
      user: { columns: { id: true, name: true } },
      city: { with: { country: true } },
      comments: { with: { user: { columns: { id: true, name: true } } } },
    },
  });
  if (!post) notFound();

  const user = await getCurrentUser();
  let liked = false;
  if (user) {
    const rows = await db
      .select()
      .from(postLikes)
      .where(and(eq(postLikes.postId, post.id), eq(postLikes.userId, user.id)))
      .limit(1);
    liked = rows.length > 0;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <nav aria-label="Breadcrumb" className="text-xs text-stone-400">
        <Link href="/community" className="hover:text-brand-700">Community</Link> / {post.type}
      </nav>

      <article className="mt-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-base font-bold text-brand-800">
            {post.user.name.slice(0, 1)}
          </span>
          <div>
            <p className="text-sm font-semibold">{post.user.name}</p>
            <p className="text-xs text-stone-400">{timeAgo(post.createdAt)}</p>
          </div>
          <Badge tone="brand" className="ml-auto capitalize">{post.type}</Badge>
          {post.city && (
            <Link href={`/travel/${post.city.country.slug}/${post.city.slug}`}>
              <Badge tone="neutral">📍 {post.city.name}</Badge>
            </Link>
          )}
        </div>

        <h1 className="mt-5 font-display text-3xl font-semibold leading-tight tracking-tight">{post.title}</h1>
        {post.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.image} alt="" className="mt-5 w-full rounded-2xl object-cover" />
        )}
        <div className="prose mt-5 max-w-none whitespace-pre-line text-[15px] leading-relaxed text-stone-700">{post.body}</div>

        <div className="mt-8">
          <PostInteractions
            postId={post.id}
            initialLikes={post.likesCount}
            initialLiked={liked}
            initialComments={post.comments.map((c) => ({ id: c.id, body: c.body, createdAt: c.createdAt.toISOString(), user: c.user }))}
            signedIn={Boolean(user)}
          />
        </div>
      </article>
    </div>
  );
}
