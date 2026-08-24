/**
 * Script obfuscation system.
 *
 * Three levels:
 *  - "minify"   → Terser minification only (fast, small output)
 *  - "medium"   → Obfuscation with readable variable names mangled
 *  - "heavy"    → Full obfuscation: string encoding, control flow flattening, dead code injection
 */

import JavaScriptObfuscator from "javascript-obfuscator";
import { minify } from "terser";

export type ObfuscationLevel = "none" | "minify" | "medium" | "heavy";

export async function obfuscateScript(
  code: string,
  level: ObfuscationLevel = "medium"
): Promise<string> {
  if (level === "none") return code;

  if (level === "minify") {
    const result = await minify(code, {
      compress: {
        dead_code: true,
        drop_console: false,
        passes: 2,
      },
      mangle: {
        toplevel: true,
      },
      output: {
        comments: false,
      },
    });
    return result.code || code;
  }

  if (level === "medium") {
    const result = JavaScriptObfuscator.obfuscate(code, {
      compact: true,
      controlFlowFlattening: false,
      deadCodeInjection: false,
      debugProtection: false,
      disableConsoleOutput: false,
      identifierNamesGenerator: "hexadecimal",
      log: false,
      numbersToExpressions: true,
      renameGlobals: false,
      selfDefending: false,
      simplify: true,
      splitStrings: true,
      splitStringsChunkLength: 5,
      stringArray: true,
      stringArrayCallsTransform: true,
      stringArrayEncoding: ["base64"],
      stringArrayIndexShift: true,
      stringArrayRotate: true,
      stringArrayShuffle: true,
      stringArrayWrappersCount: 2,
      stringArrayWrappersChainedCalls: true,
      stringArrayWrappersType: "function",
      stringArrayThreshold: 0.75,
      transformObjectKeys: true,
      unicodeEscapeSequence: false,
    });
    return result.getObfuscatedCode();
  }

  // heavy
  const result = JavaScriptObfuscator.obfuscate(code, {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.75,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 0.4,
    debugProtection: true,
    debugProtectionInterval: 2000,
    disableConsoleOutput: false,
    domainLock: [],
    domainLockRedirectUrl: "about:blank",
    forceTransformStrings: [],
    identifierNamesGenerator: "hexadecimal",
    identifiersPrefix: "",
    ignoreImports: false,
    log: false,
    numbersToExpressions: true,
    renameGlobals: true,
    selfDefending: true,
    simplify: true,
    splitStrings: true,
    splitStringsChunkLength: 3,
    stringArray: true,
    stringArrayCallsTransform: true,
    stringArrayCallsTransformThreshold: 0.75,
    stringArrayEncoding: ["rc4"],
    stringArrayIndexShift: true,
    stringArrayRotate: true,
    stringArrayShuffle: true,
    stringArrayWrappersCount: 3,
    stringArrayWrappersChainedCalls: true,
    stringArrayWrappersParametersMaxCount: 4,
    stringArrayWrappersType: "function",
    stringArrayThreshold: 1,
    transformObjectKeys: true,
    unicodeEscapeSequence: true,
  });
  return result.getObfuscatedCode();
}

/**
 * Domain-lock the script so it only runs on specific domains.
 * Works with the "heavy" obfuscation level.
 */
export async function obfuscateWithDomainLock(
  code: string,
  domains: string[],
  level: ObfuscationLevel = "heavy"
): Promise<string> {
  if (level === "none" || level === "minify") {
    return obfuscateScript(code, level);
  }

  const result = JavaScriptObfuscator.obfuscate(code, {
    compact: true,
    controlFlowFlattening: level === "heavy",
    controlFlowFlatteningThreshold: 0.75,
    deadCodeInjection: level === "heavy",
    deadCodeInjectionThreshold: 0.4,
    debugProtection: level === "heavy",
    debugProtectionInterval: level === "heavy" ? 2000 : 0,
    disableConsoleOutput: false,
    domainLock: domains,
    domainLockRedirectUrl: "about:blank",
    identifierNamesGenerator: "hexadecimal",
    log: false,
    numbersToExpressions: true,
    renameGlobals: level === "heavy",
    selfDefending: level === "heavy",
    simplify: true,
    splitStrings: true,
    splitStringsChunkLength: level === "heavy" ? 3 : 5,
    stringArray: true,
    stringArrayCallsTransform: true,
    stringArrayEncoding: [level === "heavy" ? "rc4" : "base64"],
    stringArrayIndexShift: true,
    stringArrayRotate: true,
    stringArrayShuffle: true,
    stringArrayWrappersCount: level === "heavy" ? 3 : 2,
    stringArrayWrappersChainedCalls: true,
    stringArrayWrappersType: "function",
    stringArrayThreshold: level === "heavy" ? 1 : 0.75,
    transformObjectKeys: true,
    unicodeEscapeSequence: level === "heavy",
  });
  return result.getObfuscatedCode();
}
