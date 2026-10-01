import { unzipSync, strFromU8 } from "fflate";
import { describe, expect, it } from "vitest";

import {
  createInlineScript,
  createWebsiteZip,
} from "@/lib/script-artifacts";

describe("standalone script artifacts", () => {
  const script = '(() => { document.body.dataset.ready = "yes"; })();';

  it("wraps the exact standalone payload for inline installation", () => {
    expect(createInlineScript(script)).toBe(`<script>\n${script}\n</script>`);
  });

  it("packages the same script.js payload with a working website example", () => {
    const files = unzipSync(createWebsiteZip(script));

    expect(strFromU8(files["script.js"])).toBe(script);
    expect(strFromU8(files["index.html"])).toContain('<script src="./script.js"></script>');
    expect(strFromU8(files["README.txt"])).toContain("script.js");
  });
});
