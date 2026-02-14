/**
 * Copies Expo web build (../expo/dist) into landing/public/app
 * so that Vite includes it in dist/app when building the landing.
 * Run from repo root or from landing with cwd = landing.
 */
const fs = require("fs");
const path = require("path");

const landingDir = path.resolve(__dirname, "..");
const expoDist = path.join(landingDir, "..", "expo", "dist");
const publicApp = path.join(landingDir, "public", "app");

if (!fs.existsSync(expoDist)) {
  console.error("Expo web build not found at", expoDist);
  console.error("Run from expo/: npm ci && npx expo export --platform web");
  process.exit(1);
}

if (!fs.existsSync(path.join(landingDir, "public"))) {
  fs.mkdirSync(path.join(landingDir, "public"), { recursive: true });
}
if (fs.existsSync(publicApp)) {
  fs.rmSync(publicApp, { recursive: true });
}
fs.mkdirSync(publicApp, { recursive: true });

function copyRecursive(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyRecursive(expoDist, publicApp);
console.log("Copied Expo web build to landing/public/app");
console.log("Run landing build (npm run build) to produce dist/app");
process.exit(0);
