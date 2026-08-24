import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".next-*/**",
    "packages/sdk/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
    "public/generated-scripts/**",
    "standalone/**",
    "web3-platform/compiler/output/**",
    "web3-platform/**",
    "Affliate and admin/**",
    "Affliate and admin/dist/**",
    "affiliate-app/.next/**",
    "**/*.min.js",
  ]),
]);

export default eslintConfig;
