import Script from "next/script";
import { ADSENSE_CLIENT_ID } from "@/lib/ads/config";

export function AdSenseScript() {
  if (!ADSENSE_CLIENT_ID) {
    return null;
  }

  // beforeInteractive: doğrulama botu ham HTML'de script etiketini görebilsin
  // (afterInteractive yalnızca istemci tarafında enjekte eder)
  return (
    <Script
      id="adsense"
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
      crossOrigin="anonymous"
      strategy="beforeInteractive"
    />
  );
}
