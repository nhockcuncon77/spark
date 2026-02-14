// scripts/sync_expo_appjson.js
// Usage: node scripts/sync_expo_appjson.js
// Idempotent: updates expo/app.json and expo/package.json with version from root package.json

const fs = require("fs");
const path = require("path");

const rootPkgPath = path.resolve(__dirname, "..", "package.json");
const appJsonPath = path.resolve(__dirname, "..", "expo", "app.json");
const expoPkgPath = path.resolve(__dirname, "..", "expo", "package.json");

function parseSemver(v) {
  const m = /^v?(\d+)\.(\d+)\.(\d+)(?:-(.+))?/.exec(v);
  if (!m) return null;
  return {
    major: parseInt(m[1], 10),
    minor: parseInt(m[2], 10),
    patch: parseInt(m[3], 10),
    rest: m[4] || "",
  };
}

// Read root package.json
const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, "utf8"));
const version = String(rootPkg.version || "0.0.0");

// Read expo app.json
const appJson = JSON.parse(fs.readFileSync(appJsonPath, "utf8"));

// Read expo package.json
const expoPkg = JSON.parse(fs.readFileSync(expoPkgPath, "utf8"));

// Compute android.versionCode (monotonic integer).
// Strategy: major * 1_000_000 + minor * 1_000 + patch
// => supports major up to thousands, patch up to 999.
const sem = parseSemver(version) || { major: 0, minor: 0, patch: 0 };
const androidVersionCode = sem.major * 1000000 + sem.minor * 1000 + sem.patch;

// Update app.json fields
let appJsonChanged = false;
if (appJson.expo == null) appJson.expo = {};

if (appJson.expo.version !== version) {
  appJson.expo.version = version;
  appJsonChanged = true;
}
if (!appJson.expo.android) appJson.expo.android = {};
if (appJson.expo.android.versionCode !== androidVersionCode) {
  appJson.expo.android.versionCode = androidVersionCode;
  appJsonChanged = true;
}
if (!appJson.expo.ios) appJson.expo.ios = {};
if (appJson.expo.ios.buildNumber !== version) {
  appJson.expo.ios.buildNumber = version;
  appJsonChanged = true;
}

// Write app.json if changed
if (appJsonChanged) {
  fs.writeFileSync(
    appJsonPath,
    JSON.stringify(appJson, null, 2) + "\n",
    "utf8",
  );
  console.log(
    `expo/app.json updated — version=${version}, android.versionCode=${androidVersionCode}`,
  );
} else {
  console.log("expo/app.json already in sync");
}

// Update expo package.json version
let expoPkgChanged = false;
if (expoPkg.version !== version) {
  expoPkg.version = version;
  expoPkgChanged = true;
}

// Write expo package.json if changed
if (expoPkgChanged) {
  fs.writeFileSync(
    expoPkgPath,
    JSON.stringify(expoPkg, null, 2) + "\n",
    "utf8",
  );
  console.log(`expo/package.json updated — version=${version}`);
} else {
  console.log("expo/package.json already in sync");
}
