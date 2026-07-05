import { buildOpenApiSpec } from "@/lib/agents/openapi";
import { jsonResponse } from "@/lib/agents/http";

export const runtime = "nodejs";

export async function GET() {
  return jsonResponse(buildOpenApiSpec(), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
