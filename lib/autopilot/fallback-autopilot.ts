import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  importDiscoveryAsEvent,
  importDiscoveryAsNews,
} from "@/lib/discovery/service";
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

  const [
    { count: eventsCount },
    { count: newsCount },
  ] = await Promise.all([
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
 * 1. Picks pending discovered content.
 * 2. Processes with AI/heuristic generator.
 * 3. Downloads images directly to Supabase Storage 'media' bucket (real files, no Base64, no Vercel Blob quota).
 * 4. Publishes automatically to keep the portal fresh and active.
 */
export async function runAutopilotFallback(): Promise<AutopilotResult> {
  const status = await getAutopilotStatus();
  const details: string[] = [];
  let eventsPublished = 0;
  let newsPublished = 0;

  // 1. If 0 events in last 24h, auto-publish 1 event from discovered content
  if (status.shouldPublishEvent) {
    // Look for pending event candidate
    const { data: candidates } = await supabaseAdmin
      .from("discovered_content")
      .select("id, title, source_name, content_type")
      .eq("status", "pending_review")
      .eq("content_type", "event")
      .order("discovered_at", { ascending: false })
      .limit(1);

    const candidate = candidates?.[0];
    if (candidate) {
      try {
        const importRes = await importDiscoveryAsEvent(candidate.id);
        // Promote immediately from pending_review to published
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
      } catch (err) {
        console.error("Autopilot event publish error:", err);
        details.push(
          `Oto-Pilot Etkinlik Hatası: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    } else {
      details.push("Oto-Pilot: Uygun onay bekleyen etkinlik adayı bulunamadı.");
    }
  } else {
    details.push(
      `Son 24 saatte ${status.eventsInLast24h} etkinlik zaten girilmiş, oto-pilot pas geçildi.`
    );
  }

  // 2. If 0 news in last 24h, auto-publish 1 news article from discovered content
  if (status.shouldPublishNews) {
    // Look for pending news candidate (either content_type=news or inferred_content_type=news)
    const { data: candidates } = await supabaseAdmin
      .from("discovered_content")
      .select("id, title, source_name, content_type, raw_payload")
      .eq("status", "pending_review")
      .or("content_type.eq.news,raw_payload->>inferred_content_type.eq.news,content_type.eq.article")
      .order("discovered_at", { ascending: false })
      .limit(1);

    const candidate = candidates?.[0];
    if (candidate) {
      try {
        const importRes = await importDiscoveryAsNews(candidate.id);
        // Promote immediately to published
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
      } catch (err) {
        console.error("Autopilot news publish error:", err);
        details.push(
          `Oto-Pilot Haber Hatası: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    } else {
      details.push("Oto-Pilot: Uygun onay bekleyen haber adayı bulunamadı.");
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
