import { callGeminiJson, isGeminiConfigured } from "@/lib/ai/gemini-client";
import { fetchUrlContent } from "@/lib/ai/fetch-url-content";
import { sanitizeIsoDate } from "@/lib/ai/normalize-event";
import { normalizeCitySlug } from "@/lib/cities/lookup";
import { detectTurkishCityInText } from "@/lib/discovery/classify-content";
import { isNonEventTitle } from "@/lib/events/artist-matcher";
import type { EventType } from "@/lib/events/types";

export type PrestigeCategory =
  | "orchestra"
  | "choreographer_ballet"
  | "world_artist"
  | "festival_ensemble";

export type GlobalTicketingCandidate = {
  title: string;
  sourceName: "Passo" | "Biletinial" | "Biletix";
  sourceUrl: string;
  ticketUrl: string;
  venueName: string | null;
  citySlug: string | null;
  startsAt: string | null;
  endsAt: string | null;
  descriptionText: string;
  imageUrl: string | null;
  eventTypeHint: EventType;
  isFree: boolean;
  entityNameHint: string | null;
  prestigeScore: number;
  prestigeCategory: PrestigeCategory;
};

const USER_AGENT = "Mozilla/5.0 (compatible; SeniDeBekleriz/1.0)";

const SPORTS_OR_PROMO_REJECT_REGEX =
  /\b(maç|maçı|maçları|süper lig|tff|euroleague|futbol|basketbol|voleybol|hentbol|tenis turnuvası|passolig|kombine|bilet friday|kampanya|hediye kart|üyelik|vip otopark|sezonluk bilet|o ses|masterchef|fenerbahçe\s*-|galatasaray\s*-|beşiktaş\s*-|trabzonspor\s*-|anadolu efes)\b/i;

const ORCHESTRA_REGEX =
  /\b(orkestra|orkestrası|orchestra|senfoni|senfonik|symphony|symphonic|filarmoni|philharmonic|filarmonik|chamber|oda müziği|quartet|kuartet|ensemble|koro|korosu|choir|bifo|viyana|philharmoniker|symphoniker)\b/i;

const BALLET_CHOREO_REGEX =
  /\b(bale|balesi|ballet|koreograf|koreografi|choreograph\w*|dans topluluğu|dance company|contemporary dance|çağdaş dans|bolşoy|bolshoi|mariinsky|state ballet|imperial russian ballet|swan lake|kuğu gölü|nutcracker|fındıkkıran|opera ve bale|opera)\b/i;

const WORLD_TOUR_OR_MAJOR_REGEX =
  /\b(world tour|open air tour|european tour|tour 202[6-9]|ilk kez türkiye|türkiye['’]de ilk|live in istanbul|live in turkey|candlelight|iksv|müzik festivali|caz festivali|tiyatro festivali|evgeny grinko|david garrett|mario frangoulis|charlotte cardin|saint levant|caribou|black veil brides|jethro tull|ludovico einaudi|hans zimmer|max richter|olafur arnalds|fazıl say|gülsin onay|idil biret|viktoria mullova|bruce liu|gipsy kings|buena vista|pink martini|tigran hamasyan|brahim ma\w*|ibrahim maalouf|jan garbarek|pat metheny|anathema|opeth|soen|katatonia|leprous|wardruna|dead can dance|loreena mckennitt|gregorian|era|scorpions|deep purple|megadeth|iron maiden|sting|andre rieu|sarah brightman|ennio morricone|yann tiersen|kiasmos|ben bohmer|boris brejcha|solomun|korolova|marina satti)\b/i;

const PRESTIGE_VENUE_REGEX =
  /\b(zorlu psm|volkswagen arena|akm|atatürk kültür merkezi|cso ada|iş sanat|harbiye|cemil topuzlu|crr|cemal reşit rey|lütfi kırdar|küçükçiftlik|maximum uniq|salon iksv|congresium|aassm|ahmed adnan saygun|süreyya operası|bostancı gösteri merkezi)\b/i;

export function scoreGlobalPrestigeCandidate(input: {
  title: string;
  venueName?: string | null;
  url?: string | null;
  text?: string | null;
}): {
  score: number;
  category: PrestigeCategory | null;
} {
  const title = (input.title || "").trim();
  const combined = `${title} ${input.venueName || ""} ${input.url || ""} ${
    input.text || ""
  }`.trim();

  if (!title || title.length < 4) {
    return { score: -100, category: null };
  }

  if (SPORTS_OR_PROMO_REJECT_REGEX.test(combined)) {
    return { score: -100, category: null };
  }

  if (isNonEventTitle(title)) {
    return { score: -100, category: null };
  }

  let score = 0;
  let category: PrestigeCategory | null = null;
  const venueLower = (input.venueName || "").toLocaleLowerCase("tr-TR");
  const titleAndUrl = `${title} ${input.url || ""} ${input.text || ""}`.trim();

  if (BALLET_CHOREO_REGEX.test(titleAndUrl)) {
    score += 45;
    category = "choreographer_ballet";
  }

  if (ORCHESTRA_REGEX.test(combined)) {
    score += 45;
    if (!category || ORCHESTRA_REGEX.test(title)) {
      category = "orchestra";
    }
  }

  if (!category && BALLET_CHOREO_REGEX.test(venueLower) && !/\bopera salonu\b/i.test(venueLower)) {
    score += 30;
    category = "choreographer_ballet";
  }

  if (WORLD_TOUR_OR_MAJOR_REGEX.test(combined)) {
    score += 40;
    if (!category) category = "world_artist";
  }

  if (/\biksv\b|festival|bienal/i.test(combined)) {
    score += 20;
    if (!category) category = "festival_ensemble";
  }

  if (PRESTIGE_VENUE_REGEX.test(combined)) {
    score += 18;
  }

  // Non-Turkish / international act signal (quotes, tour markers, English/European ensemble names)
  if (
    /\b(the|symphony|philharmonic|orchestra|ballet|company|ensemble|tour|live|quartet|trio|project)\b/i.test(
      title
    )
  ) {
    score += 15;
    if (!category) category = "world_artist";
  }

  return { score, category };
}

type RawDiscoveryCandidate = {
  sourceName: "Passo" | "Biletinial" | "Biletix";
  id?: number | string;
  seoUrl?: string;
  isGroup?: boolean;
  title: string;
  venueName?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  imageName?: string | null;
  detailUrl: string;
  prestigeScore: number;
  prestigeCategory: PrestigeCategory;
};

async function fetchPassoRawCandidates(): Promise<RawDiscoveryCandidate[]> {
  const candidates: RawDiscoveryCandidate[] = [];
  const pages = [0, 120, 240];

  const responses = await Promise.allSettled(
    pages.map(async (from) => {
      const res = await fetch(
        "https://ticketingweb.passo.com.tr/api/passoweb/allevents",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "User-Agent": USER_AGENT,
          },
          body: JSON.stringify({ LanguageId: 118, from, size: 120 }),
          signal: AbortSignal.timeout(10_000),
        }
      );
      if (!res.ok) return [];
      const data = (await res.json()) as {
        valueList?: Array<{
          id: number;
          name?: string;
          seoUrl?: string;
          date?: string;
          endDate?: string;
          venueName?: string;
          homePageImagePath?: string;
          eventType?: number;
          isEntertainment?: boolean;
        }>;
      };
      return data.valueList || [];
    })
  );

  const nowMs = Date.now();
  const seenIds = new Set<number>();

  for (const r of responses) {
    if (r.status !== "fulfilled") continue;
    for (const ev of r.value) {
      if (!ev.id || !ev.name || !ev.seoUrl || seenIds.has(ev.id)) continue;
      seenIds.add(ev.id);

      const isGroup = ev.eventType === 2;
      const validDate =
        ev.date && !ev.date.startsWith("0001-01-01") ? sanitizeIsoDate(ev.date) : null;
      if (validDate && new Date(validDate).getTime() < nowMs - 6 * 3600_000) {
        continue;
      }

      const scored = scoreGlobalPrestigeCandidate({
        title: ev.name,
        venueName: ev.venueName,
        url: ev.seoUrl,
      });

      if (scored.score < 30 || !scored.category) continue;

      candidates.push({
        sourceName: "Passo",
        id: ev.id,
        seoUrl: ev.seoUrl,
        isGroup,
        title: ev.name.trim(),
        venueName: ev.venueName || null,
        startsAt: validDate,
        endsAt:
          ev.endDate && !ev.endDate.startsWith("0001-01-01")
            ? sanitizeIsoDate(ev.endDate)
            : null,
        imageName: ev.homePageImagePath?.split("?")[0] || null,
        detailUrl: isGroup
          ? `https://www.passo.com.tr/tr/etkinlik-grubu/${ev.seoUrl}/${ev.id}`
          : `https://www.passo.com.tr/tr/etkinlik/${ev.seoUrl}/${ev.id}`,
        prestigeScore: scored.score,
        prestigeCategory: scored.category,
      });
    }
  }

  return candidates;
}

function slugToReadableTitle(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

async function fetchBiletinialRawCandidates(): Promise<RawDiscoveryCandidate[]> {
  const paths = ["/tr-tr/muzik", "/tr-tr/opera-bale"];
  const candidates: RawDiscoveryCandidate[] = [];
  const seenUrls = new Set<string>();

  const pages = await Promise.allSettled(
    paths.map(async (catPath) => {
      const res = await fetch(`https://biletinial.com${catPath}`, {
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) return "";
      return await res.text();
    })
  );

  for (let idx = 0; idx < pages.length; idx++) {
    const p = pages[idx];
    if (p.status !== "fulfilled" || !p.value) continue;
    const isOperaBale = paths[idx].includes("opera-bale");

    const matches = p.value.matchAll(
      /<a[^>]+href="(\/tr-tr\/(?:muzik|opera-bale)\/([a-z0-9-]+))"[^>]*>([\s\S]*?)<\/a>/gi
    );

    for (const m of matches) {
      const fullUrl = `https://biletinial.com${m[1]}`;
      if (seenUrls.has(fullUrl)) continue;
      seenUrls.add(fullUrl);

      const innerText = m[3]
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      const rawTitle =
        innerText.length >= 4 && innerText.length <= 120
          ? innerText
          : slugToReadableTitle(m[2]);

      const scored = scoreGlobalPrestigeCandidate({
        title: rawTitle,
        url: m[1],
        text: isOperaBale ? "opera bale" : "",
      });

      if (scored.score < 35 || !scored.category) continue;

      candidates.push({
        sourceName: "Biletinial",
        title: rawTitle,
        detailUrl: fullUrl,
        prestigeScore: scored.score,
        prestigeCategory: scored.category,
      });
    }
  }

  return candidates;
}

async function fetchBiletixRawCandidates(): Promise<RawDiscoveryCandidate[]> {
  const candidates: RawDiscoveryCandidate[] = [];
  try {
    const res = await fetch(
      "https://www.biletix.com/wbtxapi/api/v1/siteMap/eventGroup",
      {
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(10_000),
      }
    );
    if (!res.ok) return [];
    const xml = await res.text();

    const locs = xml.matchAll(/<loc>(https:\/\/www\.biletix\.com\/etkinlik-grup\/[^<]+)<\/loc>/gi);
    const seen = new Set<string>();

    for (const m of locs) {
      const url = m[1].trim();
      if (seen.has(url)) continue;
      seen.add(url);

      const slugPart = url.split("/").filter(Boolean).pop() || "";
      const readableTitle = slugToReadableTitle(slugPart);
      const scored = scoreGlobalPrestigeCandidate({
        title: readableTitle,
        url,
      });

      if (scored.score < 35 || !scored.category) continue;

      candidates.push({
        sourceName: "Biletix",
        title: readableTitle,
        detailUrl: url,
        prestigeScore: scored.score,
        prestigeCategory: scored.category,
      });
    }
  } catch {
    // ignore Biletix sitemap failure
  }

  return candidates;
}

type BatchPrestigeClassification = {
  id: number;
  keep: boolean;
  entity_name: string | null;
  category: PrestigeCategory;
};

async function selectPrestigeCandidatesWithAi(
  candidates: RawDiscoveryCandidate[],
  limit: number
): Promise<Map<number, { entityName: string | null; category: PrestigeCategory }>> {
  const selected = new Map<
    number,
    { entityName: string | null; category: PrestigeCategory }
  >();
  if (candidates.length === 0) return selected;

  const topPool = candidates.slice(0, Math.max(limit * 3, 24));

  if (!isGeminiConfigured()) {
    for (let i = 0; i < Math.min(limit, topPool.length); i++) {
      selected.set(i, {
        entityName: null,
        category: topPool[i].prestigeCategory,
      });
    }
    return selected;
  }

  try {
    const prompt = JSON.stringify(
      topPool.map((c, idx) => ({
        id: idx,
        source: c.sourceName,
        title: c.title,
        venue: c.venueName || null,
        category_hint: c.prestigeCategory,
      })),
      null,
      2
    );

    const results = await callGeminiJson<BatchPrestigeClassification[]>({
      systemPrompt: `Sen Türkiye kültür-sanat etkinlik küratörüsün.
Verilen biletleme sitesi adayları arasından ÖZELLİKLE dünyaca ünlü müzik gruplarını, büyük uluslararası veya prestijli orkestraları/filarmonileri, bale topluluklarını, koreografları ve büyük konser/sahne sanatçılarını seç.

KURALLAR:
- "Bilet Friday", genel kampanyalar, spor müsabakaları, küçük/yerel gece kulübü DJ partileri veya belirsiz başlıklar için keep: false yap.
- Gerçek bir orkestra, bale topluluğu, koreograf, uluslararası grup veya büyük sanatçı konseri ise keep: true yap ve entity_name alanına temiz sanatçı/grup/orkestra/koreograf adını yaz (örn: "The Imperial Russian Ballet Company", "Saint Levant", "Borusan İstanbul Filarmoni Orkestrası", "Evgeny Grinko").
- Yanıt yalnızca JSON dizisi olmalıdır: [{"id":0,"keep":true,"entity_name":"...","category":"orchestra"}]`,
      userPrompt: prompt,
      temperature: 0.1,
      tier: "fast",
      thinking: "minimal",
      timeoutMs: 10_000,
      deadlineMs: 18_000,
    });

    if (Array.isArray(results)) {
      for (const r of results) {
        if (r && r.keep && typeof r.id === "number" && topPool[r.id]) {
          selected.set(r.id, {
            entityName: r.entity_name?.trim() || null,
            category: r.category || topPool[r.id].prestigeCategory,
          });
          if (selected.size >= limit) break;
        }
      }
    }
  } catch {
    // Fallback to deterministic score order
  }

  if (selected.size === 0) {
    for (let i = 0; i < Math.min(limit, topPool.length); i++) {
      selected.set(i, {
        entityName: null,
        category: topPool[i].prestigeCategory,
      });
    }
  }

  return selected;
}

function stripHtmlTags(raw: string): string {
  return raw
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function inferEventTypeFromCandidate(
  category: PrestigeCategory,
  title: string,
  text: string
): EventType {
  const combined = `${title} ${text}`.toLocaleLowerCase("tr-TR");
  if (category === "choreographer_ballet") {
    return /\b(bale|tiyatro|opera|dans|sahne|gösteri)\b/.test(combined)
      ? "tiyatro"
      : "diger";
  }
  if (category === "festival_ensemble" || /\bfestival/i.test(title)) {
    return "festival";
  }
  return "konser";
}

async function hydratePassoCandidate(
  raw: RawDiscoveryCandidate,
  entityNameHint: string | null,
  category: PrestigeCategory
): Promise<GlobalTicketingCandidate | null> {
  if (!raw.id || !raw.seoUrl) return null;

  try {
    if (raw.isGroup) {
      const res = await fetch(
        `https://ticketingweb.passo.com.tr/api/passoweb/geteventgroupdetails/${raw.seoUrl}/${raw.id}/118`,
        {
          headers: { Accept: "application/json", "User-Agent": USER_AGENT },
          signal: AbortSignal.timeout(10_000),
        }
      );
      if (!res.ok) return null;
      const json = (await res.json()) as { value?: Record<string, any> };
      const val = json.value;
      if (!val) return null;

      const childEvents: Array<Record<string, any>> = Array.isArray(val.events)
        ? val.events
        : [];
      const nowMs = Date.now();
      const upcomingChild =
        childEvents.find((c) => {
          const d = c.date ? sanitizeIsoDate(c.date) : null;
          return d && new Date(d).getTime() >= nowMs - 6 * 3600_000;
        }) || childEvents[0];

      const startsAt = upcomingChild?.date
        ? sanitizeIsoDate(upcomingChild.date)
        : raw.startsAt || null;
      const endsAt = upcomingChild?.endDate
        ? sanitizeIsoDate(upcomingChild.endDate)
        : raw.endsAt || null;
      const venueName = upcomingChild?.venueName || raw.venueName || null;
      const childTicketUrl =
        upcomingChild?.seoUrl && upcomingChild?.id
          ? `https://www.passo.com.tr/tr/etkinlik/${upcomingChild.seoUrl}/${upcomingChild.id}`
          : raw.detailUrl;

      const imgFile =
        val.detailPageImageName || val.mainPageImageName || raw.imageName;
      const imageUrl = imgFile
        ? `https://www.passo.com.tr/images/${String(imgFile).split("?")[0]}`
        : null;

      const desc = stripHtmlTags(
        `${val.eventGroupDescription || ""}\n\n${val.eventGroupDetailPageDescription || ""}\n\n${val.seoDescription || ""}`
      );
      const citySlug = normalizeCitySlug(
        detectTurkishCityInText(`${val.name || raw.title} ${venueName || ""} ${desc}`)
      );

      return {
        title: String(val.name || raw.title).trim(),
        sourceName: "Passo",
        sourceUrl: childTicketUrl,
        ticketUrl: childTicketUrl,
        venueName,
        citySlug,
        startsAt,
        endsAt,
        descriptionText: desc,
        imageUrl,
        eventTypeHint: inferEventTypeFromCandidate(category, raw.title, desc),
        isFree: false,
        entityNameHint,
        prestigeScore: raw.prestigeScore,
        prestigeCategory: category,
      };
    }

    const res = await fetch(
      `https://ticketingweb.passo.com.tr/api/passoweb/geteventdetails/${raw.seoUrl}/${raw.id}/118`,
      {
        headers: { Accept: "application/json", "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(10_000),
      }
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { value?: Record<string, any> };
    const val = json.value;
    if (!val || val.cancelled) return null;

    const startsAt = val.date ? sanitizeIsoDate(val.date) : raw.startsAt || null;
    const endsAt = val.endDate ? sanitizeIsoDate(val.endDate) : raw.endsAt || null;
    const venueName = val.venueName || raw.venueName || null;
    const imgFile =
      val.detailPageImageName || val.homePageImageName || raw.imageName;
    const imageUrl = imgFile
      ? `https://www.passo.com.tr/images/${String(imgFile).split("?")[0]}`
      : null;

    const desc = stripHtmlTags(
      `${val.detailPageDescription || ""}\n\n${val.seoDescription || ""}\n\n${val.detailNote || ""}`
    );
    const citySlug = normalizeCitySlug(
      val.venueCity ||
        detectTurkishCityInText(`${val.name || raw.title} ${venueName || ""} ${desc}`)
    );

    return {
      title: String(val.name || raw.title).trim(),
      sourceName: "Passo",
      sourceUrl: raw.detailUrl,
      ticketUrl: raw.detailUrl,
      venueName,
      citySlug,
      startsAt,
      endsAt,
      descriptionText: desc,
      imageUrl,
      eventTypeHint: inferEventTypeFromCandidate(category, raw.title, desc),
      isFree: val.lowPrice === 0 && val.highPrice === 0,
      entityNameHint,
      prestigeScore: raw.prestigeScore,
      prestigeCategory: category,
    };
  } catch {
    return null;
  }
}

async function hydrateWebTicketingCandidate(
  raw: RawDiscoveryCandidate,
  entityNameHint: string | null,
  category: PrestigeCategory
): Promise<GlobalTicketingCandidate | null> {
  try {
    const fetched = await fetchUrlContent(raw.detailUrl, {
      maxTextLength: 6000,
      userAgent: USER_AGENT,
      minTextLength: 20,
    });
    const jEvent = fetched.jsonLdEvent;
    const title = (jEvent?.name || fetched.pageTitle || raw.title)
      .replace(/\s*\|\s*(Biletix|Biletinial|Resmi Biletix.*).*$/i, "")
      .replace(/\s*biletleri\s*$/i, "")
      .trim();

    if (!title || isNonEventTitle(title)) return null;

    const startsAt = jEvent?.startDate ? sanitizeIsoDate(jEvent.startDate) : null;
    const endsAt = jEvent?.endDate ? sanitizeIsoDate(jEvent.endDate) : null;
    if (startsAt && new Date(startsAt).getTime() < Date.now() - 6 * 3600_000) {
      return null;
    }

    const venueName = jEvent?.venueName || raw.venueName || null;
    const citySlug = normalizeCitySlug(
      jEvent?.cityLocality ||
        detectTurkishCityInText(`${title} ${venueName || ""} ${fetched.pageText}`)
    );

    return {
      title,
      sourceName: raw.sourceName,
      sourceUrl: fetched.url || raw.detailUrl,
      ticketUrl: jEvent?.ticketUrl || fetched.url || raw.detailUrl,
      venueName,
      citySlug,
      startsAt,
      endsAt,
      descriptionText: fetched.pageText || "",
      imageUrl: fetched.imageUrls[0] || null,
      eventTypeHint: inferEventTypeFromCandidate(
        category,
        title,
        fetched.pageText || ""
      ),
      isFree: Boolean(jEvent?.isFree),
      entityNameHint: entityNameHint || jEvent?.performer || null,
      prestigeScore: raw.prestigeScore,
      prestigeCategory: category,
    };
  } catch {
    return null;
  }
}

/**
 * Fetches and selects upcoming events by world-famous bands, orchestras,
 * ballet companies, choreographers, and major touring artists from Passo,
 * Biletinial, and Biletix.
 */
export async function fetchGlobalTicketingCandidates(options?: {
  limit?: number;
}): Promise<GlobalTicketingCandidate[]> {
  const limit = Math.max(1, Math.min(options?.limit ?? 10, 20));

  const [passoRes, biletinialRes, biletixRes] = await Promise.allSettled([
    fetchPassoRawCandidates(),
    fetchBiletinialRawCandidates(),
    fetchBiletixRawCandidates(),
  ]);

  const combined: RawDiscoveryCandidate[] = [
    ...(passoRes.status === "fulfilled" ? passoRes.value : []),
    ...(biletinialRes.status === "fulfilled" ? biletinialRes.value : []),
    ...(biletixRes.status === "fulfilled" ? biletixRes.value : []),
  ];

  // Deduplicate by detailUrl and sort by prestigeScore descending
  const uniqueMap = new Map<string, RawDiscoveryCandidate>();
  for (const item of combined) {
    if (!uniqueMap.has(item.detailUrl)) {
      uniqueMap.set(item.detailUrl, item);
    }
  }

  const sortedPool = Array.from(uniqueMap.values()).sort(
    (a, b) => b.prestigeScore - a.prestigeScore
  );

  if (sortedPool.length === 0) return [];

  const aiPicks = await selectPrestigeCandidatesWithAi(sortedPool, limit + 4);
  const hydrated: GlobalTicketingCandidate[] = [];

  for (const [idx, meta] of aiPicks.entries()) {
    if (hydrated.length >= limit) break;
    const raw = sortedPool[idx];
    if (!raw) continue;

    const item =
      raw.sourceName === "Passo"
        ? await hydratePassoCandidate(raw, meta.entityName, meta.category)
        : await hydrateWebTicketingCandidate(raw, meta.entityName, meta.category);

    if (item) {
      hydrated.push(item);
    }
  }

  return hydrated;
}
