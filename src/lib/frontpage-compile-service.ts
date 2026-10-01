import { compileFrontpageScript } from "@/lib/frontpage-script-compiler";
import { analyzeContractAction } from "@/lib/contract-compatibility";
import { isFrontpageConfig } from "@/lib/frontpage-config-store";

export async function compileFrontpagePayload(payload: unknown) {
  const candidate = payload && typeof payload === "object" && "frontpage" in payload
    ? (payload as { frontpage?: unknown }).frontpage
    : payload;
  if (!isFrontpageConfig(candidate)) throw new Error("Invalid frontpage config payload");
  const compiled = await compileFrontpageScript(candidate);
  const diagnostics = compiled.actions.map(analyzeContractAction);
  return {
    generator: "standalone-frontpage" as const,
    filename: compiled.filename,
    contentType: compiled.contentType,
    scriptTag: compiled.scriptTag,
    script: compiled.script,
    actions: compiled.actions.map((action) => ({ id: action.id, signature: action.functionSignature })),
    diagnostics,
  };
}
