import "./load-env";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { cleanPublisherText, stripDatelineFromParagraph } from "@/lib/ai/clean-publisher";
import { assessNewsDraft, countWords, polishMarkdown } from "@/lib/ai/editorial";
import { formatHeadingsWithAi } from "@/lib/ai/format-headings";
import { generateNewsDraft, inferNewsCategory } from "@/lib/ai/generate-news";
import { getCityName } from "@/lib/cities/lookup";
import { isRejectedNonTurkishOrCommercialContent } from "@/lib/discovery/classify-content";
import { isNonEventTitle } from "@/lib/events/artist-matcher";

async function repairCulturalNews() {
  console.log("\n=== 1. Repairing cultural_news ===");
  const { data: rows, error } = await supabaseAdmin
    .from("cultural_news")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !rows) {
    console.error("Failed to fetch cultural_news:", error?.message);
    return;
  }

  let polishedCount = 0;
  let regeneratedCount = 0;
  let headingsAddedCount = 0;
  let unpublishedOffContext = 0;

  for (const row of rows) {
    const cleanTitle = cleanPublisherText(row.title || "")
      .replace(/!+$/g, "")
      .trim();
    const cleanSummary = stripDatelineFromParagraph(
      cleanPublisherText(row.summary || cleanTitle)
    );

    // Unpublish off-context items (human-interest oddities / protocol visits / essay reviews)
    const offContext = isRejectedNonTurkishOrCommercialContent({
      title: cleanTitle,
      snippet: cleanSummary,
      sourceUrl: row.source_url || undefined,
      sourceName: row.source_name || undefined,
    });

    if (offContext) {
      if (row.is_published) {
        await supabaseAdmin
          .from("cultural_news")
          .update({
            is_published: false,
            updated_at: new Date().toISOString(),
          })
          .eq("id", row.id);
        unpublishedOffContext++;
        console.log(`  [UNPUBLISHED OFF-CONTEXT] ${row.slug}`);
      }
      continue;
    }

    let nextContent = polishMarkdown(
      row.content || "",
      cleanTitle,
      row.source_name || undefined
    );
    let nextSummary = cleanSummary;
    let nextTitle = cleanTitle;
    let nextCategory = row.category;

    // Fix obvious category mismatches (e.g. literature/theater/opera tagged as "restorasyon")
    if (
      nextCategory === "restorasyon" &&
      !/(restorasyon|restore|onarı|ihya|rölöve|konservasyon|taş konak|medrese|külliye|han|hamam|sarnıç|cami)/i.test(
        `${cleanTitle} ${cleanSummary}`
      )
    ) {
      nextCategory = inferNewsCategory(`${cleanTitle} ${cleanSummary} ${nextContent}`);
    }

    const currentLen = nextContent.length;
    const currentHeadings = (nextContent.match(/^#{2,3}\s+/gm) || []).length;

    // Regenerate thin / broken / zero-char articles using the upgraded AI engine (2,600 - 4,200 chars)
    if (currentLen < 1950) {
      try {
        console.log(`  [REGENERATING] ${row.slug} (was ${currentLen} chars)...`);
        const draft = await generateNewsDraft({
          topic: cleanTitle,
          sourceUrl: row.source_url || undefined,
          fallbackText:
            nextContent.length > 80
              ? nextContent
              : cleanSummary || cleanTitle,
          cityName: getCityName(row.city_slug) || undefined,
          coverImageHint: row.cover_image,
          depth: "standard",
        });

        const polishedDraft = polishMarkdown(
          draft.content,
          draft.title || cleanTitle,
          row.source_name || draft.source_name || undefined
        );

        const draftReport = assessNewsDraft(
          {
            title: draft.title || cleanTitle,
            summary: draft.summary || cleanSummary,
            content: polishedDraft,
          },
          { minWords: 320 }
        );

        if (polishedDraft.length > currentLen && polishedDraft.length >= 2000) {
          nextTitle = cleanPublisherText(draft.title || cleanTitle);
          nextSummary = cleanPublisherText(draft.summary || cleanSummary);
          nextContent = polishedDraft;
          nextCategory = draft.category || nextCategory;
          regeneratedCount++;
          console.log(
            `    -> Regenerated: ${nextContent.length} chars, ${countWords(
              nextContent
            )} words, score=${draftReport.score}`
          );
        }
      } catch (err) {
        console.warn(
          `    -> Regeneration skipped for ${row.slug}:`,
          err instanceof Error ? err.message : err
        );
      }
    } else if (currentHeadings === 0) {
      try {
        console.log(`  [ADDING HEADINGS] ${row.slug} (${currentLen} chars, 0 headings)...`);
        const formatted = await formatHeadingsWithAi({
          title: nextTitle,
          content: nextContent,
        });
        const polishedFormatted = polishMarkdown(
          formatted,
          nextTitle,
          row.source_name || undefined
        );
        if (
          (polishedFormatted.match(/^#{2,3}\s+/gm) || []).length >= 1 &&
          polishedFormatted.length >= Math.min(1850, nextContent.length * 0.75)
        ) {
          nextContent = polishedFormatted;
          headingsAddedCount++;
          console.log(
            `    -> Added headings: ${
              (nextContent.match(/^#{2,3}\s+/gm) || []).length
            } headings`
          );
        }
      } catch (err) {
        console.warn(
          `    -> Heading format skipped for ${row.slug}:`,
          err instanceof Error ? err.message : err
        );
      }
    }

    const changed =
      nextTitle !== row.title ||
      nextSummary !== (row.summary || "") ||
      nextContent !== (row.content || "") ||
      nextCategory !== row.category;

    if (changed) {
      const { error: updErr } = await supabaseAdmin
        .from("cultural_news")
        .update({
          title: nextTitle,
          summary: nextSummary,
          content: nextContent,
          category: nextCategory,
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);

      if (updErr) {
        console.error(`  [ERROR updating ${row.slug}]:`, updErr.message);
      } else {
        polishedCount++;
        console.log(
          `  [UPDATED] ${row.slug} -> ${nextContent.length} chars (cat=${nextCategory})`
        );
      }
    }
  }

  console.log(
    `cultural_news summary: updated=${polishedCount}, regenerated=${regeneratedCount}, headingsAdded=${headingsAddedCount}, unpublishedOffContext=${unpublishedOffContext}`
  );
}

async function repairCulturalEvents() {
  console.log("\n=== 2. Repairing cultural_events ===");
  const { data: rows, error } = await supabaseAdmin
    .from("cultural_events")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !rows) {
    console.error("Failed to fetch cultural_events:", error?.message);
    return;
  }

  let cleanedCount = 0;
  let rejectedNonEvents = 0;

  for (const ev of rows) {
    const cleanTitle = cleanPublisherText(ev.title || "");
    const nonEvent = isNonEventTitle(cleanTitle);

    const updates: Record<string, unknown> = {};

    if (nonEvent && ev.status === "published") {
      updates.status = "rejected";
      rejectedNonEvents++;
      console.log(`  [REJECTED NON-EVENT] ${ev.slug} ("${cleanTitle}")`);
    }

    if (ev.description) {
      const polishedDesc = polishMarkdown(
        ev.description,
        cleanTitle,
        ev.source_name || undefined
      );
      if (polishedDesc !== ev.description) {
        updates.description = polishedDesc;
      }
    }

    if (cleanTitle && cleanTitle !== ev.title) {
      updates.title = cleanTitle;
    }

    if (Object.keys(updates).length > 0) {
      updates.updated_at = new Date().toISOString();
      const { error: updErr } = await supabaseAdmin
        .from("cultural_events")
        .update(updates)
        .eq("id", ev.id);

      if (updErr) {
        console.error(`  [ERROR updating event ${ev.slug}]:`, updErr.message);
      } else {
        cleanedCount++;
      }
    }
  }

  console.log(
    `cultural_events summary: updated=${cleanedCount}, rejectedNonEvents=${rejectedNonEvents}`
  );
}

async function repairDiscoveredContent() {
  console.log("\n=== 3. Cleaning discovered_content queue ===");
  const { data: rows, error } = await supabaseAdmin
    .from("discovered_content")
    .select("id, title, snippet, source_url, source_name, content_type, status")
    .eq("status", "pending_review");

  if (error || !rows) {
    console.error("Failed to fetch discovered_content:", error?.message);
    return;
  }

  const rejectIds: string[] = [];
  const downgradeEventIds: string[] = [];

  for (const row of rows) {
    if (
      isRejectedNonTurkishOrCommercialContent({
        title: row.title,
        snippet: row.snippet || undefined,
        sourceUrl: row.source_url,
        sourceName: row.source_name || undefined,
      })
    ) {
      rejectIds.push(row.id);
      console.log(`  [REJECT PENDING] "${row.title}"`);
      continue;
    }

    if (row.content_type === "event" && isNonEventTitle(row.title)) {
      downgradeEventIds.push(row.id);
      console.log(`  [DOWNGRADE EVENT->NEWS] "${row.title}"`);
    }
  }

  if (rejectIds.length > 0) {
    await supabaseAdmin
      .from("discovered_content")
      .update({ status: "rejected", updated_at: new Date().toISOString() })
      .in("id", rejectIds);
  }

  if (downgradeEventIds.length > 0) {
    await supabaseAdmin
      .from("discovered_content")
      .update({ content_type: "news", updated_at: new Date().toISOString() })
      .in("id", downgradeEventIds);
  }

  console.log(
    `discovered_content summary: rejected=${rejectIds.length}, eventToNews=${downgradeEventIds.length}`
  );
}

async function main() {
  await repairCulturalNews();
  await repairCulturalEvents();
  await repairDiscoveredContent();
  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Repair script failed:", err);
  process.exit(1);
});
