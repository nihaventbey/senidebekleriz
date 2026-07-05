import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export type AgentSkillEntry = {
  name: string;
  type: "skill-md";
  description: string;
  url: string;
  digest: string;
};

const SKILLS_DIR = join(process.cwd(), "content/agent-skills");

const SKILL_MANIFEST: Array<{ dir: string; name: string; description: string }> =
  [
    {
      dir: "search-api",
      name: "search-api",
      description: "Search cities and cultural places via the public API.",
    },
    {
      dir: "explore-places",
      name: "explore-places",
      description: "List and filter museums, historic sites, and art venues.",
    },
    {
      dir: "agent-discovery",
      name: "agent-discovery",
      description:
        "Discover Seni de Bekleriz APIs, auth, and machine-readable metadata.",
    },
  ];

function sha256Digest(content: string): string {
  const hash = createHash("sha256").update(content).digest("hex");
  return `sha256:${hash}`;
}

export function getSkillContent(skillDir: string): string {
  return readFileSync(join(SKILLS_DIR, skillDir, "SKILL.md"), "utf8");
}

export function buildAgentSkillsIndex(): {
  $schema: string;
  publisher: string;
  skills: AgentSkillEntry[];
} {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://senidebekleriz.com";

  const skills = SKILL_MANIFEST.map(({ dir, name, description }) => {
    const content = getSkillContent(dir);
    return {
      name,
      type: "skill-md" as const,
      description,
      url: `${baseUrl}/.well-known/agent-skills/${name}/SKILL.md`,
      digest: sha256Digest(content),
    };
  });

  return {
    $schema: "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
    publisher: baseUrl,
    skills,
  };
}
