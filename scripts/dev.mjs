import net from "node:net";
import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net
      .createServer()
      .once("error", () => resolve(false))
      .once("listening", () => server.close(() => resolve(true)))
      .listen(port, "0.0.0.0");
  });
}

async function findAvailablePort(startPort) {
  let port = startPort;
  while (!(await isPortFree(port))) port += 1;
  return port;
}

async function main() {
  const nextBin = path.join(process.cwd(), "node_modules", ".bin", "next");
  if (!existsSync(nextBin)) {
    console.log("Dependencies are missing. Running locked install...");
    const install = spawnSync("npm", ["ci"], {
      cwd: process.cwd(),
      stdio: "inherit",
      env: process.env,
    });
    if (install.status !== 0 || !existsSync(nextBin)) {
      throw new Error("Dependency installation failed. Review the npm error above.");
    }
  }

  const preferred = Number.parseInt(process.env.PORT ?? "3000", 10);
  const port = await findAvailablePort(Number.isFinite(preferred) ? preferred : 3000);

  const distDir = `.next-${port}`;

  console.log(`Starting dev server on http://localhost:${port}`);

  const child = spawn(nextBin, ["dev", "--webpack", "--port", String(port)], {
    stdio: "inherit",
    env: {
      ...process.env,
      PORT: String(port),
      NEXT_DIST_DIR: distDir,
      NEXT_DISABLE_TURBOPACK: "1",
    },
  });

  child.on("error", (error) => {
    console.error("Unable to start Next.js:", error.message);
    process.exit(1);
  });
  child.on("exit", (code) => process.exit(code ?? 0));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
