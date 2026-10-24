import "server-only";
import { cookies } from "next/headers";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { profiles, sessions, users } from "@/db/schema";

const SESSION_COOKIE = "wanderly_session";
const SESSION_DAYS = 30;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export async function createSession(userId: number): Promise<void> {
  const token = randomBytes(48).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(sessions).values({ token, userId, expiresAt });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    // Opt-in via env: previews may terminate TLS upstream or serve plain HTTP.
    secure: process.env.COOKIE_SECURE === "true",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.delete(sessions).where(eq(sessions.token, token));
  }
  cookieStore.delete(SESSION_COOKIE);
}

export type SessionUser = {
  id: number;
  email: string;
  name: string;
  role: "user" | "creator" | "admin";
  profile: typeof profiles.$inferSelect | null;
};

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      profile: profiles,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
    .limit(1);

  if (rows.length === 0) return null;
  return rows[0] as SessionUser;
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError("Not authenticated");
  }
  return user;
}

export class AuthError extends Error {}

export function unauthorized() {
  return Response.json({ error: "You need to sign in to do that." }, { status: 401 });
}
