import { buildMcpServerCard } from "@/lib/agents/auth-md";
import { jsonResponse } from "@/lib/agents/http";

export const runtime = "nodejs";

export async function GET() {
  return jsonResponse(buildMcpServerCard());
}
