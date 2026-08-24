const botToken = process.env.TELEGRAM_BOT_TOKEN;
const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL;
const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET || "";

if (!botToken) {
  console.error("Missing TELEGRAM_BOT_TOKEN");
  process.exit(1);
}

if (!appUrl) {
  console.error("Missing NEXT_PUBLIC_APP_URL or NEXT_PUBLIC_BASE_URL");
  process.exit(1);
}

const webhookUrl = `${appUrl.replace(/\/$/, "")}/api/telegram/webhook`;

const response = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    url: webhookUrl,
    secret_token: webhookSecret || undefined,
    allowed_updates: ["message", "callback_query"],
    drop_pending_updates: false,
  }),
});

const result = await response.json().catch(() => null);

if (!response.ok || !result?.ok) {
  console.error("Failed to register webhook", result);
  process.exit(1);
}

console.log(JSON.stringify({ status: "ok", webhookUrl, result }, null, 2));
