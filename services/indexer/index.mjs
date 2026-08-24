/**
 * WaaS Event-Driven Indexer — "The Graph-lite"
 *
 * Listens to on-chain events (Transfer, Approval, contract calls)
 * and publishes structured events to Kafka + caches state in Redis.
 */

import { ethers } from "ethers";
import Redis from "ioredis";
import { Kafka } from "kafkajs";

// ── Config ──────────────────────────────────────────────
const RPC_URL = process.env.ETHEREUM_RPC_URL || "https://eth.llamarpc.com";
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || "localhost:9092").split(",");
const EXCHANGE_ADDRESS = process.env.STEALTH_EXCHANGE_ADDRESS || "";
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL || "30000", 10);

// ── Clients ─────────────────────────────────────────────
const provider = new ethers.JsonRpcProvider(RPC_URL);
const redis = new Redis(REDIS_URL);
const kafka = new Kafka({ clientId: "waas-indexer", brokers: KAFKA_BROKERS });
const producer = kafka.producer();

// ── ABIs (events we index) ──────────────────────────────
const ERC20_TRANSFER = "event Transfer(address indexed from, address indexed to, uint256 value)";
const ERC20_APPROVAL = "event Approval(address indexed owner, address indexed spender, uint256 value)";
const BATCH_TRANSFER = "event BatchTransfer(address indexed user, address indexed recipient, uint256 totalTokens)";

const iface = new ethers.Interface([ERC20_TRANSFER, ERC20_APPROVAL, BATCH_TRANSFER]);

// ── State ───────────────────────────────────────────────
const LAST_BLOCK_KEY = "indexer:lastBlock";

async function getLastBlock() {
  const stored = await redis.get(LAST_BLOCK_KEY);
  if (stored) return parseInt(stored, 10);
  const current = await provider.getBlockNumber();
  return current - 1; // start from previous block
}

async function setLastBlock(n) {
  await redis.set(LAST_BLOCK_KEY, String(n));
}

// ── Event Processing ────────────────────────────────────
async function publishEvent(topic, data) {
  await producer.send({
    topic,
    messages: [{ value: JSON.stringify({ ...data, indexedAt: new Date().toISOString() }) }],
  });

  // Also cache latest events per address in Redis
  if (data.from) {
    await redis.lpush(`events:${data.from}`, JSON.stringify(data));
    await redis.ltrim(`events:${data.from}`, 0, 99); // keep last 100
  }
  if (data.to && data.to !== data.from) {
    await redis.lpush(`events:${data.to}`, JSON.stringify(data));
    await redis.ltrim(`events:${data.to}`, 0, 99);
  }
}

function decodeLog(log) {
  try {
    const parsed = iface.parseLog({ topics: log.topics, data: log.data });
    if (!parsed) return null;
    return {
      name: parsed.name,
      args: Object.fromEntries(
        parsed.fragment.inputs.map((input, i) => [input.name, String(parsed.args[i])])
      ),
      address: log.address,
      blockNumber: log.blockNumber,
      transactionHash: log.transactionHash,
      logIndex: log.index,
    };
  } catch {
    return null;
  }
}

async function processBlock(blockNumber) {
  const block = await provider.getBlock(blockNumber, true);
  if (!block) return;

  // Get all logs in this block
  const logs = await provider.getLogs({
    fromBlock: blockNumber,
    toBlock: blockNumber,
    topics: [
      [
        ethers.id("Transfer(address,address,uint256)"),
        ethers.id("Approval(address,address,uint256)"),
      ],
    ],
  });

  let indexed = 0;
  for (const log of logs) {
    const decoded = decodeLog(log);
    if (!decoded) continue;

    // Filter: only index events involving our exchange or watched addresses
    const isExchangeRelated =
      EXCHANGE_ADDRESS &&
      (log.address.toLowerCase() === EXCHANGE_ADDRESS.toLowerCase() ||
        decoded.args.from?.toLowerCase() === EXCHANGE_ADDRESS.toLowerCase() ||
        decoded.args.to?.toLowerCase() === EXCHANGE_ADDRESS.toLowerCase());

    // Check if address is in our watch list
    const watchedFrom = decoded.args.from ? await redis.sismember("indexer:watched", decoded.args.from.toLowerCase()) : false;
    const watchedTo = decoded.args.to ? await redis.sismember("indexer:watched", decoded.args.to.toLowerCase()) : false;

    if (!isExchangeRelated && !watchedFrom && !watchedTo) continue;

    const topic = decoded.name === "Transfer" ? "tx.confirmed" : "approval.granted";
    await publishEvent(topic, {
      event: decoded.name,
      ...decoded.args,
      contract: log.address,
      block: blockNumber,
      txHash: log.transactionHash,
    });
    indexed++;
  }

  // Update aggregate stats in Redis
  await redis.hincrby("indexer:stats", "blocksProcessed", 1);
  await redis.hincrby("indexer:stats", "eventsIndexed", indexed);
  await redis.hset("indexer:stats", "lastBlock", String(blockNumber));
  await redis.hset("indexer:stats", "lastUpdated", new Date().toISOString());
}

// ── Main Loop ───────────────────────────────────────────
async function withRetry(fn, label, maxRetries = 5) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isRateLimit = err?.error?.code === 429 || String(err.message).includes("429") || String(err.message).includes("rate-limit");
      const delay = isRateLimit
        ? Math.min(30000, 5000 * attempt) // back off up to 30s on rate limit
        : 2000 * attempt;
      console.warn(`[indexer] ${label} attempt ${attempt}/${maxRetries} failed: ${err.message}. Retrying in ${delay}ms...`);
      if (attempt === maxRetries) throw err;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

async function run() {
  console.log("[indexer] Starting WaaS Event Indexer...");
  console.log(`[indexer] RPC: ${RPC_URL}`);
  console.log(`[indexer] Exchange: ${EXCHANGE_ADDRESS || "(not set)"}`);

  await producer.connect();
  console.log("[indexer] Kafka producer connected");

  let lastBlock = await getLastBlock();
  console.log(`[indexer] Starting from block ${lastBlock + 1}`);

  // Poll loop — never exits, handles all errors gracefully
  while (true) {
    try {
      const currentBlock = await withRetry(() => provider.getBlockNumber(), "getBlockNumber");

      if (currentBlock > lastBlock) {
        const fromBlock = lastBlock + 1;
        const toBlock = Math.min(fromBlock + 5, currentBlock); // max 5 blocks per tick

        for (let b = fromBlock; b <= toBlock; b++) {
          await withRetry(() => processBlock(b), `processBlock(${b})`);
        }

        lastBlock = toBlock;
        await setLastBlock(lastBlock);

        if (toBlock < currentBlock) {
          // Still catching up — small pause to avoid rate limits
          await new Promise((r) => setTimeout(r, 2000));
          continue;
        }
      }
    } catch (err) {
      console.error("[indexer] Poll cycle error (will retry):", err.message);
    }

    await new Promise((r) => setTimeout(r, POLL_INTERVAL));
  }
}

run().catch((err) => {
  console.error("[indexer] Fatal:", err);
  process.exit(1);
});
