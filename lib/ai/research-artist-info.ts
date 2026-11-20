import { callGeminiJson, isGeminiConfigured } from "@/lib/ai/gemini-client";
import { extractPageTextFromHtml } from "@/lib/ai/fetch-url-content";
import { extractArtistCandidates } from "@/lib/events/artist-image-resolver";
import {
  normalizeArtistInfoCard,
  sanitizeOfficialWebsiteUrl,
  type ArtistInfoCard,
} from "@/lib/events/artist-info-card";
import { fetchPublicResource } from "@/lib/security/public-fetch";

const USER_AGENT = "SeniDeBekleriz/1.0 (https://www.senidebekleriz.com)";

const NON_OFFICIAL_HOSTS = [
  "facebook.com",
  "instagram.com",
  "twitter.com",
  "x.com",
  "tiktok.com",
  "youtube.com",
  "youtu.be",
  "open.spotify.com",
  "spotify.com",
  "music.apple.com",
  "itunes.apple.com",
  "deezer.com",
  "soundcloud.com",
  "wikipedia.org",
  "wikidata.org",
  "wikimedia.org",
  "archive.org",
  "imdb.com",
  "musicbrainz.org",
  "discogs.com",
  "allmusic.com",
  "genius.com",
  "songkick.com",
  "bandsintown.com",
  "last.fm",
  "viaf.org",
  "isni.org",
  "id.loc.gov",
  "catalogue.bnf.fr",
  "d-nb.info",
  "biletix.com",
  "passo.com.tr",
  "biletinial.com",
  "bubilet.com.tr",
  "mobilet.com",
  "ticketmaster.com",
  "time.com",
  "washingtonexaminer.com",
  "nytimes.com",
  "theguardian.com",
  "bbc.com",
  "bbc.co.uk",
  "cnn.com",
  "reuters.com",
  "britannica.com",
  "cinematographers.nl",
  "hurriyet.com.tr",
  "hurarsiv.hurriyet.com.tr",
  "milliyet.com.tr",
  "cumhuriyet.com.tr",
  "radikal.com.tr",
  "haberturk.com",
  "ntv.com.tr",
  "sabah.com.tr",
  "sozcu.com.tr",
  "worldcat.org",
];

const ARTS_ENTITY_REGEX =
  /(müzisyen|müzik|şarkıcı|grup|orkestra|senfoni|filarmoni|bale|dans|koreograf|tiyatro|opera|besteci|piyanist|kemancı|çellist|şef|sanatçı|topluluk|koro|caz|rock|pop|metal|klasik|sahne|ensemble|orchestra|symphony|philharmonic|ballet company|dance company|choreographer|theatre|theater|opera company|composer|musician|singer|band|pianist|violinist|cellist|conductor|quartet|trio|artist|performer|rapper)/i;

const REJECTED_ENTITY_REGEX =
  /(futbolcu|voleybolcu|basketbolcu|sporcu|siyasetçi|belediye|ilçe|şehir|köy|holding|havayolu|otel|roman|kitap|görüntü yönetmeni|sinema filmi|film|dizi|footballer|basketball|athlete|politician|municipality|province|village|airline|software|video game|chemical|species|novel|book|cinematographer|movie|tv series|television|poem|painting)/i;

const KNOWN_WORK_TITLES_REGEX =
  /^(anna karenina|swan lake|kuğu gölü|nutcracker|the nutcracker|fındıkkıran|eve dönüş|giselle|carmen|la traviata|tosca|don quixote|sleeping beauty|uyuyan güzel|romeo and juliet|romeo ve juliet)$/i;

const TURKISH_TO_EN_ENSEMBLE_MAP: Array<[RegExp, string]> = [
  [/viyana\s+senfoni\s+orkestras[ıi]/i, "Vienna Symphony"],
  [/viyana\s+filarmoni\s+orkestras[ıi]/i, "Vienna Philharmonic"],
  [/berlin\s+filarmoni\s+orkestras[ıi]/i, "Berlin Philharmonic"],
  [/londra\s+senfoni\s+orkestras[ıi]/i, "London Symphony Orchestra"],
  [/kraliyet\s+filarmoni\s+orkestras[ıi]/i, "Royal Philharmonic Orchestra"],
  [/kraliyet\s+concertgebouw/i, "Royal Concertgebouw Orchestra"],
  [/gürcistan\s+devlet\s+balesi/i, "State Ballet of Georgia"],
  [/bolşoy\s+balesi/i, "Bolshoi Ballet"],
  [/mariinsky\s+balesi/i, "Mariinsky Ballet"],
];

function stripPromoterPrefix(title: string): string {
  return title
    .replace(
      /^(?:modundayız\s+sunar|garanti\s+bbva\s+genç\s+konserleri|an\s+epic\s+symphony|b\.times\s+ile\s+bizlik\s+masalar|iş\s+sanat(?:'ın|’ın)?\s+[^:]+|akm\s+[^:]+|zorlu\s+psm\s+[^:]+)\s*[:\-–—]\s*/i,
      ""
    )
    .trim();
}

function cleanEnsembleCandidate(raw: string): string {
  return raw
    .replace(/\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/[“"”«»][^“"”«»]*tour[^“"”«»]*[“"”«»]/gi, " ")
    .replace(/\s*\b(world\s+tour|open\s+air\s+tour|tour)\s*\d*.*$/i, "")
    .replace(
      /\s*\b(konseri|konserleri|konser|resitali|gösterisi|balesi|temsili|turnesi|yeni\s+yıl\s+konseri|ilk\s+kez\s+türkiye['’]ye\s+geliyor)\b.*$/i,
      ""
    )
    .replace(/\s*\b(swan\s+lake|the\s+nutcracker|kuğu\s+gölü|fındıkkıran)\b.*$/i, "")
    .replace(/\s+/g, " ")
    .replace(/^[\s\-–—:,./"“'‘]+|[\s\-–—:,./"”'’]+$/g, "")
    .trim();
}

export function extractResearchEntityCandidates(
  title: string,
  entityNameHint?: string | null
): string[] {
  const candidates: string[] = [];
  const pushUnique = (val: string) => {
    const cleaned = val.replace(/\s+/g, " ").trim();
    if (cleaned.length < 2) return;
    if (/^(istanbul|ankara|izmir|antalya|bursa|adana|konser|tiyatro|bale|opera|sergi|festival)$/i.test(cleaned)) {
      return;
    }
    if (KNOWN_WORK_TITLES_REGEX.test(cleaned)) {
      return;
    }
    if (!candidates.some((c) => c.toLowerCase() === cleaned.toLowerCase())) {
      candidates.push(cleaned);
    }
  };

  if (entityNameHint && entityNameHint.trim()) {
    pushUnique(cleanEnsembleCandidate(entityNameHint) || entityNameHint.trim());
    pushUnique(entityNameHint.trim());
  }

  const withoutPrefix = stripPromoterPrefix(title);
  if (withoutPrefix) {
    for (const [pattern, enName] of TURKISH_TO_EN_ENSEMBLE_MAP) {
      if (pattern.test(withoutPrefix)) pushUnique(enName);
    }

    const segments = withoutPrefix.split(/\s*[:|–—\-]\s*/).filter(Boolean);
    for (const seg of segments) {
      const cleanedSeg = cleanEnsembleCandidate(seg);
      if (cleanedSeg) pushUnique(cleanedSeg);
    }
    const fullClean = cleanEnsembleCandidate(withoutPrefix);
    if (fullClean) pushUnique(fullClean);
  }

  for (const c of extractArtistCandidates(title)) {
    pushUnique(c);
  }

  return candidates.slice(0, 6);
}

function isNonOfficialExternalUrl(rawUrl: string): boolean {
  const sanitized = sanitizeOfficialWebsiteUrl(rawUrl);
  if (!sanitized) return true;
  try {
    const host = new URL(sanitized).hostname.toLowerCase().replace(/^www\./, "");
    return NON_OFFICIAL_HOSTS.some((d) => host === d || host.endsWith(`.${d}`));
  } catch {
    return true;
  }
}

function isLikelyOfficialHomepageUrl(rawUrl: string): boolean {
  if (isNonOfficialExternalUrl(rawUrl)) return false;
  try {
    const parsed = new URL(rawUrl);
    const pathname = parsed.pathname.replace(/\/+$/, "");
    if (!pathname) return true;
    // Reject deep article / archive URLs from Wikipedia reference extlinks
    if (/\.(html?|php|aspx?|jsp)$/i.test(pathname)) return false;
    if (/\/(19|20)\d{2}\//.test(pathname)) return false;
    const segments = pathname.split("/").filter(Boolean);
    return segments.length <= 1;
  } catch {
    return false;
  }
}

type WikidataEntityInfo = {
  qid: string;
  label: string;
  description: string | null;
  officialWebsite: string | null;
  trWikiTitle: string | null;
  enWikiTitle: string | null;
};

async function lookupWikidataEntity(
  query: string
): Promise<WikidataEntityInfo | null> {
  for (const lang of ["en", "tr"] as const) {
    try {
      const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(
        query
      )}&language=${lang}&limit=5&format=json`;
      const sRes = await fetch(searchUrl, {
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(6000),
      });
      if (!sRes.ok) continue;

      const sJson = (await sRes.json()) as {
        search?: Array<{
          id: string;
          label?: string;
          description?: string;
        }>;
      };
      const hits = sJson.search || [];
      if (hits.length === 0) continue;

      const selected = hits.find((h) => {
        const desc = h.description || "";
        if (!desc) return false;
        if (REJECTED_ENTITY_REGEX.test(desc)) return false;
        return ARTS_ENTITY_REGEX.test(desc);
      });

      if (!selected) continue;

      const entityUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${selected.id}&props=claims|sitelinks|descriptions|labels&languages=tr|en&format=json`;
      const eRes = await fetch(entityUrl, {
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(6000),
      });
      if (!eRes.ok) continue;

      const eJson = (await eRes.json()) as {
        entities?: Record<string, any>;
      };
      const ent = eJson.entities?.[selected.id];
      if (!ent) continue;

      const rawSite = ent?.claims?.P856?.[0]?.mainsnak?.datavalue?.value;
      const officialWebsite =
        typeof rawSite === "string" ? sanitizeOfficialWebsiteUrl(rawSite) : null;

      const description =
        ent?.descriptions?.tr?.value ||
        ent?.descriptions?.en?.value ||
        selected.description ||
        null;

      if (
        description &&
        REJECTED_ENTITY_REGEX.test(description)
      ) {
        continue;
      }

      return {
        qid: selected.id,
        label:
          ent?.labels?.tr?.value ||
          ent?.labels?.en?.value ||
          selected.label ||
          query,
        description,
        officialWebsite,
        trWikiTitle: ent?.sitelinks?.trwiki?.title || null,
        enWikiTitle: ent?.sitelinks?.enwiki?.title || null,
      };
    } catch {
      // continue to next language
    }
  }
  return null;
}

type WikipediaInfo = {
  lang: "tr" | "en";
  title: string;
  extract: string;
  externalWebsite: string | null;
};

async function fetchWikipediaDetails(
  lang: "tr" | "en",
  titleOrQuery: string
): Promise<WikipediaInfo | null> {
  try {
    const url = `https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(
      titleOrQuery
    )}&redirects=1&prop=extracts|extlinks&exintro=1&explaintext=1&ellimit=15&format=json`;
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;

    const json = (await res.json()) as {
      query?: { pages?: Record<string, any> };
    };
    const pages = json.query?.pages || {};
    for (const pid of Object.keys(pages)) {
      const page = pages[pid];
      if (!page || page.missing) continue;
      const extract = typeof page.extract === "string" ? page.extract.trim() : "";
      if (!extract || /may refer to:|anlam ayrımı/i.test(extract)) continue;

      const introSample = extract.slice(0, 420);
      if (REJECTED_ENTITY_REGEX.test(introSample) || !ARTS_ENTITY_REGEX.test(introSample)) {
        continue;
      }

      const extLinks: Array<{ "*": string } | { url: string }> =
        page.extlinks || [];
      let externalWebsite: string | null = null;
      for (const link of extLinks) {
        const href = "*" in link ? link["*"] : link.url;
        if (typeof href === "string" && isLikelyOfficialHomepageUrl(href)) {
          externalWebsite = sanitizeOfficialWebsiteUrl(href);
          if (externalWebsite) break;
        }
      }

      return {
        lang,
        title: page.title || titleOrQuery,
        extract: extract.slice(0, 2200),
        externalWebsite,
      };
    }
  } catch {
    // ignore Wikipedia fetch errors
  }
  return null;
}

async function fetchOfficialWebsiteSnippet(
  websiteUrl: string
): Promise<{ title: string | null; text: string | null }> {
  try {
    const res = await fetchPublicResource(websiteUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SeniDeBekleriz/1.0)",
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8",
      },
      signal: AbortSignal.timeout(7000),
      maxBytes: 1024 * 1024,
    });

    if (!res.ok) return { title: null, text: null };
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("html") && !ct.includes("text")) {
      return { title: null, text: null };
    }

    const html = await res.text();
    if (!html || html.length < 200) return { title: null, text: null };

    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch?.[1]
      ? titleMatch[1].replace(/\s+/g, " ").trim().slice(0, 140)
      : null;

    const extracted = extractPageTextFromHtml(html, 3000);
    return {
      title,
      text: extracted && extracted.length >= 60 ? extracted : null,
    };
  } catch {
    return { title: null, text: null };
  }
}

type SynthesizedArtistCard = {
  entity_name: string;
  entity_type: string;
  origin: string | null;
  summary: string;
  website_note: string | null;
  highlights: string[];
};

const ARTIST_CARD_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: {
    entity_name: { type: "string" },
    entity_type: { type: "string" },
    origin: { type: ["string", "null"] },
    summary: { type: "string" },
    website_note: { type: ["string", "null"] },
    highlights: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: ["entity_name", "entity_type", "summary", "highlights"],
};

function buildFallbackCard(params: {
  entityName: string;
  wikidata: WikidataEntityInfo | null;
  wiki: WikipediaInfo | null;
  officialWebsite: string | null;
  websiteSnippet: { title: string | null; text: string | null };
}): ArtistInfoCard | null {
  const summarySource =
    params.wiki?.extract ||
    params.websiteSnippet.text ||
    params.wikidata?.description ||
    "";
  if (!summarySource) return null;

  const sentences = summarySource
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.length > 20);
  const summary = (sentences.slice(0, 2).join(" ") || summarySource).slice(0, 360);

  const websiteNote =
    params.websiteSnippet.text && params.officialWebsite
      ? params.websiteSnippet.text.split(/\n+/)[0]?.slice(0, 280) || null
      : null;

  const sourceParts: string[] = [];
  if (params.officialWebsite) sourceParts.push("Resmi web sitesi");
  if (params.wiki) sourceParts.push("Wikipedia");
  else if (params.wikidata) sourceParts.push("Wikidata");

  return normalizeArtistInfoCard({
    enabled: true,
    entityName: params.entityName,
    entityType: "Sanatçı / Topluluk",
    origin: null,
    officialWebsite: params.officialWebsite,
    summary,
    websiteNote,
    highlights: [],
    sourceLabel: sourceParts.join(" ve ") || "Doğrulanmış açık kaynaklar",
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Researches a featured artist, band, orchestra, ballet company, or choreographer
 * using Wikidata (P856 official website), Wikipedia (TR/EN factual intro), and
 * direct official website fetch + Gemini synthesis.
 */
export async function researchArtistInfoCard(input: {
  title: string;
  summary?: string | null;
  description?: string | null;
  eventType?: string | null;
  entityNameHint?: string | null;
}): Promise<ArtistInfoCard | null> {
  const candidates = extractResearchEntityCandidates(
    input.title,
    input.entityNameHint
  );
  if (candidates.length === 0) return null;

  let matchedName = candidates[0];
  let wikidata: WikidataEntityInfo | null = null;
  let wiki: WikipediaInfo | null = null;

  for (const candidate of candidates) {
    const wd = await lookupWikidataEntity(candidate);
    if (wd) {
      wikidata = wd;
      matchedName = wd.label || candidate;
      if (wd.trWikiTitle) {
        wiki = await fetchWikipediaDetails("tr", wd.trWikiTitle);
      }
      if (!wiki && wd.enWikiTitle) {
        wiki = await fetchWikipediaDetails("en", wd.enWikiTitle);
      }
      if (wiki || wd.officialWebsite) break;
    }

    const trWiki = await fetchWikipediaDetails("tr", candidate);
    if (trWiki) {
      wiki = trWiki;
      matchedName = trWiki.title || candidate;
      break;
    }
    const enWiki = await fetchWikipediaDetails("en", candidate);
    if (enWiki) {
      wiki = enWiki;
      matchedName = enWiki.title || candidate;
      break;
    }
  }

  if (!wikidata && !wiki) {
    return null;
  }

  const officialWebsite =
    wikidata?.officialWebsite || wiki?.externalWebsite || null;

  const websiteSnippet = officialWebsite
    ? await fetchOfficialWebsiteSnippet(officialWebsite)
    : { title: null, text: null };

  if (!isGeminiConfigured()) {
    return buildFallbackCard({
      entityName: matchedName,
      wikidata,
      wiki,
      officialWebsite,
      websiteSnippet,
    });
  }

  try {
    const promptLines = [
      `Etkinlik Başlığı: ${input.title}`,
      `Araştırılan Sanatçı / Topluluk / Orkestra / Koreograf: ${matchedName}`,
      wikidata?.description ? `Wikidata Tanımı: ${wikidata.description}` : null,
      wiki ? `Wikipedia Özeti (${wiki.lang.toUpperCase()}):\n${wiki.extract}` : null,
      officialWebsite ? `Doğrulanmış Resmi Web Sitesi: ${officialWebsite}` : null,
      websiteSnippet.title ? `Resmi Site Başlığı: ${websiteSnippet.title}` : null,
      websiteSnippet.text
        ? `Resmi Web Sitesinden Alınan Metin:\n${websiteSnippet.text.slice(0, 2600)}`
        : "Resmi Web Sitesi Metni: Site içeriği okunamadı veya mevcut değil.",
    ]
      .filter(Boolean)
      .join("\n\n");

    const synthesized = await callGeminiJson<SynthesizedArtistCard>({
      systemPrompt: `Sen kültür, sanat, müzik ve sahne sanatları editörüsün.
Verilen DOĞRULANMIŞ kaynaklara dayanarak sanatçı, orkestra, koreograf veya topluluk için kısa, bilgilendirici, ansiklopedik Türkçe bilgi kartı verisi üret.

KESİN KURALLAR:
1. YALNIZCA verilen metinlerdeki doğrulanmış gerçekleri kullan; asla ödül, albüm, yıl veya alıntı uydurma.
2. entity_type örnekleri: "Senfoni Orkestrası", "Bale Topluluğu", "Koreograf", "Müzik Grubu", "Piyanist & Besteci", "Solist", "Kültür Kurumu".
3. origin: Sanatçı veya topluluğun köken ülkesi/şehri Türkçe olarak (örn: "Avusturya", "Gürcistan", "Türkiye", "Kanada"). Kaynakta yoksa null.
4. summary: 2-3 cümle, en fazla 340 karakter, kurumsal ve akıcı Türkçe özet.
5. website_note: YALNIZCA "Resmi Web Sitesinden Alınan Metin" bölümü varsa, o sitede öne çıkan sanatçı/topluluk yaklaşımı, güncel turne/repertuvar veya vizyonunu özetleyen 1-2 kısa Türkçe cümle yaz (en fazla 280 karakter). Eğer resmi site metni okunamadıysa KESİNLİKLE null döndür!
6. highlights: 2 ila 4 adet kısa (max 110 karakter), somut madde (kuruluş yılı, sanat yönetmeni, öne çıkan repertuvar, turne vb.).`,
      userPrompt: promptLines,
      temperature: 0.25,
      thinking: "low",
      tier: "quality",
      responseSchema: ARTIST_CARD_SCHEMA,
      timeoutMs: 12000,
      deadlineMs: 25000,
    });

    const sourceParts: string[] = [];
    if (officialWebsite && websiteSnippet.text) {
      sourceParts.push("Resmi web sitesi");
    }
    if (wiki) sourceParts.push("Wikipedia");
    if (wikidata && !wiki) sourceParts.push("Wikidata");

    return normalizeArtistInfoCard({
      enabled: true,
      entityName: synthesized.entity_name || matchedName,
      entityType: synthesized.entity_type || "Sanatçı / Topluluk",
      origin: synthesized.origin,
      officialWebsite,
      summary: synthesized.summary,
      websiteNote: websiteSnippet.text ? synthesized.website_note : null,
      highlights: synthesized.highlights,
      sourceLabel:
        sourceParts.length > 0
          ? `${sourceParts.join(" ve ")} verilerinden derlendi`
          : "Doğrulanmış açık kaynaklar",
      updatedAt: new Date().toISOString(),
    });
  } catch {
    return buildFallbackCard({
      entityName: matchedName,
      wikidata,
      wiki,
      officialWebsite,
      websiteSnippet,
    });
  }
}
