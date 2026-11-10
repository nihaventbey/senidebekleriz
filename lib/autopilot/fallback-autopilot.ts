import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  importDiscoveryAsEvent,
  importDiscoveryAsNews,
} from "@/lib/discovery/service";
import { isNonEventTitle } from "@/lib/events/artist-matcher";
import { isEventExpired } from "@/lib/data/events";
import { countWords } from "@/lib/ai/editorial";
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

/**
 * Checks if any cultural event or news has been published or entered in the last 24 hours.
 */
export async function getAutopilotStatus(): Promise<AutopilotStatus> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [{ count: eventsCount }, { count: newsCount }] = await Promise.all([
    supabaseAdmin
      .from("cultural_events")
      .select("id", { count: "exact", head: true })
      .gte("created_at", oneDayAgo),
    supabaseAdmin
      .from("cultural_news")
      .select("id", { count: "exact", head: true })
      .gte("created_at", oneDayAgo),
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
 * 1. Picks pending discovered content candidates (up to 5) and filters out non-events.
 * 2. Processes with AI/heuristic generator.
 * 3. Validates editorial quality & active event dates before promoting to 'published'.
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
      .select("id, title, source_name, content_type")
      .eq("status", "pending_review")
      .eq("content_type", "event")
      .order("discovered_at", { ascending: false })
      .limit(5);

    const validCandidates = (candidates || []).filter(
      (c) => !isNonEventTitle(c.title)
    );

    if (validCandidates.length === 0) {
      details.push("Oto-Pilot: Uygun onay bekleyen etkinlik adayı bulunamadı.");
    } else {
      for (const candidate of validCandidates) {
        try {
          const importRes = await importDiscoveryAsEvent(candidate.id);
          const { data: evRow } = await supabaseAdmin
            .from("cultural_events")
            .select("id, slug, event_type, starts_at, ends_at, description")
            .eq("slug", importRes.slug)
            .maybeSingle();

          const expired =
            evRow &&
            (evRow.starts_at || evRow.ends_at) &&
            isEventExpired({
              eventType: evRow.event_type,
              startsAt: evRow.starts_at,
              endsAt: evRow.ends_at,
            });

          if (expired) {
            details.push(
              `Oto-Pilot Etkinlik Adayı Geçmiş Tarihli (Taslak bırakıldı): "${candidate.title}"`
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
            `Oto-Pilot Etkinlik Yayınlandı: "${candidate.title}" (${importRes.slug})`
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
      .select("id, title, source_name, content_type, raw_payload")
      .eq("status", "pending_review")
      .or(
        "content_type.eq.news,raw_payload->>inferred_content_type.eq.news,content_type.eq.article"
      )
      .order("discovered_at", { ascending: false })
      .limit(5);

    if (!candidates || candidates.length === 0) {
      details.push("Oto-Pilot: Uygun onay bekleyen haber adayı bulunamadı.");
    } else {
      for (const candidate of candidates) {
        try {
          const importRes = await importDiscoveryAsNews(candidate.id);
          const { data: newsRow } = await supabaseAdmin
            .from("cultural_news")
            .select("id, slug, content")
            .eq("slug", importRes.slug)
            .maybeSingle();

          const wc = countWords(newsRow?.content || "");
          if (wc < 100) {
            details.push(
              `Oto-Pilot Haber Taslak Olarak Kaydedildi (${wc} kelime): "${candidate.title}"`
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
            `Oto-Pilot Haber Yayınlandı: "${candidate.title}" (${importRes.slug})`
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
