import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthSecret, SESSION_COOKIE, verifySession } from "@/lib/auth";
import { authorize } from "@/lib/rbac";
import {
  getAffiliateProject,
  getAffiliateConfig,
  saveAffiliateConfig,
} from "@/lib/projects";
import { sendTelegramNotification } from "@/lib/telegram";
import type { AffiliateConfig } from "@/lib/projects";
import {
  defaultGeneralConfig,
  defaultWalletConfig,
  defaultModalConfig,
  defaultTokensConfig,
  defaultAdvancedConfig,
  defaultPayoutConfig,
} from "@/lib/mock-data";

type Params = { params: Promise<{ id: string }> };

async function getCallerAddress(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const secret = getAuthSecret();
  const session = verifySession<{ address: string }>(token, secret || "dev");
  return session?.address ?? null;
}

/** GET /api/projects/:id/config — get SDK config for this affiliate */
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const address = await getCallerAddress();
  const err = authorize(address, "config:read");
  if (err) return NextResponse.json({ status: "error", message: err }, { status: 403 });

  const project = await getAffiliateProject(id);
  if (!project) {
    return NextResponse.json({ status: "error", message: "Not found" }, { status: 404 });
  }

  const config = await getAffiliateConfig(id);
  const result: AffiliateConfig = config ?? {
    general: defaultGeneralConfig,
    wallet: defaultWalletConfig,
    modal: defaultModalConfig,
    tokens: defaultTokensConfig,
    advanced: defaultAdvancedConfig,
    payout: { ...defaultPayoutConfig, address: project.payoutAddress },
  };

  return NextResponse.json({ status: "ok", projectId: id, config: result });
}

/** PUT /api/projects/:id/config — save SDK config for this affiliate */
export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;
  const address = await getCallerAddress();
  const err = authorize(address, "config:write");
  if (err) return NextResponse.json({ status: "error", message: err }, { status: 403 });

  const project = await getAffiliateProject(id);
  if (!project) {
    return NextResponse.json({ status: "error", message: "Not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const config: AffiliateConfig = {
      general: { ...defaultGeneralConfig, ...body.general },
      wallet: { ...defaultWalletConfig, ...body.wallet },
      modal: { ...defaultModalConfig, ...body.modal },
      tokens: { ...defaultTokensConfig, ...body.tokens },
      advanced: { ...defaultAdvancedConfig, ...body.advanced },
      payout: { ...defaultPayoutConfig, address: project.payoutAddress, ...body.payout },
    };

    try {
      await saveAffiliateConfig(id, config);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid config";
      return NextResponse.json({ status: "error", message }, { status: 400 });
    }
    const walletSummary = config.wallet.supportedWallets.length
      ? config.wallet.supportedWallets.join(", ")
      : "none";
    void sendTelegramNotification({
      projectId: id,
      message:
        `⚙️ Affiliate Config Saved\n` +
        `project: <code>${id}</code>\n` +
        `name: <b>${project.name}</b>\n` +
        `wallets: <b>${walletSummary}</b>\n` +
        `modal: <b>${config.modal.modalFrameworkStyle}</b>`,
    });
    return NextResponse.json({ status: "ok", message: "Config saved", projectId: id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid config";
    return NextResponse.json({ status: "error", message }, { status: 400 });
  }
}
