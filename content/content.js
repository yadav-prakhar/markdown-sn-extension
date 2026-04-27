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

  // Snippets state
  let snippets = [];

  // Cheatsheet data
  const CHEATSHEET = [
    { category: 'Text Formatting', items: [
      { label: '**bold**', insert: '**bold**' },
      { label: '*italic*', insert: '*italic*' },
      { label: '~~strikethrough~~', insert: '~~strikethrough~~' },
      { label: '==highlight==', insert: '==highlight==' },
      { label: '***bold italic***', insert: '***bold italic***' },
    ]},
    { category: 'Headers', items: [
      { label: '# H1', insert: '# Heading 1' },
      { label: '## H2', insert: '## Heading 2' },
      { label: '### H3', insert: '### Heading 3' },
    ]},
    { category: 'Lists', items: [
      { label: '- Unordered list', insert: '- Item 1\n- Item 2\n- Item 3' },
      { label: '1. Ordered list', insert: '1. Item 1\n2. Item 2\n3. Item 3' },
    ]},
    { category: 'Code', items: [
      { label: '`inline code`', insert: '`code`' },
      { label: '``` code block ```', insert: '```\ncode here\n```' },
    ]},
    { category: 'Links & Images', items: [
      { label: '[link text](url)', insert: '[link text](https://example.com)' },
      { label: '![alt text](url)', insert: '![alt text](https://example.com/image.png)' },
    ]},
    { category: 'Blockquotes & Rules', items: [
      { label: '> blockquote', insert: '> blockquote text' },
      { label: '--- horizontal rule', insert: '---' },
    ]},
    { category: 'Tables', items: [
      { label: '| table |', insert: '| Column 1 | Column 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |' },
    ]},
    { category: 'Alerts', items: [
      { label: '> [!NOTE]', insert: '> [!NOTE]\n> ' },
      { label: '> [!WARNING]', insert: '> [!WARNING]\n> ' },
      { label: '> [!IMPORTANT]', insert: '> [!IMPORTANT]\n> ' },
      { label: '> [!SUCCESS]', insert: '> [!SUCCESS]\n> ' },
      { label: '> [!CAUTION]', insert: '> [!CAUTION]\n> ' },
    ]},
  ];

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

  // Load snippets from storage
  function loadSnippets() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['snippets'], (result) => {
        snippets = result.snippets || [];
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
    if (areaName === 'local' && changes.snippets) {
      snippets = changes.snippets.newValue || [];
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

  function createSnippetsButton() {
    const btn = document.createElement('button');
    btn.className = 'md-sn-snippets-btn';
    btn.textContent = '📋';
    btn.title = 'Insert snippet';
    btn.type = 'button';
    return btn;
  }

  function createCheatsheetButton() {
    const btn = document.createElement('button');
    btn.className = 'md-sn-cheatsheet-btn';
    btn.textContent = '?';
    btn.title = 'Markdown cheatsheet';
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

    // Button 4: Snippets
    const snippetsBtn = createSnippetsButton();
    snippetsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openSnippetPicker(textarea, snippetsBtn);
    });

    // Button 5: Restore (hidden initially)
    const restoreBtn = createRestoreButton();
    restoreBtn.style.display = 'none';
    restoreBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      restoreMarkdown(textarea, toolbar);
    });

    // Button 6: Cheatsheet
    const cheatsheetBtn = createCheatsheetButton();
    cheatsheetBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openCheatsheet(textarea, cheatsheetBtn);
    });

    toolbar.appendChild(convertBtn);
    toolbar.appendChild(previewBtn);
    toolbar.appendChild(alertBtn);
    toolbar.appendChild(snippetsBtn);
    toolbar.appendChild(restoreBtn);
    toolbar.appendChild(cheatsheetBtn);

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
        display: flex; justify-content: space-between; align-items: center; gap: 8px;
        padding: 10px 16px; border-top: 1px solid #e0e0e0; background: #f8f8f8;
        flex-shrink: 0;
      }
      .footer-left { display: flex; align-items: center; gap: 8px; }
      .footer-right { display: flex; align-items: center; gap: 8px; }
      .btn {
        padding: 7px 16px; border-radius: 5px; border: none;
        cursor: pointer; font-size: 13px; font-weight: 500;
      }
      .btn-cancel { background: #f0f0f0; color: #555; }
      .btn-cancel:hover { background: #e0e0e0; }
      .btn-apply { background: #0066cc; color: white; }
      .btn-apply:hover { background: #0052a3; }
      .btn-save-snippet {
        padding: 7px 14px; border-radius: 5px;
        border: 1.5px solid #0066cc; background: transparent;
        color: #0066cc; cursor: pointer; font-size: 13px; font-weight: 500;
      }
      .btn-save-snippet:hover { background: #e8f0fe; }
      .snippet-name-prompt {
        display: none; align-items: center; gap: 6px;
      }
      .snippet-name-prompt input {
        padding: 6px 10px; border: 1.5px solid #ddd; border-radius: 5px;
        font-size: 13px; outline: none; width: 180px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .snippet-name-prompt input:focus { border-color: #0066cc; }
      .snippet-name-prompt input.error { border-color: #e53935; }
      .snippet-name-prompt .confirm-btn {
        padding: 6px 10px; border: none; border-radius: 5px;
        background: #0066cc; color: #fff; cursor: pointer; font-size: 13px;
      }
      .snippet-name-prompt .confirm-btn:hover { background: #0052a3; }
      .snippet-name-prompt .dismiss-btn {
        padding: 6px 8px; border: none; border-radius: 5px;
        background: #f0f0f0; color: #555; cursor: pointer; font-size: 13px;
      }
      .snippet-name-prompt .dismiss-btn:hover { background: #e0e0e0; }
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

    const footerLeft = document.createElement('div');
    footerLeft.className = 'footer-left';

    const saveMdBtn = document.createElement('button');
    saveMdBtn.className = 'btn-save-snippet';
    saveMdBtn.textContent = 'Save MD Snippet';

    const saveConvertedBtn = document.createElement('button');
    saveConvertedBtn.className = 'btn-save-snippet';
    saveConvertedBtn.textContent = 'Save Converted Snippet';

    const namePrompt = document.createElement('div');
    namePrompt.className = 'snippet-name-prompt';
    const namePromptInput = document.createElement('input');
    namePromptInput.type = 'text';
    namePromptInput.placeholder = 'Snippet name...';
    namePromptInput.maxLength = 40;
    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'confirm-btn';
    confirmBtn.textContent = '✓';
    confirmBtn.title = 'Save snippet';
    const dismissBtn = document.createElement('button');
    dismissBtn.className = 'dismiss-btn';
    dismissBtn.textContent = '✗';
    dismissBtn.title = 'Cancel';
    namePrompt.appendChild(namePromptInput);
    namePrompt.appendChild(confirmBtn);
    namePrompt.appendChild(dismissBtn);

    footerLeft.appendChild(saveMdBtn);
    footerLeft.appendChild(saveConvertedBtn);
    footerLeft.appendChild(namePrompt);

    const footerRight = document.createElement('div');
    footerRight.className = 'footer-right';
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-cancel';
    cancelBtn.textContent = 'Cancel';
    const applyBtn = document.createElement('button');
    applyBtn.className = 'btn btn-apply';
    applyBtn.textContent = 'Apply';
    footerRight.appendChild(cancelBtn);
    footerRight.appendChild(applyBtn);

    footer.appendChild(footerLeft);
    footer.appendChild(footerRight);

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

    // Save snippet from preview modal — inline name-prompt logic
    let pendingSnippetContent = null;

    function showNamePrompt(content) {
      pendingSnippetContent = content;
      saveMdBtn.style.display = 'none';
      saveConvertedBtn.style.display = 'none';
      namePrompt.style.display = 'flex';
      namePromptInput.value = '';
      namePromptInput.classList.remove('error');
      namePromptInput.focus();
    }

    function hideNamePrompt() {
      namePrompt.style.display = 'none';
      saveMdBtn.style.display = '';
      saveConvertedBtn.style.display = '';
      pendingSnippetContent = null;
    }

    saveMdBtn.addEventListener('click', () => showNamePrompt(leftTextarea.value));

    saveConvertedBtn.addEventListener('click', () => {
      let content = leftTextarea.value;
      if (typeof markdownServicenow !== 'undefined') {
        try {
          content = markdownServicenow.convertMarkdownToServiceNow(
            leftTextarea.value, { customAlerts }
          );
        } catch { /* fall back to raw markdown */ }
      }
      showNamePrompt(content);
    });

    confirmBtn.addEventListener('click', () => {
      const name = namePromptInput.value.trim();
      if (!name) {
        namePromptInput.classList.add('error');
        namePromptInput.focus();
        return;
      }
      if (confirmBtn.disabled) return;
      confirmBtn.disabled = true;
      const newSnippet = { id: Date.now().toString(), name, content: pendingSnippetContent };
      chrome.storage.local.get(['snippets'], (result) => {
        const updated = result.snippets || [];
        updated.push(newSnippet);
        chrome.storage.local.set({ snippets: updated }, () => {
          showNotification('Snippet saved!', 'success');
          hideNamePrompt();
          confirmBtn.disabled = false;
        });
      });
    });

    dismissBtn.addEventListener('click', hideNamePrompt);

    namePromptInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') confirmBtn.click();
      if (e.key === 'Escape') { e.stopPropagation(); dismissBtn.click(); }
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

  // ==================== Snippet Picker ====================

  function insertSnippetIntoTextarea(textarea, content, savedCursor) {
    const start = savedCursor.start;
    const end = savedCursor.end;
    const textBefore = textarea.value.substring(0, start);
    const textAfter = textarea.value.substring(end);
    const needsNewline = textBefore.length > 0 && !textBefore.endsWith('\n');
    const insertion = (needsNewline ? '\n' : '') + content;
    textarea.value = textBefore + insertion + textAfter;
    textarea.focus();
    textarea.selectionStart = textarea.selectionEnd = start + insertion.length;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function openSnippetPicker(textarea, anchorBtn) {
    // Toggle: close dropdown if already open
    const existing = document.querySelector('.md-sn-snippets-host');
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
    host.className = 'md-sn-snippets-host';
    document.body.appendChild(host);
    const shadow = host.attachShadow({ mode: 'open' });

    // Position: fixed, below anchor button; flip upward if near viewport bottom
    const rect = anchorBtn.getBoundingClientRect();
    const DROPDOWN_HEIGHT = 280;
    const top = (rect.bottom + DROPDOWN_HEIGHT > window.innerHeight)
      ? Math.max(4, rect.top - DROPDOWN_HEIGHT)
      : rect.bottom + 4;
    const left = Math.min(rect.left, window.innerWidth - 330);

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
        min-width: 320px;
        max-height: 280px;
        overflow-y: auto;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .item {
        display: flex; align-items: center; justify-content: space-between;
        padding: 8px 12px; cursor: pointer;
        font-size: 13px; color: #333;
        border-bottom: 1px solid #f0f0f0;
      }
      .item:last-child { border-bottom: none; }
      .item:hover { background: #f5f5f5; }
      .snippet-name { font-weight: 500; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .delete-btn {
        background: none; border: none; cursor: pointer;
        color: #e53935; font-size: 15px; padding: 2px 5px;
        border-radius: 3px; line-height: 1; flex-shrink: 0; margin-left: 8px;
      }
      .delete-btn:hover { background: #fdecea; }
      .empty {
        padding: 12px; font-size: 13px; color: #999;
        font-style: italic; text-align: center;
      }
      .add-btn {
        display: flex; align-items: center; gap: 6px;
        padding: 8px 12px; cursor: pointer;
        font-size: 13px; color: #666;
        border-top: 1px solid #e8e8e8;
        background: #fafafa;
        border-radius: 0 0 6px 6px;
      }
      .add-btn:hover { background: #f0f0f0; color: #333; }
      .add-form {
        display: none; flex-direction: column; gap: 8px;
        padding: 10px 12px;
        border-top: 1px solid #e8e8e8;
        background: #fafafa;
        border-radius: 0 0 6px 6px;
      }
      .add-form input, .add-form textarea {
        width: 100%; box-sizing: border-box;
        border: 1px solid #ddd; border-radius: 4px;
        padding: 6px 8px; font-size: 12px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: #333; background: #fff;
      }
      .add-form input:focus, .add-form textarea:focus {
        outline: none; border-color: #667eea;
      }
      .add-form textarea { resize: vertical; min-height: 60px; max-height: 120px; }
      .add-form-row { display: flex; gap: 6px; }
      .add-form .save-btn {
        flex: 1; padding: 5px 10px; border: none; border-radius: 4px;
        background: #667eea; color: #fff; cursor: pointer; font-size: 12px;
      }
      .add-form .save-btn:hover { background: #5a6fd8; }
      .add-form .cancel-btn {
        flex: 1; padding: 5px 10px; border: none; border-radius: 4px;
        background: #e0e0e0; color: #555; cursor: pointer; font-size: 12px;
      }
      .add-form .cancel-btn:hover { background: #ccc; }
      .add-form .error { border-color: #e74c3c !important; }
    `;

    const dropdown = document.createElement('div');
    dropdown.className = 'dropdown';

    function makeSnippetItem(snippet) {
      const item = document.createElement('div');
      item.className = 'item';

      const nameEl = document.createElement('span');
      nameEl.className = 'snippet-name';
      nameEl.textContent = snippet.name || snippet.title || 'Snippet';

      const delBtn = document.createElement('button');
      delBtn.className = 'delete-btn';
      delBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M9 3v1H4v2h1v13a2 2 0 002 2h10a2 2 0 002-2V6h1V4h-5V3H9zm0 5h2v9H9V8zm4 0h2v9h-2V8z"/></svg>';
      delBtn.title = 'Delete snippet';

      item.appendChild(nameEl);
      item.appendChild(delBtn);

      item.addEventListener('click', (e) => {
        e.stopPropagation();
        insertSnippetIntoTextarea(textarea, snippet.content, savedCursor);
        host.remove();
        document.removeEventListener('click', closeListener, { capture: true });
      });

      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        chrome.storage.local.get(['snippets'], (res) => {
          const updated = (res.snippets || []).filter(s => s.id !== snippet.id);
          chrome.storage.local.set({ snippets: updated }, () => {
            item.remove();
            const remaining = dropdown.querySelectorAll('.item');
            if (remaining.length === 0) {
              const emptyEl = document.createElement('div');
              emptyEl.className = 'empty';
              emptyEl.textContent = 'No snippets saved';
              dropdown.insertBefore(emptyEl, addBtn);
            }
          });
        });
      });

      return item;
    }

    if (snippets.length === 0) {
      const emptyEl = document.createElement('div');
      emptyEl.className = 'empty';
      emptyEl.textContent = 'No snippets saved';
      dropdown.appendChild(emptyEl);
    } else {
      for (const snippet of snippets) {
        dropdown.appendChild(makeSnippetItem(snippet));
      }
    }

    // Add new snippet section
    const addBtn = document.createElement('div');
    addBtn.className = 'add-btn';
    addBtn.innerHTML = '<span>＋</span><span>Add new snippet</span>';

    const addForm = document.createElement('div');
    addForm.className = 'add-form';

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.placeholder = 'Snippet name...';
    nameInput.maxLength = 40;

    const contentInput = document.createElement('textarea');
    contentInput.placeholder = 'Snippet content...';
    contentInput.value = textarea.value;

    const formRow = document.createElement('div');
    formRow.className = 'add-form-row';

    const saveBtn = document.createElement('button');
    saveBtn.className = 'save-btn';
    saveBtn.textContent = 'Save';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'cancel-btn';
    cancelBtn.textContent = 'Cancel';

    formRow.appendChild(saveBtn);
    formRow.appendChild(cancelBtn);
    addForm.appendChild(nameInput);
    addForm.appendChild(contentInput);
    addForm.appendChild(formRow);

    dropdown.appendChild(addBtn);
    dropdown.appendChild(addForm);

    addBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      addBtn.style.display = 'none';
      addForm.style.display = 'flex';
      nameInput.focus();
    });

    cancelBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      addForm.style.display = 'none';
      addBtn.style.display = '';
      nameInput.value = '';
      nameInput.classList.remove('error');
    });

    saveBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const name = nameInput.value.trim();
      if (!name) {
        nameInput.classList.add('error');
        nameInput.focus();
        return;
      }
      const content = contentInput.value;
      const newSnippet = { id: Date.now().toString(), name, content };

      chrome.storage.local.get(['snippets'], (result) => {
        const updated = result.snippets || [];
        updated.push(newSnippet);
        chrome.storage.local.set({ snippets: updated }, () => {
          // Remove empty state if present
          const emptyEl = dropdown.querySelector('.empty');
          if (emptyEl) emptyEl.remove();

          // Add new item to list before the add section
          dropdown.insertBefore(makeSnippetItem(newSnippet), addBtn);

          // Reset form, show add button.
          // Intentionally keep picker open so user can immediately insert the new snippet.
          addForm.style.display = 'none';
          addBtn.style.display = '';
          nameInput.value = '';
          nameInput.classList.remove('error');
        });
      });
    });

    nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') saveBtn.click();
      if (e.key === 'Escape') cancelBtn.click();
    });

    shadow.appendChild(style);
    shadow.appendChild(dropdown);

    // Close on click outside
    let closeListener;
    closeListener = (e) => {
      if (!e.composedPath().includes(host)) {
        host.remove();
        document.removeEventListener('click', closeListener, { capture: true });
      }
    };
    setTimeout(() => document.addEventListener('click', closeListener, { capture: true }), 0);
  }

  // ==================== Cheatsheet Panel ====================

  function openCheatsheet(textarea, anchorBtn) {
    // Toggle: close panel if already open
    const existing = document.querySelector('.md-sn-cheatsheet-host');
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
    host.className = 'md-sn-cheatsheet-host';
    document.body.appendChild(host);
    const shadow = host.attachShadow({ mode: 'open' });

    // Position: fixed, below anchor button; flip upward if near viewport bottom
    const rect = anchorBtn.getBoundingClientRect();
    const PANEL_HEIGHT = 420;
    const top = (rect.bottom + PANEL_HEIGHT > window.innerHeight)
      ? Math.max(4, rect.top - PANEL_HEIGHT)
      : rect.bottom + 4;
    const left = Math.min(rect.left, window.innerWidth - 320);

    const style = document.createElement('style');
    style.textContent = `
      .panel {
        position: fixed;
        top: ${top}px;
        left: ${left}px;
        background: #fff;
        border: 1px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        z-index: 9999999;
        width: 300px;
        max-height: 420px;
        display: flex;
        flex-direction: column;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .panel-header {
        display: flex; align-items: center; justify-content: space-between;
        padding: 8px 12px;
        border-bottom: 1px solid #eee;
        background: #f8f8f8;
        border-radius: 8px 8px 0 0;
        flex-shrink: 0;
      }
      .panel-header span {
        font-size: 12px; font-weight: 600; color: #555;
        text-transform: uppercase; letter-spacing: 0.5px;
      }
      .close-btn {
        background: none; border: none; cursor: pointer;
        font-size: 14px; color: #999; padding: 0 2px; line-height: 1;
      }
      .close-btn:hover { color: #333; }
      .panel-body { overflow-y: auto; flex: 1; padding: 4px 0; }
      .category-header {
        padding: 6px 12px 3px;
        font-size: 10px; font-weight: 600; color: #999;
        text-transform: uppercase; letter-spacing: 0.5px;
      }
      .item {
        padding: 5px 12px; cursor: pointer;
        border-bottom: 1px solid #f5f5f5;
      }
      .item:last-of-type { border-bottom: none; }
      .item:hover { background: #f0f7ff; }
      .item-code {
        font-family: 'SF Mono', Consolas, 'Courier New', monospace;
        font-size: 12px; color: #333;
      }
    `;

    const panel = document.createElement('div');
    panel.className = 'panel';

    // Header
    const panelHeader = document.createElement('div');
    panelHeader.className = 'panel-header';
    const headerSpan = document.createElement('span');
    headerSpan.textContent = 'Markdown Cheatsheet';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-btn';
    closeBtn.textContent = '✕';
    panelHeader.appendChild(headerSpan);
    panelHeader.appendChild(closeBtn);

    // Body
    const panelBody = document.createElement('div');
    panelBody.className = 'panel-body';

    for (const section of CHEATSHEET) {
      const catHeader = document.createElement('div');
      catHeader.className = 'category-header';
      catHeader.textContent = section.category;
      panelBody.appendChild(catHeader);

      for (const cheatItem of section.items) {
        const itemEl = document.createElement('div');
        itemEl.className = 'item';
        const codeEl = document.createElement('span');
        codeEl.className = 'item-code';
        codeEl.textContent = cheatItem.label;
        itemEl.appendChild(codeEl);

        itemEl.addEventListener('click', (e) => {
          e.stopPropagation();
          insertSnippetIntoTextarea(textarea, cheatItem.insert, savedCursor);
          host.remove();
          document.removeEventListener('keydown', onEsc);
          document.removeEventListener('click', closeListener, { capture: true });
        });

        panelBody.appendChild(itemEl);
      }
    }

    panel.appendChild(panelHeader);
    panel.appendChild(panelBody);
    shadow.appendChild(style);
    shadow.appendChild(panel);

    // Close helpers
    const onEsc = (e) => {
      if (e.key === 'Escape') {
        host.remove();
        document.removeEventListener('keydown', onEsc);
        document.removeEventListener('click', closeListener, { capture: true });
      }
    };

    let closeListener;
    closeListener = (e) => {
      if (!e.composedPath().includes(host)) {
        host.remove();
        document.removeEventListener('keydown', onEsc);
        document.removeEventListener('click', closeListener, { capture: true });
      }
    };

    closeBtn.addEventListener('click', () => {
      host.remove();
      document.removeEventListener('keydown', onEsc);
      document.removeEventListener('click', closeListener, { capture: true });
    });

    document.addEventListener('keydown', onEsc);
    setTimeout(() => document.addEventListener('click', closeListener, { capture: true }), 0);
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
    // Load custom alerts and snippets first
    await loadCustomAlerts();
    await loadSnippets();

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
