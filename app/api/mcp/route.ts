import { NextRequest } from "next/server";
import { absoluteUrl } from "@/lib/agents/site";
import { jsonResponse } from "@/lib/agents/http";

export const runtime = "nodejs";

const TOOLS = [
  {
    name: "search",
    description:
      "Search Turkish cities and cultural places (museums, historic sites, art venues).",
    inputSchema: {
      type: "object",
      properties: {
        q: { type: "string", minLength: 2, description: "Search query" },
      },
      required: ["q"],
    },
  },
  {
    name: "list_places",
    description: "List cultural places with optional city and category filters.",
    inputSchema: {
      type: "object",
      properties: {
        city: { type: "string", description: "City slug, e.g. istanbul" },
        category: {
          type: "string",
          description: "Category slug: muzeler, tarihi-yer, sanat-mekanlari, parklar",
        },
        page: { type: "integer", minimum: 1 },
        limit: { type: "integer", minimum: 1, maximum: 50 },
      },
    },
  },
];

async function callTool(
  name: string,
  args: Record<string, unknown>,
  origin: string
) {
  if (name === "search") {
    const q = String(args.q ?? "");
    const res = await fetch(
      `${origin}/api/search?q=${encodeURIComponent(q)}`,
      { headers: { Accept: "application/json" } }
    );
    return res.json();
  }

  if (name === "list_places") {
    const params = new URLSearchParams();
    if (args.city) params.set("city", String(args.city));
    if (args.category) params.set("category", String(args.category));
    if (args.page) params.set("page", String(args.page));
    if (args.limit) params.set("limit", String(args.limit));
    const res = await fetch(`${origin}/api/places?${params}`, {
      headers: { Accept: "application/json" },
    });
    return res.json();
  }

  throw new Error(`Unknown tool: ${name}`);
}

export async function GET() {
  return jsonResponse({
    protocol: "mcp",
    transport: "streamable-http",
    server: "senidebekleriz",
    tools: TOOLS,
    documentation: absoluteUrl("/docs/api"),
  });
}

export async function POST(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return jsonResponse({ error: "Invalid JSON-RPC request" }, { status: 400 });
  }

  const { jsonrpc, id, method, params } = body as {
    jsonrpc?: string;
    id?: string | number;
    method?: string;
    params?: Record<string, unknown>;
  };

  if (method === "tools/list") {
    return jsonResponse({
      jsonrpc: jsonrpc || "2.0",
      id: id ?? null,
      result: { tools: TOOLS },
    });
  }

  if (method === "tools/call") {
    const name = String(params?.name ?? "");
    const args = (params?.arguments as Record<string, unknown>) || {};
    try {
      const result = await callTool(name, args, origin);
      return jsonResponse({
        jsonrpc: jsonrpc || "2.0",
        id: id ?? null,
        result: { content: [{ type: "text", text: JSON.stringify(result) }] },
      });
    } catch (error) {
      return jsonResponse({
        jsonrpc: jsonrpc || "2.0",
        id: id ?? null,
        error: {
          code: -32601,
          message: error instanceof Error ? error.message : "Tool error",
        },
      });
    }
  }

  return jsonResponse({
    jsonrpc: jsonrpc || "2.0",
    id: id ?? null,
    error: { code: -32601, message: "Method not found" },
  });
}
