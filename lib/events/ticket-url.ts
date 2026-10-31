const NON_TICKET_DOMAINS = [
  "news.google.com",
  "google.com",
  "t24.com.tr",
  "hurriyet.com.tr",
  "milliyet.com.tr",
  "cumhuriyet.com.tr",
  "sozcu.com.tr",
  "aa.com.tr",
  "trthaber.com",
  "haberturk.com",
  "ntv.com.tr",
  "dha.com.tr",
  "iha.com.tr",
  "oggusto.com",
  "gazeteduvar.com.tr",
  "evrensel.net",
  "artfulliving.com.tr",
  "kulturportali.gov.tr",
  "kulturturizm.gov.tr",
];

/**
 * Validates and sanitizes a ticket URL.
 * If the URL is just the source news article, publisher site, or not an actual ticketing service,
 * returns null so the user does not have to manually clear it.
 */
export function cleanTicketUrl(
  ticketUrl?: string | null,
  sourceUrl?: string | null
): string | null {
  if (!ticketUrl || typeof ticketUrl !== "string") return null;
  const trimmed = ticketUrl.trim();
  if (!trimmed || !trimmed.startsWith("http")) return null;

  // If ticket URL is identical to the source URL, it is NOT a ticket
  if (sourceUrl) {
    const s1 = trimmed.replace(/#.*$/, "").replace(/\/$/, "");
    const s2 = sourceUrl.trim().replace(/#.*$/, "").replace(/\/$/, "");
    if (s1 === s2) return null;
  }

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");

    // If it is a news or cultural portal domain without an explicit ticket path
    if (NON_TICKET_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`))) {
      const isExplicitTicketPath = /\/(bilet|tickets?|bilet-al|satin-al|rezervasyon)/i.test(
        parsed.pathname
      );
      if (!isExplicitTicketPath) {
        return null;
      }
    }

    return trimmed;
  } catch {
    return null;
  }
}
