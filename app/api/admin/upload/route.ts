import { NextRequest, NextResponse } from "next/server";
import { getAdminUser, unauthorizedResponse } from "@/lib/auth/admin";
import { uploadImageBuffer, uploadImageFromUrl } from "@/lib/storage/upload-image-from-url";

export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]);
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  try {
    const user = await getAdminUser();
    if (!user) {
      return unauthorizedResponse();
    }

    const contentTypeHeader = req.headers.get("content-type") || "";

    // 1. JSON body: Transfer external URL -> EXIF-free WebP on Supabase
    if (contentTypeHeader.includes("application/json")) {
      const body = await req.json();
      const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl.trim() : "";
      const folderRaw = typeof body.folder === "string" ? body.folder : "uploads";
      const folder = (["news", "events", "articles", "places", "uploads"].includes(folderRaw)
        ? folderRaw
        : "uploads") as "news" | "events" | "articles" | "places" | "uploads";
      const slugHint = typeof body.slugHint === "string" ? body.slugHint : "kapak";

      if (!imageUrl || (!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://"))) {
        return NextResponse.json(
          { error: "Geçerli bir görsel URL'si girin (http/https)." },
          { status: 400 }
        );
      }

      const publicUrl = await uploadImageFromUrl(imageUrl, {
        folder,
        slugHint,
        forceReprocess: true,
      });

      if (!publicUrl) {
        return NextResponse.json(
          { error: "Görsel karşı sunucudan indirilemedi veya WebP formatına dönüştürülemedi." },
          { status: 422 }
        );
      }

      return NextResponse.json({
        url: publicUrl,
        format: "webp",
        exifStripped: true,
      });
    }

    // 2. Multipart FormData: Direct file upload -> EXIF-free WebP on Supabase
    const formData = await req.formData();
    const file = formData.get("file");
    const folderRaw = (formData.get("folder") as string) || "uploads";
    const folder = (["news", "events", "articles", "places", "uploads"].includes(folderRaw)
      ? folderRaw
      : "uploads") as "news" | "events" | "articles" | "places" | "uploads";
    const slugHint = (formData.get("slugHint") as string) || "";

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Desteklenmeyen dosya türü. Sadece JPG, PNG, WebP, AVIF ve GIF yüklenebilir." },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Dosya boyutu 10 MB'ı aşamaz." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const publicUrl = await uploadImageBuffer(buffer, file.type, {
      folder,
      slugHint: slugHint || file.name.replace(/\.[^.]+$/, ""),
    });

    if (!publicUrl) {
      return NextResponse.json(
        { error: "Görsel WebP'ye dönüştürülüp Supabase Storage'a yüklenemedi." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: publicUrl,
      format: "webp",
      exifStripped: true,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Yükleme hatası";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
