import { NextResponse } from "next/server";
import { generateLogs } from "@/lib/mock-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const chain = searchParams.get("chain");
  const limit = parseInt(searchParams.get("limit") || "100");
  const offset = parseInt(searchParams.get("offset") || "0");

  let logs = generateLogs(200);

  if (type && type !== "all") {
    logs = logs.filter((l) => l.type === type);
  }
  if (chain && chain !== "all") {
    logs = logs.filter((l) => l.chain === chain);
  }

  const total = logs.length;
  const paged = logs.slice(offset, offset + limit);

  return NextResponse.json({
    status: "ok",
    total,
    offset,
    limit,
    data: paged,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json({
      status: "ok",
      message: "Log entry recorded",
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      entry: body,
    });
  } catch {
    return NextResponse.json({ status: "error", message: "Invalid log entry" }, { status: 400 });
  }
}
