import { afterEach, describe, expect, it } from "vitest";
import { getSiteUrl } from "@/lib/agents/site";

describe("getSiteUrl", () => {
  const original = process.env.NEXT_PUBLIC_SITE_URL;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    } else {
      process.env.NEXT_PUBLIC_SITE_URL = original;
    }
  });

  it("defaults to https://www.senidebekleriz.com", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    expect(getSiteUrl()).toBe("https://www.senidebekleriz.com");
  });

  it("normalizes bare apex senidebekleriz.com to www.senidebekleriz.com", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://senidebekleriz.com/";
    expect(getSiteUrl()).toBe("https://www.senidebekleriz.com");

    process.env.NEXT_PUBLIC_SITE_URL = "http://senidebekleriz.com";
    expect(getSiteUrl()).toBe("https://www.senidebekleriz.com");
  });

  it("preserves custom preview/local URLs", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000/";
    expect(getSiteUrl()).toBe("http://localhost:3000");
  });
});
