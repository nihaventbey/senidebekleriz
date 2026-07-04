const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function rmSyncRecursive(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function copySyncRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((child) => {
      copySyncRecursive(path.join(src, child), path.join(dest, child));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

console.log("🚀 Build başlıyor...\n");
execSync("npm run build", { stdio: "inherit" });

console.log("\n📦 Deployment paketi hazırlanıyor...\n");

// Eski deploy klasörünü temizle
rmSyncRecursive("deploy");
fs.mkdirSync("deploy", { recursive: true });

// Standalone dosyalarını kopyala
copySyncRecursive(".next/standalone", "deploy");

// Static dosyalarını kopyala
fs.mkdirSync("deploy/.next/static", { recursive: true });
copySyncRecursive(".next/static", "deploy/.next/static");

// Public dosyalarını kopyala
copySyncRecursive("public", "deploy/public");

console.log("\n✅ deploy/ klasörü hazır!");
console.log("📤 Şimdi deploy/ klasörünün içindekileri FTP'deki senidebekleriz.com klasörüne at.");
