import fs from "fs";
import path from "path";

const jsonPath = path.join(process.cwd(), "data", "articles.json");
const articles = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

console.log(`Checking lengths for all ${articles.length} articles...\n`);

let shortCount = 0;
for (let i = 0; i < articles.length; i++) {
  const a = articles[i];
  const len = a.content.length;
  const status = len >= 2000 ? "✅ OK" : "❌ TOO SHORT";
  if (len < 2000) shortCount++;
  console.log(`[${i+1}] (${len} chars) ${status} -> ${a.slug}`);
}

console.log(`\nSummary: ${articles.length - shortCount}/${articles.length} articles are >= 2000 chars.`);
