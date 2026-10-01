import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(import.meta.dirname, "..");

function readProductionCompose(environment: NodeJS.ProcessEnv = process.env) {
  const output = execFileSync(
    "docker",
    ["compose", "-f", "docker-compose.prod.yml", "config", "--format", "json"],
    { cwd: projectRoot, encoding: "utf8", env: environment },
  );

  return JSON.parse(output) as {
    services: Record<string, {
      build?: { target?: string; args?: Record<string, string> };
      command?: string[];
      depends_on?: Record<string, { condition?: string }>;
      environment?: Record<string, string>;
      ports?: Array<{ published?: string; target?: number }>;
      volumes?: Array<{ target?: string }>;
    }>;
  };
}

describe("production Docker Compose", () => {
  it("defines the complete production service set", () => {
    const compose = readProductionCompose();

    expect(Object.keys(compose.services).sort()).toEqual([
      "app",
      "indexer",
      "kafka",
      "redis",
      "workers",
      "zookeeper",
    ]);
  });

  it("checks application health over the container IPv4 listener", () => {
    const composeFile = readFileSync(path.join(projectRoot, "docker-compose.prod.yml"), "utf8");

    expect(composeFile).toContain("http://127.0.0.1:3000/api/health");
    expect(composeFile).not.toContain("http://localhost:3000/api/health");
  });

  it("runs all queue workers from a dedicated image target", () => {
    const compose = readProductionCompose();
    const workers = compose.services.workers;

    expect(workers.build?.target).toBe("workers");
    expect(workers.command).toEqual(["npm", "run", "workers"]);
    expect(workers.depends_on?.redis?.condition).toBe("service_healthy");
    expect(workers.depends_on?.kafka?.condition).toBe("service_healthy");
    expect(workers.volumes?.map((volume) => volume.target)).toEqual(
      expect.arrayContaining(["/app/data", "/app/public/generated-scripts", "/app/.builds"]),
    );
  });

  it("accepts a configurable dashboard host port", () => {
    const compose = readProductionCompose({ ...process.env, APP_PORT: "3010" });

    expect(compose.services.app.ports).toEqual(
      expect.arrayContaining([expect.objectContaining({ published: "3010", target: 3000 })]),
    );
  });

  it("passes the configured Reown project ID into the Next.js image build", () => {
    const compose = readProductionCompose({
      ...process.env,
      NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: "reown-project-for-build",
      NEXT_PUBLIC_PROJECT_ID: "reown-project-alias",
    });

    expect(compose.services.app.build?.args).toMatchObject({
      NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: "reown-project-for-build",
      NEXT_PUBLIC_PROJECT_ID: "reown-project-alias",
    });
  });

  it("supports a dedicated indexer RPC endpoint with a working public default", () => {
    const composeFile = readFileSync(path.join(projectRoot, "docker-compose.prod.yml"), "utf8");
    const compose = readProductionCompose();

    expect(composeFile).toContain("indexer:");
    expect(composeFile).toContain("env_file: .env.local");
    expect(composeFile).toContain("ETHEREUM_RPC_URL: ${INDEXER_RPC_URL:-https://ethereum-rpc.publicnode.com}");
    expect(composeFile).not.toContain("ETHEREUM_RPC_URL: ${ETHEREUM_RPC_URL:-https://eth.llamarpc.com}");
    expect(composeFile).not.toContain("STEALTH_EXCHANGE_ADDRESS: ${STEALTH_EXCHANGE_ADDRESS:-}");
    expect(composeFile).not.toContain("POLL_INTERVAL: ${POLL_INTERVAL:-30000}");
    expect(compose.services.indexer.environment?.ETHEREUM_RPC_URL).toBe("https://ethereum-rpc.publicnode.com");
  });

  it("packages the TypeScript worker runtime and application modules", () => {
    const dockerfile = readFileSync(path.join(projectRoot, "Dockerfile"), "utf8");

    expect(dockerfile).toContain("FROM base AS workers");
    expect(dockerfile).toContain("COPY --from=proddeps /app/node_modules ./node_modules");
    expect(dockerfile).toContain("COPY --from=builder /app/workers ./workers");
    expect(dockerfile).toContain("COPY --from=builder /app/src ./src");
    expect(dockerfile).toContain('COPY --from=builder ["/app/contracts json", "./contracts json"]');
    expect(dockerfile).toContain('CMD ["npm", "run", "workers"]');
  });

  it("keeps independent development projects outside the production build context", () => {
    const dockerignore = readFileSync(path.join(projectRoot, ".dockerignore"), "utf8");
    const entries = new Set(
      dockerignore
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#")),
    );

    expect([...entries]).toEqual(expect.arrayContaining([
      ".builds",
      ".kilo",
      "Affliate and admin",
      "PyTelegramClientCopier",
      "affiliate-app",
      "project",
      "standalone",
      "test-dapp-site",
      "vercel-demo",
      "web3-platform",
    ]));
  });
});
