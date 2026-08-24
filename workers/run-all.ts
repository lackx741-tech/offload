/**
 * Starts all BullMQ workers in a single process.
 * Loads .env.local first (workers run outside Next.js).
 * Run: npm run workers
 */
import { loadEnvFile } from "./env";

loadEnvFile(".env.local");
loadEnvFile(".env.development");

const start = async () => {
  await import("./telegram.worker");
  await import("./compile.worker");
  await import("./notify.worker");
  await import("./relay.worker");
  console.log("[workers] all workers running (telegram, compile, notify, relay)");
};

start().catch((err) => {
  console.error("[workers] failed to start:", err);
  process.exit(1);
});

const shutdown = () => {
  console.log("[workers] shutting down...");
  setTimeout(() => process.exit(0), 300);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
