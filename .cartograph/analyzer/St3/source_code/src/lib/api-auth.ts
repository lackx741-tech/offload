/**
 * api-auth.ts
 *
 * Reusable server-side auth guard for Next.js API routes.
 * Returns a NextResponse error if the request is not authenticated/authorised,
 * or null if it should proceed.
 *
 * Usage:
 *   const guard = await requireAuth(request, "config:write");
 *   if (guard) return guard;
 */

import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getAuthSecret, SESSION_COOKIE, verifySession } from "@/lib/auth";
import { authorize, type Role } from "@/lib/rbac";

type Permission = Parameters<typeof authorize>[1];

function jsonError(message: string, status: number) {
  return NextResponse.json({ status: "error", message }, { status });
}

/**
 * Reads the session cookie and verifies it.
 * Returns the wallet address string, or null if unauthenticated.
 */
async function resolveSessionAddress(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const secret = getAuthSecret();
  const session = verifySession<{ address: string }>(token, secret || "dev");
  return session?.address ?? null;
}

/**
 * Full auth + permission guard.
 *
 * @param permission  The RBAC permission required (e.g. "config:write").
 * @returns           A NextResponse (4xx) to return immediately, or null to proceed.
 */
export async function requireAuth(permission: Permission): Promise<NextResponse | null> {
  const address = await resolveSessionAddress();

  if (!address) {
    return jsonError("Authentication required. Sign in with your wallet.", 401);
  }

  const error = authorize(address, permission);
  if (error) {
    return jsonError(error, 403);
  }

  return null;
}

/**
 * Lightweight variant — only checks that the session exists (any role).
 * Use for read-only endpoints that are still gated behind a login.
 */
export async function requireSession(): Promise<NextResponse | null> {
  const address = await resolveSessionAddress();
  if (!address) {
    return jsonError("Authentication required.", 401);
  }
  return null;
}
