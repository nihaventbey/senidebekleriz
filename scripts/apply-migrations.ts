/**
 * Bekleyen SQL migration dosyalarını doğrudan Postgres'e uygular.
 *
 * Gerekli: DATABASE_URL veya SUPABASE_DB_URL (.env.local)
 * Supabase Dashboard → Project Settings → Database → Connection string (URI)
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";

const migrationsDir = join(process.cwd(), "supabase/migrations");

async function main() {
  const databaseUrl =
    process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

  if (!databaseUrl) {
    console.error(
      "DATABASE_URL veya SUPABASE_DB_URL tanımlı değil.\n" +
        "Supabase Dashboard → Settings → Database → Connection string (URI)\n" +
        "Alternatif: SQL Editor'da supabase/migrations/*.sql dosyalarını çalıştırın."
    );
    process.exit(1);
  }

  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.log("Migration dosyası bulunamadı.");
    return;
  }

  const sql = postgres(databaseUrl, { max: 1 });

  try {
    for (const file of files) {
      const content = readFileSync(join(migrationsDir, file), "utf8");
      process.stdout.write(`${file}... `);
      await sql.unsafe(content);
      console.log("OK");
    }
    console.log(`\n${files.length} migration uygulandı.`);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error("Migration hatası:", err instanceof Error ? err.message : err);
  process.exit(1);
});
