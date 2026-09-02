import { NextRequest, NextResponse } from "next/server";
import { getAdminUser, unauthorizedResponse } from "@/lib/auth/admin";
import { callGeminiText } from "@/lib/ai/gemini-client";
import { uploadImageFromUrl } from "@/lib/storage/upload-image-from-url";
import { slugify } from "@/lib/slugify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STYLE_PROMPTS: Record<string, string> = {
  photo: "photorealistic, 8k resolution, authentic colors, documentary photography style, natural lighting, highly detailed, sharp focus",
  cinematic: "cinematic composition, dramatic atmospheric lighting, golden hour, wide angle, award winning photography, 8k resolution, ultra-detailed",
  historic: "cultural heritage photography, authentic architectural details, historic realism, museum archival quality, National Geographic style",
  digital_art: "modern cultural art poster style, vibrant and elegant, cultural Turkish motifs, refined digital illustration, high contrast, clean aesthetics",
};

const ASPECT_RATIOS: Record<string, { width: number; height: number }> = {
  "16:9": { width: 1200, height: 675 },
  "4:3": { width: 1024, height: 768 },
  "1:1": { width: 1000, height: 1000 },
};

export async function POST(request: NextRequest) {
  const user = await getAdminUser();
  if (!user) return unauthorizedResponse();

  try {
    const body = await request.json();
    const {
      prompt: rawPrompt,
      title,
      category,
      cityName,
      style = "photo",
      aspectRatio = "16:9",
      uploadToStorage = false,
      slugHint,
    } = body;

    let targetPrompt = (rawPrompt || "").trim();

    // If only title/topic or simple prompt provided, use Gemini to create an expert image generation prompt
    if (!targetPrompt || targetPrompt.length < 30 || title) {
      const systemPrompt = `You are a world-class prompt engineer for AI image generation (Midjourney / Flux / Imagen), specializing in Turkish cultural heritage, archaeology, tourism, festivals, museums, historical architecture, and scenic Turkey locations.
Create a vivid, highly descriptive, photorealistic image generation prompt in English.
Do NOT output explanations, prefixes or markdown. Return ONLY the final comma-separated English prompt string.`;

      const userPrompt = [
        title ? `Title / Subject: ${title}` : null,
        cityName ? `City in Turkey: ${cityName}` : null,
        category ? `Category / Theme: ${category}` : null,
        rawPrompt ? `User prompt notes: ${rawPrompt}` : null,
        "Create an evocative, highly specific, culturally authentic, high-quality visual description.",
      ]
        .filter(Boolean)
        .join("\n");

      try {
        const generated = await callGeminiText({
          systemPrompt,
          userPrompt,
          temperature: 0.6,
        });
        if (generated && generated.length > 10) {
          targetPrompt = generated;
        }
      } catch (err) {
        console.warn("Gemini prompt enhancement fallback:", err);
        targetPrompt = targetPrompt || title || "Turkish cultural heritage landmark scenic view";
      }
    }

    const styleModifier = STYLE_PROMPTS[style] || STYLE_PROMPTS.photo;
    const finalPrompt = `${targetPrompt}, ${styleModifier}, no text watermark, no distortion, masterpiece`;

    const dims = ASPECT_RATIOS[aspectRatio] || ASPECT_RATIOS["16:9"];
    const seed = Math.floor(Math.random() * 10000000);
    const encodedPrompt = encodeURIComponent(finalPrompt.slice(0, 500));

    const generatedImageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${dims.width}&height=${dims.height}&seed=${seed}&nologo=true&enhance=true&model=flux`;

    let finalImageUrl = generatedImageUrl;

    // If immediate storage upload is requested
    if (uploadToStorage) {
      const safeSlug = slugify(slugHint || title || "ai-image");
      const storagePath = `generated/${safeSlug}/${Date.now()}/ai-cover`;
      const uploadedUrl = await uploadImageFromUrl(generatedImageUrl, storagePath);
      if (uploadedUrl) {
        finalImageUrl = uploadedUrl;
      }
    }

    return NextResponse.json({
      success: true,
      imageUrl: finalImageUrl,
      refinedPrompt: finalPrompt,
      prompt: targetPrompt,
      originalTitle: title || null,
      isStored: uploadToStorage && finalImageUrl !== generatedImageUrl,
    });
  } catch (error) {
    console.error("AI image generation error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "AI görsel üretimi başarısız oldu",
      },
      { status: 500 }
    );
  }
}
