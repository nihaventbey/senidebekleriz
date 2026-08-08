import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { SearchProvider } from "@/components/layout/search-provider";
import { AppToaster } from "@/components/ui/sonner";
import { AdSenseScript } from "@/components/ads/adsense-script";
import { ConsentAwareAnalytics } from "@/components/analytics/consent-aware-analytics";
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
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" },
    ],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || "a4LojGVvce1ZqWaOA-v7vrTrPWGafr09UL2xkZiE-zw",
  },
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
        {brand.faviconUrl ? (
          <>
            <link rel="icon" href={brand.faviconUrl} key="dynamic-favicon" />
            <link rel="shortcut icon" href={brand.faviconUrl} key="dynamic-shortcut-favicon" />
          </>
        ) : (
          <>
            <link rel="icon" href="/icon.svg" type="image/svg+xml" />
            <link rel="shortcut icon" href="/icon.svg" />
          </>
        )}
        {brand.appleTouchIconUrl && (
          <link rel="apple-touch-icon" href={brand.appleTouchIconUrl} key="dynamic-apple-icon" />
        )}
      </head>
      <body className="min-h-full flex flex-col bg-background">
        <ConsentAwareAnalytics />
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
