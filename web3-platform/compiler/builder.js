import esbuild from "esbuild";
import fs from "fs-extra";
import path from "path";

export async function buildSDK(config) {
  const version = Date.now();
  const outDir = path.resolve("./output/" + version);

  await fs.ensureDir(outDir);

  const entry = path.join(outDir, "entry.js");

  await fs.writeFile(entry, `
    import { initSDK } from "../../template/sdk.js";
    window.AffiliateSDK = initSDK(${JSON.stringify(config)});
  `);

  const outfile = path.join(outDir, "bundle.js");

  await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    outfile,
    minify: true,
    format: "iife"
  });

  console.log("✅ Build complete:", outfile);
}
