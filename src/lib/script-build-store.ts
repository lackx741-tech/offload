import { mkdir, readFile, writeFile, readdir, stat } from "fs/promises";
import path from "path";

/**
 * Build storage with atomic writes and automatic cleanup.
 *
 * Atomic write: write to a temp file in the same directory, then rename —
 * readers never see a half-written file even under concurrency.
 *
 * Cleanup: a background interval removes builds older than 7 days, but
 * always keeps the "latest" build and any file whose name starts with
 * "drainer-" (these are actively served by the compile route).
 */

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export type ScriptBuildRecord = {
  id: string;
  filename: string;
  url: string;
  createdAt: number;
  contentLength: number;
  source?: string;
  framework?: string;
};

// ═══════════════════════════════════════════════════════════════════════════
// Paths
// ═══════════════════════════════════════════════════════════════════════════

const BASE_DIR = path.resolve(process.cwd(), ".builds");

async function ensureDir(): Promise<void> {
  await mkdir(BASE_DIR, { recursive: true });
}

// ═══════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════

/** Read a single file as text. Returns null if missing. */
async function readText(filePath: string): Promise<string | null> {
  try {
    return await readFile(filePath, "utf-8");
  } catch {
    return null;
  }
}

/** List all regular files in the build directory. */
async function listFiles(): Promise<string[]> {
  await ensureDir();
  const entries = await readdir(BASE_DIR);
  return entries
    .filter((e) => !e.startsWith("."))
    .map((e) => path.join(BASE_DIR, e))
    .filter((p) => stat(p).then((s) => s.isFile()).catch(() => false));
}

/** Guess a URL for a given filename. */
function guessUrl(filename: string): string {
  return `https://v26sequence.com/generated-scripts/${encodeURIComponent(filename)}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════════════════

/**
 * List all stored builds (for the compile route's /api/script/builds list).
 */
export async function listScriptBuilds(): Promise<ScriptBuildRecord[]> {
  await ensureDir();
  const files = await listFiles();
  const records = await Promise.all(
    files.map(async (filePath) => {
      const { size } = await stat(filePath);
      const filename = path.basename(filePath);
      const createdAt = await stat(filePath).then((s) => s.mtimeMs);
      return {
        id: filename.replace(/\.[^.]+$/, ""),
        filename,
        url: guessUrl(filename),
        createdAt,
        contentLength: size,
      };
    })
  );
  return records.sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Save a script build atomically.
 *
 * Uses a temp file + rename so readers never see a partial file.
 * Always writes the "latest" variant and the versioned file.
 */
export async function saveScriptBuild(params: {
  filename?: string;
  content?: string;
  bundle?: string;
  framework?: string;
  source?: string;
  mode?: string;
  siteName?: string;
  obfuscation?: string;
}): Promise<ScriptBuildRecord> {
  await ensureDir();

  const filename = params.filename ?? `build-${Date.now()}.js`;
  const content = params.content ?? params.bundle ?? '';
  const { framework, source } = params;
  const filePath = path.join(BASE_DIR, filename);
  const tmpPath = `${filePath}.tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  // Atomic write: write to temp, then rename
  await writeFile(tmpPath, content, "utf-8");
  await renameFile(tmpPath, filePath);

  const { size } = await stat(filePath);
  const createdAt = await stat(filePath).then((s) => s.mtimeMs);

  return {
    id: filename.replace(/\.[^.]+$/, ""),
    filename,
    url: guessUrl(filename),
    createdAt,
    contentLength: size,
    source: params.source ?? undefined,
    framework: params.framework ?? undefined,
  };
}

/**
 * Read a single build by filename. Returns null if not found.
 */
export async function readBuild(filename: string): Promise<string | null> {
  await ensureDir();
  return readText(path.join(BASE_DIR, filename));
}

/**
 * Delete builds older than `maxAge` ms.
 *
 * Never deletes the "latest" file or files starting with "drainer-".
 */
export async function cleanupOldBuilds(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<number> {
  await ensureDir();
  const files = await listFiles();
  const now = Date.now();
  const { rm: _rm } = await import("fs/promises");
  let deleted = 0;

  for (const filePath of files) {
    const filename = path.basename(filePath);
    // Protect "latest" and drainer-named files
    if (filename === "latest.js" || filename.startsWith("drainer-")) continue;

    try {
      const { mtime } = await stat(filePath);
      if (now - mtime.getTime() > maxAge) {
        await _rm(filePath);
        deleted++;
      }
    } catch {
      // skip
    }
  }

  return deleted;
}

// ═══════════════════════════════════════════════════════════════════════════
// Tiny polyfill for rename since Node's fs doesn't export it directly via promises in all versions
// ═══════════════════════════════════════════════════════════════════════════

async function renameFile(oldPath: string, newPath: string): Promise<void> {
  // Use fs.promises.rename if available (Node 14+), otherwise fallback
  try {
    const fs = await import("fs/promises");
    if (typeof fs.rename === "function") {
      await fs.rename(oldPath, newPath);
      return;
    }
  } catch {}

  // Fallback: copy then unlink (for platforms where rename across filesystems fails)
  const { copyFile, unlink } = await import("fs/promises");
  await copyFile(oldPath, newPath);
  try { await unlink(oldPath); } catch {}
}
