import { NextResponse } from "next/server";
import { generateStats } from "@/lib/mock-data";

export async function GET() {
  const stats = generateStats();
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    data: stats,
  });
}
