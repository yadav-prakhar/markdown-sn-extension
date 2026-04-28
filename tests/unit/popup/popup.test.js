import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupPopup } from './_setup.js';

describe('Popup UI', () => {
  let api;
  let inputEl, outputEl, copyBtn, clearBtn, charCountEl, toastEl;

  beforeEach(async () => {
    api = await setupPopup();
    inputEl = document.getElementById('input');
    outputEl = document.getElementById('output');
    copyBtn = document.getElementById('copyBtn');
    clearBtn = document.getElementById('clearBtn');
    charCountEl = document.getElementById('charCount');
    toastEl = document.getElementById('toast');
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  // ── debounce ──────────────────────────────────────────────────────────────

  describe('debounce function', () => {
    it('should delay function execution', () => {
      vi.useFakeTimers();
      const mockFn = vi.fn();
      const debouncedFn = api.debounce(mockFn, 100);

      debouncedFn();
      expect(mockFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should cancel previous calls', () => {
      vi.useFakeTimers();
      const mockFn = vi.fn();
      const debouncedFn = api.debounce(mockFn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      vi.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments to function', () => {
      vi.useFakeTimers();
      const mockFn = vi.fn();
      const debouncedFn = api.debounce(mockFn, 100);

      debouncedFn('arg1', 'arg2');
      vi.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  // ── convert ───────────────────────────────────────────────────────────────

  describe('convert function', () => {
    it('should convert markdown to output', () => {
      inputEl.value = '**Bold**';
      api.convert();

      expect(outputEl.value).toBeTruthy();
      expect(outputEl.value).not.toBe('');
    });

    it('should update character count after conversion', () => {
      inputEl.value = '**Bold**';
      api.convert();

      const len = outputEl.value.length;
      expect(charCountEl.textContent).toBe(`${len} chars`);
    });

    it('should enable copy button when output exists', () => {
      inputEl.value = '**Bold**';
      copyBtn.disabled = true;
      api.convert();

      expect(copyBtn.disabled).toBe(false);
    });

    it('should clear output when input is empty', () => {
      outputEl.value = 'Previous output';
      inputEl.value = '';
      api.convert();

      expect(outputEl.value).toBe('');
    });

    it('should disable copy button when input is empty', () => {
      copyBtn.disabled = false;
      inputEl.value = '';
      api.convert();

      expect(copyBtn.disabled).toBe(true);
    });

    it('should set char count to 0 when input is empty', () => {
      inputEl.value = '';
      api.convert();

      expect(charCountEl.textContent).toBe('0 chars');
    });

    it('should trim whitespace from input before converting', () => {
      inputEl.value = '  **Bold**  ';
      api.convert();

      expect(outputEl.value).toBeTruthy();
      expect(outputEl.value).not.toBe('');
    });

    it('should produce non-empty output for headers', () => {
      inputEl.value = '# Hello';
      api.convert();

      expect(outputEl.value).toContain('Hello');
    });
  });

  // ── showToast ─────────────────────────────────────────────────────────────

  describe('showToast function', () => {
    it('should display toast with message', () => {
      vi.useFakeTimers();
      api.showToast('Test message');

      const message = toastEl.querySelector('.toast-message');
      expect(message.textContent).toBe('Test message');
    });

    it('should show toast by removing hidden class', () => {
      vi.useFakeTimers();
      toastEl.classList.add('hidden');
      api.showToast('hello');

      expect(toastEl.classList.contains('hidden')).toBe(false);
    });

    it('should add show class to toast', () => {
      vi.useFakeTimers();
      api.showToast('hello');

      expect(toastEl.classList.contains('show')).toBe(true);
    });

    it('should use default message if not provided', () => {
      vi.useFakeTimers();
      api.showToast();

      const message = toastEl.querySelector('.toast-message');
      expect(message.textContent).toBe('Copied to clipboard!');
    });
  });

  // ── copyToClipboard ───────────────────────────────────────────────────────

  describe('copyToClipboard function', () => {
    it('should copy output to clipboard', async () => {
      outputEl.value = '<p>Test</p>';

      await api.copyToClipboard();

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('<p>Test</p>');
    });

    it('should show toast after copying', async () => {
      vi.useFakeTimers();
      outputEl.value = 'Test';

      await api.copyToClipboard();

      expect(navigator.clipboard.writeText).toHaveBeenCalled();
      const message = toastEl.querySelector('.toast-message');
      expect(message.textContent).toBe('Copied to clipboard!');
    });

    it('should not copy if output is empty', async () => {
      outputEl.value = '';

      await api.copyToClipboard();

      expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
    });

    it('should fallback to execCommand if clipboard API fails', async () => {
      navigator.clipboard.writeText = vi.fn(() => Promise.reject(new Error('Clipboard error')));
      outputEl.value = 'Test';

      await api.copyToClipboard();

      expect(document.execCommand).toHaveBeenCalledWith('copy');
    });
  });

  // ── clearAll ──────────────────────────────────────────────────────────────

  describe('clearAll function', () => {
    it('should clear input field', () => {
      inputEl.value = 'Test input';
      api.clearAll();

      expect(inputEl.value).toBe('');
    });

    it('should clear output field', () => {
      outputEl.value = 'Test output';
      api.clearAll();

      expect(outputEl.value).toBe('');
    });

    it('should reset character count', () => {
      charCountEl.textContent = '100 chars';
      api.clearAll();

      expect(charCountEl.textContent).toBe('0 chars');
    });

    it('should disable copy button', () => {
      copyBtn.disabled = false;
      api.clearAll();

      expect(copyBtn.disabled).toBe(true);
    });

    it('should focus input field', () => {
      const focusSpy = vi.spyOn(inputEl, 'focus');
      api.clearAll();

      expect(focusSpy).toHaveBeenCalled();
    });
  });

  // ── Storage Persistence ───────────────────────────────────────────────────

  describe('Storage Persistence', () => {
    it('should load saved input on popup open', () => {
      const mockGet = vi.fn((keys, callback) => {
        callback({ lastInput: '# Saved content' });
      });
      chrome.storage.local.get = mockGet;

      mockGet(['lastInput'], (result) => {
        if (result.lastInput) {
          inputEl.value = result.lastInput;
          api.convert();
        }
      });

      expect(inputEl.value).toBe('# Saved content');
      expect(outputEl.value).not.toBe('');
    });

    it('should save input on window blur', () => {
      inputEl.value = '# Content to save';
      const mockSet = vi.fn();
      chrome.storage.local.set = mockSet;

      if (inputEl.value) {
        chrome.storage.local.set({ lastInput: inputEl.value });
      }

      expect(mockSet).toHaveBeenCalledWith({ lastInput: '# Content to save' });
    });

    it('should not save if input is empty', () => {
      inputEl.value = '';
      const mockSet = vi.fn();
      chrome.storage.local.set = mockSet;

      if (inputEl.value) {
        chrome.storage.local.set({ lastInput: inputEl.value });
      }

      expect(mockSet).not.toHaveBeenCalled();
    });
  });

  // ── Integration Scenarios ─────────────────────────────────────────────────

  describe('Integration Scenarios', () => {
    it('should handle full conversion flow with bold text', () => {
      inputEl.value = '**Bold text**';
      api.convert();

      expect(outputEl.value).toContain('Bold text');
      expect(copyBtn.disabled).toBe(false);
      const len = outputEl.value.length;
      expect(charCountEl.textContent).toBe(`${len} chars`);
    });

    it('should handle clear and reconvert', () => {
      inputEl.value = '# Test';
      api.convert();
      expect(outputEl.value).not.toBe('');

      api.clearAll();
      expect(inputEl.value).toBe('');
      expect(outputEl.value).toBe('');

      inputEl.value = '# New';
      api.convert();
      expect(outputEl.value).not.toBe('');
    });

    it('should handle copy after conversion', async () => {
      inputEl.value = '# Test';
      api.convert();
      const converted = outputEl.value;

      await api.copyToClipboard();

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(converted);
    });
  });

  // ── saveQuickSnippet ──────────────────────────────────────────────────────

  describe('saveQuickSnippet', () => {
    it('should call chrome.storage.local.set with snippets array after saving', () => {
      const quickSaveName = document.getElementById('quickSaveName');
      outputEl.value = '[code]<p>Hello</p>[/code]';
      quickSaveName.value = 'My Snippet';

      api.saveQuickSnippet();

      expect(chrome.storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({ snippets: expect.any(Array) })
      );
    });

    it('should not save if name is empty', () => {
      const quickSaveName = document.getElementById('quickSaveName');
      quickSaveName.value = '';
      const setCalls = chrome.storage.local.set.mock.calls.length;

      api.saveQuickSnippet();

      expect(chrome.storage.local.set.mock.calls.length).toBe(setCalls);
    });
  });

  // ── insertAlertSyntax ─────────────────────────────────────────────────────

  describe('insertAlertSyntax', () => {
    it('should insert NOTE alert syntax into input', () => {
      inputEl.value = '';
      inputEl.selectionStart = 0;
      inputEl.selectionEnd = 0;

      api.insertAlertSyntax('note');

      expect(inputEl.value).toContain('> [!NOTE]');
    });

    it('should insert at cursor position', () => {
      inputEl.value = 'before';
      inputEl.selectionStart = 6;
      inputEl.selectionEnd = 6;

      api.insertAlertSyntax('warning');

      expect(inputEl.value).toContain('> [!WARNING]');
      expect(inputEl.value).toContain('before');
    });
  });

  // ── renderAlertPicker ─────────────────────────────────────────────────────

  describe('renderAlertPicker', () => {
    it('should populate alertPicker with alert-badge elements', () => {
      api.renderAlertPicker();

      const picker = document.getElementById('alertPicker');
      const badges = picker.querySelectorAll('.alert-badge');
      expect(badges.length).toBeGreaterThan(0);
    });

    it('should include built-in alert names in picker', () => {
      api.renderAlertPicker();

      const picker = document.getElementById('alertPicker');
      const text = picker.textContent;
      expect(text.toLowerCase()).toMatch(/note|warning|status/);
    });
  });

  // ── Tab switching ─────────────────────────────────────────────────────────

  describe('switchToTab', () => {
    it('should hide panelConverter and show panelAlerts when switching to Alerts', () => {
      api.switchToTab('Alerts');

      expect(document.getElementById('panelAlerts').classList.contains('hidden')).toBe(false);
      expect(document.getElementById('panelConverter').classList.contains('hidden')).toBe(true);
    });

    it('should show panelConverter and hide others when switching to Converter', () => {
      api.switchToTab('Alerts');
      api.switchToTab('Converter');

      expect(document.getElementById('panelConverter').classList.contains('hidden')).toBe(false);
      expect(document.getElementById('panelAlerts').classList.contains('hidden')).toBe(true);
      expect(document.getElementById('panelSnippets').classList.contains('hidden')).toBe(true);
    });

    it('should show panelSnippets when switching to Snippets', () => {
      api.switchToTab('Snippets');

      expect(document.getElementById('panelSnippets').classList.contains('hidden')).toBe(false);
      expect(document.getElementById('panelConverter').classList.contains('hidden')).toBe(true);
    });
  });

  // ── openSettingsModal / closeSettingsModal ────────────────────────────────

  describe('openSettingsModal / closeSettingsModal', () => {
    it('should remove hidden class from settingsModal on open', () => {
      const modal = document.getElementById('settingsModal');
      modal.classList.add('hidden');

      api.openSettingsModal();

      expect(modal.classList.contains('hidden')).toBe(false);
    });

    it('should add hidden class to settingsModal on close', () => {
      const modal = document.getElementById('settingsModal');
      modal.classList.remove('hidden');

      api.closeSettingsModal();

      expect(modal.classList.contains('hidden')).toBe(true);
    });
  });
});
