import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAdminAdPlacements } from "@/lib/data/admin";
import { Plus, Pencil } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminAdsPage() {
  const placements = await getAdminAdPlacements();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reklamlar</h1>
          <p className="text-muted-foreground">
            Google AdSense reklam birimlerini yönetin.
          </p>
        </div>
        <Button asChild>
          <Link href="/yonetim/reklamlar/yeni">
            <Plus className="mr-2 h-4 w-4" />
            Yeni Birim
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Birim</TableHead>
              <TableHead>Pozisyon</TableHead>
              <TableHead>Ad Unit ID</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {placements.map((placement) => (
              <TableRow key={placement.id}>
                <TableCell className="font-medium">{placement.name}</TableCell>
                <TableCell>{placement.position}</TableCell>
                <TableCell className="text-muted-foreground">
                  {placement.ad_unit_id || "Henüz atanmadı"}
                </TableCell>
                <TableCell>{placement.is_active ? "Aktif" : "Pasif"}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/yonetim/reklamlar/${placement.id}/duzenle`}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Düzenle
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
