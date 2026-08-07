"use client";

import { useEffect, useState } from "react";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import {
  GoogleTagManager,
  GoogleTagManagerNoScript,
} from "@/components/analytics/google-tag-manager";
import {
  CONSENT_KEY,
  getCookieConsent,
  type CookieConsentValue,
} from "@/components/layout/cookie-consent";

/**
 * Analytics yalnızca çerez kabulünden sonra yüklenir.
 * AdSense doğrulama scripti layout head'de kalır.
 */
export function ConsentAwareAnalytics() {
  const [consent, setConsent] = useState<CookieConsentValue | null>(null);

  useEffect(() => {
    function sync() {
      setConsent(getCookieConsent());
    }
    sync();
    window.addEventListener("sdb-cookie-consent-changed", sync);
    window.addEventListener("storage", (event) => {
      if (event.key === CONSENT_KEY) sync();
    });
    return () => {
      window.removeEventListener("sdb-cookie-consent-changed", sync);
    };
  }, []);

  if (consent !== "accepted") return null;

  return (
    <>
      <GoogleAnalytics />
      <GoogleTagManager />
      <GoogleTagManagerNoScript />
    </>
  );
}
