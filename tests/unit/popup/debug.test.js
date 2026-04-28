import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { Script } from 'vm';
import { loadSource } from '../../setup/load-source.js';

const ROOT = resolve(import.meta.dirname, '../../..');

describe('debug', () => {
  it('checks globalThis in runInThisContext', async () => {
    // Check what globalThis is in the vm context
    const check = new Script(`
      typeof globalThis + '|' + (typeof globalThis.__mdSn_popup)
    `).runInThisContext();
    console.log('globalThis check in vm:', check);

    // Check if the export line itself works
    const testExport = new Script(`
      if (typeof globalThis !== 'undefined') {
        globalThis.__test_export = { works: true };
      }
    `).runInThisContext();
    console.log('__test_export:', globalThis.__test_export);

    // Now check end of popup.js specifically
    const code = readFileSync(resolve(ROOT, 'popup/popup.js'), 'utf8');
    const lastLines = code.split('\n').slice(-10).join('\n');
    console.log('Last 10 lines of popup.js:\n', lastLines);

    expect(true).toBe(true);
  });
});
