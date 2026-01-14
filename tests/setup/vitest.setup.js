import { beforeEach, afterEach } from 'vitest';
import { Window } from 'happy-dom';
import { setupChromeMocks, resetChromeMocks } from '../mocks/chrome-api.js';

// Setup Chrome APIs globally
setupChromeMocks();

// Setup DOM for each test
beforeEach(() => {
  const window = new Window({
    url: 'https://test.service-now.com',
    settings: {
      disableJavaScriptFileLoading: true,
      disableJavaScriptEvaluation: false,
      disableCSSFileLoading: true
    }
  });

  global.window = window;
  global.document = window.document;
  global.navigator = window.navigator;
  global.MutationObserver = window.MutationObserver;
  global.HTMLElement = window.HTMLElement;
  global.Element = window.Element;
  global.Node = window.Node;

  // Reset Chrome API mocks
  resetChromeMocks();
});

afterEach(() => {
  global.window?.close();
});
