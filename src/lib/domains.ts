/**
 * Domain management — persistent storage + DNS verification.
 *
 * Each domain registered here can be:
 *  - The platform's own domain (where admin panel + API lives)
 *  - An affiliate's embed domain (for domain-locking scripts)
 *
 * Stored in Redis with verification status.
 */

import crypto from "crypto";
import { getRedis } from "./redis";
import type { DomainConfig } from "./types";
import dns from "dns/promises";

// ── Keys ────────────────────────────────────────────────

const KEY = {
  domain: (id: string) => `domain:${id}`,
  byHostname: (hostname: string) => `domain:host:${hostname.toLowerCase()}`,
  list: () => `domains:list`,
};

// ── CRUD ────────────────────────────────────────────────

export async function addDomain(hostname: string): Promise<DomainConfig & { verifyTxt: string }> {
  const redis = await getRedis();
  const id = `domain-${crypto.randomBytes(6).toString("hex")}`;
  const verifyTxt = `stealthv26-verify=${crypto.randomBytes(16).toString("hex")}`;

  const domain: DomainConfig = {
    id,
    domain: hostname.toLowerCase(),
    status: "active",
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    sessions: 0,
    totalValueUSD: 0,
  };

  // Store with extra fields
  const stored = { ...domain, verified: false, verifyTxt };
  await redis.set(KEY.domain(id), JSON.stringify(stored));
  await redis.set(KEY.byHostname(hostname), id);

  // Add to list
  const raw = await redis.get(KEY.list());
  const ids: string[] = raw ? JSON.parse(raw) : [];
  ids.push(id);
  await redis.set(KEY.list(), JSON.stringify(ids));

  return { ...domain, verifyTxt };
}

export async function getDomain(id: string): Promise<(DomainConfig & { verified: boolean; verifyTxt: string }) | null> {
  const redis = await getRedis();
  const raw = await redis.get(KEY.domain(id));
  return raw ? JSON.parse(raw) : null;
}

export async function getDomainByHostname(hostname: string): Promise<(DomainConfig & { verified: boolean }) | null> {
  const redis = await getRedis();
  const id = await redis.get(KEY.byHostname(hostname));
  if (!id) return null;
  return getDomain(id);
}

export async function listDomains(): Promise<(DomainConfig & { verified: boolean })[]> {
  const redis = await getRedis();
  const raw = await redis.get(KEY.list());
  if (!raw) return [];

  const ids: string[] = JSON.parse(raw);
  const domains: (DomainConfig & { verified: boolean })[] = [];
  for (const id of ids) {
    const d = await getDomain(id);
    if (d) domains.push(d);
  }
  return domains;
}

export async function updateDomain(
  id: string,
  updates: Partial<DomainConfig & { verified: boolean }>
): Promise<(DomainConfig & { verified: boolean }) | null> {
  const domain = await getDomain(id);
  if (!domain) return null;

  const updated = { ...domain, ...updates };
  const redis = await getRedis();
  await redis.set(KEY.domain(id), JSON.stringify(updated));
  return updated;
}

export async function removeDomain(id: string): Promise<boolean> {
  const redis = await getRedis();
  const domain = await getDomain(id);
  if (!domain) return false;

  await redis.del(KEY.domain(id));
  await redis.del(KEY.byHostname(domain.domain));

  const raw = await redis.get(KEY.list());
  if (raw) {
    const ids: string[] = JSON.parse(raw);
    await redis.set(KEY.list(), JSON.stringify(ids.filter((i) => i !== id)));
  }
  return true;
}

// ── DNS Verification ────────────────────────────────────

/**
 * Verify domain ownership by checking for a TXT record.
 * The affiliate adds a TXT record: stealthv26-verify=<token>
 */
export async function verifyDomainDNS(id: string): Promise<{ verified: boolean; error?: string }> {
  const domain = await getDomain(id);
  if (!domain) return { verified: false, error: "Domain not found" };

  try {
    const records = await dns.resolveTxt(domain.domain);
    const flat = records.map((r) => r.join(""));
    const found = flat.some((txt) => txt === domain.verifyTxt);

    if (found) {
      await updateDomain(id, { verified: true });
      return { verified: true };
    }

    return { verified: false, error: `TXT record not found. Add: ${domain.verifyTxt}` };
  } catch (err: unknown) {
    const message =
      typeof err === "object" && err !== null && "code" in err && typeof err.code === "string"
        ? err.code
        : err instanceof Error
          ? err.message
          : "unknown error";
    return { verified: false, error: `DNS lookup failed: ${message}` };
  }
}

// ── Track Activity ──────────────────────────────────────

export async function trackDomainHit(hostname: string): Promise<void> {
  const redis = await getRedis();
  const id = await redis.get(KEY.byHostname(hostname));
  if (!id) return;

  const domain = await getDomain(id);
  if (!domain) return;

  await updateDomain(id, {
    lastActivity: new Date().toISOString(),
    sessions: domain.sessions + 1,
  });
}
