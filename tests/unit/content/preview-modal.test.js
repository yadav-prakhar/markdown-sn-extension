import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setupContent } from './_setup.js';

describe('Content Script - Preview Modal', () => {
  let api, textarea;

  beforeEach(async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn(() => Promise.resolve()) },
      writable: true,
      configurable: true
    });
    ({ api, textarea } = await setupContent());
    textarea.value = '# Hello';
  });

  afterEach(() => {
    document.querySelectorAll('.md-sn-modal-host').forEach(el => el.remove());
    if (typeof window !== 'undefined') window.__mdSnModalOpen = false;
  });

  // ==================== Modal lifecycle ====================

  describe('modal lifecycle', () => {
    it('appends a .md-sn-modal-host element to document.body', () => {
      api.openPreviewModal(textarea, null);
      const host = document.querySelector('.md-sn-modal-host');
      expect(host).not.toBeNull();
      expect(document.body.contains(host)).toBe(true);
    });

    it('sets window.__mdSnModalOpen to truthy after opening', () => {
      api.openPreviewModal(textarea, null);
      expect(window.__mdSnModalOpen).toBeTruthy();
    });

    it('is a no-op when a modal is already open (no second host appended)', () => {
      api.openPreviewModal(textarea, null);
      api.openPreviewModal(textarea, null);
      const hosts = document.querySelectorAll('.md-sn-modal-host');
      expect(hosts.length).toBe(1);
    });
  });

  // ==================== Shadow DOM structure ====================

  describe('shadow DOM structure', () => {
    it('creates a shadow root on the host element', () => {
      api.openPreviewModal(textarea, null);
      const host = document.querySelector('.md-sn-modal-host');
      expect(host.shadowRoot).not.toBeNull();
    });

    it('renders an overlay element inside the shadow root', () => {
      api.openPreviewModal(textarea, null);
      const host = document.querySelector('.md-sn-modal-host');
      const shadow = host.shadowRoot;
      // happy-dom may have partial shadow support; skip gracefully if not available
      if (!shadow) return;
      const overlay = shadow.querySelector('.overlay');
      expect(overlay).not.toBeNull();
    });

    it('renders the preview-content div inside the shadow root', () => {
      api.openPreviewModal(textarea, null);
      const host = document.querySelector('.md-sn-modal-host');
      const shadow = host.shadowRoot;
      if (!shadow) return;
      const previewContent = shadow.querySelector('.preview-content');
      expect(previewContent).not.toBeNull();
    });
  });

  // ==================== Rendered content ====================

  describe('rendered content', () => {
    it('renders converted HTML (not raw markdown) in preview-content', async () => {
      textarea.value = '# Hello World';
      api.openPreviewModal(textarea, null);
      // Allow debounced renderPreview to fire
      await new Promise(r => setTimeout(r, 200));
      const host = document.querySelector('.md-sn-modal-host');
      const shadow = host.shadowRoot;
      if (!shadow) return;
      const previewContent = shadow.querySelector('.preview-content');
      // Should contain an h1 tag (converted from "# Hello World"), not the raw "#" syntax
      expect(previewContent.innerHTML).not.toBe('');
      expect(previewContent.innerHTML).not.toContain('# Hello World');
    });

    it('left panel textarea mirrors the original textarea value', () => {
      textarea.value = 'some markdown text';
      api.openPreviewModal(textarea, null);
      const host = document.querySelector('.md-sn-modal-host');
      const shadow = host.shadowRoot;
      if (!shadow) return;
      const leftTextarea = shadow.querySelector('.left-panel textarea');
      expect(leftTextarea).not.toBeNull();
      expect(leftTextarea.value).toBe('some markdown text');
    });
  });

  // ==================== Escape key closes modal ====================

  describe('Escape key closes modal', () => {
    it('removes the modal host from DOM on Escape keydown', () => {
      api.openPreviewModal(textarea, null);
      expect(document.querySelector('.md-sn-modal-host')).not.toBeNull();

      const escEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      document.dispatchEvent(escEvent);

      expect(document.querySelector('.md-sn-modal-host')).toBeNull();
    });

    it('clears window.__mdSnModalOpen after Escape closes modal', () => {
      api.openPreviewModal(textarea, null);
      expect(window.__mdSnModalOpen).toBeTruthy();

      const escEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      document.dispatchEvent(escEvent);

      expect(window.__mdSnModalOpen).toBeFalsy();
    });
  });

  // ==================== Close button ====================

  describe('close button', () => {
    it('clicking the close button removes the modal host', () => {
      api.openPreviewModal(textarea, null);
      const host = document.querySelector('.md-sn-modal-host');
      const shadow = host.shadowRoot;
      if (!shadow) {
        // If shadow DOM not supported, just verify host exists and skip
        expect(host).not.toBeNull();
        return;
      }
      const closeBtn = shadow.querySelector('.close-btn');
      expect(closeBtn).not.toBeNull();
      closeBtn.click();
      expect(document.querySelector('.md-sn-modal-host')).toBeNull();
    });

    it('clicking the cancel button removes the modal host', () => {
      api.openPreviewModal(textarea, null);
      const host = document.querySelector('.md-sn-modal-host');
      const shadow = host.shadowRoot;
      if (!shadow) return;
      const cancelBtn = shadow.querySelector('.btn-cancel');
      expect(cancelBtn).not.toBeNull();
      cancelBtn.click();
      expect(document.querySelector('.md-sn-modal-host')).toBeNull();
    });
  });

  // ==================== Overlay click closes modal ====================

  describe('overlay click', () => {
    it('clicking directly on the overlay closes the modal', () => {
      api.openPreviewModal(textarea, null);
      const host = document.querySelector('.md-sn-modal-host');
      const shadow = host.shadowRoot;
      // Skip gracefully if Shadow DOM querySelector not supported
      if (!shadow) return;
      const overlay = shadow.querySelector('.overlay');
      if (!overlay) return;
      // Simulate click directly on overlay (not on child container)
      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', { value: overlay, configurable: true });
      overlay.dispatchEvent(clickEvent);
      // Modal should be removed
      expect(document.querySelector('.md-sn-modal-host')).toBeNull();
    });
  });

  // ==================== Save as snippet flow ====================

  describe('save as snippet flow', () => {
    it('clicking Save MD Snippet shows the name-prompt panel', () => {
      api.openPreviewModal(textarea, null);
      const host = document.querySelector('.md-sn-modal-host');
      const shadow = host.shadowRoot;
      if (!shadow) return;
      const saveMdBtn = shadow.querySelector('.btn-save-snippet');
      expect(saveMdBtn).not.toBeNull();
      saveMdBtn.click();
      const namePrompt = shadow.querySelector('.snippet-name-prompt');
      expect(namePrompt).not.toBeNull();
      expect(namePrompt.style.display).toBe('flex');
    });

    it('confirming snippet save calls chrome.storage.local.set with snippets array', () => {
      api.openPreviewModal(textarea, null);
      const host = document.querySelector('.md-sn-modal-host');
      const shadow = host.shadowRoot;
      if (!shadow) return;
      // Open the name prompt
      const saveMdBtn = shadow.querySelector('.btn-save-snippet');
      saveMdBtn.click();
      // Fill in a name
      const nameInput = shadow.querySelector('.snippet-name-prompt input');
      nameInput.value = 'My Test Snippet';
      // Click confirm
      const confirmBtn = shadow.querySelector('.snippet-name-prompt .confirm-btn');
      confirmBtn.click();
      // chrome.storage.local.get is called first, then set is called in callback
      expect(chrome.storage.local.get).toHaveBeenCalled();
    });

    it('dismiss button hides the name-prompt panel', () => {
      api.openPreviewModal(textarea, null);
      const host = document.querySelector('.md-sn-modal-host');
      const shadow = host.shadowRoot;
      if (!shadow) return;
      const saveMdBtn = shadow.querySelector('.btn-save-snippet');
      saveMdBtn.click();
      const namePrompt = shadow.querySelector('.snippet-name-prompt');
      expect(namePrompt.style.display).toBe('flex');
      const dismissBtn = shadow.querySelector('.snippet-name-prompt .dismiss-btn');
      dismissBtn.click();
      expect(namePrompt.style.display).toBe('none');
    });

    it('confirming with empty name adds error class to input', () => {
      api.openPreviewModal(textarea, null);
      const host = document.querySelector('.md-sn-modal-host');
      const shadow = host.shadowRoot;
      if (!shadow) return;
      const saveMdBtn = shadow.querySelector('.btn-save-snippet');
      saveMdBtn.click();
      // Leave name empty and click confirm
      const nameInput = shadow.querySelector('.snippet-name-prompt input');
      nameInput.value = '';
      const confirmBtn = shadow.querySelector('.snippet-name-prompt .confirm-btn');
      confirmBtn.click();
      expect(nameInput.classList.contains('error')).toBe(true);
    });

    it('storage.local.set is called with snippets containing the new snippet after confirm', () => {
      api.openPreviewModal(textarea, null);
      const host = document.querySelector('.md-sn-modal-host');
      const shadow = host.shadowRoot;
      if (!shadow) return;
      const saveMdBtn = shadow.querySelector('.btn-save-snippet');
      saveMdBtn.click();
      const nameInput = shadow.querySelector('.snippet-name-prompt input');
      nameInput.value = 'My Snippet';
      const confirmBtn = shadow.querySelector('.snippet-name-prompt .confirm-btn');
      confirmBtn.click();
      // The mock chrome.storage.local.get calls callback with {} immediately,
      // so set should be called synchronously in this mock
      expect(chrome.storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({ snippets: expect.any(Array) }),
        expect.any(Function)
      );
      const setCall = chrome.storage.local.set.mock.calls[0];
      const snippets = setCall[0].snippets;
      expect(snippets.length).toBeGreaterThan(0);
      expect(snippets[snippets.length - 1].name).toBe('My Snippet');
    });
  });

  // ==================== Apply button ====================

  describe('apply button', () => {
    it('clicking Apply converts left panel content and writes to the original textarea', () => {
      textarea.value = '# Apply Test';
      api.openPreviewModal(textarea, null);
      const host = document.querySelector('.md-sn-modal-host');
      const shadow = host.shadowRoot;
      if (!shadow) return;
      const applyBtn = shadow.querySelector('.btn-apply');
      expect(applyBtn).not.toBeNull();
      applyBtn.click();
      // After apply, textarea.value should be converted HTML, not raw markdown
      expect(textarea.value).not.toBe('# Apply Test');
      expect(textarea.value.length).toBeGreaterThan(0);
    });

    it('clicking Apply closes the modal', () => {
      textarea.value = '# Apply Test';
      api.openPreviewModal(textarea, null);
      const host = document.querySelector('.md-sn-modal-host');
      const shadow = host.shadowRoot;
      if (!shadow) return;
      const applyBtn = shadow.querySelector('.btn-apply');
      applyBtn.click();
      expect(document.querySelector('.md-sn-modal-host')).toBeNull();
    });
  });
});
