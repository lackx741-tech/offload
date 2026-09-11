import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// ── Shared temp directory for file-system tests ──────────────────────────
let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'st3-test-'));
});

afterEach(() => {
  if (tmpDir && fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

// ── Helper: create a fake DATA_DIR + PUBLIC_DIR structure ─────────────────
function createTestDirs(dataSubdir: string, publicSubdir: string) {
  const dataDir = path.join(tmpDir, dataSubdir);
  const publicDir = path.join(tmpDir, publicSubdir);
  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(publicDir, { recursive: true });
  return { dataDir, publicDir };
}
