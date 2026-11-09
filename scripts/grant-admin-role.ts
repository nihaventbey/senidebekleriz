/** Explicit trusted account migration; does not change passwords or trust user_metadata. */
import { createClient } from "@supabase/supabase-js";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const id = process.env.ADMIN_USER_ID?.trim();
  const email = process.env.ADMIN_EMAIL?.trim();
  if (!url || !key || !id || !email) {
    throw new Error("SUPABASE URL/key, ADMIN_USER_ID ve ADMIN_EMAIL gerekli.");
  }
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.admin.getUserById(id);
  if (error) throw error;
  if (data.user.email?.toLowerCase() !== email.toLowerCase()) {
    throw new Error("Kullanıcı ID ve e-posta eşleşmiyor; rol değiştirilmedi.");
  }
  const { error: updateError } = await client.auth.admin.updateUserById(id, {
    app_metadata: { ...data.user.app_metadata, role: "admin" },
  });
  if (updateError) throw updateError;
  console.log("Belirtilen hesabın güvenilir yönetici rolü güncellendi.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Rol güncellenemedi.");
  process.exitCode = 1;
});
