import { vi } from 'vitest';

export const mockChrome = {
  runtime: {
    onInstalled: { addListener: vi.fn() },
    onMessage: { addListener: vi.fn() },
    getURL: vi.fn((path) => `chrome-extension://test-id/${path}`),
    lastError: null,
    sendMessage: vi.fn((msg, callback) => {
      if (callback) callback({ success: true });
      return Promise.resolve({ success: true });
    })
  },
  contextMenus: {
    create: vi.fn(),
    onClicked: { addListener: vi.fn() }
  },
  storage: {
    local: {
      get: vi.fn((keys, callback) => {
        if (callback) callback({});
        return Promise.resolve({});
      }),
      set: vi.fn((items, callback) => {
        if (callback) callback();
        return Promise.resolve();
      }),
      clear: vi.fn((callback) => {
        if (callback) callback();
        return Promise.resolve();
      })
    }
  },
  tabs: {
    sendMessage: vi.fn((tabId, msg, callback) => {
      if (callback) callback({ success: true });
      return Promise.resolve({ success: true });
    }),
    query: vi.fn((query, callback) => {
      if (callback) callback([]);
      return Promise.resolve([]);
    })
  },
  notifications: {
    create: vi.fn()
  }
};

export function setupChromeMocks() {
  global.chrome = mockChrome;
}

export function resetChromeMocks() {
  Object.values(mockChrome).forEach(api => {
    Object.values(api).forEach(method => {
      if (method?.mockClear) {
        method.mockClear();
      } else if (typeof method === 'object' && method?.addListener) {
        method.addListener.mockClear?.();
      }
    });
  });
}
