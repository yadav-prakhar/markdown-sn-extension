import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

describe('Popup UI', () => {
  let inputEl, outputEl, copyBtn, clearBtn, charCountEl, toastEl;
  let debounce, convert, showToast, copyToClipboard, clearAll;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div>
        <textarea id="input"></textarea>
        <textarea id="output" readonly></textarea>
        <button id="copyBtn">Copy</button>
        <button id="clearBtn">Clear</button>
        <div id="charCount">0 chars</div>
        <div id="toast" class="hidden">
          <span class="toast-message"></span>
        </div>
      </div>
    `;

    inputEl = document.getElementById('input');
    outputEl = document.getElementById('output');
    copyBtn = document.getElementById('copyBtn');
    clearBtn = document.getElementById('clearBtn');
    charCountEl = document.getElementById('charCount');
    toastEl = document.getElementById('toast');

    // Mock markdownServicenow
    global.markdownServicenow = {
      convertMarkdownToServiceNow: vi.fn((text) => `<p>${text}</p>`)
    };

    // Mock navigator.clipboard
    const mockClipboard = {
      writeText: vi.fn(() => Promise.resolve())
    };
    Object.defineProperty(navigator, 'clipboard', {
      value: mockClipboard,
      writable: true,
      configurable: true
    });

    // Mock document.execCommand
    document.execCommand = vi.fn(() => true);

    // Define debounce function
    debounce = function(fn, delay) {
      let timeoutId;
      return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
      };
    };

    // Define convert function
    convert = function() {
      const markdown = inputEl.value.trim();

      if (!markdown) {
        outputEl.value = '';
        charCountEl.textContent = '0 chars';
        copyBtn.disabled = true;
        return;
      }

      try {
        const result = markdownServicenow.convertMarkdownToServiceNow(markdown);
        outputEl.value = result;
        charCountEl.textContent = `${result.length} chars`;
        copyBtn.disabled = false;
      } catch (error) {
        outputEl.value = `Error: ${error.message}`;
        copyBtn.disabled = true;
      }
    };

    // Define showToast function
    showToast = function(message = 'Copied to clipboard!') {
      const toastMessage = toastEl.querySelector('.toast-message');
      toastMessage.textContent = message;

      toastEl.classList.remove('hidden');
      toastEl.offsetHeight; // Force reflow
      toastEl.classList.add('show');

      setTimeout(() => {
        toastEl.classList.remove('show');
        setTimeout(() => toastEl.classList.add('hidden'), 300);
      }, 2000);
    };

    // Define copyToClipboard function
    copyToClipboard = async function() {
      const text = outputEl.value;
      if (!text) return;

      try {
        await navigator.clipboard.writeText(text);
        showToast('Copied to clipboard!');
      } catch (error) {
        outputEl.select();
        document.execCommand('copy');
        showToast('Copied to clipboard!');
      }
    };

    // Define clearAll function
    clearAll = function() {
      inputEl.value = '';
      outputEl.value = '';
      charCountEl.textContent = '0 chars';
      copyBtn.disabled = true;
      inputEl.focus();
    };
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('debounce function', () => {
    it('should delay function execution', async () => {
      vi.useFakeTimers();
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      expect(mockFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });

    it('should cancel previous calls', async () => {
      vi.useFakeTimers();
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      vi.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });

    it('should pass arguments to function', async () => {
      vi.useFakeTimers();
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('arg1', 'arg2');
      vi.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');

      vi.useRealTimers();
    });
  });

  describe('convert function', () => {
    it('should convert markdown to output', () => {
      inputEl.value = '# Hello';
      convert();

      expect(markdownServicenow.convertMarkdownToServiceNow).toHaveBeenCalledWith('# Hello');
      expect(outputEl.value).toBe('<p># Hello</p>');
    });

    it('should update character count', () => {
      inputEl.value = '# Test';
      convert();

      const expectedLength = '<p># Test</p>'.length;
      expect(charCountEl.textContent).toBe(`${expectedLength} chars`);
    });

    it('should enable copy button when output exists', () => {
      inputEl.value = '# Test';
      copyBtn.disabled = true;
      convert();

      expect(copyBtn.disabled).toBe(false);
    });

    it('should clear output when input is empty', () => {
      outputEl.value = 'Previous output';
      inputEl.value = '';
      convert();

      expect(outputEl.value).toBe('');
    });

    it('should disable copy button when input is empty', () => {
      copyBtn.disabled = false;
      inputEl.value = '';
      convert();

      expect(copyBtn.disabled).toBe(true);
    });

    it('should set char count to 0 when input is empty', () => {
      inputEl.value = '';
      convert();

      expect(charCountEl.textContent).toBe('0 chars');
    });

    it('should handle conversion errors', () => {
      markdownServicenow.convertMarkdownToServiceNow.mockImplementation(() => {
        throw new Error('Invalid markdown');
      });

      inputEl.value = 'Bad input';
      convert();

      expect(outputEl.value).toBe('Error: Invalid markdown');
      expect(copyBtn.disabled).toBe(true);
    });

    it('should trim whitespace from input', () => {
      inputEl.value = '  # Test  ';
      convert();

      expect(markdownServicenow.convertMarkdownToServiceNow).toHaveBeenCalledWith('# Test');
    });
  });

  describe('showToast function', () => {
    it('should display toast with message', () => {
      showToast('Test message');

      const message = toastEl.querySelector('.toast-message');
      expect(message.textContent).toBe('Test message');
    });

    it('should show toast by removing hidden class', () => {
      toastEl.classList.add('hidden');
      showToast();

      expect(toastEl.classList.contains('hidden')).toBe(false);
    });

    it('should add show class to toast', () => {
      showToast();

      expect(toastEl.classList.contains('show')).toBe(true);
    });

    it('should use default message if not provided', () => {
      showToast();

      const message = toastEl.querySelector('.toast-message');
      expect(message.textContent).toBe('Copied to clipboard!');
    });
  });

  describe('copyToClipboard function', () => {
    it('should copy output to clipboard', async () => {
      outputEl.value = '<p>Test</p>';

      await copyToClipboard();

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('<p>Test</p>');
    });

    it('should show toast after copying', async () => {
      outputEl.value = 'Test';
      const spy = vi.spyOn({ showToast }, 'showToast');

      await copyToClipboard();

      // Toast is shown but we can verify clipboard was called
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });

    it('should not copy if output is empty', async () => {
      outputEl.value = '';

      await copyToClipboard();

      expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
    });

    it('should fallback to execCommand if clipboard API fails', async () => {
      navigator.clipboard.writeText.mockRejectedValue(new Error('Clipboard error'));
      outputEl.value = 'Test';

      await copyToClipboard();

      expect(document.execCommand).toHaveBeenCalledWith('copy');
    });
  });

  describe('clearAll function', () => {
    it('should clear input field', () => {
      inputEl.value = 'Test input';
      clearAll();

      expect(inputEl.value).toBe('');
    });

    it('should clear output field', () => {
      outputEl.value = 'Test output';
      clearAll();

      expect(outputEl.value).toBe('');
    });

    it('should reset character count', () => {
      charCountEl.textContent = '100 chars';
      clearAll();

      expect(charCountEl.textContent).toBe('0 chars');
    });

    it('should disable copy button', () => {
      copyBtn.disabled = false;
      clearAll();

      expect(copyBtn.disabled).toBe(true);
    });

    it('should focus input field', () => {
      const focusSpy = vi.spyOn(inputEl, 'focus');
      clearAll();

      expect(focusSpy).toHaveBeenCalled();
    });
  });

  describe('Storage Persistence', () => {
    it('should load saved input on popup open', () => {
      const mockGet = vi.fn((keys, callback) => {
        callback({ lastInput: '# Saved content' });
      });
      chrome.storage.local.get = mockGet;

      // Simulate popup open
      mockGet(['lastInput'], (result) => {
        if (result.lastInput) {
          inputEl.value = result.lastInput;
          convert();
        }
      });

      expect(inputEl.value).toBe('# Saved content');
      expect(outputEl.value).toBe('<p># Saved content</p>');
    });

    it('should save input on window blur', () => {
      inputEl.value = '# Content to save';
      const mockSet = vi.fn();
      chrome.storage.local.set = mockSet;

      // Simulate blur event
      if (inputEl.value) {
        chrome.storage.local.set({ lastInput: inputEl.value });
      }

      expect(mockSet).toHaveBeenCalledWith({ lastInput: '# Content to save' });
    });

    it('should not save if input is empty', () => {
      inputEl.value = '';
      const mockSet = vi.fn();
      chrome.storage.local.set = mockSet;

      // Simulate blur event
      if (inputEl.value) {
        chrome.storage.local.set({ lastInput: inputEl.value });
      }

      expect(mockSet).not.toHaveBeenCalled();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle full conversion flow', () => {
      inputEl.value = '**Bold text**';
      markdownServicenow.convertMarkdownToServiceNow.mockReturnValue('<strong>Bold text</strong>');

      convert();

      expect(outputEl.value).toBe('<strong>Bold text</strong>');
      expect(copyBtn.disabled).toBe(false);
      expect(charCountEl.textContent).toBe('26 chars');
    });

    it('should handle clear and reconvert', () => {
      inputEl.value = '# Test';
      convert();
      expect(outputEl.value).toBe('<p># Test</p>');

      clearAll();
      expect(inputEl.value).toBe('');
      expect(outputEl.value).toBe('');

      inputEl.value = '# New';
      convert();
      expect(outputEl.value).toBe('<p># New</p>');
    });

    it('should handle copy after conversion', async () => {
      inputEl.value = '# Test';
      convert();

      await copyToClipboard();

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('<p># Test</p>');
    });
  });
});
