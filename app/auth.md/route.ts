import { AUTH_MD_BODY } from "@/lib/agents/auth-md";
import { markdownResponse } from "@/lib/agents/http";

export const runtime = "nodejs";

export async function GET() {
  return markdownResponse(AUTH_MD_BODY);
}
