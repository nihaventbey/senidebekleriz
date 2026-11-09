import { lookup } from "node:dns/promises";
import type { LookupAddress } from "node:dns";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { createBrotliDecompress, createGunzip, createInflate } from "node:zlib";
import ipaddr from "ipaddr.js";

const REDIRECTS = new Set([301, 302, 303, 307, 308]);

async function resolveWithinDeadline(hostname: string, signal: AbortSignal): Promise<LookupAddress[]> {
  return new Promise((resolve, reject) => {
    const abort = () => reject(signal.reason);
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) {
      signal.removeEventListener("abort", abort);
      reject(signal.reason);
      return;
    }
    lookup(hostname, { all: true, verbatim: true }).then(resolve, reject).finally(() => {
      signal.removeEventListener("abort", abort);
    });
  });
}

export function isPublicAddress(address: string): boolean {
  if (!ipaddr.isValid(address)) return false;
  // process() also normalizes IPv4-mapped IPv6 before checking special ranges.
  return ipaddr.process(address).range() === "unicast";
}

export function validatePublicUrl(input: string): URL {
  const url = new URL(input);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Geçersiz URL");
  if (url.username || url.password || url.port) throw new Error("URL kimlik bilgisi/portu yasak");
  const hostname = url.hostname.replace(/^\[|\]$/g, "").replace(/\.$/, "");
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local")) {
    throw new Error("Yerel ağ adresi yasak");
  }
  if (ipaddr.isValid(hostname) && !isPublicAddress(hostname)) throw new Error("Yerel ağ adresi yasak");
  return url;
}

/** Validate every redirect, pin DNS to the checked IP, and cap decoded bytes. */
export async function fetchPublicResource(input: string, options: {
  method?: "GET" | "HEAD";
  headers?: HeadersInit;
  signal?: AbortSignal;
  maxBytes?: number;
} = {}) {
  const signal = options.signal ?? AbortSignal.timeout(15_000);
  const maxBytes = options.maxBytes ?? 2 * 1024 * 1024;
  let current = input;

  for (let hop = 0; hop <= 5; hop++) {
    signal.throwIfAborted();
    const url = validatePublicUrl(current);
    const hostname = url.hostname.replace(/^\[|\]$/g, "");
    const addresses = await resolveWithinDeadline(hostname, signal);
    signal.throwIfAborted();
    if (!addresses.length || addresses.some(({ address }) => !isPublicAddress(address))) {
      throw new Error("Yerel veya özel ağ hedefi yasak");
    }
    const pinned = addresses[0];
    const headers = new Headers(options.headers);
    // Credentials and caller-controlled routing must not cross origins on redirects.
    for (const name of ["authorization", "cookie", "host", "proxy-authorization"]) headers.delete(name);
    headers.set("accept-encoding", "identity");
    const result = await new Promise<{ status: number; headers: Headers; bytes: Buffer }>((resolve, reject) => {
      const request = url.protocol === "https:" ? httpsRequest : httpRequest;
      const req = request(url, {
        method: options.method ?? "GET",
        agent: false,
        family: pinned.family,
        lookup: (_host, _options, callback) => callback(null, pinned.address, pinned.family),
        headers: Object.fromEntries(headers.entries()),
        signal,
      }, (res) => {
        const responseHeaders = new Headers();
        for (const [name, value] of Object.entries(res.headers)) {
          if (value !== undefined) responseHeaders.set(name, Array.isArray(value) ? value.join(", ") : value);
        }
        const status = res.statusCode ?? 502;
        if (REDIRECTS.has(status) || options.method === "HEAD") {
          res.destroy();
          resolve({ status, headers: responseHeaders, bytes: Buffer.alloc(0) });
          return;
        }
        if (Number(responseHeaders.get("content-length")) > maxBytes) {
          res.destroy();
          reject(new Error("Yanıt boyutu sınırı aşıldı"));
          return;
        }
        const encoding = responseHeaders.get("content-encoding")?.toLowerCase();
        const decoder = encoding === "gzip" ? createGunzip()
          : encoding === "br" ? createBrotliDecompress()
          : encoding === "deflate" ? createInflate() : null;
        if (encoding && encoding !== "identity" && !decoder) {
          res.destroy();
          reject(new Error("Desteklenmeyen yanıt sıkıştırması"));
          return;
        }
        const stream = decoder ? res.pipe(decoder) : res;
        const chunks: Buffer[] = [];
        let size = 0;
        const fail = (error: Error) => {
          res.destroy();
          decoder?.destroy();
          reject(error);
        };
        res.on("error", fail);
        stream.on("error", fail);
        stream.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > maxBytes) { fail(new Error("Yanıt boyutu sınırı aşıldı")); return; }
          chunks.push(chunk);
        });
        stream.on("end", () => resolve({ status, headers: responseHeaders, bytes: Buffer.concat(chunks) }));
      });
      req.on("error", reject);
      req.end();
    });
    if (REDIRECTS.has(result.status)) {
      const location = result.headers.get("location");
      if (!location || hop === 5) throw new Error("Geçersiz veya çok fazla yönlendirme");
      current = new URL(location, url).href;
      continue;
    }
    return {
      status: result.status,
      ok: result.status >= 200 && result.status < 300,
      headers: result.headers,
      url: url.href,
      text: async () => result.bytes.toString("utf8"),
      arrayBuffer: async () => result.bytes,
    };
  }
  throw new Error("Çok fazla yönlendirme");
}
