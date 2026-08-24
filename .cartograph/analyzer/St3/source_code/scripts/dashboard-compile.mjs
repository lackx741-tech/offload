/**
 * POST /api/compile using data/compile-config.json (same shape as the Compile page).
 * Usage: from repo root, with dev server already up:
 *   node scripts/dashboard-compile.mjs
 * Or set PORT if not 3000:
 *   PORT=3015 node scripts/dashboard-compile.mjs
 *
 * To refresh public/generated-scripts/stealthv26-latest.min.js without a server:
 *   npm run sdk:sync
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const port = process.env.PORT || "3000";
const base = `http://127.0.0.1:${port}`;

const cfgPath = path.join(root, "data", "compile-config.json");
const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));

const payload = {
  ...cfg,
  saveConfig: true,
  saveBuild: true,
  source: "cli",
  receiverAddress: (cfg.payout && cfg.payout.address) || undefined,
};

const res = await fetch(`${base}/api/compile`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});

const text = await res.text();
let data;
try {
  data = JSON.parse(text);
} catch {
  console.error("Non-JSON response:", text.slice(0, 2000));
  process.exit(1);
}

console.log("HTTP", res.status);
if (!res.ok) {
  console.error(data);
  process.exit(1);
}

console.log(data.message || data.status);
console.log("bundle KB:", data.bundle?.sizeKB);
console.log("published:", data.publishedBuild?.url || "(none)");
console.log("latest static: /generated-scripts/stealthv26-latest.min.js");
