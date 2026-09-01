import { Metadata } from "next";
import { getAdminNewsList } from "@/lib/data/admin-news";
import { AdminNewsList } from "@/components/admin/news-list";

export const metadata: Metadata = {
  title: "Kültür Haberleri Yönetimi",
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ durum?: string }>;
};

export default async function AdminNewsPage({ searchParams }: Props) {
  const { durum } = await searchParams;
  const newsList = await getAdminNewsList(durum);

  return <AdminNewsList newsList={newsList} />;
}
