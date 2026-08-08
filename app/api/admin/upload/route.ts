import { type NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { uploadImageBuffer } from "@/lib/storage/upload-image-from-url";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Dosya seçilmedi" }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const storagePath = `uploads/${Date.now()}-${file.name.replace(/[^a-z0-9.-]/gi, "_")}`;
    
    const publicUrl = await uploadImageBuffer(bytes, file.type, storagePath);

    if (!publicUrl) {
      return NextResponse.json(
        { error: "Görsel yüklenemedi. Formatı veya boyutu desteklenmiyor." },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error("Upload endpoint error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Yükleme hatası" },
      { status: 500 }
    );
  }
}
