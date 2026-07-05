import Link from "next/link";
import { absoluteUrl } from "@/lib/agents/site";

export const metadata = {
  title: "API Documentation",
  description: "Public API documentation for Seni de Bekleriz.",
};

export default function ApiDocsPage() {
  const openApiUrl = absoluteUrl("/.well-known/openapi.json");
  const catalogUrl = absoluteUrl("/.well-known/api-catalog");

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <p className="text-sm font-semibold uppercase tracking-wider text-primary">
        Agent &amp; Developer API
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">
        Public API Documentation
      </h1>
      <p className="mt-4 text-muted-foreground">
        Read-only endpoints for discovering Turkish museums, historic sites, and
        cultural venues. Machine discovery via{" "}
        <a href={catalogUrl} className="text-primary underline">
          API catalog
        </a>{" "}
        and{" "}
        <a href={openApiUrl} className="text-primary underline">
          OpenAPI
        </a>
        .
      </p>

      <section id="search" className="mt-10 scroll-mt-24">
        <h2 className="text-xl font-semibold">GET /api/search</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Search cities and places. Requires <code>q</code> (min. 2 characters).
        </p>
        <pre className="mt-4 overflow-x-auto rounded-lg bg-muted p-4 text-sm">
          {`GET /api/search?q=ayasofya`}
        </pre>
      </section>

      <section id="places" className="mt-10 scroll-mt-24">
        <h2 className="text-xl font-semibold">GET /api/places</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          List places. Optional filters: <code>city</code>,{" "}
          <code>category</code>, <code>page</code>, <code>limit</code> (max 50).
        </p>
        <pre className="mt-4 overflow-x-auto rounded-lg bg-muted p-4 text-sm">
          {`GET /api/places?city=istanbul&category=muzeler&limit=10`}
        </pre>
      </section>

      <section id="place-image" className="mt-10 scroll-mt-24">
        <h2 className="text-xl font-semibold">GET /api/place-image</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Resolve a cover image URL. Requires <code>placeName</code>; optional{" "}
          <code>cityName</code>, <code>wikidataId</code>.
        </p>
        <pre className="mt-4 overflow-x-auto rounded-lg bg-muted p-4 text-sm">
          {`GET /api/place-image?placeName=Ayasofya&cityName=İstanbul`}
        </pre>
      </section>

      <section id="health" className="mt-10 scroll-mt-24">
        <h2 className="text-xl font-semibold">GET /api/health</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Health check — returns <code>{`{ "status": "ok" }`}</code>.
        </p>
      </section>

      <section className="mt-10 rounded-xl border bg-muted/30 p-6">
        <h2 className="text-lg font-semibold">Agent discovery</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>
            <Link href="/.well-known/api-catalog" className="text-primary hover:underline">
              /.well-known/api-catalog
            </Link>
          </li>
          <li>
            <Link href="/.well-known/agent-skills/index.json" className="text-primary hover:underline">
              /.well-known/agent-skills/index.json
            </Link>
          </li>
          <li>
            <Link href="/auth.md" className="text-primary hover:underline">
              /auth.md
            </Link>
          </li>
        </ul>
        <p className="mt-4 text-sm text-muted-foreground">
          Request any public page with{" "}
          <code>Accept: text/markdown</code> for a markdown representation.
        </p>
      </section>
    </div>
  );
}
