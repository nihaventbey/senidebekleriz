import { notFound } from "next/navigation";
import { getSkillContent } from "@/lib/agents/skills-index";
import { markdownResponse } from "@/lib/agents/http";

export const runtime = "nodejs";

const SKILL_DIRS: Record<string, string> = {
  "search-api": "search-api",
  "explore-places": "explore-places",
  "agent-discovery": "agent-discovery",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const dir = SKILL_DIRS[name];
  if (!dir) notFound();

  return markdownResponse(getSkillContent(dir));
}
