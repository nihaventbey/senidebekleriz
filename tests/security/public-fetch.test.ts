import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import { gzipSync } from "node:zlib";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ lookup: vi.fn(), request: vi.fn() }));
vi.mock("node:dns/promises", () => ({ lookup: mocks.lookup }));
vi.mock("node:http", () => ({ request: mocks.request }));
vi.mock("node:https", () => ({ request: mocks.request }));
import { fetchPublicResource, isPublicAddress, validatePublicUrl } from "@/lib/security/public-fetch";

function respond(status: number, headers: Record<string, string>, body = Buffer.alloc(0)) {
  mocks.request.mockImplementationOnce((_url, _options, callback) => {
    const req = new EventEmitter() as EventEmitter & { end: () => void };
    req.end = () => queueMicrotask(() => {
      const res = Object.assign(new PassThrough(), { statusCode: status, headers });
      callback(res);
      if (!res.destroyed) res.end(body);
    });
    return req;
  });
}

describe("public resource network boundary", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.lookup.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);
  });

  it.each(["127.0.0.1", "10.0.0.1", "172.16.0.1", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "::1", "fe80::1", "fc00::1", "::ffff:127.0.0.1"])("blocks special IP %s", (ip) => {
    expect(isPublicAddress(ip)).toBe(false);
  });
  it.each(["http://2130706433/", "http://0x7f000001/", "http://[::1]/", "http://localhost./", "http://user:pass@example.com/", "http://example.com:8080/", "file:///etc/passwd"])("rejects unsafe URL %s", (url) => {
    expect(() => validatePublicUrl(url)).toThrow();
  });
  it("rejects mixed public/private DNS without making a request", async () => {
    mocks.lookup.mockResolvedValue([{ address: "93.184.216.34", family: 4 }, { address: "127.0.0.1", family: 4 }]);
    await expect(fetchPublicResource("https://example.com")).rejects.toThrow("özel ağ");
    expect(mocks.request).not.toHaveBeenCalled();
  });
  it("validates redirect destinations before connecting", async () => {
    respond(302, { location: "http://169.254.169.254/latest/" });
    await expect(fetchPublicResource("https://example.com")).rejects.toThrow("Yerel ağ");
    expect(mocks.request).toHaveBeenCalledTimes(1);
  });
  it("pins the connection to the validated address and drops credentials", async () => {
    respond(200, {}, Buffer.from("kültür"));
    const response = await fetchPublicResource("https://example.com", { headers: { Cookie: "secret", Authorization: "secret" } });
    const options = mocks.request.mock.calls[0][1];
    const callback = vi.fn();
    options.lookup("example.com", {}, callback);
    expect(callback).toHaveBeenCalledWith(null, "93.184.216.34", 4);
    expect(options.headers).not.toHaveProperty("cookie");
    expect(options.headers).not.toHaveProperty("authorization");
    expect(await response.text()).toBe("kültür");
  });
  it("caps chunked responses without trusting Content-Length", async () => {
    respond(200, {}, Buffer.alloc(101));
    await expect(fetchPublicResource("https://example.com", { maxBytes: 100 })).rejects.toThrow("boyutu");
  });
  it("caps decompressed bytes", async () => {
    respond(200, { "content-encoding": "gzip" }, gzipSync(Buffer.alloc(1000)));
    await expect(fetchPublicResource("https://example.com", { maxBytes: 100 })).rejects.toThrow("boyutu");
  });
  it("does not connect after cancellation", async () => {
    await expect(fetchPublicResource("https://example.com", { signal: AbortSignal.abort() })).rejects.toThrow();
    expect(mocks.request).not.toHaveBeenCalled();
  });
  it("honors cancellation while DNS is still pending", async () => {
    mocks.lookup.mockReturnValue(new Promise(() => {}));
    const controller = new AbortController();
    const pending = fetchPublicResource("https://example.com", { signal: controller.signal });
    controller.abort(new Error("deadline"));
    await expect(pending).rejects.toThrow("deadline");
    expect(mocks.request).not.toHaveBeenCalled();
  });
});
