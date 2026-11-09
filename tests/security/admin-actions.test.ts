import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUser, from } = vi.hoisted(() => ({ getUser: vi.fn(), from: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser } }),
}));
vi.mock("@/lib/supabase/admin", () => ({ supabaseAdmin: { from } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { getAdminUser, requireAdmin } from "@/lib/auth/admin";
import * as admin from "@/lib/actions/admin";
import * as articles from "@/lib/actions/articles";
import * as news from "@/lib/actions/news";
import * as events from "@/lib/actions/events";
import * as discovery from "@/lib/actions/discovery";
import * as autopilot from "@/lib/actions/autopilot";
import * as settings from "@/lib/actions/site-settings";
import * as account from "@/lib/actions/account";

const actions = Object.entries({ ...admin, ...articles, ...news, ...events, ...discovery, ...autopilot, ...settings });

describe("management authorization boundary", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  for (const identity of [null, { user_metadata: { role: "admin" }, app_metadata: {} }]) {
    describe(identity ? "forged user metadata" : "anonymous", () => {
      beforeEach(() => getUser.mockResolvedValue({ data: { user: identity }, error: null }));
      it.each(actions)("rejects %s before privileged side effects", async (_name, action) => {
        // Deliberately omit arguments: authorization must happen before parsing or accessing data.
        await expect((action as () => Promise<unknown>)()).rejects.toThrow("Yetkisiz erişim");
        expect(from).not.toHaveBeenCalled();
      });
      it("denies account changes", async () => {
        expect(await account.getAdminAccountEmail()).toBeNull();
        expect(await account.updateAdminPassword(new FormData())).toHaveProperty("error");
        expect(await account.updateAdminEmail(new FormData())).toHaveProperty("error");
      });
    });
  }

  it("accepts a server-assigned app role", async () => {
    const user = { id: "admin", app_metadata: { role: "admin" }, user_metadata: {} };
    getUser.mockResolvedValue({ data: { user }, error: null });
    expect(await requireAdmin()).toBe(user);
    from.mockReturnValue({ delete: () => ({ eq: async () => ({ error: null }) }) });
    await news.deleteNews("some-id");
    expect(from).toHaveBeenCalledWith("cultural_news");
  });

  it("fails closed on auth errors even if user data is present", async () => {
    getUser.mockResolvedValue({ data: { user: { app_metadata: { role: "admin" } } }, error: new Error("auth failed") });
    expect(await getAdminUser()).toBeNull();
  });
});
