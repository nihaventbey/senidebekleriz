import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { SearchProvider } from "@/components/layout/search-provider";
import { AppToaster } from "@/components/ui/sonner";
import { AdSenseScript } from "@/components/ads/adsense-script";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import {
  GoogleTagManager,
  GoogleTagManagerNoScript,
} from "@/components/analytics/google-tag-manager";
import { CookieConsent } from "@/components/layout/cookie-consent";
import { WebMcpTools } from "@/components/agents/webmcp-tools";
import { getBrandSettings } from "@/lib/data/site-settings";
import { buildBrandMetadata } from "@/lib/metadata/brand-metadata";
import { getActiveAdSlotMap } from "@/lib/data/ad-placements";
import { AdPlacementsProvider } from "@/components/ads/ad-placements-provider";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
});

const BASE_METADATA: Metadata = {
  title: {
    default: "Seni de Bekleriz | Sanat, Tarih ve Kültür Rehberi",
    template: "%s | Seni de Bekleriz",
  },
  description:
    "Türkiye'nin müzeleri, tarihi yerleri, sanat mekanları ve kültürel durakları. Sanat ve tarihe yönelen keşif platformu.",
  keywords: [
    "Türkiye",
    "müzeler",
    "tarihi yerler",
    "sanat mekanları",
    "kültür rehberi",
    "gezi rehberi",
    "İstanbul",
    "İzmir",
    "Ankara",
  ],
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? {
        verification: {
          google: process.env.GOOGLE_SITE_VERIFICATION,
        },
      }
    : {}),
};

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrandSettings();
  return buildBrandMetadata(brand, BASE_METADATA);
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const brand = await getBrandSettings();
  const adSlots = await getActiveAdSlotMap();

  return (
    <html
      lang="tr"
      className={`${jakarta.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <AdSenseScript />
        <GoogleAnalytics />
        <GoogleTagManager />
      </head>
      <body className="min-h-full flex flex-col bg-background">
        <GoogleTagManagerNoScript />
        <SearchProvider>
          <AdPlacementsProvider slots={adSlots}>
            <Header brand={brand} />
            <main className="flex-1">{children}</main>
            <Footer brand={brand} />
            <CookieConsent />
          </AdPlacementsProvider>
        </SearchProvider>
        <div id="search-portal" />
        <AppToaster />
        <WebMcpTools />
      </body>
    </html>
  );
}
