"use client";

import { useEffect } from "react";

type WebMcpTool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (
    input: Record<string, unknown>,
    signal?: AbortSignal
  ) => Promise<unknown>;
};

type ModelContext = {
  registerTool: (tool: WebMcpTool) => () => void;
};

function getModelContext(): ModelContext | undefined {
  return (navigator as Navigator & { modelContext?: ModelContext })
    .modelContext;
}

async function fetchJson(url: string, signal?: AbortSignal) {
  const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

export function WebMcpTools() {
  useEffect(() => {
    const modelContext = getModelContext();
    if (!modelContext?.registerTool) return;

    const unregisterSearch = modelContext.registerTool({
      name: "search_cultural_places",
      description:
        "Search Turkish cities and cultural places (museums, historic sites, art venues).",
      inputSchema: {
        type: "object",
        properties: {
          q: { type: "string", minLength: 2, description: "Search query" },
        },
        required: ["q"],
      },
      execute: async (input, signal) => {
        const q = String(input.q ?? "");
        return fetchJson(`/api/search?q=${encodeURIComponent(q)}`, signal);
      },
    });

    const unregisterPlaces = modelContext.registerTool({
      name: "list_cultural_places",
      description: "List cultural places with optional city and category filters.",
      inputSchema: {
        type: "object",
        properties: {
          city: { type: "string" },
          category: { type: "string" },
          page: { type: "integer", minimum: 1 },
          limit: { type: "integer", minimum: 1, maximum: 50 },
        },
      },
      execute: async (input, signal) => {
        const params = new URLSearchParams();
        if (input.city) params.set("city", String(input.city));
        if (input.category) params.set("category", String(input.category));
        if (input.page) params.set("page", String(input.page));
        if (input.limit) params.set("limit", String(input.limit));
        return fetchJson(`/api/places?${params}`, signal);
      },
    });

    const unregisterNavigate = modelContext.registerTool({
      name: "get_site_paths",
      description:
        "Return canonical URLs for key sections of Seni de Bekleriz.",
      inputSchema: {
        type: "object",
        properties: {
          section: {
            type: "string",
            enum: ["home", "cities", "categories", "events", "blog", "api-docs"],
          },
        },
        required: ["section"],
      },
      execute: async (input) => {
        const paths: Record<string, string> = {
          home: "/",
          cities: "/sehirler",
          categories: "/kategoriler",
          events: "/etkinlikler",
          blog: "/blog",
          "api-docs": "/docs/api",
        };
        const section = String(input.section);
        const path = paths[section];
        if (!path) throw new Error("Unknown section");
        return { url: `${window.location.origin}${path}`, path };
      },
    });

    return () => {
      unregisterSearch();
      unregisterPlaces();
      unregisterNavigate();
    };
  }, []);

  return null;
}
