import { buildOAuthProtectedResourceMetadata } from "@/lib/agents/oauth-metadata";
import { jsonResponse } from "@/lib/agents/http";

export const runtime = "nodejs";

export async function GET() {
  return jsonResponse(buildOAuthProtectedResourceMetadata());
}
