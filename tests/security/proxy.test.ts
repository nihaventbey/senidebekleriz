import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const { getUser } = vi.hoisted(() => ({ getUser: vi.fn() }));
vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({ auth: { getUser } }),
}));
import { proxy } from "@/proxy";

describe("management proxy", () => {
  it("redirects forged metadata to login", async () => {
    getUser.mockResolvedValue({ data: { user: { user_metadata: { role: "admin" }, app_metadata: {} } } });
    const response = await proxy(new NextRequest("https://example.com/yonetim"));
    expect(response.headers.get("location")).toBe("https://example.com/yonetim/giris");
  });
  it("allows trusted administrator", async () => {
    getUser.mockResolvedValue({ data: { user: { app_metadata: { role: "admin" } } } });
    const response = await proxy(new NextRequest("https://example.com/yonetim"));
    expect(response.headers.get("location")).toBeNull();
    expect(response.status).toBe(200);
  });
  it("keeps login accessible without a session", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const response = await proxy(new NextRequest("https://example.com/yonetim/giris"));
    expect(response.headers.get("location")).toBeNull();
  });
  it("rejects unauthorized access to /api/admin", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const response = await proxy(new NextRequest("https://example.com/api/admin/places"));
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Yetkisiz erişim");
  });
  it("allows admin access to /api/admin", async () => {
    getUser.mockResolvedValue({ data: { user: { app_metadata: { role: "admin" } } } });
    const response = await proxy(new NextRequest("https://example.com/api/admin/places"));
    expect(response.status).toBe(200);
  });
});
