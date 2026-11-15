import { timingSafeEqual } from "node:crypto";

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** Constant-time authorization check for Vercel / external cron endpoints. */
export function authorizeCronRequest(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const authHeader = request.headers.get("authorization");
  if (authHeader && safeEqual(authHeader, `Bearer ${secret}`)) {
    return true;
  }

  const cronHeader = request.headers.get("x-cron-secret");
  return Boolean(cronHeader && safeEqual(cronHeader, secret));
}
