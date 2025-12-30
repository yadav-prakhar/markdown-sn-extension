// Content script for ServiceNow integration
(function() {
  'use strict';

  // Skip if already initialized in this frame
  if (window.__mdSnInitialized) return;
  window.__mdSnInitialized = true;

  console.log('MD-SN: Content script loaded in frame:', window.location.href);

  const BUTTON_CLASS = 'md-sn-convert-btn';
  const TOOLBAR_CLASS = 'md-sn-toolbar';
  
  // ServiceNow journal field selectors - only journal/activity fields, NOT description
  const JOURNAL_SELECTORS = [
    // Classic UI - specific journal fields (exact match at end)
    'textarea[id$=".work_notes"]',
    'textarea[id$=".comments"]',
    'textarea[id$=".close_notes"]',
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

  // Create convert button
  function createConvertButton() {
    const btn = document.createElement('button');
    btn.className = BUTTON_CLASS;
    btn.innerHTML = `<img src="${chrome.runtime.getURL('icons/Icon.svg')}" alt="Convert Markdown">`;
    btn.title = 'Convert Markdown to ServiceNow format';
    btn.type = 'button';
    return btn;
  }

  // Create toolbar container
  function createToolbar() {
    const toolbar = document.createElement('div');
    toolbar.className = TOOLBAR_CLASS;
    
    const convertBtn = createConvertButton();
    toolbar.appendChild(convertBtn);
    
    return toolbar;
  }

  // Convert markdown in textarea
  function convertTextarea(textarea) {
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

      const result = markdownServicenow.convertMarkdownToServiceNow(text);
      textarea.value = result;
      
      // Trigger events to notify ServiceNow of change
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
      textarea.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
      
      // For ServiceNow's onChange handlers
      if (typeof textarea.onchange === 'function') {
        textarea.onchange();
      }
      
      showNotification('Converted successfully!', 'success');
      console.log('MD-SN: Conversion complete');
    } catch (error) {
      console.error('MD-SN: Conversion error', error);
      showNotification('Conversion error: ' + error.message, 'error');
    }
  }

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

  // Add toolbar to journal field
  function addToolbarToField(textarea) {
    if (textarea.dataset.mdSnEnhanced) return;
    textarea.dataset.mdSnEnhanced = 'true';

    console.log('MD-SN: Enhancing textarea:', textarea.id || textarea.name || 'unnamed');

    const toolbar = createToolbar();
    
    // Position toolbar after the textarea
    const textareaParent = textarea.parentNode;

    // Insert toolbar before the parent's next sibling (to appear after textarea)
    textareaParent.parentNode.insertBefore(toolbar, textareaParent.nextSibling);

    // Style toolbar for inline display
    toolbar.style.display = "inline-block";
    toolbar.style.margin = "4px 0 12px 4px";

    // Add click handler
    toolbar.querySelector(`.${BUTTON_CLASS}`).addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      convertTextarea(textarea);
    });
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
    if (message.action === 'replaceSelection') {
      const activeElement = document.activeElement;
      
      if (activeElement && activeElement.tagName === 'TEXTAREA') {
        const start = activeElement.selectionStart;
        const end = activeElement.selectionEnd;
        const text = activeElement.value;
        
        activeElement.value = text.substring(0, start) + message.text + text.substring(end);
        activeElement.dispatchEvent(new Event('input', { bubbles: true }));
        
        sendResponse({ success: true });
      } else {
        // Copy to clipboard instead
        navigator.clipboard.writeText(message.text).then(() => {
          showNotification('Copied to clipboard!', 'success');
          sendResponse({ success: true });
        }).catch(() => {
          sendResponse({ success: false });
        });
      }
      
      return true;
    }
  });

  // Initialize
  function init() {
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
