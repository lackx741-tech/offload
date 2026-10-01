import { strToU8, zipSync } from "fflate";

export function createInlineScript(script: string): string {
  return `<script>\n${script}\n</script>`;
}

export function createWebsiteZip(script: string): Uint8Array {
  const indexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Standalone transaction script</title>
  </head>
  <body>
    <button class="connect-btn">Connect Wallet</button>
    <script src="./script.js"></script>
  </body>
</html>
`;
  const readme = `Standalone website script

1. Copy script.js into your website.
2. Load it before the closing body tag:
   <script src="./script.js"></script>
3. Keep or replace the matching trigger element in index.html.

The script is self-executing and does not expose an SDK API.
`;

  return zipSync({
    "script.js": strToU8(script),
    "index.html": strToU8(indexHtml),
    "README.txt": strToU8(readme),
  });
}
