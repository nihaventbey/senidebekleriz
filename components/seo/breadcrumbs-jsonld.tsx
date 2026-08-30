import { JsonLd } from "@/components/seo/json-ld";
import { getSiteUrl } from "@/lib/agents/site";

export type BreadcrumbItem = {
  name: string;
  path?: string;
};

export function buildBreadcrumbsJsonLd(items: BreadcrumbItem[]) {
  const baseUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => {
      const itemUrl = item.path
        ? item.path.startsWith("http")
          ? item.path
          : `${baseUrl}${item.path.startsWith("/") ? "" : "/"}${item.path}`
        : undefined;

      return {
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        ...(itemUrl ? { item: itemUrl } : {}),
      };
    }),
  };
}

export function BreadcrumbsJsonLd({ items }: { items: BreadcrumbItem[] }) {
  const jsonLd = buildBreadcrumbsJsonLd(items);
  return <JsonLd data={jsonLd} />;
}
