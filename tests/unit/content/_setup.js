import { vi } from 'vitest';
import { loadSource } from '../../setup/load-source.js';

/**
 * Loads lib + content.js into the current test context.
 * Call inside beforeEach with await. Returns { api, textarea }.
 *
 * vitest.setup.js already creates a fresh window per test, so
 * window.__mdSnInitialized is naturally reset between tests.
 */
export async function setupContent() {
  // Pre-load real library so content.js finds markdownServicenow as a global
  loadSource('lib/markdown-servicenow.js');
  // Mirror onto globalThis: lib assigns to window.markdownServicenow (happy-dom Window),
  // but content.js running via runInThisContext looks up markdownServicenow on globalThis.
  if (global.window?.markdownServicenow) {
    globalThis.markdownServicenow = global.window.markdownServicenow;
  }

  // Build minimal SN-like DOM: grandparent > parent > textarea#incident.work_notes
  const grandparent = document.createElement('div');
  const parent = document.createElement('div');
  const textarea = document.createElement('textarea');
  textarea.id = 'incident.work_notes';
  parent.appendChild(textarea);
  grandparent.appendChild(parent);
  document.body.appendChild(grandparent);

  // Explicitly clear any cached export key and early-return guard
  delete globalThis.__mdSn_content;
  if (typeof window !== 'undefined') window.__mdSnInitialized = false;

  // Load content.js — runs the IIFE which calls init()
  loadSource('content/content.js');

  // Flush microtasks so loadCustomAlerts() / loadSnippets() inside init() settle
  await new Promise(r => setTimeout(r, 0));

  return { api: globalThis.__mdSn_content, textarea };
}
