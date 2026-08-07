import { config } from "dotenv";
config({ path: ".env.local" });
import fs from "fs/promises";
import path from "path";

async function testImages() {
  const jsonPath = path.join(process.cwd(), "data", "articles.json");
  const rawData = await fs.readFile(jsonPath, "utf-8");
  const articles = JSON.parse(rawData);

  console.log(`Checking ${articles.length} article cover images...\n`);

  for (let i = 0; i < articles.length; i++) {
    const art = articles[i];
    const url = art.cover_image;
    try {
      const res = await fetch(url, {
        method: "HEAD",
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
      });
      if (res.ok) {
        console.log(`✅ [${i+1}] ${art.slug}: OK (${res.status})`);
      } else {
        console.log(`❌ [${i+1}] ${art.slug}: FAILED (${res.status}) -> ${url}`);
      }
    } catch (e: any) {
      console.log(`❌ [${i+1}] ${art.slug}: ERROR -> ${e.message}`);
    }
  }
}

testImages();
