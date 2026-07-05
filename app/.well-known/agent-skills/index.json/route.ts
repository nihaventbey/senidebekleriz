import { buildAgentSkillsIndex } from "@/lib/agents/skills-index";
import { jsonResponse } from "@/lib/agents/http";

export const runtime = "nodejs";

export async function GET() {
  return jsonResponse(buildAgentSkillsIndex());
}
