import net from "node:net";
import { spawn } from "node:child_process";
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
  const preferred = Number.parseInt(process.env.PORT ?? "3000", 10);
  const port = await findAvailablePort(Number.isFinite(preferred) ? preferred : 3000);

  const nextBin = path.join(process.cwd(), "node_modules", ".bin", "next");
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

  child.on("exit", (code) => process.exit(code ?? 0));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
