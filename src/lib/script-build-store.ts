import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

export type ScriptBuildRecord = {
  id: string;
  filename: string;
  url: string;
  createdAt: string;
  framework: string;
  source: "compile" | "frontpage";
  size: number;
};

const DATA_DIR = path.join(process.cwd(), "data");
const PUBLIC_DIR = path.join(process.cwd(), "public", "generated-scripts");
const BUILDS_PATH = path.join(DATA_DIR, "script-builds.json");

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isBuildRecord(value: unknown): value is ScriptBuildRecord {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.filename === "string" &&
    typeof value.url === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.framework === "string" &&
    (value.source === "compile" || value.source === "frontpage") &&
    typeof value.size === "number"
  );
}

export async function listScriptBuilds(): Promise<ScriptBuildRecord[]> {
  try {
    const raw = await readFile(BUILDS_PATH, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isBuildRecord).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}

export async function saveScriptBuild(params: {
  bundle: string;
  framework: string;
  source: "compile" | "frontpage";
}): Promise<ScriptBuildRecord> {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const id = `build-${stamp}`;
  const filename = `stealthv26-${stamp}.min.js`;
  const url = `/generated-scripts/${filename}`;

  await mkdir(DATA_DIR, { recursive: true });
  await mkdir(PUBLIC_DIR, { recursive: true });
  await writeFile(path.join(PUBLIC_DIR, filename), params.bundle, "utf8");
  // Stable URL for embeds / CDNs: always points at the last compiled bundle
  await writeFile(path.join(PUBLIC_DIR, "stealthv26-latest.min.js"), params.bundle, "utf8");

  const builds = await listScriptBuilds();
  const record: ScriptBuildRecord = {
    id,
    filename,
    url,
    createdAt: new Date().toISOString(),
    framework: params.framework,
    source: params.source,
    size: params.bundle.length,
  };
  await writeFile(BUILDS_PATH, `${JSON.stringify([record, ...builds], null, 2)}\n`, "utf8");
  return record;
}
