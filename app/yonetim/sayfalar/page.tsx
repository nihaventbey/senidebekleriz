import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getAdminPages } from "@/lib/data/admin-pages";
import { PagesList } from "@/components/admin/pages-list";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPagesPage() {
  const pages = await getAdminPages();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sayfalar</h1>
          <p className="text-muted-foreground">
            İçerik sayfalarını yönetin, düzenleyin ve yeni sayfalar ekleyin.
          </p>
        </div>
        <Button asChild>
          <Link href="/yonetim/sayfalar/yeni">
            <Plus className="mr-2 h-4 w-4" />
            Yeni Sayfa
          </Link>
        </Button>
      </div>

      <PagesList pages={pages} />
    </div>
  );
}
