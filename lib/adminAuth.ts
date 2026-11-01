import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "admin_session";

function secret(): string | null {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || null;
}

export function makeToken(): string | null {
  const s = secret();
  if (!s) return null;
  return createHmac("sha256", s).update("cynbit-admin-v1").digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function passwordMatches(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  // Compare fixed-length digests so neither content nor length leaks via timing.
  const digest = (x: string) => createHmac("sha256", "pw-compare").update(x).digest();
  return timingSafeEqual(digest(input), digest(expected));
}

export async function isAdmin(): Promise<boolean> {
  const token = makeToken();
  if (!token) return false;
  const value = (await cookies()).get(ADMIN_COOKIE)?.value;
  return !!value && safeEqual(value, token);
}