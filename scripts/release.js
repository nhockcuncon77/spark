#!/usr/bin/env node
// scripts/release.js
// Usage: node scripts/release.js [patch|minor|major]
// Handles version bumping, changelog updates, syncing, and git tagging

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const BUMP_TYPE = process.argv[2];
const VALID_BUMPS = ["patch", "minor", "major"];

if (!VALID_BUMPS.includes(BUMP_TYPE)) {
  console.error(`Usage: node scripts/release.js [${VALID_BUMPS.join("|")}]`);
  process.exit(1);
}

const ROOT_DIR = path.resolve(__dirname, "..");
const ROOT_PKG_PATH = path.join(ROOT_DIR, "package.json");
const EXPO_PKG_PATH = path.join(ROOT_DIR, "expo", "package.json");
const APP_JSON_PATH = path.join(ROOT_DIR, "expo", "app.json");
const CHANGELOG_PATH = path.join(ROOT_DIR, "CHANGELOG.md");

function exec(cmd, options = {}) {
  console.log(`$ ${cmd}`);
  return execSync(cmd, { cwd: ROOT_DIR, stdio: "inherit", ...options });
}

function execSilent(cmd) {
  return execSync(cmd, { cwd: ROOT_DIR, encoding: "utf8" }).trim();
}

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function bumpVersion(version, type) {
  const parts = version.split(".").map(Number);
  if (type === "major") {
    parts[0]++;
    parts[1] = 0;
    parts[2] = 0;
  } else if (type === "minor") {
    parts[1]++;
    parts[2] = 0;
  } else {
    parts[2]++;
  }
  return parts.join(".");
}

function getGitLogs(fromTag) {
  try {
    // Get commits since last tag
    const logs = execSilent(
      `git log ${fromTag}..HEAD --pretty=format:"- %s (%h)" --no-merges`
    );
    return logs || "- Various improvements and bug fixes";
  } catch {
    // No previous tag, get recent commits
    try {
      const logs = execSilent(
        `git log --pretty=format:"- %s (%h)" --no-merges -20`
      );
      return logs || "- Initial release";
    } catch {
      return "- Release updates";
    }
  }
}

function getLatestTag() {
  try {
    return execSilent("git describe --tags --abbrev=0");
  } catch {
    return null;
  }
}

function updateChangelog(version, bumpType) {
  const latestTag = getLatestTag();
  const commits = latestTag ? getGitLogs(latestTag) : "- Release updates";

  const date = new Date().toISOString().split("T")[0];
  const changeType =
    bumpType === "major"
      ? "Major Changes"
      : bumpType === "minor"
        ? "Minor Changes"
        : "Patch Changes";

  const newEntry = `## ${version}

### ${changeType}

${commits}

_Released: ${date}_

`;

  let changelog = "";
  if (fs.existsSync(CHANGELOG_PATH)) {
    changelog = fs.readFileSync(CHANGELOG_PATH, "utf8");
  }

  // Find where to insert (after the header)
  const headerMatch = changelog.match(/^# .+\n+/);
  if (headerMatch) {
    const insertPos = headerMatch[0].length;
    changelog =
      changelog.slice(0, insertPos) + newEntry + changelog.slice(insertPos);
  } else {
    changelog = `# blindly\n\n${newEntry}${changelog}`;
  }

  fs.writeFileSync(CHANGELOG_PATH, changelog, "utf8");
  console.log(`✓ Updated CHANGELOG.md`);
}

function computeAndroidVersionCode(version) {
  const parts = version.split(".").map(Number);
  return parts[0] * 1000000 + parts[1] * 1000 + parts[2];
}

// Main release flow
console.log(`\n🚀 Starting ${BUMP_TYPE} release...\n`);

// 1. Check for clean working directory (allow staged changes)
try {
  const status = execSilent("git status --porcelain");
  if (status) {
    console.log("⚠️  Working directory has changes. They will be included in the release commit.\n");
  }
} catch (e) {
  console.error("Failed to check git status:", e.message);
  process.exit(1);
}

// 2. Read current version and compute new version
const rootPkg = readJSON(ROOT_PKG_PATH);
const currentVersion = rootPkg.version;
const newVersion = bumpVersion(currentVersion, BUMP_TYPE);

console.log(`📦 Version: ${currentVersion} → ${newVersion}\n`);

// 3. Update root package.json
rootPkg.version = newVersion;
writeJSON(ROOT_PKG_PATH, rootPkg);
console.log(`✓ Updated package.json`);

// 4. Update expo/package.json
const expoPkg = readJSON(EXPO_PKG_PATH);
expoPkg.version = newVersion;
writeJSON(EXPO_PKG_PATH, expoPkg);
console.log(`✓ Updated expo/package.json`);

// 5. Update expo/app.json
const appJson = readJSON(APP_JSON_PATH);
appJson.expo.version = newVersion;
appJson.expo.android = appJson.expo.android || {};
appJson.expo.android.versionCode = computeAndroidVersionCode(newVersion);
appJson.expo.ios = appJson.expo.ios || {};
appJson.expo.ios.buildNumber = newVersion;
writeJSON(APP_JSON_PATH, appJson);
console.log(`✓ Updated expo/app.json (versionCode: ${appJson.expo.android.versionCode})`);

// 6. Update CHANGELOG.md
updateChangelog(newVersion, BUMP_TYPE);

// 7. Git operations
console.log(`\n📝 Committing changes...`);
exec("git add -A");
exec(`git commit -m "chore(release): v${newVersion}"`);

console.log(`\n🏷️  Creating tag v${newVersion}...`);
exec(`git tag -a v${newVersion} -m "Release v${newVersion}"`);

console.log(`\n📤 Pushing to remote...`);
exec("git push");
exec("git push --tags");

console.log(`\n✅ Successfully released v${newVersion}!\n`);
