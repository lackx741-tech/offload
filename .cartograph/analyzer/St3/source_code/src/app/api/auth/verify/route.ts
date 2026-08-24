import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAddress, verifyMessage } from "viem";
import {
  buildSiweLikeMessage,
  getAuthSecret,
  NONCE_COOKIE,
  SESSION_COOKIE,
  signSession,
} from "@/lib/auth";
import { sendTelegramMessage } from "@/lib/telegram";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const addressRaw = body?.address;
    const signature = body?.signature;
    const nonceFromBody = body?.nonce;

    if (!addressRaw || !signature) {
      return NextResponse.json(
        { status: "error", message: "address and signature are required" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const nonceFromCookie = cookieStore.get(NONCE_COOKIE)?.value;

    const nonce = nonceFromBody || nonceFromCookie;
    if (!nonce || !nonceFromCookie || nonce !== nonceFromCookie) {
      return NextResponse.json(
        { status: "error", message: "Invalid or missing nonce" },
        { status: 400 }
      );
    }

    const address = getAddress(addressRaw);
    const domain = new URL(request.url).host.split(":")[0];
    const message = buildSiweLikeMessage({ domain, nonce });

    const ok = await verifyMessage({
      address,
      message,
      signature,
    });

    if (!ok) {
      return NextResponse.json(
        { status: "error", message: "Signature verification failed" },
        { status: 401 }
      );
    }

    const secret = getAuthSecret();
    if (!secret && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { status: "error", message: "Server missing AUTH_SECRET" },
        { status: 500 }
      );
    }

    const session = signSession(
      { address, iat: Date.now(), v: 1 },
      secret || "dev"
    );

    cookieStore.set({
      name: SESSION_COOKIE,
      value: session,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    cookieStore.delete(NONCE_COOKIE);

    await sendTelegramMessage(`✅ Login\n<code>${address}</code>`);

    return NextResponse.json({ status: "ok", address });
  } catch {
    return NextResponse.json(
      { status: "error", message: "Invalid request" },
      { status: 400 }
    );
  }
}
