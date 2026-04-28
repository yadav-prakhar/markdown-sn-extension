import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { loadSource } from '../../setup/load-source.js';

describe('P1.1 Smoke Test — vm.runInThisContext coverage attribution', () => {
  beforeAll(() => {
    global.importScripts = () => {};
    loadSource('lib/markdown-servicenow.js');
  });

  afterAll(() => {
    delete global.importScripts;
  });

  it('exposes markdownServicenow on globalThis after loading via loader', () => {
    expect(typeof globalThis.markdownServicenow).toBe('object');
  });

  it('can call convertMarkdownToServiceNow from the loaded module', () => {
    const result = globalThis.markdownServicenow.convertMarkdownToServiceNow('# Hello');
    expect(result).toContain('Hello');
  });

  it('converts bold markdown', () => {
    const result = globalThis.markdownServicenow.convertMarkdownToServiceNow('**bold**', { skipCodeTags: true });
    expect(result).toContain('<strong>bold</strong>');
  });
});
