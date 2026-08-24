import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ADMIN_SENTINEL_ADDRESS,
  getAdminLoginPassphrase,
  getAdminLoginUsername,
  getAdminPanelPassword,
  getAuthSecret,
  SESSION_COOKIE,
  signSession,
} from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = typeof body?.username === "string" ? body.username.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const configuredUsername = getAdminLoginUsername();
    const configuredPassphrase = getAdminLoginPassphrase();
    const configuredPassword = getAdminPanelPassword();

    if (!configuredPassphrase && !configuredPassword) {
      return NextResponse.json(
        { status: "error", message: "Admin login credentials are not configured" },
        { status: 500 },
      );
    }

    if (!username) {
      return NextResponse.json(
        { status: "error", message: "Admin username is required" },
        { status: 400 },
      );
    }

    if (!password) {
      return NextResponse.json(
        { status: "error", message: configuredPassphrase ? "Admin passphrase is required" : "Admin password is required" },
        { status: 400 },
      );
    }

    const validUsername = username.toLowerCase() === configuredUsername.toLowerCase();
    const validSecret = configuredPassphrase ? password === configuredPassphrase : password === configuredPassword;

    if (!validUsername || !validSecret) {
      return NextResponse.json(
        { status: "error", message: "Invalid admin credentials" },
        { status: 403 },
      );
    }

    const cookieStore = await cookies();
    const secret = getAuthSecret();
    const session = signSession(
      { address: ADMIN_SENTINEL_ADDRESS, iat: Date.now(), v: 1, mode: "admin-password" },
      secret || "dev",
    );

    cookieStore.set({
      name: SESSION_COOKIE,
      value: session,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    return NextResponse.json({
      status: "ok",
      session: {
        address: ADMIN_SENTINEL_ADDRESS,
        label: configuredUsername || "Global Admin",
        mode: configuredPassphrase ? "admin-passphrase" : "admin-password",
      },
    });
  } catch {
    return NextResponse.json(
      { status: "error", message: "Invalid request" },
      { status: 400 },
    );
  }
}
