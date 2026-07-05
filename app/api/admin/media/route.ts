import { NextRequest, NextResponse } from "next/server";
import { getAdminUser, unauthorizedResponse } from "@/lib/auth/admin";
import { uploadImageBuffer } from "@/lib/storage/upload-image-from-url";

export const runtime = "nodejs";
export const maxDuration = 60;

function safeSegment(value: string): string {
  return value
    .replace(/[^a-z0-9-]/gi, "-")
    .replace(/-+/g, "-")
    .slice(0, 80)
    .replace(/^-+|-+$/g, "");
}

export async function POST(request: NextRequest) {
  const user = await getAdminUser();
  if (!user) return unauthorizedResponse();

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const folder = safeSegment((formData.get("folder") as string) || "uploads");
    const slug = safeSegment((formData.get("slug") as string) || "item");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Dosya gerekli" }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const path = `${folder || "uploads"}/${slug || "item"}/${Date.now()}-cover`;

    const url = await uploadImageBuffer(bytes, file.type, path);
    if (!url) {
      return NextResponse.json(
        { error: "Görsel yüklenemedi (format veya boyut hatası)" },
        { status: 400 }
      );
    }

    return NextResponse.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Yükleme hatası";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
