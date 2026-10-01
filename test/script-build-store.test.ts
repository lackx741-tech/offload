import { saveScriptBuild, readBuild } from '@/lib/script-build-store';
import { promises as fs } from 'fs';
import path from 'path';
import { describe, it, expect, afterAll } from 'vitest';

const TEST_FILENAME = 'test-atomic-write.js';
const TEST_CONTENT = 'console.log("hello");';
let generatedFilename: string | null = null;

describe('script-build-store', () => {
  it('writes and reads atomically', async () => {
    const record = await saveScriptBuild({ filename: TEST_FILENAME, content: TEST_CONTENT });
    expect(record.filename).toBe(TEST_FILENAME);
    expect(record.contentLength).toBe(TEST_CONTENT.length);

    const content = await readBuild(TEST_FILENAME);
    expect(content).toBe(TEST_CONTENT);
  });

  it('generates a filename when bundle content is provided without one', async () => {
    const record = await saveScriptBuild({ bundle: TEST_CONTENT });
    generatedFilename = record.filename;
    expect(record.filename).toMatch(/^build-[0-9]+\.js$/);
    expect(await readBuild(record.filename)).toBe(TEST_CONTENT);
  });

  afterAll(async () => {
    const filePath = path.join(process.cwd(), '.builds', TEST_FILENAME);
    try {
      await fs.unlink(filePath);
    } catch {}
    if (generatedFilename) {
      try {
        await fs.unlink(path.join(process.cwd(), '.builds', generatedFilename));
      } catch {}
    }
  });
});
