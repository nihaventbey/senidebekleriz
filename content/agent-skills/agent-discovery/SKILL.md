# Agent Discovery

Machine-readable discovery for Seni de Bekleriz.

## Well-known resources

| Resource | URL |
|----------|-----|
| API catalog (RFC 9727) | `/.well-known/api-catalog` |
| OpenAPI 3.1 | `/.well-known/openapi.json` |
| OAuth authorization server | `/.well-known/oauth-authorization-server` |
| OAuth protected resource | `/.well-known/oauth-protected-resource` |
| OpenID configuration | `/.well-known/openid-configuration` |
| Agent skills index | `/.well-known/agent-skills/index.json` |
| MCP server card | `/.well-known/mcp/server-card.json` |
| Auth.md | `/auth.md` |

## Content negotiation

Request any public HTML page with:

```http
Accept: text/markdown
```

The response uses `Content-Type: text/markdown`.

## Content signals

See `robots.txt`:

```
Content-Signal: ai-train=no, search=yes, ai-input=no
```
