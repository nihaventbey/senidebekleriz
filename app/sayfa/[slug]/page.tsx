import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllPageSlugs, getPageBySlug } from "@/lib/data/pages";
import { BreadcrumbsJsonLd } from "@/components/seo/breadcrumbs-jsonld";

export const revalidate = 604800;

export async function generateStaticParams() {
  const slugs = await getAllPageSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPageBySlug(slug);
  if (!page) return {};

  return {
    title: page.meta_title,
    description: page.meta_description,
    alternates: {
      canonical: `/sayfa/${slug}`,
    },
    openGraph: {
      title: page.meta_title || page.title,
      description: page.meta_description,
      type: "article",
    },
  };
}

export default async function PagePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await getPageBySlug(slug);

  if (!page) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <BreadcrumbsJsonLd
        items={[
          { name: "Ana Sayfa", path: "/" },
          { name: page.title, path: `/sayfa/${page.slug}` },
        ]}
      />
      <article className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-bold tracking-tight">{page.title}</h1>
        <div
          className="prose prose-stone mt-8 max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      </article>
    </div>
  );
}
