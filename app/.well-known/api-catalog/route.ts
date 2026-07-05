import { buildApiCatalog } from "@/lib/agents/api-catalog";
import { linksetResponse } from "@/lib/agents/http";

export const runtime = "nodejs";

export async function GET() {
  return linksetResponse(buildApiCatalog());
}
