import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, verifyPassword } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const email = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");
    if (!email || !password) {
      return Response.json({ error: "Email and password are required." }, { status: 400 });
    }

    const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const user = rows[0];
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return Response.json({ error: "Incorrect email or password." }, { status: 401 });
    }

    await createSession(user.id);
    return Response.json({ ok: true, user: { id: user.id, name: user.name, role: user.role } });
  } catch {
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
