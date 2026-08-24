/**
 * POST /api/affiliate/access
 *
 * Affiliate login endpoint.
 * Accepts { username, password } — credentials generated at project creation
 * (or after a reset-password call).
 */

import { NextResponse } from "next/server";
import { getProjectIdByUsername, getAffiliateProjectDecrypted } from "@/lib/projects";
import { sendTelegramNotification } from "@/lib/telegram";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = typeof body?.username === "string" ? body.username.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!username || !password) {
      return NextResponse.json(
        { status: "error", message: "Username and password are required" },
        { status: 400 },
      );
    }

    // Resolve username → project ID
    const projectId = await getProjectIdByUsername(username);
    if (!projectId) {
      return NextResponse.json(
        { status: "error", message: "Invalid credentials" },
        { status: 401 },
      );
    }

    const project = await getAffiliateProjectDecrypted(projectId);
    if (!project) {
      return NextResponse.json(
        { status: "error", message: "Invalid credentials" },
        { status: 401 },
      );
    }

    if (project.status === "pending") {
      return NextResponse.json(
        { status: "error", message: "Account is pending approval", projectStatus: project.status },
        { status: 403 },
      );
    }

    if (project.status !== "active") {
      return NextResponse.json(
        { status: "error", message: `Account is ${project.status}`, projectStatus: project.status },
        { status: 403 },
      );
    }

    if (project.accessSecret !== password) {
      return NextResponse.json(
        { status: "error", message: "Invalid credentials" },
        { status: 401 },
      );
    }

    void sendTelegramNotification({
      projectId: project.id,
      message:
        `🔐 Affiliate Login\n` +
        `project: <code>${project.id}</code>\n` +
        `name: <b>${project.name}</b>\n` +
        `username: <code>${project.username}</code>\n` +
        `status: <b>${project.status}</b>`,
    });

    return NextResponse.json({
      status: "ok",
      project: {
        id: project.id,
        name: project.name,
        username: project.username,
        status: project.status,
      },
    });
  } catch {
    return NextResponse.json(
      { status: "error", message: "Invalid request" },
      { status: 400 },
    );
  }
}
