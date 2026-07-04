import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";

const adPlacements = [
  { position: "header", name: "Header Banner" },
  { position: "hero-bottom", name: "Hero Altı" },
  { position: "list-inline", name: "Liste Arası" },
  { position: "content-inline", name: "İçerik İçi" },
  { position: "sidebar", name: "Sidebar" },
  { position: "footer-top", name: "Footer Öncesi" },
];

export const dynamic = "force-dynamic";

export default function AdminAdsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reklamlar</h1>
          <p className="text-muted-foreground">
            Google AdSense reklam birimlerini yönetin.
          </p>
        </div>
        <Button disabled>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Birim
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pozisyon</TableHead>
              <TableHead>Ad Unit ID</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {adPlacements.map((placement) => (
              <TableRow key={placement.position}>
                <TableCell className="font-medium">{placement.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  Henüz atanmadı
                </TableCell>
                <TableCell>Aktif</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" disabled>
                    Düzenle
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
