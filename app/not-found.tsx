import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container mx-auto flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <h1 className="text-6xl font-bold tracking-tight text-primary">404</h1>
      <h2 className="mt-4 text-2xl font-semibold">Sayfa Bulunamadı</h2>
      <p className="mt-4 max-w-md text-muted-foreground">
        Aradığınız sayfa taşınmış, silinmiş veya hiç var olmamış olabilir.
      </p>
      <Button asChild className="mt-8">
        <Link href="/">Ana Sayfaya Dön</Link>
      </Button>
    </div>
  );
}
