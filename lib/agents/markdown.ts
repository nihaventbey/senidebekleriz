import { absoluteUrl, getSiteUrl } from "@/lib/agents/site";

export function buildHomepageMarkdown(): string {
  const site = getSiteUrl();

  return `# Seni de Bekleriz

Türkiye'nin müzeleri, tarihi yerleri, sanat mekanları ve kültürel durakları için sanat ve tarihe yönelen bir keşif platformu.

## Keşfet

- [Şehirler](${site}/sehirler) — 81 il kültür rehberi
- [Kategoriler](${site}/kategoriler) — müze, tarih, sanat, park
- [Etkinlikler](${site}/etkinlikler) — kültür ve sanat gündemi
- [Gezi Rehberi](${site}/blog) — editör yazıları

## Public API

Machine-readable discovery:

- API catalog: ${absoluteUrl("/.well-known/api-catalog")}
- OpenAPI: ${absoluteUrl("/.well-known/openapi.json")}
- Documentation: ${absoluteUrl("/docs/api")}
- Agent skills: ${absoluteUrl("/.well-known/agent-skills/index.json")}
- MCP server card: ${absoluteUrl("/.well-known/mcp/server-card.json")}
- Auth: ${absoluteUrl("/auth.md")}

### Endpoints

- \`GET /api/search?q=\` — search cities and places
- \`GET /api/places\` — list places (optional \`city\`, \`category\`, \`page\`, \`limit\`)
- \`GET /api/place-image\` — resolve place cover image
- \`GET /api/health\` — health check

## Content preferences

- Search indexing: allowed
- AI training: not allowed (\`ai-train=no\`)
- AI input / RAG: not allowed (\`ai-input=no\`)

See [robots.txt](${site}/robots.txt) for Content Signals.
`;
}

export function buildPageMarkdown(path: string, title: string): string {
  const site = getSiteUrl();
  const url = `${site}${path}`;

  return `# ${title}

Canonical URL: ${url}

This page is part of Seni de Bekleriz — a Turkish cultural discovery platform focused on museums, historic sites, and art venues (not restaurants).

## Discovery

- API catalog: ${absoluteUrl("/.well-known/api-catalog")}
- Full site markdown: request this URL with \`Accept: text/markdown\`
- Homepage: ${site}/

## Related

- [Search API](${site}/api/search?q=example)
- [Places API](${site}/api/places)
`;
}

export function estimateMarkdownTokens(markdown: string): number {
  return Math.ceil(markdown.length / 4);
}
