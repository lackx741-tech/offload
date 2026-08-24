/**
 * Writes the same EVM bundle as GET /api/sdk to public/generated-scripts/
 * (no dev server required). Run from repo root:
 *   npx tsx scripts/sync-generated-sdk.ts
 */
import { generateLiveSdkBundle } from "@/lib/live-compile-bundle";
import { saveScriptBuild } from "@/lib/script-build-store";

async function main() {
  const bundle = await generateLiveSdkBundle();
  await saveScriptBuild({
    bundle,
    framework: "reown",
    source: "compile",
  });
  console.log("OK: public/generated-scripts/stealthv26-latest.min.js (+ timestamped copy)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
