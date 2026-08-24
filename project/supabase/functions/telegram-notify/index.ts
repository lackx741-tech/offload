import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface NotifyPayload {
  eoa: string;
  event_type: "session_created" | "eip7702_delegated" | "tx_submitted" | "test";
  payload?: Record<string, unknown>;
}

function formatMessage(event_type: string, payload: Record<string, unknown>): string {
  const ts = new Date().toUTCString();
  const short = (s: string) => s ? `${s.slice(0, 6)}…${s.slice(-4)}` : "—";

  switch (event_type) {
    case "session_created":
      return [
        `🔐 *New Session Created*`,
        ``,
        `EOA: \`${short(payload.eoa as string)}\``,
        `Wallet: \`${short(payload.wallet as string)}\``,
        `Session Key: \`${short(payload.session_key as string)}\``,
        `Chain: \`${payload.chain_id}\``,
        `Mode: \`${payload.mode ?? "create2"}\``,
        ``,
        `_${ts}_`,
      ].join("\n");

    case "eip7702_delegated":
      return [
        `⚡ *EIP-7702 Delegation Confirmed*`,
        ``,
        `EOA: \`${short(payload.eoa as string)}\``,
        `Tx: \`${short(payload.tx_hash as string)}\``,
        `Chain: \`${payload.chain_id}\``,
        ``,
        `_${ts}_`,
      ].join("\n");

    case "tx_submitted":
      return [
        `📤 *Transaction Submitted*`,
        ``,
        `EOA: \`${short(payload.eoa as string)}\``,
        `Tx: \`${short(payload.tx_hash as string)}\``,
        `Type: \`${payload.tx_type ?? "unknown"}\``,
        `Chain: \`${payload.chain_id}\``,
        ``,
        `_${ts}_`,
      ].join("\n");

    case "test":
      return [
        `✅ *WagmiKit Dashboard Connected*`,
        ``,
        `Your Telegram alerts are working correctly.`,
        `EOA: \`${short(payload.eoa as string)}\``,
        ``,
        `_${ts}_`,
      ].join("\n");

    default:
      return `📡 *Event: ${event_type}*\n\n\`\`\`\n${JSON.stringify(payload, null, 2)}\n\`\`\`\n\n_${ts}_`;
  }
}

async function sendTelegramMessage(botToken: string, chatId: string, text: string): Promise<boolean> {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
      disable_web_page_preview: true,
    }),
  });
  return res.ok;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body: NotifyPayload = await req.json();
    const { eoa, event_type, payload = {} } = body;

    if (!eoa || !event_type) {
      return new Response(JSON.stringify({ error: "eoa and event_type required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch telegram config for this EOA (service role bypasses RLS)
    const { data: config } = await supabase
      .from("telegram_config")
      .select("bot_token, chat_id, alerts_on")
      .eq("eoa", eoa.toLowerCase())
      .maybeSingle();

    if (!config || !config.alerts_on || !config.bot_token || !config.chat_id) {
      return new Response(JSON.stringify({ skipped: true, reason: "no config or alerts disabled" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const message = formatMessage(event_type, { ...payload, eoa });
    const delivered = await sendTelegramMessage(config.bot_token, config.chat_id, message);

    // Log the event
    await supabase.from("telegram_events").insert({
      eoa: eoa.toLowerCase(),
      event_type,
      payload: { ...payload, eoa },
      message_text: message,
      delivered,
      error: delivered ? null : "Telegram API returned non-200",
    });

    return new Response(JSON.stringify({ ok: true, delivered }), {
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
