import fs from "fs";
import path from "path";

const jsonPath = path.join(process.cwd(), "data", "articles.json");
const raw = fs.readFileSync(jsonPath, "utf-8");
const articles = JSON.parse(raw);

const sagalassos = articles.find((a: any) => a.slug === "sagalassos-antik-kenti-burdur");

console.log("TITLE:", sagalassos?.title);
console.log("LENGTH:", sagalassos?.content?.length, "characters");
console.log("CONTENT:\n", sagalassos?.content);
