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
import { getAdSlotLabel } from "@/lib/ads/slots";
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
            AdSense slot ID&apos;lerini buradan yönetin — Vercel env gerekmez.
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
              <TableHead>Slot ID</TableHead>
              <TableHead>Format</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {placements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Henüz reklam pozisyonu yok. Migration çalıştırın veya yeni birim ekleyin.
                </TableCell>
              </TableRow>
            ) : (
              placements.map((placement) => (
                <TableRow key={placement.id}>
                  <TableCell className="font-medium">{placement.name}</TableCell>
                  <TableCell>
                    <div className="text-sm">{getAdSlotLabel(placement.position)}</div>
                    <div className="text-xs text-muted-foreground">
                      {placement.position}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {placement.ad_unit_id || "—"}
                  </TableCell>
                  <TableCell>{placement.ad_format || "auto"}</TableCell>
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
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
