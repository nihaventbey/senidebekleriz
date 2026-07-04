"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AccountActionResult = {
  error?: string;
  success?: string;
};

async function getAuthenticatedAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user || user.user_metadata?.role !== "admin") {
    return { supabase: null, user: null };
  }

  return { supabase, user };
}

async function verifyCurrentPassword(
  supabase: Awaited<ReturnType<typeof createClient>>,
  email: string,
  currentPassword: string
): Promise<AccountActionResult | null> {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: currentPassword,
  });

  if (error) {
    return { error: "Mevcut şifre hatalı." };
  }

  return null;
}

export async function getAdminAccountEmail(): Promise<string | null> {
  const { user } = await getAuthenticatedAdmin();
  return user?.email ?? null;
}

export async function updateAdminEmail(
  formData: FormData
): Promise<AccountActionResult> {
  const { supabase, user } = await getAuthenticatedAdmin();
  if (!supabase || !user?.email) {
    return { error: "Oturum bulunamadı." };
  }

  const newEmail = (formData.get("email") as string)?.trim();
  const currentPassword = formData.get("current_password") as string;

  if (!newEmail) {
    return { error: "Yeni e-posta adresi gerekli." };
  }

  if (newEmail === user.email) {
    return { error: "Yeni e-posta mevcut adresle aynı." };
  }

  const passwordError = await verifyCurrentPassword(
    supabase,
    user.email,
    currentPassword
  );
  if (passwordError) return passwordError;

  const { error } = await supabase.auth.updateUser({ email: newEmail });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/yonetim/hesap");
  return {
    success:
      "E-posta güncelleme isteği gönderildi. Gelen kutunuzu kontrol edin.",
  };
}

export async function updateAdminPassword(
  formData: FormData
): Promise<AccountActionResult> {
  const { supabase, user } = await getAuthenticatedAdmin();
  if (!supabase || !user?.email) {
    return { error: "Oturum bulunamadı." };
  }

  const currentPassword = formData.get("current_password") as string;
  const newPassword = formData.get("new_password") as string;
  const confirmPassword = formData.get("confirm_password") as string;

  if (!newPassword || newPassword.length < 8) {
    return { error: "Yeni şifre en az 8 karakter olmalı." };
  }

  if (newPassword !== confirmPassword) {
    return { error: "Yeni şifreler eşleşmiyor." };
  }

  if (newPassword === currentPassword) {
    return { error: "Yeni şifre mevcut şifreden farklı olmalı." };
  }

  const passwordError = await verifyCurrentPassword(
    supabase,
    user.email,
    currentPassword
  );
  if (passwordError) return passwordError;

  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/yonetim/hesap");
  return { success: "Şifreniz güncellendi." };
}
