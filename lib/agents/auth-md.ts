import { absoluteUrl, getSiteUrl } from "@/lib/agents/site";

export const AUTH_MD_BODY = `# Seni de Bekleriz auth.md

Agent authentication and registration for **Seni de Bekleriz** — a Turkish cultural discovery platform.

## Audience

AI agents, MCP clients, and automated tools that consume our public read APIs or editor workflows.

## Anonymous access {#anonymous-access}

No credentials are required for public endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| \`/api/search\` | GET | Search cities and cultural places |
| \`/api/places\` | GET | List places with optional filters |
| \`/api/place-image\` | GET | Resolve a place cover image URL |
| \`/api/health\` | GET | Service health check |

Rate limits and caching headers apply. Respect \`robots.txt\` Content Signals.

## Protected admin API

Endpoints under \`/api/admin/*\` require an authenticated admin session (Supabase Auth).

- Protected resource metadata: ${absoluteUrl("/.well-known/oauth-protected-resource")}
- Authorization server metadata: ${absoluteUrl("/.well-known/oauth-authorization-server")}
- OpenID configuration: ${absoluteUrl("/.well-known/openid-configuration")}

## Registration {#registration}

### Anonymous agents

Use public APIs without registration. Identify your client via the \`User-Agent\` header.

Supported identity type: \`anonymous\`  
Credential type: \`none\`

### Human editors / admin agents

1. Request editor access via [İletişim](${absoluteUrl("/sayfa/iletisim")}).
2. Sign in at [${absoluteUrl("/yonetim/giris")}](${absoluteUrl("/yonetim/giris")}) after approval.
3. Use session cookies or bearer tokens issued by the authorization server.

## Discovery

- API catalog (RFC 9727): ${absoluteUrl("/.well-known/api-catalog")}
- OpenAPI: ${absoluteUrl("/.well-known/openapi.json")}
- Agent skills index: ${absoluteUrl("/.well-known/agent-skills/index.json")}
- MCP server card: ${absoluteUrl("/.well-known/mcp/server-card.json")}

## Content usage

\`Content-Signal: ai-train=no, search=yes, ai-input=no\` — see ${absoluteUrl("/robots.txt")}.
`;

export function buildMcpServerCard() {
  return {
    $schema:
      "https://raw.githubusercontent.com/modelcontextprotocol/modelcontextprotocol/main/schema/server-card.schema.json",
    serverInfo: {
      name: "senidebekleriz",
      version: "1.0.0",
      description:
        "Read-only tools for discovering Turkish museums, historic sites, and cultural venues.",
    },
    transport: {
      type: "streamable-http",
      endpoint: absoluteUrl("/api/mcp"),
    },
    capabilities: {
      tools: true,
      resources: false,
      prompts: false,
    },
    authentication: {
      type: "none",
      documentation: absoluteUrl("/auth.md"),
    },
    links: {
      apiCatalog: absoluteUrl("/.well-known/api-catalog"),
      openApi: absoluteUrl("/.well-known/openapi.json"),
      agentSkills: absoluteUrl("/.well-known/agent-skills/index.json"),
    },
    publisher: getSiteUrl(),
  };
}
