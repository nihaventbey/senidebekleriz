import { describe, expect, it } from "vitest";
import { renderMarkdown } from "@/lib/markdown";
import { sanitizeContentHtml, serializeJsonLd } from "@/lib/security/html";

describe("untrusted published content", () => {
  it("removes active HTML while preserving editorial formatting", () => {
    const result = renderMarkdown('## Başlık\n\n**Kalın** [kaynak](https://example.com)\n\n<img src="https://example.com/a.webp" onerror="alert(1)"><script>alert(1)</script><iframe src="https://example.com"></iframe>');
    expect(result).toContain("<h2>Başlık</h2>");
    expect(result).toContain("<strong>Kalın</strong>");
    expect(result).toContain('src="https://example.com/a.webp"');
    expect(result).not.toMatch(/onerror|<script|<iframe/);
  });
  it("rejects executable links and SVG in CMS HTML", () => {
    const result = sanitizeContentHtml('<a href="javascript:alert(1)">link</a><img src="data:image/svg+xml,x"><svg onload="alert(1)"></svg>');
    expect(result).not.toMatch(/javascript:|data:|<svg|onload/);
  });
  it("round trips JSON-LD without allowing script termination", () => {
    const data = { name: '</script><script>alert(1)</script>', description: "Kültür & sanat" };
    const result = serializeJsonLd(data);
    expect(result).not.toContain("<");
    expect(JSON.parse(result)).toEqual(data);
  });
});
