import { describe, it, expect } from "vitest";
import {
  collectArticleImageUrls,
  extractMarkdownImageUrls,
} from "@/lib/markdown/extract-images";

describe("extractMarkdownImageUrls", () => {
  it("collects markdown image urls", () => {
    const content = `
## Başlık

![Müze](https://cdn.example.com/a.jpg)

Metin.

![Harita](https://cdn.example.com/b.png)
    `;

    expect(extractMarkdownImageUrls(content)).toEqual([
      "https://cdn.example.com/a.jpg",
      "https://cdn.example.com/b.png",
    ]);
  });

  it("puts cover first without duplicates", () => {
    const urls = collectArticleImageUrls(
      "![x](https://cdn.example.com/a.jpg)",
      "https://cdn.example.com/cover.jpg"
    );
    expect(urls[0]).toBe("https://cdn.example.com/cover.jpg");
    expect(urls).toHaveLength(2);
  });
});
