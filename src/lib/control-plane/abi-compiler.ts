export type AbiParameter = {
  name?: string;
  type: string;
  components?: AbiParameter[];
};

export type CanonicalAbiFunction = {
  id: string;
  name: string;
  signature: string;
  kind: "contractRead" | "contractWrite";
  stateMutability: "pure" | "view" | "nonpayable" | "payable";
  payable: boolean;
  inputs: AbiParameter[];
  outputs: AbiParameter[];
  methodAbi: unknown;
};

export type AbiCompilerDiagnostic = {
  path: string;
  code: "non_function" | "duplicate_function" | "malformed_function" | "malformed_tuple";
  severity: "info" | "error";
  message: string;
};

export type CompileAbiInput = { abi: unknown[] };
export type CompileAbiResult = { functions: CanonicalAbiFunction[]; diagnostics: AbiCompilerDiagnostic[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function canonicalType(parameter: AbiParameter, path: string): string {
  if (typeof parameter.type !== "string" || !parameter.type) throw new Error(`${path} needs a type`);
  if (!parameter.type.startsWith("tuple")) return parameter.type;
  if (!Array.isArray(parameter.components)) throw new Error(`${path} tuple needs components`);
  const suffix = parameter.type.slice("tuple".length);
  return `(${parameter.components.map((component, index) => canonicalType(component, `${path}.components[${index}]`)).join(",")})${suffix}`;
}

export function canonicalAbiParameterType(parameter: AbiParameter): string {
  return canonicalType(parameter, "parameter");
}

function fnv1a(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function functionIdForSignature(signature: string): string {
  const name = signature.slice(0, signature.indexOf("(")) || "function";
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "function";
  return `fn-${slug}-${fnv1a(signature)}`;
}

function asParameters(value: unknown): AbiParameter[] | undefined {
  if (!Array.isArray(value)) return undefined;
  if (!value.every((entry) => isRecord(entry) && typeof entry.type === "string")) return undefined;
  return value as AbiParameter[];
}

export function compileContractAbi(input: CompileAbiInput): CompileAbiResult {
  const functions: CanonicalAbiFunction[] = [];
  const diagnostics: AbiCompilerDiagnostic[] = [];
  const signatures = new Set<string>();

  input.abi.forEach((entry, index) => {
    const entryPath = `abi[${index}]`;
    if (!isRecord(entry) || entry.type !== "function") {
      diagnostics.push({ path: entryPath, code: "non_function", severity: "info", message: "Skipped non-function ABI entry" });
      return;
    }
    if (typeof entry.name !== "string" || !entry.name || !["pure", "view", "nonpayable", "payable"].includes(String(entry.stateMutability))) {
      diagnostics.push({ path: entryPath, code: "malformed_function", severity: "error", message: "Function needs a name and valid stateMutability" });
      return;
    }
    const inputs = asParameters(entry.inputs);
    const outputs = asParameters(entry.outputs);
    if (!inputs || !outputs) {
      diagnostics.push({ path: entryPath, code: "malformed_function", severity: "error", message: "Function inputs and outputs must be ABI parameter arrays" });
      return;
    }

    let signature: string;
    try {
      signature = `${entry.name}(${inputs.map((parameter, inputIndex) => canonicalType(parameter, `${entryPath}.inputs[${inputIndex}]`)).join(",")})`;
      outputs.forEach((parameter, outputIndex) => canonicalType(parameter, `${entryPath}.outputs[${outputIndex}]`));
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Malformed tuple";
      const tuplePath = message.split(" tuple needs components")[0] || entryPath;
      diagnostics.push({ path: tuplePath, code: "malformed_tuple", severity: "error", message });
      return;
    }

    if (signatures.has(signature)) {
      diagnostics.push({ path: entryPath, code: "duplicate_function", severity: "info", message: `Skipped duplicate ${signature}` });
      return;
    }
    signatures.add(signature);
    const stateMutability = entry.stateMutability as CanonicalAbiFunction["stateMutability"];
    functions.push({
      id: functionIdForSignature(signature),
      name: entry.name,
      signature,
      kind: stateMutability === "pure" || stateMutability === "view" ? "contractRead" : "contractWrite",
      stateMutability,
      payable: stateMutability === "payable",
      inputs,
      outputs,
      methodAbi: entry,
    });
  });

  return { functions, diagnostics };
}
