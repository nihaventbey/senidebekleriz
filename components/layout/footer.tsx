"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/layout/logo";
import { DeveloperCredit } from "@/components/layout/developer-credit";
import type { BrandSettings } from "@/lib/settings/branding";

type FooterProps = {
  brand?: BrandSettings;
};

export function Footer({ brand }: FooterProps) {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();

  if (pathname?.startsWith("/embed")) {
    return null;
  }

  return (
    <footer className="border-t border-border/60 bg-muted/20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <Logo brand={brand} />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Türkiye'nin güncel kültür, sanat ve şehir ajandası. Sergi, tiyatro, konser, festival ve arkeoloji haberleri tek adreste.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Ajanda &amp; Kültür</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link href="/etkinlikler" className="transition-colors hover:text-foreground">
                  Etkinlik Takvimi
                </Link>
              </li>
              <li>
                <Link href="/haberler" className="transition-colors hover:text-foreground">
                  Kültür &amp; Sanat Haberleri
                </Link>
              </li>
              <li>
                <Link href="/etkinlikler?zaman=haftasonu" className="transition-colors hover:text-foreground">
                  Bu Hafta Sonu Ne Var?
                </Link>
              </li>
              <li>
                <Link href="/etkinlikler?tur=sergi" className="transition-colors hover:text-foreground">
                  Güncel Sergiler &amp; Müzeler
                </Link>
              </li>
              <li>
                <Link href="/etkinlikler?tur=tiyatro" className="transition-colors hover:text-foreground">
                  Tiyatro &amp; Sahne Sanatları
                </Link>
              </li>
              <li>
                <Link href="/etkinlikler?tur=festival" className="transition-colors hover:text-foreground">
                  Festivaller
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Kurumsal &amp; İletişim</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link href="/sayfa/hakkimizda" className="transition-colors hover:text-foreground">
                  Hakkımızda
                </Link>
              </li>
              <li>
                <Link href="/sayfa/iletisim" className="transition-colors hover:text-foreground">
                  İletişim &amp; Bülten Gönderimi
                </Link>
              </li>
              <li>
                <Link href="/sayfa/gizlilik-politikasi" className="transition-colors hover:text-foreground">
                  Gizlilik Politikası
                </Link>
              </li>
              <li>
                <Link href="/sayfa/kullanim-kosullari" className="transition-colors hover:text-foreground">
                  Kullanım Koşulları
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Kültür-Sanat Medyası</h3>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Seni de Bekleriz; tiyatro sahnelerinden müze galerilerine, antik kent kazılarından açık hava festivallerine Türkiye'nin yaşayan kültür nabzını tutar.
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-6 sm:flex-row">
          <p className="text-center text-sm text-muted-foreground sm:text-left">
            © {currentYear} Seni de Bekleriz. Tüm hakları saklıdır.
          </p>
          <DeveloperCredit />
        </div>
      </div>
    </footer>
  );
}
