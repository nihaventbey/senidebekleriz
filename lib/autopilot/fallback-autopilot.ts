import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  importDiscoveryAsEvent,
  importDiscoveryAsNews,
} from "@/lib/discovery/service";
import {
  detectTurkishCityInText,
  isRejectedNonTurkishOrCommercialContent,
} from "@/lib/discovery/classify-content";
import { isNonEventTitle } from "@/lib/events/artist-matcher";
import { isEventExpired } from "@/lib/data/events";
import {
  assessEventDraft,
  assessNewsDraft,
  countWords,
} from "@/lib/ai/editorial";
import { revalidatePath } from "next/cache";

export type AutopilotStatus = {
  eventsInLast24h: number;
  newsInLast24h: number;
  shouldPublishEvent: boolean;
  shouldPublishNews: boolean;
};

export type AutopilotResult = {
  status: AutopilotStatus;
  eventsPublished: number;
  newsPublished: number;
  details: string[];
};

type DiscoveryCandidate = {
  id: string;
  title: string;
  snippet?: string | null;
  source_name?: string | null;
  source_url?: string | null;
  city_slug?: string | null;
  content_type: string;
  raw_payload?: Record<string, unknown> | null;
};

const CORE_CULTURAL_TITLE_REGEX =
  /(antik kent|kazı|arkeoloji|restorasyon|müze|sergi|kültür yolu|festival|senfoni|opera|bale|devlet tiyatro|tiyatro|konser|bienal|kültürel miras|tarihi eser)/i;

const TRUSTED_CULTURAL_SOURCE_REGEX =
  /(kültür|trt|anadolu ajansı|\baa\b|cumhuriyet|milliyet sanat|arkeofili|arkitera|biletinial|belediyesi|valiliği|sinema|gazete oksijen)/i;

export function scoreDiscoveryCandidate(
  candidate: DiscoveryCandidate,
  mode: "event" | "news"
): number {
  if (
    isRejectedNonTurkishOrCommercialContent({
      title: candidate.title,
      snippet: candidate.snippet || undefined,
      sourceUrl: candidate.source_url || undefined,
      sourceName: candidate.source_name || undefined,
    })
  ) {
    return -100;
  }

  if (mode === "event" && isNonEventTitle(candidate.title)) {
    return -100;
  }

  let score = 0;
  const titleLower = (candidate.title || "").toLocaleLowerCase("tr-TR");
  const combined = `${candidate.title} ${candidate.snippet || ""}`;

  if (CORE_CULTURAL_TITLE_REGEX.test(titleLower)) {
    score += 30;
  }
  if (candidate.city_slug || detectTurkishCityInText(combined)) {
    score += 15;
  }
  if (
    candidate.source_name &&
    TRUSTED_CULTURAL_SOURCE_REGEX.test(candidate.source_name)
  ) {
    score += 10;
  }

  // Prefer news items that actually carry cultural heritage context over weak general items
  if (mode === "news" && score === 0) {
    return -10;
  }

  return score;
}

/**
 * Checks if any cultural event or news has been published or entered in the last 24 hours.
 */
export async function getAutopilotStatus(): Promise<AutopilotStatus> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [{ count: eventsCount }, { count: newsCount }] = await Promise.all([
    supabaseAdmin
      .from("cultural_events")
      .select("id", { count: "exact", head: true })
      .eq("status", "published")
      .gte("published_at", oneDayAgo),
    supabaseAdmin
      .from("cultural_news")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true)
      .gte("published_at", oneDayAgo),
  ]);

  const eventsInLast24h = eventsCount || 0;
  const newsInLast24h = newsCount || 0;

  return {
    eventsInLast24h,
    newsInLast24h,
    shouldPublishEvent: eventsInLast24h === 0,
    shouldPublishNews: newsInLast24h === 0,
  };
}

/**
 * Executes fallback auto-pilot publishing if no content was added in the last 24 hours.
 * 1. Pulls up to 25 pending_review candidates, filters out non-domain/essay/PR items, and scores by relevance.
 * 2. Processes with AI editorial engine.
 * 3. Enforces strict quality & SEO gates (active date + city + >=1000 char for events; >=2200 char & >=320 words & passed report for news).
 */
export async function runAutopilotFallback(): Promise<AutopilotResult> {
  const status = await getAutopilotStatus();
  const details: string[] = [];
  let eventsPublished = 0;
  let newsPublished = 0;

  // 1. If 0 events in last 24h, auto-publish 1 verified event from discovered content
  if (status.shouldPublishEvent) {
    const { data: candidates } = await supabaseAdmin
      .from("discovered_content")
      .select("id, title, snippet, source_name, source_url, city_slug, content_type, raw_payload")
      .eq("status", "pending_review")
      .eq("content_type", "event")
      .order("discovered_at", { ascending: false })
      .limit(25);

    const rejectedIds: string[] = [];
    const scoredEvents = (candidates || [])
      .map((c) => {
        const score = scoreDiscoveryCandidate(c as DiscoveryCandidate, "event");
        if (score < 0) rejectedIds.push(c.id);
        return { candidate: c as DiscoveryCandidate, score };
      })
      .filter((entry) => entry.score >= 0)
      .sort((a, b) => b.score - a.score);

    if (rejectedIds.length > 0) {
      await supabaseAdmin
        .from("discovered_content")
        .update({ status: "rejected", updated_at: new Date().toISOString() })
        .in("id", rejectedIds);
    }

    if (scoredEvents.length === 0) {
      details.push("Oto-Pilot: Proje bağlamına uygun onay bekleyen etkinlik adayı bulunamadı.");
    } else {
      for (const { candidate } of scoredEvents) {
        try {
          const importRes = await importDiscoveryAsEvent(candidate.id);
          const { data: evRow } = await supabaseAdmin
            .from("cultural_events")
            .select(
              "id, title, slug, summary, event_type, starts_at, ends_at, city_slug, description"
            )
            .eq("slug", importRes.slug)
            .maybeSingle();

          if (!evRow) continue;

          const expired =
            !evRow.starts_at ||
            isEventExpired({
              eventType: evRow.event_type,
              startsAt: evRow.starts_at,
              endsAt: evRow.ends_at,
            });

          if (expired || !evRow.city_slug || isNonEventTitle(evRow.title)) {
            details.push(
              `Oto-Pilot Etkinlik Kalite Kapısına Takıldı (Tarih/Şehir/Tür eksik, taslak bırakıldı): "${candidate.title}"`
            );
            continue;
          }

          const evReport = assessEventDraft({
            title: evRow.title,
            summary: evRow.summary,
            description: evRow.description,
            starts_at: evRow.starts_at,
            ends_at: evRow.ends_at,
            city_slug: evRow.city_slug,
          });

          if (!evReport.passed || (evRow.description || "").length < 1000) {
            details.push(
              `Oto-Pilot Etkinlik İçerik Kapısına Takıldı (${(evRow.description || "").length} kr, taslak bırakıldı): "${candidate.title}"`
            );
            continue;
          }

          await supabaseAdmin
            .from("cultural_events")
            .update({
              status: "published",
              published_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("slug", importRes.slug);

          eventsPublished++;
          details.push(
            `Oto-Pilot Etkinlik Yayınlandı: "${evRow.title}" (${importRes.slug})`
          );
          break;
        } catch (err) {
          console.error("Autopilot event publish error:", err);
          details.push(
            `Oto-Pilot Etkinlik Hatası (${candidate.title.slice(0, 35)}): ${
              err instanceof Error ? err.message : String(err)
            }`
          );
        }
      }
    }
  } else {
    details.push(
      `Son 24 saatte ${status.eventsInLast24h} etkinlik zaten girilmiş, oto-pilot pas geçildi.`
    );
  }

  // 2. If 0 news in last 24h, auto-publish 1 verified news article from discovered content
  if (status.shouldPublishNews) {
    const { data: candidates } = await supabaseAdmin
      .from("discovered_content")
      .select(
        "id, title, snippet, source_name, source_url, city_slug, content_type, raw_payload"
      )
      .eq("status", "pending_review")
      .or(
        "content_type.eq.news,raw_payload->>inferred_content_type.eq.news,content_type.eq.article"
      )
      .order("discovered_at", { ascending: false })
      .limit(25);

    const rejectedIds: string[] = [];
    const scoredNews = (candidates || [])
      .map((c) => {
        const score = scoreDiscoveryCandidate(c as DiscoveryCandidate, "news");
        if (score <= -50) rejectedIds.push(c.id);
        return { candidate: c as DiscoveryCandidate, score };
      })
      .filter((entry) => entry.score >= 0)
      .sort((a, b) => b.score - a.score);

    if (rejectedIds.length > 0) {
      await supabaseAdmin
        .from("discovered_content")
        .update({ status: "rejected", updated_at: new Date().toISOString() })
        .in("id", rejectedIds);
    }

    if (scoredNews.length === 0) {
      details.push("Oto-Pilot: Proje bağlamına uygun onay bekleyen haber adayı bulunamadı.");
    } else {
      for (const { candidate } of scoredNews) {
        try {
          const importRes = await importDiscoveryAsNews(candidate.id);
          const { data: newsRow } = await supabaseAdmin
            .from("cultural_news")
            .select("id, title, slug, summary, content")
            .eq("slug", importRes.slug)
            .maybeSingle();

          if (!newsRow) continue;

          const charLen = (newsRow.content || "").length;
          const wc = countWords(newsRow.content || "");
          const report = assessNewsDraft(
            {
              title: newsRow.title,
              summary: newsRow.summary || "",
              content: newsRow.content || "",
            },
            { minWords: 320 }
          );

          if (charLen < 2200 || wc < 320 || !report.passed) {
            details.push(
              `Oto-Pilot Haber Kalite Kapısına Takıldı (${charLen} kr, ${wc} kelime, puan: ${report.score}, taslak bırakıldı): "${candidate.title}"`
            );
            continue;
          }

          await supabaseAdmin
            .from("cultural_news")
            .update({
              is_published: true,
              published_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("slug", importRes.slug);

          newsPublished++;
          details.push(
            `Oto-Pilot Haber Yayınlandı: "${newsRow.title}" (${importRes.slug}, ${charLen} kr)`
          );
          break;
        } catch (err) {
          console.error("Autopilot news publish error:", err);
          details.push(
            `Oto-Pilot Haber Hatası (${candidate.title.slice(0, 35)}): ${
              err instanceof Error ? err.message : String(err)
            }`
          );
        }
      }
    }
  } else {
    details.push(
      `Son 24 saatte ${status.newsInLast24h} haber zaten girilmiş, oto-pilot pas geçildi.`
    );
  }

  if (eventsPublished > 0 || newsPublished > 0) {
    revalidatePath("/");
    revalidatePath("/etkinlikler");
    revalidatePath("/haberler");
    revalidatePath("/yonetim");
  }

  return {
    status,
    eventsPublished,
    newsPublished,
    details,
  };
}
