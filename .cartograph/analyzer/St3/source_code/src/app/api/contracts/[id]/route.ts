import { NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs/promises";
import { getContractRegistryEntryByName } from "@/lib/contract-registry";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function decodeId(id: string) {
  return Buffer.from(id, "base64url").toString("utf8");
}

function pickAbi(json: unknown): unknown[] | null {
  if (!isRecord(json)) return null;
  if (Array.isArray(json.abi)) return json.abi;
  if (isRecord(json.output) && Array.isArray(json.output.abi)) return json.output.abi;
  if (isRecord(json.artifact) && Array.isArray(json.artifact.abi)) return json.artifact.abi;
  return null;
}

function pickDevAddressHintByName(name: string): string | null {
  if (!name) return null;
  return getContractRegistryEntryByName(name)?.address ?? null;
}

function pickAddressHint(json: unknown): string | null {
  if (!isRecord(json)) return null;
  if (typeof json.address === "string") return json.address;
  if (typeof json.contractAddress === "string") return json.contractAddress;

  // hardhat-deploy style: deployments/<network>/<Contract>.json
  if (isRecord(json.networks)) {
    const entries = Object.values(json.networks);
    for (const n of entries) {
      if (isRecord(n) && typeof n.address === "string") return n.address;
    }
  }

  return null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const rel = decodeId(id);

  const projectRoot = process.cwd();
  const full = path.resolve(projectRoot, rel);

  // Prevent path traversal
  if (!full.startsWith(projectRoot)) {
    return NextResponse.json({ status: "error", message: "Invalid id" }, { status: 400 });
  }

  try {
    const raw = await fs.readFile(full, "utf8");
    const json = JSON.parse(raw) as unknown;

    const abi = pickAbi(json);
    if (!abi) {
      return NextResponse.json(
        { status: "error", message: "No abi found in artifact" },
        { status: 400 }
      );
    }

    const name =
      (isRecord(json) && typeof json.contractName === "string" && json.contractName) ||
      (isRecord(json) && typeof json.name === "string" && json.name) ||
      path.basename(rel, path.extname(rel));
    const addressHint = pickDevAddressHintByName(name) || pickAddressHint(json);
    const registryEntry = getContractRegistryEntryByName(name);

    return NextResponse.json({
      status: "ok",
      name,
      relativePath: rel,
      addressHint,
      abi,
      category: registryEntry?.category ?? null,
      capabilities: registryEntry?.capabilities ?? [],
      description: registryEntry?.description ?? null,
      executionBackend: registryEntry?.backend ?? null,
    });
  } catch {
    return NextResponse.json(
      { status: "error", message: "Artifact not found" },
      { status: 404 }
    );
  }
}
