import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { ScrapedIntro } from "@/lib/ingest/valilik-scraper";

export type BridgeOptions = {
  force?: boolean;
  publish?: boolean;
  dryRun?: boolean;
};

export type BridgeResult = {
  slug: string;
  status: "success" | "skipped" | "error";
  message: string;
  coverUpdated: boolean;
};

const DESCRIPTION_UPDATE_THRESHOLD = 200;

export function createBridgeClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli (.env.local)"
    );
  }
  return createClient(url, key);
}

function sourceNote(intro: ScrapedIntro): string {
  const date = new Date().toLocaleDateString("tr-TR");
  return `\n<p><em>Kaynak: <a href="${intro.sourceUrl}" rel="nofollow noopener" target="_blank">${intro.name} Valiliği</a> — ${date}</em></p>`;
}

async function logSync(
  db: SupabaseClient,
  entityId: string,
  status: "success" | "error",
  message: string
): Promise<void> {
  await db.from("sync_logs").insert({
    source: "valilik",
    entity_type: "city",
    entity_id: entityId,
    status,
    message: message.slice(0, 500),
  });
}

/**
 * Writes a scraped province intro into Supabase:
 * - upserts the guide page (rehber-{slug})
 * - updates cities.description when it is empty/short
 * - optionally sets the city cover image (already uploaded to storage)
 * Honors manual/lock protection so admin edits are never overwritten.
 */
export async function bridgeIntroToSupabase(
  db: SupabaseClient,
  intro: ScrapedIntro,
  coverUrl: string | null,
  options: BridgeOptions
): Promise<BridgeResult> {
  try {
    const { data: city } = await db
      .from("cities")
      .select(
        "id, slug, description, cover_image, cover_image_locked, cover_image_source"
      )
      .eq("slug", intro.slug)
      .maybeSingle();

    if (!city) {
      const message = "Şehir bulunamadı";
      if (!options.dryRun) await logSync(db, intro.slug, "error", message);
      return { slug: intro.slug, status: "error", message, coverUpdated: false };
    }

    const pageSlug = `rehber-${intro.slug}`;

    const { data: existingPage } = await db
      .from("pages")
      .select("id, content_source, updated_at")
      .eq("slug", pageSlug)
      .maybeSingle();

    // Overwrite protection: never touch manually edited guides unless forced.
    if (
      existingPage &&
      existingPage.content_source === "manual" &&
      !options.force
    ) {
      const message = "Manuel içerik korundu (atlandı)";
      return {
        slug: intro.slug,
        status: "skipped",
        message,
        coverUpdated: false,
      };
    }

    const contentHtml = intro.contentHtml + sourceNote(intro);
    const pagePayload = {
      slug: pageSlug,
      title: `${intro.name} Şehir Rehberi`,
      content: contentHtml,
      meta_title: `${intro.name} Şehir Rehberi ve Tanıtımı`,
      meta_description: intro.summary.slice(0, 160),
      source_url: intro.sourceUrl,
      content_source: "valilik" as const,
      is_published: Boolean(options.publish),
      updated_at: new Date().toISOString(),
    };

    // Decide cover update (respect manual lock).
    const coverLocked =
      city.cover_image_locked || city.cover_image_source === "manual";
    const shouldSetCover = Boolean(
      coverUrl && !coverLocked && (!city.cover_image || options.force)
    );

    // Decide description update.
    const currentDescription = (city.description || "").trim();
    const shouldUpdateDescription =
      currentDescription.length < DESCRIPTION_UPDATE_THRESHOLD || options.force;

    if (options.dryRun) {
      return {
        slug: intro.slug,
        status: "success",
        message: `[dry-run] page=${pageSlug} cover=${shouldSetCover} desc=${shouldUpdateDescription}`,
        coverUpdated: shouldSetCover,
      };
    }

    // Upsert guide page.
    if (existingPage) {
      const { error } = await db
        .from("pages")
        .update(pagePayload)
        .eq("id", existingPage.id);
      if (error) throw new Error(`pages update: ${error.message}`);
    } else {
      const { error } = await db.from("pages").insert(pagePayload);
      if (error) throw new Error(`pages insert: ${error.message}`);
    }

    // Update city description / cover / source.
    const cityUpdate: Record<string, unknown> = {
      intro_source_url: intro.sourceUrl,
      updated_at: new Date().toISOString(),
    };
    if (shouldUpdateDescription) cityUpdate.description = intro.summary;
    if (shouldSetCover) {
      cityUpdate.cover_image = coverUrl;
      cityUpdate.cover_image_source = "valilik";
    }

    const { error: cityError } = await db
      .from("cities")
      .update(cityUpdate)
      .eq("id", city.id);
    if (cityError) throw new Error(`cities update: ${cityError.message}`);

    const message = `Rehber güncellendi${shouldSetCover ? " +kapak" : ""}`;
    await logSync(db, intro.slug, "success", message);

    return {
      slug: intro.slug,
      status: "success",
      message,
      coverUpdated: shouldSetCover,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bilinmeyen hata";
    if (!options.dryRun) await logSync(db, intro.slug, "error", message);
    return { slug: intro.slug, status: "error", message, coverUpdated: false };
  }
}
