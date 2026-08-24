import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_SENTINEL_ADDRESS, getAuthSecret, SESSION_COOKIE, verifySession } from "@/lib/auth";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ status: "ok", authenticated: false });

  const secret = getAuthSecret();
  const session = verifySession<{ address: string }>(token, secret || "dev");

  if (!session?.address) {
    return NextResponse.json({ status: "ok", authenticated: false });
  }

  return NextResponse.json({
    status: "ok",
    authenticated: true,
    address: session.address,
    authType: session.address === ADMIN_SENTINEL_ADDRESS ? "admin-password" : "wallet",
    label: session.address === ADMIN_SENTINEL_ADDRESS ? "Global Admin" : session.address,
  });
}
