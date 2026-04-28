import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { vi } from 'vitest';
import { Script } from 'vm';
import { loadSource } from '../../setup/load-source.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '../../..');

/**
 * Evaluates popup.js wrapped in an IIFE so top-level `const`/`let`
 * declarations don't accumulate in the global scope across test runs.
 * globalThis assignments (like globalThis.__mdSn_popup = ...) still work
 * because they explicitly reference globalThis.
 */
function loadPopupJs() {
  const absPath = resolve(ROOT, 'popup/popup.js');
  const code = readFileSync(absPath, 'utf8');
  // Wrap in IIFE: top-level const/let stay scoped; globalThis.* assignments
  // still reach the global object.
  const wrapped = `(function() {\n${code}\n})();`;

  const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  try {
    new Script(wrapped, { filename: absPath }).runInThisContext();
  } finally {
    logSpy.mockRestore();
    warnSpy.mockRestore();
    errSpy.mockRestore();
  }
}

/**
 * Loads popup.html DOM and popup.js into the current test context.
 * Call inside beforeEach with await. Returns globalThis.__mdSn_popup.
 */
export async function setupPopup() {
  // Build DOM from popup.html, stripping <script> tags (JS loaded manually)
  const html = readFileSync(resolve(ROOT, 'popup/popup.html'), 'utf8');
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const bodyHtml = (bodyMatch ? bodyMatch[1] : html)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  document.body.innerHTML = bodyHtml;

  // Load the real library via loadSource (not wrapped) — it assigns to
  // window.markdownServicenow AND globalThis.markdownServicenow via its own IIFE.
  loadSource('lib/markdown-servicenow.js');
  // Mirror onto globalThis so popup.js (running inside an IIFE) can reach it
  // as a bare name via the global scope.
  if (global.window?.markdownServicenow) {
    globalThis.markdownServicenow = global.window.markdownServicenow;
  }

  // Clipboard and legacy copy fallback
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn(() => Promise.resolve()) },
    writable: true,
    configurable: true
  });
  document.execCommand = vi.fn(() => true);

  // URL/Blob stubs for exportAlerts()
  global.URL.createObjectURL = vi.fn(() => 'blob:test');
  global.URL.revokeObjectURL = vi.fn();
  global.Blob = class Blob {
    constructor(parts, opts) { this._parts = parts; this.type = opts?.type ?? ''; }
  };

  // FileReader stub for handleImportFile()
  global.FileReader = class FileReader {
    readAsText(file) {
      setTimeout(() => this.onload?.({ target: { result: file._content ?? '' } }), 0);
    }
  };

  // Clear previous popup export before re-evaluation
  delete globalThis.__mdSn_popup;

  // Load popup.js wrapped in IIFE to avoid const re-declaration errors
  // across multiple beforeEach runs. init() runs at the bottom of popup.js
  // and sets globalThis.__mdSn_popup.
  loadPopupJs();

  // Flush microtasks so init()'s async storage calls resolve
  await new Promise(r => setTimeout(r, 0));

  return globalThis.__mdSn_popup;
}
