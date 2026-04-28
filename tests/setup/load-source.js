import { Script } from 'vm';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { vi } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '../..');

/**
 * Evaluates a source file in the current V8 context using vm.Script so v8 coverage
 * attributes executed lines to the real file path.
 *
 * @param {string} relativePath  - relative to the extension root
 * @param {object} [options]
 * @param {Function} [options.preEvaluate] - called before evaluation (stubs, pre-loads)
 */
export function loadSource(relativePath, options = {}) {
  const { preEvaluate } = options;
  const absPath = resolve(ROOT, relativePath);
  const code = readFileSync(absPath, 'utf8');

  if (typeof preEvaluate === 'function') preEvaluate();

  const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  try {
    new Script(code, { filename: absPath }).runInThisContext();
  } finally {
    logSpy.mockRestore();
    warnSpy.mockRestore();
    errSpy.mockRestore();
  }
}
