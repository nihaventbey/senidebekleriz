import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";

export async function getAdminUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== "admin") {
    return null;
  }

  return user;
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
}
