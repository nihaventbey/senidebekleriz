import { ADSENSE_CLIENT_ID } from "@/lib/ads/config";

/**
 * Google AdSense doğrulama botu ham HTML'de klasik script etiketini arar.
 * next/script (beforeInteractive dahil) bunu üretmediği için düz <script> kullanıyoruz.
 */
export function AdSenseScript() {
  if (!ADSENSE_CLIENT_ID) {
    return null;
  }

  return (
    <script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
      crossOrigin="anonymous"
    />
  );
}
