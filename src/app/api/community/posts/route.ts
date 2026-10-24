import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { cities, communityPosts, users } from "@/db/schema";
import { getCurrentUser, unauthorized } from "@/lib/auth";

export const dynamic = "force-dynamic";

const POST_TYPES = ["story", "tip", "question", "route", "budget", "review"];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sort = searchParams.get("sort") ?? "latest";
  const limit = Math.min(30, Number(searchParams.get("limit")) || 20);

  const rows = await db
    .select({ post: communityPosts, author: { id: users.id, name: users.name }, city: cities })
    .from(communityPosts)
    .innerJoin(users, eq(communityPosts.userId, users.id))
    .leftJoin(cities, eq(communityPosts.cityId, cities.id))
    .orderBy(sort === "trending" ? desc(communityPosts.likesCount) : desc(communityPosts.createdAt))
    .limit(limit);
  return Response.json({ posts: rows });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const body = await req.json().catch(() => ({}));
  const title = String(body?.title ?? "").trim().slice(0, 220);
  const content = String(body?.body ?? "").trim().slice(0, 8000);
  const type = POST_TYPES.includes(body?.type) ? body.type : "story";
  const cityId = body?.cityId ? Number(body.cityId) : null;

  if (title.length < 8) return Response.json({ error: "Title should be at least 8 characters." }, { status: 400 });
  if (content.length < 20) return Response.json({ error: "Tell the community a bit more (20+ characters)." }, { status: 400 });

  if (cityId) {
    const city = await db.query.cities.findFirst({ where: eq(cities.id, cityId) });
    if (!city) return Response.json({ error: "Unknown city." }, { status: 400 });
  }

  const [post] = await db
    .insert(communityPosts)
    .values({ userId: user.id, title, body: content, type, cityId })
    .returning();
  return Response.json({ ok: true, postId: post.id });
}
