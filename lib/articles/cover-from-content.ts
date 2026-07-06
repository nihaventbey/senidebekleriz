import { extractMarkdownImageUrls } from "@/lib/markdown/extract-images";

export function resolveArticleCoverImage(
  coverImage: string | null | undefined,
  content: string
): string | null {
  if (coverImage?.trim()) return coverImage.trim();
  return extractMarkdownImageUrls(content)[0] ?? null;
}
