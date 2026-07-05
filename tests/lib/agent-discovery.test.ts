import { describe, expect, it } from "vitest";
import { buildApiCatalog } from "@/lib/agents/api-catalog";
import { buildAgentLinkHeader } from "@/lib/agents/link-headers";
import { buildHomepageMarkdown, estimateMarkdownTokens } from "@/lib/agents/markdown";
import { buildAgentSkillsIndex } from "@/lib/agents/skills-index";
import { AUTH_MD_BODY } from "@/lib/agents/auth-md";
import { buildOAuthAuthorizationServerMetadata } from "@/lib/agents/oauth-metadata";

describe("agent discovery", () => {
  it("builds RFC 9727 api catalog with service links", () => {
    const catalog = buildApiCatalog();
    expect(catalog.linkset.length).toBeGreaterThanOrEqual(3);
    expect(catalog.linkset[0]).toHaveProperty("anchor");
    expect(catalog.linkset[0]).toHaveProperty("service-desc");
    expect(catalog.linkset[0]).toHaveProperty("service-doc");
    expect(catalog.linkset[0]).toHaveProperty("status");
  });

  it("includes api-catalog link relation on homepage headers", () => {
    const link = buildAgentLinkHeader();
    expect(link).toContain('rel="api-catalog"');
    expect(link).toContain("/.well-known/api-catalog");
    expect(link).toContain('rel="service-doc"');
  });

  it("generates homepage markdown with discovery links", () => {
    const md = buildHomepageMarkdown();
    expect(md).toContain("# Seni de Bekleriz");
    expect(md).toContain("/.well-known/api-catalog");
    expect(estimateMarkdownTokens(md)).toBeGreaterThan(0);
  });

  it("indexes agent skills with sha256 digests", () => {
    const index = buildAgentSkillsIndex();
    expect(index.$schema).toContain("agentskills.io");
    expect(index.skills.length).toBe(3);
    for (const skill of index.skills) {
      expect(skill.digest).toMatch(/^sha256:[a-f0-9]{64}$/);
      expect(skill.url).toContain("/.well-known/agent-skills/");
    }
  });

  it("auth.md contains required heading", () => {
    expect(AUTH_MD_BODY).toMatch(/# .*auth\.md/i);
  });

  it("oauth metadata includes agent_auth block", () => {
    const oauth = buildOAuthAuthorizationServerMetadata();
    expect(oauth.issuer).toBeTruthy();
    expect(oauth.authorization_endpoint).toBeTruthy();
    expect(oauth.token_endpoint).toBeTruthy();
    expect(oauth.jwks_uri).toBeTruthy();
    expect(oauth.agent_auth).toBeTruthy();
  });
});
