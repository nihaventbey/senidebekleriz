import { slugify } from "@/lib/slugify";

export function uniqueEventSlug(base: string, attempt = 0): string {
  const slug = attempt === 0 ? slugify(base) : `${slugify(base)}-${attempt}`;
  return slug.slice(0, 120);
}
