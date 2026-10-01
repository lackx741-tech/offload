import { createRequire } from "module";
import type { NextConfig } from "next";

const require = createRequire(import.meta.url);

const nextConfig: NextConfig = {
  reactCompiler: false,
  outputFileTracingRoot: process.cwd(),
  distDir: process.env.NEXT_DIST_DIR || ".next",
  output: "standalone",
  serverExternalPackages: ["ioredis", "kafkajs", "javascript-obfuscator", "esbuild"],
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "viem$": require.resolve("viem"),
      "viem/actions$": require.resolve("viem/actions"),
      "viem/account-abstraction$": require.resolve("viem/account-abstraction"),
      "viem/accounts$": require.resolve("viem/accounts"),
      "viem/chains$": require.resolve("viem/chains"),
      "viem/ens$": require.resolve("viem/ens"),
      "viem/experimental$": require.resolve("viem/experimental"),
      "viem/linea$": require.resolve("viem/linea"),
      "viem/nonce$": require.resolve("viem/nonce"),
      "viem/op-stack$": require.resolve("viem/op-stack"),
      "viem/utils$": require.resolve("viem/utils"),
      "viem/window$": require.resolve("viem/window"),
      "abitype$": require.resolve("abitype"),
      "preact$": require.resolve("preact"),
      "preact/hooks$": require.resolve("preact/hooks"),
      "preact/jsx-runtime$": require.resolve("preact/jsx-runtime"),
      "zustand/middleware$": require.resolve("zustand/middleware"),
      "zustand/vanilla$": require.resolve("zustand/vanilla"),
    };
    return config;
  },
  // turbopack disabled — standalone output requires webpack for production

};

export default nextConfig;
