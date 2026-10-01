import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { middleware } from "../src/middleware";

describe("health-check authentication", () => {
  it("allows unauthenticated orchestration health checks", () => {
    const response = middleware(new NextRequest("http://localhost:3000/api/health"));

    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
});
