import { absoluteUrl, getSiteUrl } from "@/lib/agents/site";

export function buildApiCatalog() {
  const site = getSiteUrl();

  return {
    linkset: [
      {
        anchor: absoluteUrl("/api/search"),
        "service-desc": [
          {
            href: absoluteUrl("/.well-known/openapi.json"),
            type: "application/json",
          },
        ],
        "service-doc": [
          {
            href: absoluteUrl("/docs/api#search"),
            type: "text/html",
          },
        ],
        status: [
          {
            href: absoluteUrl("/api/health"),
            type: "application/json",
          },
        ],
      },
      {
        anchor: absoluteUrl("/api/places"),
        "service-desc": [
          {
            href: absoluteUrl("/.well-known/openapi.json"),
            type: "application/json",
          },
        ],
        "service-doc": [
          {
            href: absoluteUrl("/docs/api#places"),
            type: "text/html",
          },
        ],
        status: [
          {
            href: absoluteUrl("/api/health"),
            type: "application/json",
          },
        ],
      },
      {
        anchor: absoluteUrl("/api/place-image"),
        "service-desc": [
          {
            href: absoluteUrl("/.well-known/openapi.json"),
            type: "application/json",
          },
        ],
        "service-doc": [
          {
            href: absoluteUrl("/docs/api#place-image"),
            type: "text/html",
          },
        ],
        status: [
          {
            href: absoluteUrl("/api/health"),
            type: "application/json",
          },
        ],
      },
    ],
    profile: "https://www.rfc-editor.org/info/rfc9727",
    publisher: site,
  };
}
