import { getSiteUrl } from "@/lib/agents/site";

export const dynamic = "force-static";

export async function GET() {
  const baseUrl = getSiteUrl();

  const body = `User-agent: Mediapartners-Google
Allow: /

User-agent: *
Allow: /
Disallow: /yonetim
Disallow: /yonetim/
Content-Signal: ai-train=no, search=yes, ai-input=no

Sitemap: ${baseUrl}/sitemap.xml
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
