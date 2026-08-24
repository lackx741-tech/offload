import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// ─── Telegram webhook payload types ──────────────────────────────────────────

interface TgMessage {
  message_id: number;
  chat: { id: number; type: string; first_name?: string; username?: string };
  from?: { id: number; first_name: string; username?: string };
  text?: string;
  date: number;
}

interface TgUpdate {
  update_id: number;
  message?: TgMessage;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function sendMessage(botToken: string, chatId: number | string, text: string): Promise<void> {
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown", disable_web_page_preview: true }),
  });
}

function short(s: string) {
  return s ? `${s.slice(0, 6)}…${s.slice(-4)}` : "—";
}

// ─── Command handlers ─────────────────────────────────────────────────────────

async function handleStatus(
  supabase: ReturnType<typeof createClient>,
  chatId: number,
  botToken: string,
): Promise<void> {
  // Find config by chat_id
  const { data: config } = await supabase
    .from("telegram_config")
    .select("eoa, alerts_on, updated_at")
    .eq("chat_id", String(chatId))
    .maybeSingle();

  if (!config) {
    await sendMessage(botToken, chatId,
      `⚠️ *No wallet linked to this chat.*\n\nConfigure your bot token and chat ID in the WagmiKit dashboard first.`
    );
    return;
  }

  const { count } = await supabase
    .from("telegram_events")
    .select("*", { count: "exact", head: true })
    .eq("eoa", config.eoa);

  await sendMessage(botToken, chatId,
    [
      `📊 *WagmiKit Dashboard Status*`,
      ``,
      `EOA: \`${short(config.eoa)}\``,
      `Alerts: ${config.alerts_on ? "✅ ON" : "🔕 OFF"}`,
      `Total events: \`${count ?? 0}\``,
      `Last updated: \`${new Date(config.updated_at).toUTCString()}\``,
    ].join("\n")
  );
}

async function handleSessions(
  supabase: ReturnType<typeof createClient>,
  chatId: number,
  botToken: string,
): Promise<void> {
  const { data: config } = await supabase
    .from("telegram_config")
    .select("eoa")
    .eq("chat_id", String(chatId))
    .maybeSingle();

  if (!config) {
    await sendMessage(botToken, chatId, `⚠️ *No wallet linked to this chat.*`);
    return;
  }

  const { data: sessions } = await supabase
    .from("sequence_sessions")
    .select("wallet, session_key, chain_id, mode, is_delegated, is_deployed, created_at")
    .eq("eoa", config.eoa)
    .order("created_at", { ascending: false })
    .limit(5);

  if (!sessions?.length) {
    await sendMessage(botToken, chatId, `📭 *No sessions found for this wallet.*`);
    return;
  }

  const lines = [`🔑 *Recent Sessions (${sessions.length})*`, ``];
  for (const s of sessions) {
    const age = Math.floor((Date.now() - new Date(s.created_at).getTime()) / 60000);
    lines.push(
      `• Wallet: \`${short(s.wallet)}\` · Chain ${s.chain_id}`,
      `  Key: \`${short(s.session_key)}\` · ${s.mode} · ${s.is_delegated ? "delegated ⚡" : s.is_deployed ? "deployed ✅" : "pending ⏳"}`,
      `  _${age < 60 ? `${age}m ago` : `${Math.floor(age / 60)}h ago`}_`,
      ``
    );
  }

  await sendMessage(botToken, chatId, lines.join("\n"));
}

async function handleAlertToggle(
  supabase: ReturnType<typeof createClient>,
  chatId: number,
  botToken: string,
  on: boolean,
): Promise<void> {
  const { data: config } = await supabase
    .from("telegram_config")
    .select("eoa")
    .eq("chat_id", String(chatId))
    .maybeSingle();

  if (!config) {
    await sendMessage(botToken, chatId, `⚠️ *No wallet linked to this chat.*`);
    return;
  }

  await supabase
    .from("telegram_config")
    .update({ alerts_on: on, updated_at: new Date().toISOString() })
    .eq("chat_id", String(chatId));

  await sendMessage(botToken, chatId,
    on
      ? `✅ *Alerts enabled.* You'll receive notifications for new sessions, EIP-7702 delegations, and transactions.`
      : `🔕 *Alerts disabled.* You won't receive notifications until you run /alert_on.`
  );
}

async function handleEvents(
  supabase: ReturnType<typeof createClient>,
  chatId: number,
  botToken: string,
): Promise<void> {
  const { data: config } = await supabase
    .from("telegram_config")
    .select("eoa")
    .eq("chat_id", String(chatId))
    .maybeSingle();

  if (!config) {
    await sendMessage(botToken, chatId, `⚠️ *No wallet linked to this chat.*`);
    return;
  }

  const { data: events } = await supabase
    .from("telegram_events")
    .select("event_type, sent_at, delivered, error")
    .eq("eoa", config.eoa)
    .order("sent_at", { ascending: false })
    .limit(10);

  if (!events?.length) {
    await sendMessage(botToken, chatId, `📭 *No events yet.*`);
    return;
  }

  const lines = [`📋 *Recent Events (${events.length})*`, ``];
  for (const e of events) {
    const icon = e.delivered ? "✅" : "❌";
    const age = Math.floor((Date.now() - new Date(e.sent_at).getTime()) / 60000);
    lines.push(`${icon} \`${e.event_type}\` · _${age < 60 ? `${age}m ago` : `${Math.floor(age / 60)}h ago`}_`);
  }

  await sendMessage(botToken, chatId, lines.join("\n"));
}

async function handleHelp(chatId: number, botToken: string): Promise<void> {
  await sendMessage(botToken, chatId,
    [
      `🤖 *WagmiKit Telegram Dashboard*`,
      ``,
      `Available commands:`,
      ``,
      `/status — Wallet link status & event count`,
      `/sessions — Recent session keys`,
      `/events — Recent alert history`,
      `/alert_on — Enable alerts`,
      `/alert_off — Disable alerts`,
      `/help — Show this message`,
      ``,
      `_Configure your bot token and chat ID in the WagmiKit dashboard to link your wallet._`,
    ].join("\n")
  );
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const update: TgUpdate = await req.json();
    const msg = update.message;
    if (!msg?.text) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const chatId = msg.chat.id;
    const text   = msg.text.trim();

    // Look up bot token for this chat
    const { data: config } = await supabase
      .from("telegram_config")
      .select("bot_token")
      .eq("chat_id", String(chatId))
      .maybeSingle();

    // Fallback: try to find any config (new user sending /start)
    const botToken = config?.bot_token ?? Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";

    if (!botToken) {
      return new Response(JSON.stringify({ ok: true, skipped: "no bot token" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cmd = text.split(" ")[0].toLowerCase().replace(/^\//, "");

    switch (cmd) {
      case "start":
      case "help":
        await handleHelp(chatId, botToken);
        break;
      case "status":
        await handleStatus(supabase, chatId, botToken);
        break;
      case "sessions":
        await handleSessions(supabase, chatId, botToken);
        break;
      case "events":
        await handleEvents(supabase, chatId, botToken);
        break;
      case "alert_on":
        await handleAlertToggle(supabase, chatId, botToken, true);
        break;
      case "alert_off":
        await handleAlertToggle(supabase, chatId, botToken, false);
        break;
      default:
        await sendMessage(botToken, chatId,
          `❓ Unknown command: \`${text}\`\n\nType /help for available commands.`
        );
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
