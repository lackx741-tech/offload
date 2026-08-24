import { NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs/promises";
import type { Dirent } from "node:fs";

type ContractListItem = {
  id: string;
  name: string;
  relativePath: string;
};

const MAX_FILES = 200;

function encodeId(relativePath: string) {
  return Buffer.from(relativePath, "utf8").toString("base64url");
}

async function pathExists(p: string) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function walkJsonFiles(dir: string, out: string[]) {
  if (out.length >= MAX_FILES) return;
  let entries: Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const ent of entries) {
    if (out.length >= MAX_FILES) return;
    if (ent.name === "node_modules" || ent.name.startsWith(".next")) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      await walkJsonFiles(full, out);
    } else if (ent.isFile() && ent.name.toLowerCase().endsWith(".json")) {
      out.push(full);
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isLikelyContractArtifact(json: unknown): boolean {
  if (Array.isArray(json)) return true;
  if (!json || typeof json !== "object") return false;
  if (!isRecord(json)) return false;
  if (Array.isArray(json.abi)) return true;
  if (typeof json.contractName === "string" && Array.isArray(json.abi)) return true;
  if (isRecord(json.output) && Array.isArray(json.output.abi)) return true;
  if (isRecord(json.artifact) && Array.isArray(json.artifact.abi)) return true;
  return false;
}

export async function GET() {
  const projectRoot = process.cwd();

  const candidateRoots = [
    "abi",
    "src/contracts",
    "contracts",
    "contracts json",
    "artifacts",
    "out",
    "deployments",
  ].map((p) => path.join(projectRoot, p));

  const roots = [] as string[];
  for (const r of candidateRoots) {
    if (await pathExists(r)) roots.push(r);
  }

  const allFiles: string[] = [];
  for (const r of roots) {
    await walkJsonFiles(r, allFiles);
    if (allFiles.length >= MAX_FILES) break;
  }

  const items: ContractListItem[] = [];

  for (const file of allFiles) {
    try {
      const raw = await fs.readFile(file, "utf8");
      const json = JSON.parse(raw) as unknown;
      if (!isLikelyContractArtifact(json)) continue;

      const relativePath = path.relative(projectRoot, file);
      const name =
        (isRecord(json) && typeof json.contractName === "string" && json.contractName) ||
        (isRecord(json) && typeof json.name === "string" && json.name) ||
        path.basename(file, path.extname(file));

      items.push({
        id: encodeId(relativePath),
        name,
        relativePath,
      });
    } catch {
      continue;
    }
  }

  items.sort((a, b) => a.relativePath.localeCompare(b.relativePath));

  return NextResponse.json({ status: "ok", total: items.length, items });
}
