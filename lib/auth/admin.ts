import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";

export async function getAdminUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user || user.app_metadata?.role !== "admin") {
    return null;
  }

  return user;
}

/** Authorize before accessing privileged services in every management action. */
export async function requireAdmin(): Promise<User> {
  const user = await getAdminUser();
  if (!user) throw new Error("Yetkisiz erişim");
  return user;
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
}
