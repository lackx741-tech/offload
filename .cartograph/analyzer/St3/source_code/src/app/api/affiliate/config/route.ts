/**
 * PUT /api/affiliate/config
 *
 * Public-facing config save endpoint for affiliates.
 * - Requires projectId in body
 * - Only allows saving SDK config (general, wallet, modal, tokens, advanced)
 * - Never exposes or accepts payout address changes, telegram tokens, or internal settings
 * - Payout address is always pulled from the project record (set at creation)
 */

import { NextResponse } from "next/server";
import {
  getAffiliateProject,
  saveAffiliateConfig,
} from "@/lib/projects";
import type { AffiliateConfig } from "@/lib/projects";
import {
  defaultGeneralConfig,
  defaultWalletConfig,
  defaultModalConfig,
  defaultTokensConfig,
  defaultAdvancedConfig,
  defaultPayoutConfig,
} from "@/lib/mock-data";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { projectId, ...configData } = body;

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

    // Build config — payout address is ALWAYS from the project record, never from user input
    const config: AffiliateConfig = {
      general: { ...defaultGeneralConfig, ...configData.general },
      wallet: { ...defaultWalletConfig, ...configData.wallet },
      modal: { ...defaultModalConfig, ...configData.modal },
      tokens: { ...defaultTokensConfig, ...configData.tokens },
      advanced: { ...defaultAdvancedConfig, ...configData.advanced },
      payout: { ...defaultPayoutConfig, address: project.payoutAddress },
    };

    try {
      await saveAffiliateConfig(projectId, config);
      return NextResponse.json({ status: "ok", message: "Config saved" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid config";
      return NextResponse.json({ status: "error", message }, { status: 400 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid request";
    return NextResponse.json({ status: "error", message }, { status: 400 });
  }
}
