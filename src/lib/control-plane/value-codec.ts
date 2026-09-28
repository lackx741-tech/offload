import type { AbiParameter } from "@/lib/control-plane/abi-compiler";

type AbiMethod = { inputs?: AbiParameter[] };

function parseStructured(value: unknown, path: string): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    throw new Error(`${path} must contain valid JSON`);
  }
}

function normalize(parameter: AbiParameter, value: unknown, path: string): unknown {
  const array = parameter.type.match(/^(.*)\[([0-9]*)\]$/);
  if (array) {
    const parsed = parseStructured(value, path);
    if (!Array.isArray(parsed)) throw new Error(`${path} must be a JSON array`);
    const fixedLength = array[2] ? Number(array[2]) : undefined;
    if (fixedLength !== undefined && parsed.length !== fixedLength) {
      throw new Error(`${path} must contain exactly ${fixedLength} items`);
    }
    return parsed.map((item, index) => normalize({ ...parameter, type: array[1] }, item, `${path}[${index}]`));
  }

  if (parameter.type === "tuple") {
    const tuple = parseStructured(value, path);
    const components = parameter.components;
    if (!Array.isArray(components)) throw new Error(`${path} tuple needs components`);
    if (Array.isArray(tuple)) {
      if (tuple.length !== components.length) throw new Error(`${path} must contain exactly ${components.length} items`);
      return components.map((component, index) => normalize(component, tuple[index], `${path}[${index}]`));
    }
    if (typeof tuple === "object" && tuple !== null) {
      const record = tuple as Record<string, unknown>;
      return Object.fromEntries(components.map((component, index) => {
        const name = component.name;
        if (!name) throw new Error(`${path}.components[${index}] needs a name for object input`);
        if (!(name in record)) throw new Error(`${path}.${name} is required`);
        return [name, normalize(component, record[name], `${path}.${name}`)];
      }));
    }
    throw new Error(`${path} must be a JSON array or object`);
  }

  if (/^uint([0-9]*)$/.test(parameter.type)) {
    if (!/^[0-9]+$/.test(String(value))) throw new Error(`${path} must be ${parameter.type}`);
    return BigInt(String(value));
  }
  if (/^int([0-9]*)$/.test(parameter.type)) {
    if (!/^-?[0-9]+$/.test(String(value))) throw new Error(`${path} must be ${parameter.type}`);
    return BigInt(String(value));
  }
  if (parameter.type === "bool") {
    if (value === true || value === 1 || value === "1" || value === "true") return true;
    if (value === false || value === 0 || value === "0" || value === "false") return false;
    throw new Error(`${path} must be bool`);
  }
  return value;
}

export function normalizeAbiValue(parameter: AbiParameter, value: unknown): unknown {
  return normalize(parameter, value, parameter.name || "Argument");
}

export function normalizeFunctionArguments(method: AbiMethod, values: unknown[]): unknown[] {
  const inputs = Array.isArray(method.inputs) ? method.inputs : [];
  if (values.length !== inputs.length) throw new Error(`Function expects ${inputs.length} arguments, received ${values.length}`);
  return inputs.map((input, index) => normalize(input, values[index], input.name || `args[${index}]`));
}

export function toJsonSafeContractResult(value: unknown): unknown {
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return value.map(toJsonSafeContractResult);
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, toJsonSafeContractResult(item)]));
  }
  return value;
}
