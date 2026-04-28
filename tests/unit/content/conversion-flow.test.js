import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setupContent } from './_setup.js';

describe('Content Script - Conversion Flow', () => {
  let api, textarea;

  beforeEach(async () => {
    ({ api, textarea } = await setupContent());
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ==================== sanitizeHtml ====================

  describe('sanitizeHtml', () => {
    it('strips onclick attribute', () => {
      const input = '<button onclick="alert(1)">click</button>';
      const result = api.sanitizeHtml(input);
      expect(result).not.toContain('onclick');
      expect(result).toContain('<button');
    });

    it('strips onerror attribute with single quotes', () => {
      const input = "<img src='x' onerror='alert(1)'>";
      const result = api.sanitizeHtml(input);
      expect(result).not.toContain('onerror');
    });

    it('replaces href="javascript:..." with href="', () => {
      const input = '<a href="javascript:void(0)">link</a>';
      const result = api.sanitizeHtml(input);
      expect(result).not.toContain('javascript:');
      expect(result).toContain('href="');
    });

    it('replaces src="javascript:..." with src="', () => {
      const input = '<img src="javascript:alert(1)">';
      const result = api.sanitizeHtml(input);
      expect(result).not.toContain('javascript:');
      expect(result).toContain('src="');
    });

    it('preserves benign HTML tags', () => {
      const input = '<strong>bold</strong> <em>italic</em> <p>paragraph</p>';
      const result = api.sanitizeHtml(input);
      expect(result).toContain('<strong>bold</strong>');
      expect(result).toContain('<em>italic</em>');
      expect(result).toContain('<p>paragraph</p>');
    });
  });

  // ==================== debounce ====================

  describe('debounce', () => {
    it('delays function execution until after the delay', () => {
      const fn = vi.fn();
      const debounced = api.debounce(fn, 300);

      debounced();
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(300);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('cancels previous call when invoked again quickly', () => {
      const fn = vi.fn();
      const debounced = api.debounce(fn, 300);

      debounced();
      vi.advanceTimersByTime(100);
      debounced();
      vi.advanceTimersByTime(300);

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('passes arguments through to the wrapped function', () => {
      const fn = vi.fn();
      const debounced = api.debounce(fn, 100);

      debounced('hello', 42);
      vi.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledWith('hello', 42);
    });
  });

  // ==================== convertTextarea ====================

  describe('convertTextarea', () => {
    it('changes textarea value from markdown to HTML on success', () => {
      textarea.value = '# Hello';
      api.convertTextarea(textarea, null);
      expect(textarea.value).not.toBe('# Hello');
      expect(textarea.value.length).toBeGreaterThan(0);
    });

    it('allows restoreMarkdown to recover the original value', () => {
      const original = '# Hello World';
      textarea.value = original;
      const toolbar = api.createToolbar(textarea);

      api.convertTextarea(textarea, toolbar);
      expect(textarea.value).not.toBe(original);

      api.restoreMarkdown(textarea, toolbar);
      expect(textarea.value).toBe(original);
    });

    it('dispatches input event after conversion', () => {
      textarea.value = '# Hello';
      const inputSpy = vi.fn();
      textarea.addEventListener('input', inputSpy);

      api.convertTextarea(textarea, null);

      expect(inputSpy).toHaveBeenCalled();
    });

    it('dispatches change event after conversion', () => {
      textarea.value = '# Hello';
      const changeSpy = vi.fn();
      textarea.addEventListener('change', changeSpy);

      api.convertTextarea(textarea, null);

      expect(changeSpy).toHaveBeenCalled();
    });

    it('dispatches keyup event after conversion', () => {
      textarea.value = '# Hello';
      const keyupSpy = vi.fn();
      textarea.addEventListener('keyup', keyupSpy);

      api.convertTextarea(textarea, null);

      expect(keyupSpy).toHaveBeenCalled();
    });

    it('shows error notification when textarea is empty', () => {
      textarea.value = '';
      api.convertTextarea(textarea, null);
      // showNotification appends a DOM element with the error class
      const notification = document.querySelector('.md-sn-notification-error');
      expect(notification).not.toBeNull();
    });

    it('shows restore button on toolbar after conversion', () => {
      textarea.value = '# Hello';
      const toolbar = api.createToolbar(textarea);
      document.body.appendChild(toolbar);

      api.convertTextarea(textarea, toolbar);

      const restoreBtn = toolbar.querySelector('.md-sn-restore-btn');
      expect(restoreBtn).not.toBeNull();
      expect(restoreBtn.style.display).not.toBe('none');
    });
  });

  // ==================== restoreMarkdown ====================

  describe('restoreMarkdown', () => {
    it('restores original textarea value after conversion', () => {
      const original = '**bold** text';
      textarea.value = original;
      const toolbar = api.createToolbar(textarea);

      api.convertTextarea(textarea, toolbar);
      api.restoreMarkdown(textarea, toolbar);

      expect(textarea.value).toBe(original);
    });

    it('dispatches input event after restore', () => {
      textarea.value = '# Test';
      const toolbar = api.createToolbar(textarea);
      api.convertTextarea(textarea, toolbar);

      const inputSpy = vi.fn();
      textarea.addEventListener('input', inputSpy);
      api.restoreMarkdown(textarea, toolbar);

      expect(inputSpy).toHaveBeenCalled();
    });

    it('dispatches change event after restore', () => {
      textarea.value = '# Test';
      const toolbar = api.createToolbar(textarea);
      api.convertTextarea(textarea, toolbar);

      const changeSpy = vi.fn();
      textarea.addEventListener('change', changeSpy);
      api.restoreMarkdown(textarea, toolbar);

      expect(changeSpy).toHaveBeenCalled();
    });

    it('hides the restore button after restore', () => {
      textarea.value = '# Hello';
      const toolbar = api.createToolbar(textarea);
      document.body.appendChild(toolbar);

      api.convertTextarea(textarea, toolbar);
      api.restoreMarkdown(textarea, toolbar);

      const restoreBtn = toolbar.querySelector('.md-sn-restore-btn');
      expect(restoreBtn.style.display).toBe('none');
    });

    it('is a no-op when called without prior conversion', () => {
      const original = 'no conversion happened';
      textarea.value = original;
      const toolbar = api.createToolbar(textarea);

      api.restoreMarkdown(textarea, toolbar);

      expect(textarea.value).toBe(original);
    });
  });

  // ==================== insertAlertIntoTextarea ====================

  describe('insertAlertIntoTextarea', () => {
    it('inserts alert syntax at cursor position in mid-text', () => {
      textarea.value = 'before\nafter';
      // cursor at position 7 (after "before\n")
      const savedCursor = { start: 7, end: 7 };

      api.insertAlertIntoTextarea(textarea, 'NOTE', savedCursor);

      expect(textarea.value).toContain('> [!NOTE]\n> ');
    });

    it('adds leading newline when text before cursor does not end with newline', () => {
      textarea.value = 'some text';
      const savedCursor = { start: 9, end: 9 };

      api.insertAlertIntoTextarea(textarea, 'WARNING', savedCursor);

      expect(textarea.value).toContain('\n> [!WARNING]\n> ');
    });

    it('does not add leading newline when textarea is empty', () => {
      textarea.value = '';
      const savedCursor = { start: 0, end: 0 };

      api.insertAlertIntoTextarea(textarea, 'TIP', savedCursor);

      expect(textarea.value).toBe('> [!TIP]\n> ');
    });

    it('does not add leading newline when text before cursor ends with newline', () => {
      textarea.value = 'line one\n';
      const savedCursor = { start: 9, end: 9 };

      api.insertAlertIntoTextarea(textarea, 'NOTE', savedCursor);

      expect(textarea.value).toBe('line one\n> [!NOTE]\n> ');
    });

    it('inserts at end when cursor is at end of text', () => {
      textarea.value = 'text';
      const savedCursor = { start: 4, end: 4 };

      api.insertAlertIntoTextarea(textarea, 'IMPORTANT', savedCursor);

      expect(textarea.value).toContain('> [!IMPORTANT]\n> ');
      expect(textarea.value.startsWith('text')).toBe(true);
    });
  });

  // ==================== insertSnippetIntoTextarea ====================

  describe('insertSnippetIntoTextarea', () => {
    it('inserts snippet content at cursor position', () => {
      textarea.value = '';
      const savedCursor = { start: 0, end: 0 };
      const snippet = 'Hello snippet';

      api.insertSnippetIntoTextarea(textarea, snippet, savedCursor);

      expect(textarea.value).toBe('Hello snippet');
    });

    it('adds leading newline when text before cursor does not end with newline', () => {
      textarea.value = 'existing text';
      const savedCursor = { start: 13, end: 13 };
      const snippet = 'new snippet';

      api.insertSnippetIntoTextarea(textarea, snippet, savedCursor);

      expect(textarea.value).toBe('existing text\nnew snippet');
    });

    it('does not add leading newline when textarea is empty', () => {
      textarea.value = '';
      const savedCursor = { start: 0, end: 0 };

      api.insertSnippetIntoTextarea(textarea, 'snippet', savedCursor);

      expect(textarea.value).toBe('snippet');
    });
  });
});
