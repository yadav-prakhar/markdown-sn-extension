// Content script for ServiceNow integration
(function() {
  'use strict';

  // Skip if already initialized in this frame
  if (window.__mdSnInitialized) return;
  window.__mdSnInitialized = true;

  console.log('MD-SN: Content script loaded in frame:', window.location.href);

  const BUTTON_CLASS = 'md-sn-convert-btn';
  const TOOLBAR_CLASS = 'md-sn-toolbar';

  // Custom alert types state
  let customAlerts = {};
  let builtInAlerts = {};

  // Undo state: stores original markdown before in-place conversion
  const originalMarkdowns = new WeakMap();

  // Load custom alerts from storage
  function loadCustomAlerts() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['customAlertTypes'], (result) => {
        customAlerts = result.customAlertTypes || {};
        console.log('MD-SN: Loaded custom alerts:', Object.keys(customAlerts).length);
        resolve();
      });
    });
  }

  // Listen for storage changes
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.customAlertTypes) {
      customAlerts = changes.customAlertTypes.newValue || {};
      console.log('MD-SN: Custom alerts updated:', Object.keys(customAlerts).length);
    }
  });

  // ServiceNow journal field selectors - only journal/activity fields, NOT description
  const JOURNAL_SELECTORS = [
    // Classic UI - specific journal fields (exact match at end)
    'textarea[id$=".work_notes"]',
    'textarea[id$=".comments"]',
    // Activity stream textareas
    'textarea[id^="activity-stream"]',
    '#activity-stream-textarea',
    '#activity-stream-work_notes-textarea',
    '#activity-stream-comments-textarea',
    // Workspace UI
    '[data-type="journal_input"] textarea'
  ];

  // Fields to explicitly EXCLUDE (not journal fields)
  const EXCLUDED_PATTERNS = [
    'description',
    'short_description',
    'resolution_notes',
    'justification'
  ];

  // Check if element is a journal field
  function isJournalField(element) {
    if (!element || element.tagName !== 'TEXTAREA') return false;
    if (element.dataset.mdSnEnhanced) return false;

    const id = (element.id || '').toLowerCase();
    const name = (element.name || '').toLowerCase();

    // Check exclusions first
    const isExcluded = EXCLUDED_PATTERNS.some(pattern =>
      id.includes(pattern) || name.includes(pattern)
    );
    if (isExcluded) {
      console.log('MD-SN: Excluding field:', id || name);
      return false;
    }

    // Check if matches any selector
    const matches = JOURNAL_SELECTORS.some(selector => {
      try {
        return element.matches(selector);
      } catch {
        return false;
      }
    });

    return matches;
  }

  // Strip on* event handlers and javascript: URIs from HTML (sanitization for preview)
  function sanitizeHtml(html) {
    let sanitized = html.replace(/\s+on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi, '');
    sanitized = sanitized.replace(/(href|src)\s*=\s*["']?\s*javascript:/gi, '$1="');
    return sanitized;
  }

  // Debounce helper
  function debounce(fn, delay) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
  }

  // ==================== Button factories ====================

  // Create convert button (existing behavior)
  function createConvertButton() {
    const btn = document.createElement('button');
    btn.className = BUTTON_CLASS;
    btn.innerHTML = `<img src="${chrome.runtime.getURL('icons/Icon.svg')}" alt="Convert Markdown">`;
    btn.title = 'Convert Markdown to ServiceNow format';
    btn.type = 'button';
    return btn;
  }

  function createPreviewButton() {
    const btn = document.createElement('button');
    btn.className = 'md-sn-preview-btn';
    btn.textContent = '👁';
    btn.title = 'Preview rendered output';
    btn.type = 'button';
    return btn;
  }

  function createAlertPickerButton() {
    const btn = document.createElement('button');
    btn.className = 'md-sn-alert-picker-btn';
    btn.textContent = '🔖';
    btn.title = 'Insert alert type';
    btn.type = 'button';
    return btn;
  }

  function createRestoreButton() {
    const btn = document.createElement('button');
    btn.className = 'md-sn-restore-btn';
    btn.textContent = '↩️';
    btn.title = 'Restore original markdown';
    btn.type = 'button';
    return btn;
  }

  function showRestoreButton(toolbar) {
    const btn = toolbar.querySelector('.md-sn-restore-btn');
    if (btn) btn.style.display = 'inline-flex';
  }

  function hideRestoreButton(toolbar) {
    const btn = toolbar.querySelector('.md-sn-restore-btn');
    if (btn) btn.style.display = 'none';
  }

  // ==================== Toolbar ====================

  function createToolbar(textarea) {
    const toolbar = document.createElement('div');
    toolbar.className = TOOLBAR_CLASS;

    // Button 1: Convert (existing)
    const convertBtn = createConvertButton();
    convertBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      convertTextarea(textarea, toolbar);
    });

    // Button 2: Preview (new)
    const previewBtn = createPreviewButton();
    previewBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openPreviewModal(textarea, toolbar);
    });

    // Button 3: Alert Picker (new)
    const alertBtn = createAlertPickerButton();
    alertBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openAlertPicker(textarea, alertBtn);
    });

    // Button 4: Restore (hidden initially)
    const restoreBtn = createRestoreButton();
    restoreBtn.style.display = 'none';
    restoreBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      restoreMarkdown(textarea, toolbar);
    });

    toolbar.appendChild(convertBtn);
    toolbar.appendChild(previewBtn);
    toolbar.appendChild(alertBtn);
    toolbar.appendChild(restoreBtn);

    return toolbar;
  }

  // ==================== Convert & Restore ====================

  // Convert markdown in textarea (toolbar ref needed to show restore button)
  function convertTextarea(textarea, toolbar) {
    const text = textarea.value.trim();
    if (!text) {
      showNotification('No text to convert', 'error');
      return;
    }

    try {
      // Use the library directly (injected via manifest)
      if (typeof markdownServicenow === 'undefined') {
        console.error('MD-SN: Library not loaded');
        showNotification('Library not loaded', 'error');
        return;
      }

      // Save original markdown for undo before overwriting
      originalMarkdowns.set(textarea, textarea.value);

      const result = markdownServicenow.convertMarkdownToServiceNow(text, { customAlerts });
      textarea.value = result;

      // Trigger events to notify ServiceNow of change
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
      textarea.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));

      // For ServiceNow's onChange handlers
      if (typeof textarea.onchange === 'function') {
        textarea.onchange();
      }

      // Show restore button if toolbar ref available
      if (toolbar) showRestoreButton(toolbar);

      showNotification('Converted successfully!', 'success');
      console.log('MD-SN: Conversion complete');
    } catch (error) {
      console.error('MD-SN: Conversion error', error);
      showNotification('Conversion error: ' + error.message, 'error');
    }
  }

  function restoreMarkdown(textarea, toolbar) {
    const original = originalMarkdowns.get(textarea);
    if (!original) return;
    textarea.value = original;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.dispatchEvent(new Event('change', { bubbles: true }));
    textarea.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
    if (typeof textarea.onchange === 'function') textarea.onchange();
    originalMarkdowns.delete(textarea);
    hideRestoreButton(toolbar);
    showNotification('Markdown restored', 'success');
  }

  // ==================== Notifications ====================

  // Show inline notification
  function showNotification(message, type = 'success') {
    const existing = document.querySelector('.md-sn-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `md-sn-notification md-sn-notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('md-sn-notification-hide');
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }

  // ==================== Preview Modal ====================

  function openPreviewModal(textarea, toolbar) {
    // Only one modal at a time per frame
    if (window.__mdSnModalOpen) return;
    window.__mdSnModalOpen = true;

    // Shadow host appended to body of the current frame
    const host = document.createElement('div');
    host.className = 'md-sn-modal-host';
    document.body.appendChild(host);
    const shadow = host.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = `
      .overlay {
        position: fixed; inset: 0;
        background: rgba(0,0,0,0.5);
        z-index: 9999998;
        display: flex; align-items: center; justify-content: center;
      }
      .container {
        background: #fff;
        border-radius: 8px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.2);
        width: 90vw; max-width: 1100px;
        height: 80vh; max-height: 700px;
        display: flex; flex-direction: column;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        overflow: hidden;
      }
      .header {
        display: flex; align-items: center; justify-content: space-between;
        padding: 12px 16px;
        border-bottom: 1px solid #e0e0e0;
        background: #f8f8f8;
        flex-shrink: 0;
      }
      .header h3 { margin: 0; font-size: 14px; color: #333; font-weight: 600; }
      .close-btn {
        background: none; border: none; cursor: pointer;
        font-size: 18px; color: #666; padding: 2px 6px; border-radius: 4px;
        line-height: 1;
      }
      .close-btn:hover { background: #eee; color: #333; }
      .body {
        display: flex; flex: 1; overflow: hidden; min-height: 0;
      }
      .left-panel {
        flex: 1; display: flex; flex-direction: column;
        border-right: 1px solid #e0e0e0; overflow: hidden;
      }
      .panel-label {
        padding: 6px 12px; font-size: 11px; font-weight: 600;
        color: #888; text-transform: uppercase; letter-spacing: 0.5px;
        border-bottom: 1px solid #f0f0f0; background: #fafafa;
        flex-shrink: 0;
      }
      .left-panel textarea {
        flex: 1; resize: none; border: none; outline: none;
        padding: 12px; font-size: 13px;
        font-family: 'SF Mono', Consolas, 'Courier New', monospace;
        line-height: 1.5; color: #333; background: #fff;
        overflow-y: auto;
      }
      .right-panel {
        flex: 1; display: flex; flex-direction: column; overflow: hidden;
      }
      .preview-content {
        flex: 1; overflow-y: auto; padding: 12px 16px;
        font-size: 13px; line-height: 1.6; color: #333;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .preview-content h1 {
        font-size: 1.4em; margin: 8px 0 4px;
        border-bottom: 1px solid #eee; padding-bottom: 4px;
      }
      .preview-content h2 { font-size: 1.2em; margin: 8px 0 4px; }
      .preview-content h3, .preview-content h4 { font-size: 1.05em; margin: 6px 0 3px; }
      .preview-content p { margin: 4px 0; }
      .preview-content ul, .preview-content ol { margin: 4px 0; padding-left: 20px; }
      .preview-content li { margin: 2px 0; }
      .preview-content strong { font-weight: 600; }
      .preview-content em { font-style: italic; }
      .preview-content code {
        background: #f4f4f4; padding: 1px 4px; border-radius: 3px;
        font-size: 12px; font-family: monospace;
      }
      .preview-content pre { background: #f4f4f4; padding: 8px; border-radius: 4px; overflow-x: auto; }
      .preview-content table { border-collapse: collapse; width: 100%; margin: 4px 0; }
      .preview-content th, .preview-content td {
        border: 1px solid #ddd; padding: 6px 8px; font-size: 12px;
      }
      .preview-content th { background: #f5f5f5; font-weight: 600; }
      .preview-content hr { border: none; border-top: 1px solid #eee; margin: 8px 0; }
      .preview-content a { color: #0066cc; }
      .footer {
        display: flex; justify-content: flex-end; gap: 8px;
        padding: 10px 16px; border-top: 1px solid #e0e0e0; background: #f8f8f8;
        flex-shrink: 0;
      }
      .btn {
        padding: 7px 16px; border-radius: 5px; border: none;
        cursor: pointer; font-size: 13px; font-weight: 500;
      }
      .btn-cancel { background: #f0f0f0; color: #555; }
      .btn-cancel:hover { background: #e0e0e0; }
      .btn-apply { background: #0066cc; color: white; }
      .btn-apply:hover { background: #0052a3; }
    `;

    const overlay = document.createElement('div');
    overlay.className = 'overlay';

    const container = document.createElement('div');
    container.className = 'container';

    // Header
    const header = document.createElement('div');
    header.className = 'header';
    const headerTitle = document.createElement('h3');
    headerTitle.textContent = '📝 Preview';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-btn';
    closeBtn.textContent = '✕';
    closeBtn.title = 'Close (Esc)';
    header.appendChild(headerTitle);
    header.appendChild(closeBtn);

    // Body
    const body = document.createElement('div');
    body.className = 'body';

    const leftPanel = document.createElement('div');
    leftPanel.className = 'left-panel';
    const leftLabel = document.createElement('div');
    leftLabel.className = 'panel-label';
    leftLabel.textContent = 'Markdown';
    const leftTextarea = document.createElement('textarea');
    leftTextarea.value = textarea.value;
    leftTextarea.placeholder = 'Type markdown here...';
    leftPanel.appendChild(leftLabel);
    leftPanel.appendChild(leftTextarea);

    const rightPanel = document.createElement('div');
    rightPanel.className = 'right-panel';
    const rightLabel = document.createElement('div');
    rightLabel.className = 'panel-label';
    rightLabel.textContent = 'Preview';
    const previewContent = document.createElement('div');
    previewContent.className = 'preview-content';
    rightPanel.appendChild(rightLabel);
    rightPanel.appendChild(previewContent);

    body.appendChild(leftPanel);
    body.appendChild(rightPanel);

    // Footer
    const footer = document.createElement('div');
    footer.className = 'footer';
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-cancel';
    cancelBtn.textContent = 'Cancel';
    const applyBtn = document.createElement('button');
    applyBtn.className = 'btn btn-apply';
    applyBtn.textContent = 'Apply';
    footer.appendChild(cancelBtn);
    footer.appendChild(applyBtn);

    container.appendChild(header);
    container.appendChild(body);
    container.appendChild(footer);
    overlay.appendChild(container);
    shadow.appendChild(style);
    shadow.appendChild(overlay);

    // Live preview renderer (debounced)
    const renderPreview = debounce(() => {
      if (typeof markdownServicenow === 'undefined') return;
      try {
        const converted = markdownServicenow.convertMarkdownToServiceNow(
          leftTextarea.value, { customAlerts, skipCodeTags: true }
        );
        previewContent.innerHTML = sanitizeHtml(converted);
      } catch {
        previewContent.innerHTML = '<em style="color:#999">Preview unavailable</em>';
      }
    }, 150);

    leftTextarea.addEventListener('input', renderPreview);
    renderPreview(); // render immediately on open

    // Close helpers — onEsc must be defined before closeModal references it
    const onEsc = (e) => {
      if (e.key === 'Escape') closeModal();
    };

    function closeModal() {
      host.remove();
      delete window.__mdSnModalOpen;
      document.removeEventListener('keydown', onEsc);
    }

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
    document.addEventListener('keydown', onEsc);

    // Apply: convert left panel content and write to field
    applyBtn.addEventListener('click', () => {
      if (typeof markdownServicenow === 'undefined') return;
      try {
        // Save original for undo before overwriting
        originalMarkdowns.set(textarea, leftTextarea.value);

        const result = markdownServicenow.convertMarkdownToServiceNow(
          leftTextarea.value, { customAlerts }
        );
        textarea.value = result;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.dispatchEvent(new Event('change', { bubbles: true }));
        textarea.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
        if (typeof textarea.onchange === 'function') textarea.onchange();

        // Show restore button on the associated toolbar (passed via closure)
        if (toolbar) showRestoreButton(toolbar);

        closeModal();
        showNotification('Applied!', 'success');
      } catch (err) {
        showNotification('Error: ' + err.message, 'error');
      }
    });

    // Focus left textarea
    setTimeout(() => leftTextarea.focus(), 50);
  }

  // ==================== Alert Picker ====================

  function openAlertPicker(textarea, anchorBtn) {
    // Toggle: close dropdown if already open
    const existing = document.querySelector('.md-sn-alert-host');
    if (existing) {
      existing.remove();
      return;
    }

    // Save cursor position before textarea loses focus from click
    const savedCursor = {
      start: textarea.selectionStart != null ? textarea.selectionStart : textarea.value.length,
      end: textarea.selectionEnd != null ? textarea.selectionEnd : textarea.value.length
    };

    // Shadow host for CSS isolation
    const host = document.createElement('div');
    host.className = 'md-sn-alert-host';
    document.body.appendChild(host);
    const shadow = host.attachShadow({ mode: 'open' });

    // Position: fixed, below anchor button; flip upward if near viewport bottom
    const rect = anchorBtn.getBoundingClientRect();
    const DROPDOWN_HEIGHT = 280;
    const top = (rect.bottom + DROPDOWN_HEIGHT > window.innerHeight)
      ? Math.max(4, rect.top - DROPDOWN_HEIGHT)
      : rect.bottom + 4;
    const left = Math.min(rect.left, window.innerWidth - 200);

    // Build merged alert list (built-in + custom overrides)
    const allAlerts = { ...builtInAlerts };
    for (const [name, alert] of Object.entries(customAlerts)) {
      allAlerts[name] = allAlerts[name]
        ? { ...allAlerts[name], ...alert }
        : { ...alert, name };
    }

    const style = document.createElement('style');
    style.textContent = `
      .dropdown {
        position: fixed;
        top: ${top}px;
        left: ${left}px;
        background: #fff;
        border: 1px solid #ddd;
        border-radius: 6px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        z-index: 9999999;
        min-width: 180px;
        max-height: 280px;
        overflow-y: auto;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .item {
        display: flex; align-items: center; gap: 8px;
        padding: 8px 12px; cursor: pointer;
        font-size: 13px; color: #333;
        border-bottom: 1px solid #f0f0f0;
      }
      .item:last-child { border-bottom: none; }
      .item:hover { background: #f5f5f5; }
      .emoji { font-size: 16px; min-width: 20px; }
      .name { font-weight: 500; }
    `;

    const dropdown = document.createElement('div');
    dropdown.className = 'dropdown';

    for (const [name, alert] of Object.entries(allAlerts)) {
      const item = document.createElement('div');
      item.className = 'item';
      const emojiEl = document.createElement('span');
      emojiEl.className = 'emoji';
      emojiEl.textContent = alert.emoji || '';
      const nameEl = document.createElement('span');
      nameEl.className = 'name';
      nameEl.textContent = alert.displayName || name.toUpperCase();
      item.appendChild(emojiEl);
      item.appendChild(nameEl);

      item.addEventListener('click', (e) => {
        e.stopPropagation();
        insertAlertIntoTextarea(textarea, name, savedCursor);
        host.remove();
        document.removeEventListener('click', closeListener, { capture: true });
      });

      dropdown.appendChild(item);
    }

    shadow.appendChild(style);
    shadow.appendChild(dropdown);

    // Close on click outside (capture phase to catch SN event handling)
    // composedPath() correctly resolves clicks inside the Shadow DOM
    let closeListener;
    closeListener = (e) => {
      if (!e.composedPath().includes(host)) {
        host.remove();
        document.removeEventListener('click', closeListener, { capture: true });
      }
    };
    // Defer to avoid the triggering click immediately closing the dropdown
    setTimeout(() => document.addEventListener('click', closeListener, { capture: true }), 0);
  }

  function insertAlertIntoTextarea(textarea, alertName, savedCursor) {
    const syntax = `> [!${alertName.toUpperCase()}]\n> `;
    const start = savedCursor.start;
    const end = savedCursor.end;
    const textBefore = textarea.value.substring(0, start);
    const textAfter = textarea.value.substring(end);
    const needsNewline = textBefore.length > 0 && !textBefore.endsWith('\n');
    const insertion = (needsNewline ? '\n' : '') + syntax;
    textarea.value = textBefore + insertion + textAfter;
    textarea.focus();
    textarea.selectionStart = textarea.selectionEnd = start + insertion.length;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }

  // ==================== Field injection ====================

  // Add toolbar to journal field
  function addToolbarToField(textarea) {
    if (textarea.dataset.mdSnEnhanced) return;
    textarea.dataset.mdSnEnhanced = 'true';

    console.log('MD-SN: Enhancing textarea:', textarea.id || textarea.name || 'unnamed');

    const toolbar = createToolbar(textarea);

    // Position toolbar after the textarea
    const textareaParent = textarea.parentNode;
    if (!textareaParent || !textareaParent.parentNode) return;

    // Insert toolbar before the parent's next sibling (to appear after textarea)
    textareaParent.parentNode.insertBefore(toolbar, textareaParent.nextSibling);

    // Toolbar styling is handled by the md-sn-toolbar CSS class
  }

  // Find and enhance all journal fields
  function enhanceJournalFields() {
    console.log('MD-SN: Scanning for journal fields...');

    // First try specific selectors
    const selector = JOURNAL_SELECTORS.join(', ');
    let textareas = [];

    try {
      textareas = document.querySelectorAll(selector);
      console.log('MD-SN: Found', textareas.length, 'textareas matching selectors');
    } catch (e) {
      console.log('MD-SN: Selector error, falling back to all textareas');
    }

    // Also scan ALL textareas as fallback
    const allTextareas = document.querySelectorAll('textarea');
    console.log('MD-SN: Total textareas on page:', allTextareas.length);

    // Log all textarea IDs for debugging
    allTextareas.forEach(ta => {
      console.log('MD-SN: Found textarea:', ta.id || ta.name || '(no id/name)',
                  'class:', ta.className || '(no class)');
    });

    // Enhance matched textareas
    textareas.forEach(textarea => {
      if (!textarea.dataset.mdSnEnhanced) {
        addToolbarToField(textarea);
      }
    });

    // Also try to enhance any textarea that looks like a journal field
    allTextareas.forEach(textarea => {
      if (!textarea.dataset.mdSnEnhanced && isJournalField(textarea)) {
        addToolbarToField(textarea);
      }
    });
  }

  // Watch for dynamically added fields
  function observeDOM() {
    const observer = new MutationObserver((mutations) => {
      let shouldEnhance = false;

      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          shouldEnhance = true;
          break;
        }
      }

      if (shouldEnhance) {
        // Debounce enhancement
        clearTimeout(observer.timeout);
        observer.timeout = setTimeout(enhanceJournalFields, 500);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Handle messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'convertSelection') {
      const activeElement = document.activeElement;
      let selectedText = '';
      let isTextarea = false;

      // Check textarea/input selection first (window.getSelection doesn't work for these)
      if (activeElement && (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT')) {
        const start = activeElement.selectionStart;
        const end = activeElement.selectionEnd;
        if (start !== end) {
          selectedText = activeElement.value.substring(start, end);
          isTextarea = true;
        }
      }

      // Fall back to DOM selection
      if (!selectedText) {
        const selection = window.getSelection();
        selectedText = selection?.toString() || '';
      }

      selectedText = selectedText.trim();

      // If no selection in this frame, don't respond - let another frame handle it
      if (!selectedText) {
        return false;
      }

      try {
        // Convert the markdown
        if (typeof markdownServicenow === 'undefined') {
          console.error('MD-SN: Library not loaded');
          showNotification('Library not loaded', 'error');
          sendResponse({ success: false, error: 'Library not loaded' });
          return true;
        }

        const converted = markdownServicenow.convertMarkdownToServiceNow(selectedText, { customAlerts });

        if (isTextarea) {
          // Replace selection in textarea/input
          const start = activeElement.selectionStart;
          const end = activeElement.selectionEnd;
          const text = activeElement.value;

          activeElement.value = text.substring(0, start) + converted + text.substring(end);
          activeElement.dispatchEvent(new Event('input', { bubbles: true }));
          activeElement.dispatchEvent(new Event('change', { bubbles: true }));

          showNotification('Converted successfully!', 'success');
          sendResponse({ success: true });
        } else {
          // Not in an editable field, copy to clipboard
          navigator.clipboard.writeText(converted).then(() => {
            showNotification('Converted and copied to clipboard!', 'success');
            sendResponse({ success: true });
          }).catch((error) => {
            console.error('MD-SN: Clipboard error', error);
            showNotification('Conversion succeeded, clipboard failed', 'error');
            sendResponse({ success: false, error: 'Clipboard error' });
          });
        }
      } catch (error) {
        console.error('MD-SN: Conversion error', error);
        showNotification('Conversion error: ' + error.message, 'error');
        sendResponse({ success: false, error: error.message });
      }

      return true;
    }
  });

  // Initialize
  async function init() {
    // Load custom alerts first
    await loadCustomAlerts();

    // Load built-in alerts from library for alert picker
    if (typeof markdownServicenow !== 'undefined' && markdownServicenow.getBuiltInAlerts) {
      builtInAlerts = markdownServicenow.getBuiltInAlerts();
      console.log('MD-SN: Loaded built-in alerts:', Object.keys(builtInAlerts).length);
    }

    // Wait for page to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        enhanceJournalFields();
        observeDOM();
      });
    } else {
      enhanceJournalFields();
      observeDOM();
    }
  }

  init();
})();
