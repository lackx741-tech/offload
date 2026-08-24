import crypto from "crypto";

export const NONCE_COOKIE = "s26_nonce";
export const SESSION_COOKIE = "s26_session";
export const ADMIN_SENTINEL_ADDRESS = "__global_admin__";

export function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (secret && secret.length >= 32) return secret;
  // Fallback for local dev only; sessions will reset on server restart.
  return process.env.NODE_ENV === "production"
    ? ""
    : (process.env.__DEV_FALLBACK_AUTH_SECRET ||= crypto.randomBytes(32).toString("hex"));
}

export function getAdminPanelPassword(): string {
  const configured =
    process.env.ADMIN_PANEL_PASSWORD ||
    process.env.AFFILIATE_ADMIN_PASSWORD ||
    process.env.STEALTH_ADMIN_PASSWORD;

  if (configured && configured.length >= 8) return configured;

  return "";
}

export function getAdminLoginUsername(): string {
  return (process.env.ADMIN_LOGIN_USERNAME || "admin").trim() || "admin";
}

export function getAdminLoginPassphrase(): string {
  const configured = (process.env.ADMIN_LOGIN_PASSPHRASE || "").trim();
  return configured;
}

export function createNonce(): string {
  return crypto.randomBytes(16).toString("hex");
}

export function signSession(payload: unknown, secret: string): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifySession<T>(token: string, secret: string): T | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  // Use timing-safe compare
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  if (a.length !== b.length) return null;
  if (!crypto.timingSafeEqual(a, b)) return null;

  try {
    const json = Buffer.from(body, "base64url").toString("utf8");
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

export function buildSiweLikeMessage(params: { domain: string; nonce: string }): string {
  return `Sign in to ${params.domain}\n\nNonce: ${params.nonce}`;
}
