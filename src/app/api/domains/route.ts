import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthSecret, SESSION_COOKIE, verifySession } from "@/lib/auth";
import { authorize } from "@/lib/rbac";
import {
  addDomain,
  listDomains,
  removeDomain,
  verifyDomainDNS,
  updateDomain,
} from "@/lib/domains";

async function getCallerAddress(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const secret = getAuthSecret();
  const session = verifySession<{ address: string }>(token, secret || "dev");
  return session?.address ?? null;
}

/** GET /api/domains — list all registered domains */
export async function GET() {
  const address = await getCallerAddress();
  const err = authorize(address, "domains:read");
  if (err) return NextResponse.json({ status: "error", message: err }, { status: 403 });

  const domains = await listDomains();
  return NextResponse.json({ status: "ok", total: domains.length, data: domains });
}

/** POST /api/domains — register a new domain */
export async function POST(request: Request) {
  const address = await getCallerAddress();
  const err = authorize(address, "domains:manage");
  if (err) return NextResponse.json({ status: "error", message: err }, { status: 403 });

  try {
    const body = await request.json();
    const { domain } = body;

    if (!domain || typeof domain !== "string") {
      return NextResponse.json(
        { status: "error", message: "Domain name is required" },
        { status: 400 }
      );
    }

    // Basic hostname validation
    const cleaned = domain.toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/.test(cleaned)) {
      return NextResponse.json(
        { status: "error", message: "Invalid domain format" },
        { status: 400 }
      );
    }

    const result = await addDomain(cleaned);

    return NextResponse.json({
      status: "ok",
      message: "Domain registered. Add the TXT record to verify ownership.",
      domain: result,
      verification: {
        type: "TXT",
        host: cleaned,
        value: result.verifyTxt,
        instructions: `Add a TXT record to ${cleaned} with value: ${result.verifyTxt}`,
      },
    }, { status: 201 });
  } catch {
    return NextResponse.json({ status: "error", message: "Invalid request" }, { status: 400 });
  }
}

/** DELETE /api/domains?id=xxx — remove a domain */
export async function DELETE(request: Request) {
  const address = await getCallerAddress();
  const err = authorize(address, "domains:manage");
  if (err) return NextResponse.json({ status: "error", message: err }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ status: "error", message: "Domain ID is required" }, { status: 400 });
  }

  await removeDomain(id);
  return NextResponse.json({ status: "ok", message: "Domain removed" });
}

/** PATCH /api/domains — verify or update a domain */
export async function PATCH(request: Request) {
  const address = await getCallerAddress();
  const err = authorize(address, "domains:manage");
  if (err) return NextResponse.json({ status: "error", message: err }, { status: 403 });

  try {
    const body = await request.json();
    const { id, action, status: newStatus } = body;

    if (!id) {
      return NextResponse.json({ status: "error", message: "Domain ID required" }, { status: 400 });
    }

    // DNS verification
    if (action === "verify") {
      const result = await verifyDomainDNS(id);
      return NextResponse.json({
        status: "ok",
        verified: result.verified,
        error: result.error,
      });
    }

    // Status toggle (active/paused)
    if (newStatus) {
      const updated = await updateDomain(id, { status: newStatus });
      if (!updated) {
        return NextResponse.json({ status: "error", message: "Domain not found" }, { status: 404 });
      }
      return NextResponse.json({ status: "ok", domain: updated });
    }

    return NextResponse.json({ status: "error", message: "No action specified" }, { status: 400 });
  } catch {
    return NextResponse.json({ status: "error", message: "Invalid request" }, { status: 400 });
  }
}
