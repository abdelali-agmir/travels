import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { communityPosts, postComments, postLikes } from "@/db/schema";
import { getCurrentUser, unauthorized } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await db.query.communityPosts.findFirst({
    where: eq(communityPosts.id, Number(id)),
    with: { user: { columns: { id: true, name: true } }, city: true, comments: { with: { user: { columns: { id: true, name: true } } } } },
  });
  if (!post) return Response.json({ error: "Post not found." }, { status: 404 });

  const user = await getCurrentUser();
  let liked = false;
  if (user) {
    const like = await db
      .select()
      .from(postLikes)
      .where(and(eq(postLikes.postId, post.id), eq(postLikes.userId, user.id)))
      .limit(1);
    liked = like.length > 0;
  }
  return Response.json({ post, liked });
}

/** POST { action: "like" } toggles like; { action: "comment", body } adds a comment. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const postId = Number(id);
  const post = await db.query.communityPosts.findFirst({ where: eq(communityPosts.id, postId) });
  if (!post) return Response.json({ error: "Post not found." }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const action = String(body?.action ?? "");

  if (action === "like") {
    const existing = await db
      .select()
      .from(postLikes)
      .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, user.id)))
      .limit(1);
    if (existing.length) {
      await db.delete(postLikes).where(and(eq(postLikes.postId, postId), eq(postLikes.userId, user.id)));
      await db
        .update(communityPosts)
        .set({ likesCount: sql`greatest(${communityPosts.likesCount} - 1, 0)` })
        .where(eq(communityPosts.id, postId));
      return Response.json({ ok: true, liked: false });
    }
    await db.insert(postLikes).values({ postId, userId: user.id });
    await db
      .update(communityPosts)
      .set({ likesCount: sql`${communityPosts.likesCount} + 1` })
      .where(eq(communityPosts.id, postId));
    return Response.json({ ok: true, liked: true });
  }

  if (action === "comment") {
    const text = String(body?.body ?? "").trim().slice(0, 2000);
    if (text.length < 2) return Response.json({ error: "Comment is too short." }, { status: 400 });
    const [comment] = await db.insert(postComments).values({ postId, userId: user.id, body: text }).returning();
    await db
      .update(communityPosts)
      .set({ commentsCount: sql`${communityPosts.commentsCount} + 1` })
      .where(eq(communityPosts.id, postId));
    return Response.json({ ok: true, comment: { ...comment, user: { id: user.id, name: user.name } } });
  }

  return Response.json({ error: "Unknown action." }, { status: 400 });
}
