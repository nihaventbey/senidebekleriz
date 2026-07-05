import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import type { AuthError, User } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function formatAuthError(error: AuthError | null | undefined): string {
  if (!error) return "bilinmeyen hata";
  const parts = [
    error.message,
    error.status ? `status=${error.status}` : null,
    error.code ? `code=${error.code}` : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : JSON.stringify(error);
}

function isNotFound(error: AuthError | null | undefined): boolean {
  return (
    error?.status === 404 ||
    error?.code === "user_not_found" ||
    error?.message?.toLowerCase().includes("not found") === true
  );
}

async function listUsersByEmail(email: string): Promise<User | undefined> {
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (error) {
    console.warn(`listUsers başarısız: ${formatAuthError(error)}`);
    return undefined;
  }

  return data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
}

async function updateAdmin(userId: string, password: string) {
  return supabase.auth.admin.updateUserById(userId, {
    password,
    email_confirm: true,
    user_metadata: { full_name: "Admin", role: "admin" },
  });
}

async function deleteAdmin(userId: string) {
  return supabase.auth.admin.deleteUser(userId);
}

async function createAdmin(email: string, password: string) {
  return supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Admin", role: "admin" },
  });
}

function printSqlCleanup(email: string) {
  console.error(`
GoTrue bu e-postayı tanımıyor ama veritabanında eski kayıt kalmış olabilir.
Supabase SQL Editor'de çalıştırın, ardından tekrar: npm run seed:admin

DELETE FROM auth.identities
WHERE user_id IN (SELECT id FROM auth.users WHERE email = '${email}');

DELETE FROM auth.users
WHERE email = '${email}';
`);
}

async function seedAdminUser() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@senidebekleriz.com";
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminUserId = process.env.ADMIN_USER_ID?.trim();

  if (!adminPassword) {
    throw new Error("ADMIN_PASSWORD environment variable is required.");
  }

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli (.env.local)."
    );
  }

  console.log(`Proje: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
  console.log(`Admin e-posta: ${adminEmail}`);
  if (adminUserId) console.log(`Admin user id (opsiyonel): ${adminUserId}`);
  console.log();

  let goTrueUser: User | undefined;

  // GoTrue'da e-posta ile ara
  goTrueUser = await listUsersByEmail(adminEmail);

  // ADMIN_USER_ID verilmişse ve listUsers bulamadıysa id ile güncellemeyi dene
  if (!goTrueUser && adminUserId) {
    const { error: updateError } = await updateAdmin(adminUserId, adminPassword);

    if (!updateError) {
      console.log("✅ Admin şifresi güncellendi (GoTrue formatında)");
      console.log(`   Kullanıcı id: ${adminUserId}`);
      return;
    }

    if (!isNotFound(updateError)) {
      throw new Error(
        `Admin şifresi güncellenemedi: ${formatAuthError(updateError)}`
      );
    }

    console.log(
      "GoTrue bu kullanıcı id'sini tanımıyor (404) — yeni kullanıcı oluşturulacak.\n"
    );
  }

  if (goTrueUser) {
    const { error: updateError } = await updateAdmin(
      goTrueUser.id,
      adminPassword
    );

    if (!updateError) {
      console.log("✅ Admin şifresi güncellendi (GoTrue formatında)");
      console.log(`   Kullanıcı id: ${goTrueUser.id}`);
      return;
    }

    if (!isNotFound(updateError)) {
      throw new Error(
        `Admin şifresi güncellenemedi: ${formatAuthError(updateError)}`
      );
    }

    console.log("GoTrue kaydı kayıp — yeniden oluşturuluyor...\n");
    const { error: deleteError } = await deleteAdmin(goTrueUser.id);
    if (deleteError && !isNotFound(deleteError)) {
      throw new Error(`Kullanıcı silinemedi: ${formatAuthError(deleteError)}`);
    }
  }

  const { data, error } = await createAdmin(adminEmail, adminPassword);

  if (error) {
    const duplicateEmail =
      error.message?.toLowerCase().includes("already") ||
      error.code === "email_exists" ||
      error.status === 422;

    if (duplicateEmail) {
      printSqlCleanup(adminEmail);
      throw new Error(
        `E-posta veritabanında mevcut ama GoTrue tanımıyor. Yukarıdaki SQL ile temizleyin.`
      );
    }

    throw new Error(`Admin kullanıcı oluşturulamadı: ${formatAuthError(error)}`);
  }

  console.log("✅ Admin kullanıcısı oluşturuldu:", data.user.email);
  console.log(`   Kullanıcı id: ${data.user.id}`);
  console.log("\nGiriş: /yonetim/giris");
  console.log(
    "\nİpucu: .env.local içindeki ADMIN_USER_ID artık gerekmez; yeni id yukarıda."
  );
}

seedAdminUser().catch((err) => {
  console.error("\n❌ Hata:", err.message);
  process.exit(1);
});
