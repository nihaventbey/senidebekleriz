import { jsonResponse } from "@/lib/agents/http";

export const runtime = "nodejs";

export async function GET() {
  return jsonResponse({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}
