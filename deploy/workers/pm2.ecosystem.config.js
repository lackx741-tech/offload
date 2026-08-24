// StealthV26 — PM2 ecosystem (bare-metal VPS, no Docker)
// Usage: pm2 start deploy/workers/pm2.ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "waas-app",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      cwd: "/opt/stealth-v26",
      env: { NODE_ENV: "production", PORT: "3000", HOSTNAME: "0.0.0.0" },
      instances: 1,
      max_memory_restart: "768M",
    },
    {
      name: "waas-workers",
      script: "node_modules/.bin/tsx",
      args: "workers/run-all.ts",
      cwd: "/opt/stealth-v26",
      env: { NODE_ENV: "production" },
      instances: 1,
      max_memory_restart: "512M",
      autorestart: true,
    },
  ],
};
