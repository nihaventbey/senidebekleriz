import Link from "next/link";
import { MapPin } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/30 mt-auto">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <Link href="/" className="flex items-center gap-2 text-lg font-bold">
              <MapPin className="h-5 w-5 text-primary" />
              <span>Seni de Bekleriz</span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">
              Türkiye&apos;nin şehirlerini ve gezilecek yerlerini keşfet.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Keşfet</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/sehirler" className="hover:text-foreground">
                  Şehirler
                </Link>
              </li>
              <li>
                <Link href="/kategoriler" className="hover:text-foreground">
                  Kategoriler
                </Link>
              </li>
              <li>
                <Link href="/sayfa/hakkimizda" className="hover:text-foreground">
                  Hakkımızda
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Yasal</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/sayfa/kullanim-kosullari" className="hover:text-foreground">
                  Kullanım Koşulları
                </Link>
              </li>
              <li>
                <Link href="/sayfa/gizlilik-politikasi" className="hover:text-foreground">
                  Gizlilik Politikası
                </Link>
              </li>
              <li>
                <Link href="/sayfa/iletisim" className="hover:text-foreground">
                  İletişim
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t pt-6 text-center text-sm text-muted-foreground">
          © {currentYear} Seni de Bekleriz. Tüm hakları saklıdır.
        </div>
      </div>
    </footer>
  );
}
