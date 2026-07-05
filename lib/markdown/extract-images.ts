const MARKDOWN_IMAGE_REGEX = /!\[[^\]]*\]\(([^)]+)\)/g;

export function extractMarkdownImageUrls(content: string): string[] {
  const urls = new Set<string>();
  for (const match of content.matchAll(MARKDOWN_IMAGE_REGEX)) {
    const url = match[1]?.trim();
    if (url) urls.add(url);
  }
  return [...urls];
}

export function collectArticleImageUrls(
  content: string,
  coverImage?: string | null
): string[] {
  const urls = extractMarkdownImageUrls(content);
  if (coverImage?.trim()) {
    return [coverImage.trim(), ...urls.filter((u) => u !== coverImage.trim())];
  }
  return urls;
}
