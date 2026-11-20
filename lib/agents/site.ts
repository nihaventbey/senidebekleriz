const CANONICAL_WWW_SITE_URL = "https://www.senidebekleriz.com";

export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  if (!raw) return CANONICAL_WWW_SITE_URL;

  // Vercel redirects apex senidebekleriz.com -> www.senidebekleriz.com (HTTP 308).
  // Normalize apex host so canonicals, sitemap.xml, and robots.txt never point to a 308 redirect.
  if (/^https?:\/\/senidebekleriz\.com$/i.test(raw)) {
    return CANONICAL_WWW_SITE_URL;
  }

  return raw;
}

export function getSupabaseAuthIssuer(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!url) return `${getSiteUrl()}/auth`;
  return `${url}/auth/v1`;
}

export function absoluteUrl(path: string): string {
  const base = getSiteUrl();
  return path.startsWith("http") ? path : `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}
