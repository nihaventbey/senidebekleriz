import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createAdPlacement } from "@/lib/actions/admin";
import { AdPlacementForm } from "@/components/admin/ad-placement-form";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Yeni Reklam Birimi",
};

export default function NewAdPlacementPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/yonetim/reklamlar">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Yeni Reklam Birimi</h1>
      </div>

      <AdPlacementForm action={createAdPlacement} />
    </div>
  );
}
