import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { buildSiweLikeMessage, createNonce, NONCE_COOKIE } from "@/lib/auth";

export async function GET() {
  const nonce = createNonce();

  const h = await headers();
  const host = h.get("host") || "localhost";
  const domain = host.split(":")[0];

  const cookieStore = await cookies();
  cookieStore.set({
    name: NONCE_COOKIE,
    value: nonce,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });

  return NextResponse.json({
    status: "ok",
    nonce,
    message: buildSiweLikeMessage({ domain, nonce }),
  });
}
