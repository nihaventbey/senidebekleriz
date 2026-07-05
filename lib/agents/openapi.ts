import { absoluteUrl, getSiteUrl } from "@/lib/agents/site";

export function buildOpenApiSpec() {
  const site = getSiteUrl();

  return {
    openapi: "3.1.0",
    info: {
      title: "Seni de Bekleriz Public API",
      version: "1.0.0",
      description:
        "Read-only public APIs for discovering Turkish cultural places, cities, and images.",
    },
    servers: [{ url: site }],
    paths: {
      "/api/search": {
        get: {
          operationId: "search",
          summary: "Search cities and cultural places",
          parameters: [
            {
              name: "q",
              in: "query",
              required: true,
              schema: { type: "string", minLength: 2 },
              description: "Search query (minimum 2 characters)",
            },
          ],
          responses: {
            "200": {
              description: "Matching cities and places",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      results: {
                        type: "array",
                        items: {
                          oneOf: [
                            {
                              type: "object",
                              properties: {
                                type: { const: "city" },
                                name: { type: "string" },
                                slug: { type: "string" },
                                description: { type: "string", nullable: true },
                              },
                            },
                            {
                              type: "object",
                              properties: {
                                type: { const: "place" },
                                name: { type: "string" },
                                slug: { type: "string" },
                                citySlug: { type: "string" },
                                cityName: { type: "string" },
                                description: { type: "string", nullable: true },
                              },
                            },
                          ],
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/places": {
        get: {
          operationId: "listPlaces",
          summary: "List cultural places",
          parameters: [
            {
              name: "city",
              in: "query",
              schema: { type: "string" },
              description: "Filter by city slug",
            },
            {
              name: "category",
              in: "query",
              schema: { type: "string" },
              description: "Filter by category slug",
            },
            {
              name: "page",
              in: "query",
              schema: { type: "integer", minimum: 1, default: 1 },
            },
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", minimum: 1, maximum: 50, default: 20 },
            },
          ],
          responses: {
            "200": {
              description: "Paginated place list",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      items: { type: "array", items: { type: "object" } },
                      total: { type: "integer" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/place-image": {
        get: {
          operationId: "getPlaceImage",
          summary: "Resolve a cover image for a place",
          parameters: [
            {
              name: "placeName",
              in: "query",
              required: true,
              schema: { type: "string" },
            },
            {
              name: "cityName",
              in: "query",
              schema: { type: "string" },
            },
            {
              name: "wikidataId",
              in: "query",
              schema: { type: "string", nullable: true },
            },
          ],
          responses: {
            "200": {
              description: "Image URL if found",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      image: { type: "string", nullable: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/health": {
        get: {
          operationId: "health",
          summary: "API health check",
          responses: {
            "200": {
              description: "Service is healthy",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: { type: "string", enum: ["ok"] },
                      timestamp: { type: "string", format: "date-time" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    externalDocs: {
      description: "Human-readable API documentation",
      url: absoluteUrl("/docs/api"),
    },
  };
}
