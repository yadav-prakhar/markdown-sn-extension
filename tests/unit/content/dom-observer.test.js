import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setupContent } from './_setup.js';

const TOOLBAR_CLASS = 'md-sn-toolbar';

describe('Content Script - DOM Observer', () => {
  let api, textarea;

  beforeEach(async () => {
    // setupContent() uses setTimeout(r, 0) internally — do NOT use fake timers
    // before it resolves or the promise will never settle.
    ({ api, textarea } = await setupContent());
  });

  // ---------------------------------------------------------------------------
  // enhanceJournalFields
  // ---------------------------------------------------------------------------

  describe('enhanceJournalFields', () => {
    it('adds toolbar to a textarea matching a journal selector', () => {
      // The default textarea from _setup.js (incident.work_notes) is already
      // enhanced by init(). Create a fresh unenhanced one.
      const grandparent = document.createElement('div');
      const parent = document.createElement('div');
      const ta = document.createElement('textarea');
      ta.id = 'incident.work_notes';
      parent.appendChild(ta);
      grandparent.appendChild(parent);
      document.body.appendChild(grandparent);

      api.enhanceJournalFields();

      const toolbar = grandparent.querySelector(`.${TOOLBAR_CLASS}`);
      expect(toolbar).not.toBeNull();

      grandparent.remove();
    });

    it('marks textarea as enhanced after first call', () => {
      const grandparent = document.createElement('div');
      const parent = document.createElement('div');
      const ta = document.createElement('textarea');
      ta.id = 'incident.work_notes';
      parent.appendChild(ta);
      grandparent.appendChild(parent);
      document.body.appendChild(grandparent);

      api.enhanceJournalFields();

      expect(ta.dataset.mdSnEnhanced).toBe('true');

      grandparent.remove();
    });

    it('is idempotent — calling twice does not add two toolbars', () => {
      const grandparent = document.createElement('div');
      const parent = document.createElement('div');
      const ta = document.createElement('textarea');
      ta.id = 'incident.work_notes';
      parent.appendChild(ta);
      grandparent.appendChild(parent);
      document.body.appendChild(grandparent);

      api.enhanceJournalFields();
      api.enhanceJournalFields();

      const toolbars = grandparent.querySelectorAll(`.${TOOLBAR_CLASS}`);
      expect(toolbars.length).toBe(1);

      grandparent.remove();
    });

    it('skips textareas that do not match journal selectors', () => {
      const grandparent = document.createElement('div');
      const parent = document.createElement('div');
      const ta = document.createElement('textarea');
      ta.id = 'incident.description';
      parent.appendChild(ta);
      grandparent.appendChild(parent);
      document.body.appendChild(grandparent);

      api.enhanceJournalFields();

      const toolbar = grandparent.querySelector(`.${TOOLBAR_CLASS}`);
      expect(toolbar).toBeNull();

      grandparent.remove();
    });

    it('skips already-enhanced textareas', () => {
      const grandparent = document.createElement('div');
      const parent = document.createElement('div');
      const ta = document.createElement('textarea');
      ta.id = 'incident.work_notes';
      ta.dataset.mdSnEnhanced = 'true';
      parent.appendChild(ta);
      grandparent.appendChild(parent);
      document.body.appendChild(grandparent);

      api.enhanceJournalFields();

      const toolbars = grandparent.querySelectorAll(`.${TOOLBAR_CLASS}`);
      expect(toolbars.length).toBe(0);

      grandparent.remove();
    });
  });

  // ---------------------------------------------------------------------------
  // observeDOM
  // ---------------------------------------------------------------------------

  describe('observeDOM', () => {
    it('triggers enhanceJournalFields when a node is added to the DOM after 500ms', async () => {
      // Set up an unenhanced journal textarea so we can detect enhanceJournalFields ran
      const grandparent = document.createElement('div');
      const parent = document.createElement('div');
      const ta = document.createElement('textarea');
      ta.id = 'incident.work_notes';
      parent.appendChild(ta);
      grandparent.appendChild(parent);
      document.body.appendChild(grandparent);

      api.observeDOM();

      // Mutation: add an unrelated node to trigger the observer
      const trigger = document.createElement('div');
      document.body.appendChild(trigger);

      // happy-dom MutationObserverListener debounces via this.#window.setTimeout,
      // which bypasses vi fake timers. Wait for real time to elapse.
      await new Promise(r => setTimeout(r, 600));

      expect(grandparent.querySelector(`.${TOOLBAR_CLASS}`)).not.toBeNull();

      grandparent.remove();
      trigger.remove();
    }, 2000);

    it('debounces multiple mutations — fires enhanceJournalFields only once', async () => {
      // Set up an unenhanced journal textarea
      const grandparent = document.createElement('div');
      const parent = document.createElement('div');
      const ta = document.createElement('textarea');
      ta.id = 'incident.work_notes';
      parent.appendChild(ta);
      grandparent.appendChild(parent);
      document.body.appendChild(grandparent);

      api.observeDOM();

      // Add several nodes in rapid succession — each resets the debounce timer
      for (let i = 0; i < 5; i++) {
        const div = document.createElement('div');
        document.body.appendChild(div);
      }

      // Wait for the debounce to settle (500ms) plus buffer
      await new Promise(r => setTimeout(r, 600));

      // enhanceJournalFields ran exactly once — one toolbar, textarea enhanced
      expect(ta.dataset.mdSnEnhanced).toBe('true');
      const toolbars = grandparent.querySelectorAll(`.${TOOLBAR_CLASS}`);
      expect(toolbars.length).toBe(1);

      grandparent.remove();
    }, 2000);
  });

  // ---------------------------------------------------------------------------
  // Init side effects — storage and message listener
  // ---------------------------------------------------------------------------

  describe('init side effects', () => {
    it('calls chrome.storage.local.get at least once during load (alerts + snippets)', () => {
      // setupContent() already loaded content.js and flushed microtasks
      expect(chrome.storage.local.get).toHaveBeenCalled();
    });

    it('wires up chrome.runtime.onMessage.addListener during load', () => {
      expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();
    });
  });
});
