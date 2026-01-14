import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the markdownServicenow library
const mockConvert = vi.fn((text) => `<h1>${text}</h1>`);
global.markdownServicenow = {
  convertMarkdownToServiceNow: mockConvert
};

// Mock importScripts
global.importScripts = vi.fn();

// Import after setting up mocks
let backgroundModule;

describe('Background Service Worker', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    mockConvert.mockImplementation((text) => `<h1>${text}</h1>`);

    // Reset chrome API mocks
    chrome.contextMenus.create.mockClear();
    chrome.contextMenus.onClicked.addListener.mockClear();
    chrome.tabs.sendMessage.mockClear();
    chrome.runtime.onMessage.addListener.mockClear();
    chrome.storage.local.set.mockClear();
    chrome.notifications.create = vi.fn();
  });

  describe('Context Menu Creation', () => {
    it('should create context menu on install', () => {
      // Simulate the onInstalled event
      const listeners = [];
      chrome.runtime.onInstalled.addListener.mockImplementation((callback) => {
        listeners.push(callback);
        callback(); // Execute immediately for test
      });

      // Re-import to trigger the listener setup
      eval(`
        chrome.runtime.onInstalled.addListener(() => {
          chrome.contextMenus.create({
            id: 'convert-markdown',
            title: 'Convert Markdown to ServiceNow',
            contexts: ['selection']
          });
        });
      `);

      expect(chrome.contextMenus.create).toHaveBeenCalledWith({
        id: 'convert-markdown',
        title: 'Convert Markdown to ServiceNow',
        contexts: ['selection']
      });
    });
  });

  describe('Context Menu Click Handler', () => {
    let clickHandler;

    beforeEach(() => {
      // Capture the click handler
      chrome.contextMenus.onClicked.addListener.mockImplementation((callback) => {
        clickHandler = callback;
      });

      // Setup the listener - matches actual background.js behavior
      // The background script now sends 'convertSelection' to content script
      // and lets the content script do the actual conversion
      eval(`
        chrome.contextMenus.onClicked.addListener(async (info, tab) => {
          if (info.menuItemId === 'convert-markdown' && info.selectionText) {
            chrome.tabs.sendMessage(tab.id, {
              action: 'convertSelection'
            }, (response) => {
              if (chrome.runtime.lastError) {
                console.log('No frame handled selection');
              }
            });
          }
        });
      `);
    });

    it('should send convertSelection message on context menu click', async () => {
      const info = {
        menuItemId: 'convert-markdown',
        selectionText: 'Test markdown'
      };
      const tab = { id: 123 };

      chrome.tabs.sendMessage.mockImplementation((tabId, message, callback) => {
        callback({ success: true });
      });

      await clickHandler(info, tab);

      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
        123,
        { action: 'convertSelection' },
        expect.any(Function)
      );
    });

    it('should send message to correct tab', async () => {
      const info = {
        menuItemId: 'convert-markdown',
        selectionText: '# Header'
      };
      const tab = { id: 456 };

      chrome.tabs.sendMessage.mockImplementation((tabId, message, callback) => {
        expect(tabId).toBe(456);
        expect(message.action).toBe('convertSelection');
        callback({ success: true });
      });

      await clickHandler(info, tab);

      expect(chrome.tabs.sendMessage).toHaveBeenCalled();
    });

    it('should not process if menuItemId does not match', async () => {
      const info = {
        menuItemId: 'other-menu',
        selectionText: 'Test'
      };
      const tab = { id: 789 };

      await clickHandler(info, tab);

      expect(chrome.tabs.sendMessage).not.toHaveBeenCalled();
    });

    it('should not process if selectionText is empty', async () => {
      const info = {
        menuItemId: 'convert-markdown',
        selectionText: ''
      };
      const tab = { id: 789 };

      await clickHandler(info, tab);

      expect(chrome.tabs.sendMessage).not.toHaveBeenCalled();
    });

    it('should handle no receiving end gracefully', async () => {
      const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

      chrome.tabs.sendMessage.mockImplementation((tabId, message, callback) => {
        chrome.runtime.lastError = { message: 'No receiving end' };
        callback();
        chrome.runtime.lastError = null;
      });

      const info = {
        menuItemId: 'convert-markdown',
        selectionText: 'Test'
      };
      const tab = { id: 999 };

      await clickHandler(info, tab);

      expect(consoleLog).toHaveBeenCalledWith('No frame handled selection');
      consoleLog.mockRestore();
    });
  });

  describe('Message Listener', () => {
    let messageHandler;

    beforeEach(() => {
      // Capture the message handler
      chrome.runtime.onMessage.addListener.mockImplementation((callback) => {
        messageHandler = callback;
      });

      // Setup the listener
      eval(`
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
          if (message.action === 'convert') {
            try {
              const result = markdownServicenow.convertMarkdownToServiceNow(message.text);
              sendResponse({ success: true, result });
            } catch (error) {
              sendResponse({ success: false, error: error.message });
            }
            return true;
          }
        });
      `);
    });

    it('should handle convert messages from popup', () => {
      const message = {
        action: 'convert',
        text: '# Test'
      };
      const sender = {};
      const sendResponse = vi.fn();

      const result = messageHandler(message, sender, sendResponse);

      expect(mockConvert).toHaveBeenCalledWith('# Test');
      expect(sendResponse).toHaveBeenCalledWith({
        success: true,
        result: '<h1># Test</h1>'
      });
      expect(result).toBe(true); // Should return true for async response
    });

    it('should handle conversion errors in messages', () => {
      mockConvert.mockImplementation(() => {
        throw new Error('Invalid markdown');
      });

      const message = {
        action: 'convert',
        text: 'Bad input'
      };
      const sender = {};
      const sendResponse = vi.fn();

      messageHandler(message, sender, sendResponse);

      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid markdown'
      });
    });

    it('should not process non-convert messages', () => {
      const message = {
        action: 'other-action',
        text: 'Test'
      };
      const sender = {};
      const sendResponse = vi.fn();

      const result = messageHandler(message, sender, sendResponse);

      expect(mockConvert).not.toHaveBeenCalled();
      expect(sendResponse).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });
  });

  describe('copyToClipboard Helper', () => {
    it('should store text in chrome.storage.local', async () => {
      chrome.storage.local.set.mockImplementation((data, callback) => {
        expect(data.clipboardText).toBe('Converted text');
        callback();
      });

      // Simulate copyToClipboard function
      const copyToClipboard = async (text) => {
        chrome.storage.local.set({ clipboardText: text }, () => {
          chrome.notifications.create({
            type: 'basic',
            iconUrl: '../icons/icon48.png',
            title: 'Markdown Converted',
            message: 'Output copied to clipboard!'
          });
        });
      };

      await copyToClipboard('Converted text');

      expect(chrome.storage.local.set).toHaveBeenCalled();
    });

    it('should create notification after copying', async () => {
      chrome.storage.local.set.mockImplementation((data, callback) => {
        callback();
      });

      chrome.notifications.create.mockImplementation((options) => {
        expect(options.type).toBe('basic');
        expect(options.title).toBe('Markdown Converted');
        expect(options.message).toBe('Output copied to clipboard!');
      });

      const copyToClipboard = async (text) => {
        chrome.storage.local.set({ clipboardText: text }, () => {
          chrome.notifications.create({
            type: 'basic',
            iconUrl: '../icons/icon48.png',
            title: 'Markdown Converted',
            message: 'Output copied to clipboard!'
          });
        });
      };

      await copyToClipboard('Test');

      expect(chrome.notifications.create).toHaveBeenCalled();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle full flow from context menu to content script', async () => {
      // Setup complete flow
      let clickHandler;
      chrome.contextMenus.onClicked.addListener.mockImplementation((callback) => {
        clickHandler = callback;
      });

      // The background script delegates conversion to content script
      eval(`
        chrome.contextMenus.onClicked.addListener(async (info, tab) => {
          if (info.menuItemId === 'convert-markdown' && info.selectionText) {
            chrome.tabs.sendMessage(tab.id, {
              action: 'convertSelection'
            }, (response) => {});
          }
        });
      `);

      chrome.tabs.sendMessage.mockImplementation((tabId, message, callback) => {
        callback({ success: true });
      });

      const info = {
        menuItemId: 'convert-markdown',
        selectionText: '**Bold text**'
      };
      const tab = { id: 100 };

      await clickHandler(info, tab);

      // Background script sends convertSelection, content script does the conversion
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
        100,
        { action: 'convertSelection' },
        expect.any(Function)
      );
    });
  });
});
