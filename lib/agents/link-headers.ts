export function buildAgentLinkHeader(): string {
  return [
    '</.well-known/api-catalog>; rel="api-catalog"',
    '</.well-known/openapi.json>; rel="service-desc"; type="application/json"',
    '</docs/api>; rel="service-doc"; type="text/html"',
    '</.well-known/agent-skills/index.json>; rel="describedby"; type="application/json"',
    '</.well-known/mcp/server-card.json>; rel="describedby"; type="application/json"',
    '</auth.md>; rel="describedby"; type="text/markdown"',
  ].join(", ");
}

export function applyAgentLinkHeaders(headers: Headers): void {
  headers.set("Link", buildAgentLinkHeader());
}
