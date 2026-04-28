import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';
import { loadSource } from '../../setup/load-source.js';

// Listener callbacks captured once after background.js loads
let onInstalledCb, onStartupCb, onClickedCb, onMessageCb, onChangedCb;

beforeAll(() => {
  globalThis.importScripts = () => {};
  loadSource('lib/markdown-servicenow.js');
  if (global.window?.markdownServicenow) {
    globalThis.markdownServicenow = global.window.markdownServicenow;
  }
  loadSource('background/background.js');

  onInstalledCb = chrome.runtime.onInstalled.addListener.mock.calls[0]?.[0];
  onStartupCb   = chrome.runtime.onStartup.addListener.mock.calls[0]?.[0];
  onClickedCb   = chrome.contextMenus.onClicked.addListener.mock.calls[0]?.[0];
  onMessageCb   = chrome.runtime.onMessage.addListener.mock.calls[0]?.[0];
  onChangedCb   = chrome.storage.onChanged.addListener.mock.calls[0]?.[0];
});

afterAll(() => {
  delete globalThis.importScripts;
});

describe('Background Service Worker', () => {

  describe('Context Menu Setup', () => {
    it('creates context menu inside removeAll callback', () => {
      chrome.contextMenus.removeAll.mockImplementation((cb) => cb?.());
      const { setupContextMenu } = globalThis.__mdSn_background;
      setupContextMenu();
      expect(chrome.contextMenus.create).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'convert-markdown', contexts: ['selection'] }),
        expect.any(Function)
      );
    });

    it('handles lastError on context menu creation gracefully', () => {
      chrome.contextMenus.removeAll.mockImplementation((cb) => cb?.());
      chrome.contextMenus.create.mockImplementation((_opts, cb) => {
        chrome.runtime.lastError = { message: 'already exists' };
        cb?.();
        chrome.runtime.lastError = null;
      });
      expect(() => globalThis.__mdSn_background.setupContextMenu()).not.toThrow();
    });

    it('registers onInstalled listener', () => {
      expect(typeof onInstalledCb).toBe('function');
    });

    it('registers onStartup listener', () => {
      expect(typeof onStartupCb).toBe('function');
    });

    it('onInstalled triggers setupContextMenu (removeAll called)', () => {
      chrome.contextMenus.removeAll.mockClear();
      onInstalledCb();
      expect(chrome.contextMenus.removeAll).toHaveBeenCalled();
    });

    it('onStartup triggers setupContextMenu (removeAll called)', () => {
      chrome.contextMenus.removeAll.mockClear();
      onStartupCb();
      expect(chrome.contextMenus.removeAll).toHaveBeenCalled();
    });
  });

  describe('Context Menu Click Handler', () => {
    it('sends convertSelection to correct tab on valid click', async () => {
      chrome.tabs.sendMessage.mockImplementation((_id, _msg, cb) => cb?.({ success: true }));
      await onClickedCb({ menuItemId: 'convert-markdown', selectionText: '# Test' }, { id: 42 });
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(42, { action: 'convertSelection' }, expect.any(Function));
    });

    it('ignores click for different menu item', async () => {
      await onClickedCb({ menuItemId: 'other', selectionText: 'text' }, { id: 1 });
      expect(chrome.tabs.sendMessage).not.toHaveBeenCalled();
    });

    it('ignores click when selectionText is empty', async () => {
      await onClickedCb({ menuItemId: 'convert-markdown', selectionText: '' }, { id: 1 });
      expect(chrome.tabs.sendMessage).not.toHaveBeenCalled();
    });

    it('handles no-receiving-end lastError gracefully', async () => {
      chrome.tabs.sendMessage.mockImplementation((_id, _msg, cb) => {
        chrome.runtime.lastError = { message: 'No receiving end' };
        cb?.();
        chrome.runtime.lastError = null;
      });
      await expect(
        onClickedCb({ menuItemId: 'convert-markdown', selectionText: 'text' }, { id: 99 })
      ).resolves.not.toThrow();
    });
  });

  describe('Message Listener', () => {
    it('converts text and returns success response', () => {
      const sendResponse = vi.fn();
      const result = onMessageCb({ action: 'convert', text: '**bold**' }, {}, sendResponse);
      expect(sendResponse).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
      expect(result).toBe(true);
    });

    it('uses customAlerts from message when provided', () => {
      const sendResponse = vi.fn();
      const customAlerts = { myalert: { name: 'myalert' } };
      onMessageCb({ action: 'convert', text: '# Hi', customAlerts }, {}, sendResponse);
      expect(sendResponse).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('returns error response when conversion throws', () => {
      const origConvert = globalThis.markdownServicenow.convertMarkdownToServiceNow;
      globalThis.markdownServicenow.convertMarkdownToServiceNow = () => { throw new Error('bad'); };
      const sendResponse = vi.fn();
      onMessageCb({ action: 'convert', text: 'x' }, {}, sendResponse);
      expect(sendResponse).toHaveBeenCalledWith({ success: false, error: 'bad' });
      globalThis.markdownServicenow.convertMarkdownToServiceNow = origConvert;
    });

    it('ignores non-convert messages', () => {
      const sendResponse = vi.fn();
      const result = onMessageCb({ action: 'other' }, {}, sendResponse);
      expect(sendResponse).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });
  });

  describe('loadCustomAlerts', () => {
    it('loads custom alerts from chrome.storage.local', () => {
      const custom = { myalert: { name: 'myalert', emoji: '🎯' } };
      chrome.storage.local.get.mockImplementation((_keys, cb) => cb({ customAlertTypes: custom }));
      const { loadCustomAlerts } = globalThis.__mdSn_background;
      loadCustomAlerts();
      expect(chrome.storage.local.get).toHaveBeenCalledWith(['customAlertTypes'], expect.any(Function));
    });
  });

  describe('storage.onChanged listener', () => {
    it('updates customAlerts when customAlertTypes changes', () => {
      const newCustom = { updated: { name: 'updated' } };
      onChangedCb({ customAlertTypes: { newValue: newCustom } }, 'local');
      // Verify conversion uses updated alerts via message listener
      const sendResponse = vi.fn();
      onMessageCb({ action: 'convert', text: '# Hi' }, {}, sendResponse);
      expect(sendResponse).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('ignores changes from non-local storage areas', () => {
      expect(() => onChangedCb({ customAlertTypes: { newValue: {} } }, 'sync')).not.toThrow();
    });
  });
});
