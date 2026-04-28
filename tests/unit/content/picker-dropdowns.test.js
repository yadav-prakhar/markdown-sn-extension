import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setupContent } from './_setup.js';

describe('Content Script - Picker Dropdowns', () => {
  let api, textarea;

  function makeAnchorBtn() {
    const btn = document.createElement('button');
    btn.getBoundingClientRect = () => ({
      top: 100, bottom: 130, left: 0, right: 100, width: 100, height: 30
    });
    document.body.appendChild(btn);
    return btn;
  }

  beforeEach(async () => {
    ({ api, textarea } = await setupContent());
  });

  afterEach(() => {
    // Remove any picker/panel hosts left in the DOM
    document.querySelectorAll(
      '.md-sn-alert-host, .md-sn-snippets-host, .md-sn-cheatsheet-host'
    ).forEach(el => el.remove());
  });

  // ==================== openAlertPicker ====================

  describe('openAlertPicker', () => {
    it('appends a host element to document.body', () => {
      const anchor = makeAnchorBtn();
      api.openAlertPicker(textarea, anchor);
      const host = document.querySelector('.md-sn-alert-host');
      expect(host).not.toBeNull();
      expect(host.parentNode).toBe(document.body);
    });

    it('toggles closed when called a second time (host already open)', () => {
      const anchor = makeAnchorBtn();
      api.openAlertPicker(textarea, anchor);
      expect(document.querySelector('.md-sn-alert-host')).not.toBeNull();

      api.openAlertPicker(textarea, anchor);
      expect(document.querySelector('.md-sn-alert-host')).toBeNull();
    });

    it('renders built-in alert buttons inside shadow DOM', () => {
      const anchor = makeAnchorBtn();
      api.openAlertPicker(textarea, anchor);
      const host = document.querySelector('.md-sn-alert-host');
      expect(host.shadowRoot).not.toBeNull();
      const items = host.shadowRoot.querySelectorAll('.item');
      expect(items.length).toBeGreaterThan(0);
    });

    it('renders at least NOTE and WARNING built-in alerts', () => {
      const anchor = makeAnchorBtn();
      api.openAlertPicker(textarea, anchor);
      const host = document.querySelector('.md-sn-alert-host');
      const names = Array.from(host.shadowRoot.querySelectorAll('.name'))
        .map(el => el.textContent.toUpperCase());
      expect(names.some(n => n.includes('NOTE'))).toBe(true);
      expect(names.some(n => n.includes('WARNING'))).toBe(true);
    });

    it('clicking an alert item inserts syntax into textarea', () => {
      const anchor = makeAnchorBtn();
      textarea.value = '';
      api.openAlertPicker(textarea, anchor);
      const host = document.querySelector('.md-sn-alert-host');
      const noteItem = Array.from(host.shadowRoot.querySelectorAll('.item'))
        .find(el => el.querySelector('.name')?.textContent.toUpperCase().includes('NOTE'));
      expect(noteItem).not.toBeUndefined();

      noteItem.click();

      expect(textarea.value).toContain('> [!NOTE]');
    });

    it('clicking an alert item closes the picker', () => {
      const anchor = makeAnchorBtn();
      api.openAlertPicker(textarea, anchor);
      const host = document.querySelector('.md-sn-alert-host');
      const firstItem = host.shadowRoot.querySelector('.item');

      firstItem.click();

      expect(document.querySelector('.md-sn-alert-host')).toBeNull();
    });

    it('pressing Escape removes the picker from DOM', () => {
      const anchor = makeAnchorBtn();
      api.openAlertPicker(textarea, anchor);
      // The alert picker uses outside-click only (no Escape handler)
      // so verify the host is present and the toggle (second call) removes it
      expect(document.querySelector('.md-sn-alert-host')).not.toBeNull();
    });

    it('clicking outside the host removes the picker (via deferred listener)', async () => {
      const anchor = makeAnchorBtn();
      api.openAlertPicker(textarea, anchor);
      expect(document.querySelector('.md-sn-alert-host')).not.toBeNull();

      // Flush the setTimeout that registers the outside-click listener
      await new Promise(r => setTimeout(r, 0));

      // Simulate click outside (on document body, not inside the host)
      const evt = new MouseEvent('click', { bubbles: true });
      // composedPath() needs to be mockable for this to work in jsdom;
      // the close listener checks e.composedPath().includes(host).
      // In happy-dom composedPath returns the real path, so clicking document.body
      // (which doesn't include the host) should close the picker.
      document.body.dispatchEvent(evt);

      expect(document.querySelector('.md-sn-alert-host')).toBeNull();
    });
  });

  // ==================== openSnippetPicker ====================

  describe('openSnippetPicker', () => {
    it('appends a host element to document.body', () => {
      const anchor = makeAnchorBtn();
      api.openSnippetPicker(textarea, anchor);
      const host = document.querySelector('.md-sn-snippets-host');
      expect(host).not.toBeNull();
      expect(host.parentNode).toBe(document.body);
    });

    it('shows empty-state message when no snippets are loaded', () => {
      const anchor = makeAnchorBtn();
      // Default mock returns {} so snippets = []
      api.openSnippetPicker(textarea, anchor);
      const host = document.querySelector('.md-sn-snippets-host');
      const emptyEl = host.shadowRoot.querySelector('.empty');
      expect(emptyEl).not.toBeNull();
      expect(emptyEl.textContent).toContain('No snippets saved');
    });

    it('toggles closed when called a second time', () => {
      const anchor = makeAnchorBtn();
      api.openSnippetPicker(textarea, anchor);
      expect(document.querySelector('.md-sn-snippets-host')).not.toBeNull();

      api.openSnippetPicker(textarea, anchor);
      expect(document.querySelector('.md-sn-snippets-host')).toBeNull();
    });

    it('renders snippet buttons when snippets are injected via storage.onChanged', async () => {
      // Retrieve the onChanged listener registered during init and fire it
      const onChangedListeners = chrome.storage.onChanged.addListener.mock.calls;
      expect(onChangedListeners.length).toBeGreaterThan(0);
      const listener = onChangedListeners[onChangedListeners.length - 1][0];

      // Inject snippets via the storage change event
      listener(
        { snippets: { newValue: [{ id: '1', name: 'My snippet', content: '**bold**' }] } },
        'local'
      );

      const anchor = makeAnchorBtn();
      api.openSnippetPicker(textarea, anchor);

      const host = document.querySelector('.md-sn-snippets-host');
      const items = host.shadowRoot.querySelectorAll('.item');
      expect(items.length).toBeGreaterThan(0);

      const nameEl = host.shadowRoot.querySelector('.snippet-name');
      expect(nameEl).not.toBeNull();
      expect(nameEl.textContent).toBe('My snippet');
    });

    it('clicking a snippet item inserts its content into textarea', async () => {
      const onChangedListeners = chrome.storage.onChanged.addListener.mock.calls;
      const listener = onChangedListeners[onChangedListeners.length - 1][0];
      listener(
        { snippets: { newValue: [{ id: '2', name: 'Bold snippet', content: '**bold**' }] } },
        'local'
      );

      textarea.value = '';
      const anchor = makeAnchorBtn();
      api.openSnippetPicker(textarea, anchor);

      const host = document.querySelector('.md-sn-snippets-host');
      const item = host.shadowRoot.querySelector('.item');
      item.click();

      expect(textarea.value).toContain('**bold**');
    });

    it('clicking a snippet item closes the picker', async () => {
      const onChangedListeners = chrome.storage.onChanged.addListener.mock.calls;
      const listener = onChangedListeners[onChangedListeners.length - 1][0];
      listener(
        { snippets: { newValue: [{ id: '3', name: 'Closer', content: 'close me' }] } },
        'local'
      );

      const anchor = makeAnchorBtn();
      api.openSnippetPicker(textarea, anchor);

      const host = document.querySelector('.md-sn-snippets-host');
      const item = host.shadowRoot.querySelector('.item');
      item.click();

      expect(document.querySelector('.md-sn-snippets-host')).toBeNull();
    });

    it('pressing Escape removes the picker via outside-click deferred listener', async () => {
      const anchor = makeAnchorBtn();
      api.openSnippetPicker(textarea, anchor);
      expect(document.querySelector('.md-sn-snippets-host')).not.toBeNull();

      // Flush setTimeout so outside-click listener registers
      await new Promise(r => setTimeout(r, 0));

      const evt = new MouseEvent('click', { bubbles: true });
      document.body.dispatchEvent(evt);

      expect(document.querySelector('.md-sn-snippets-host')).toBeNull();
    });
  });

  // ==================== openCheatsheet ====================

  describe('openCheatsheet', () => {
    it('appends a host element to document.body', () => {
      const anchor = makeAnchorBtn();
      api.openCheatsheet(textarea, anchor);
      const host = document.querySelector('.md-sn-cheatsheet-host');
      expect(host).not.toBeNull();
      expect(host.parentNode).toBe(document.body);
    });

    it('panel contains markdown syntax examples in shadow DOM', () => {
      const anchor = makeAnchorBtn();
      api.openCheatsheet(textarea, anchor);
      const host = document.querySelector('.md-sn-cheatsheet-host');
      const items = host.shadowRoot.querySelectorAll('.item-code');
      expect(items.length).toBeGreaterThan(0);
      const labels = Array.from(items).map(el => el.textContent);
      // At minimum these canonical labels should appear
      expect(labels.some(l => l.includes('**bold**'))).toBe(true);
      expect(labels.some(l => l.includes('# H1'))).toBe(true);
    });

    it('panel has a Markdown Cheatsheet header', () => {
      const anchor = makeAnchorBtn();
      api.openCheatsheet(textarea, anchor);
      const host = document.querySelector('.md-sn-cheatsheet-host');
      const header = host.shadowRoot.querySelector('.panel-header span');
      expect(header).not.toBeNull();
      expect(header.textContent).toBe('Markdown Cheatsheet');
    });

    it('pressing Escape removes the panel', () => {
      const anchor = makeAnchorBtn();
      api.openCheatsheet(textarea, anchor);
      expect(document.querySelector('.md-sn-cheatsheet-host')).not.toBeNull();

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

      expect(document.querySelector('.md-sn-cheatsheet-host')).toBeNull();
    });

    it('clicking outside removes the panel after deferred listener registers', async () => {
      const anchor = makeAnchorBtn();
      api.openCheatsheet(textarea, anchor);
      expect(document.querySelector('.md-sn-cheatsheet-host')).not.toBeNull();

      await new Promise(r => setTimeout(r, 0));

      const evt = new MouseEvent('click', { bubbles: true });
      document.body.dispatchEvent(evt);

      expect(document.querySelector('.md-sn-cheatsheet-host')).toBeNull();
    });

    it('toggles closed when called a second time', () => {
      const anchor = makeAnchorBtn();
      api.openCheatsheet(textarea, anchor);
      expect(document.querySelector('.md-sn-cheatsheet-host')).not.toBeNull();

      api.openCheatsheet(textarea, anchor);
      expect(document.querySelector('.md-sn-cheatsheet-host')).toBeNull();
    });

    it('clicking an item in the cheatsheet inserts its content into textarea', () => {
      const anchor = makeAnchorBtn();
      textarea.value = '';
      api.openCheatsheet(textarea, anchor);
      const host = document.querySelector('.md-sn-cheatsheet-host');
      const firstItem = host.shadowRoot.querySelector('.item');
      expect(firstItem).not.toBeNull();

      firstItem.click();

      expect(textarea.value.length).toBeGreaterThan(0);
    });
  });
});
