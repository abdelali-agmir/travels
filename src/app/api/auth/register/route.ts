import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles, users } from "@/db/schema";
import { createSession, hashPassword } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const email = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");
    const name = String(body?.name ?? "").trim();
    const nationalityCode = body?.nationalityCode ? String(body.nationalityCode).toUpperCase().slice(0, 2) : null;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    if (password.length < 8) {
      return Response.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }
    if (name.length < 2 || name.length > 80) {
      return Response.json({ error: "Please enter your name (2–80 characters)." }, { status: 400 });
    }

    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existing.length) {
      return Response.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const [user] = await db
      .insert(users)
      .values({ email, passwordHash: hashPassword(password), name })
      .returning();
    await db.insert(profiles).values({ userId: user.id, nationalityCode, avatarSeed: name });
    await createSession(user.id);

    return Response.json({ ok: true, user: { id: user.id, name: user.name, email: user.email } });
  } catch {
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
