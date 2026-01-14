import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Content Script - Toolbar Injection', () => {
  const BUTTON_CLASS = 'md-sn-convert-btn';
  const TOOLBAR_CLASS = 'md-sn-toolbar';

  let createConvertButton;
  let createToolbar;
  let addToolbarToField;
  let showNotification;

  beforeEach(() => {
    // Mock chrome.runtime.getURL
    chrome.runtime.getURL = vi.fn((path) => `chrome-extension://test-id/${path}`);

    // Mock markdownServicenow
    global.markdownServicenow = {
      convertMarkdownToServiceNow: vi.fn((text) => `<p>${text}</p>`)
    };

    // Mock console.log
    global.console.log = vi.fn();

    // Define createConvertButton from content.js
    createConvertButton = function() {
      const btn = document.createElement('button');
      btn.className = BUTTON_CLASS;
      btn.innerHTML = `<img src="${chrome.runtime.getURL('icons/Icon.svg')}" alt="Convert Markdown">`;
      btn.title = 'Convert Markdown to ServiceNow format';
      btn.type = 'button';
      return btn;
    };

    // Define createToolbar from content.js
    createToolbar = function() {
      const toolbar = document.createElement('div');
      toolbar.className = TOOLBAR_CLASS;

      const convertBtn = createConvertButton();
      toolbar.appendChild(convertBtn);

      return toolbar;
    };

    // Define showNotification from content.js
    showNotification = function(message, type = 'success') {
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
    };

    // Define addToolbarToField from content.js
    addToolbarToField = function(textarea, convertTextarea) {
      if (textarea.dataset.mdSnEnhanced) return;
      textarea.dataset.mdSnEnhanced = 'true';

      const toolbar = createToolbar();

      const textareaParent = textarea.parentNode;
      if (!textareaParent || !textareaParent.parentNode) return;

      textareaParent.parentNode.insertBefore(toolbar, textareaParent.nextSibling);

      toolbar.style.display = "inline-block";
      toolbar.style.margin = "4px 0 12px 4px";

      toolbar.querySelector(`.${BUTTON_CLASS}`).addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (convertTextarea) convertTextarea(textarea);
      });
    };
  });

  describe('createConvertButton', () => {
    it('should create button with correct class', () => {
      const btn = createConvertButton();
      expect(btn.className).toBe(BUTTON_CLASS);
    });

    it('should create button with image', () => {
      const btn = createConvertButton();
      const img = btn.querySelector('img');
      expect(img).not.toBeNull();
      expect(img.alt).toBe('Convert Markdown');
    });

    it('should set button type to button', () => {
      const btn = createConvertButton();
      expect(btn.type).toBe('button');
    });

    it('should set title attribute', () => {
      const btn = createConvertButton();
      expect(btn.title).toBe('Convert Markdown to ServiceNow format');
    });

    it('should use chrome.runtime.getURL for icon path', () => {
      createConvertButton();
      expect(chrome.runtime.getURL).toHaveBeenCalledWith('icons/Icon.svg');
    });
  });

  describe('createToolbar', () => {
    it('should create toolbar with correct class', () => {
      const toolbar = createToolbar();
      expect(toolbar.className).toBe(TOOLBAR_CLASS);
    });

    it('should contain convert button', () => {
      const toolbar = createToolbar();
      const btn = toolbar.querySelector(`.${BUTTON_CLASS}`);
      expect(btn).not.toBeNull();
    });

    it('should be a div element', () => {
      const toolbar = createToolbar();
      expect(toolbar.tagName).toBe('DIV');
    });
  });

  describe('showNotification', () => {
    it('should create notification element', () => {
      showNotification('Test message');
      const notification = document.querySelector('.md-sn-notification');
      expect(notification).not.toBeNull();
      expect(notification.textContent).toBe('Test message');
    });

    it('should apply success class by default', () => {
      showNotification('Success');
      const notification = document.querySelector('.md-sn-notification');
      expect(notification.classList.contains('md-sn-notification-success')).toBe(true);
    });

    it('should apply error class when type is error', () => {
      showNotification('Error', 'error');
      const notification = document.querySelector('.md-sn-notification');
      expect(notification.classList.contains('md-sn-notification-error')).toBe(true);
    });

    it('should remove existing notification before showing new one', () => {
      showNotification('First');
      showNotification('Second');
      const notifications = document.querySelectorAll('.md-sn-notification');
      expect(notifications.length).toBe(1);
      expect(notifications[0].textContent).toBe('Second');
    });

    it('should append notification to body', () => {
      showNotification('Test');
      const notification = document.querySelector('.md-sn-notification');
      expect(notification.parentNode).toBe(document.body);
    });
  });

  describe('addToolbarToField', () => {
    it('should add toolbar to textarea', () => {
      const parent = document.createElement('div');
      const wrapper = document.createElement('div');
      const textarea = document.createElement('textarea');
      wrapper.appendChild(textarea);
      parent.appendChild(wrapper);
      document.body.appendChild(parent);

      addToolbarToField(textarea);

      const toolbar = parent.querySelector(`.${TOOLBAR_CLASS}`);
      expect(toolbar).not.toBeNull();

      document.body.removeChild(parent);
    });

    it('should mark textarea as enhanced', () => {
      const parent = document.createElement('div');
      const wrapper = document.createElement('div');
      const textarea = document.createElement('textarea');
      wrapper.appendChild(textarea);
      parent.appendChild(wrapper);
      document.body.appendChild(parent);

      addToolbarToField(textarea);

      expect(textarea.dataset.mdSnEnhanced).toBe('true');

      document.body.removeChild(parent);
    });

    it('should not add toolbar if already enhanced', () => {
      const parent = document.createElement('div');
      const wrapper = document.createElement('div');
      const textarea = document.createElement('textarea');
      textarea.dataset.mdSnEnhanced = 'true';
      wrapper.appendChild(textarea);
      parent.appendChild(wrapper);
      document.body.appendChild(parent);

      addToolbarToField(textarea);

      const toolbars = parent.querySelectorAll(`.${TOOLBAR_CLASS}`);
      expect(toolbars.length).toBe(0);

      document.body.removeChild(parent);
    });

    it('should position toolbar after textarea parent', () => {
      const parent = document.createElement('div');
      const wrapper = document.createElement('div');
      wrapper.id = 'wrapper';
      const textarea = document.createElement('textarea');
      wrapper.appendChild(textarea);
      parent.appendChild(wrapper);
      document.body.appendChild(parent);

      addToolbarToField(textarea);

      const toolbar = parent.querySelector(`.${TOOLBAR_CLASS}`);
      expect(toolbar.previousElementSibling.id).toBe('wrapper');

      document.body.removeChild(parent);
    });

    it('should apply inline styles to toolbar', () => {
      const parent = document.createElement('div');
      const wrapper = document.createElement('div');
      const textarea = document.createElement('textarea');
      wrapper.appendChild(textarea);
      parent.appendChild(wrapper);
      document.body.appendChild(parent);

      addToolbarToField(textarea);

      const toolbar = parent.querySelector(`.${TOOLBAR_CLASS}`);
      expect(toolbar.style.display).toBe('inline-block');
      expect(toolbar.style.margin).toBe('4px 0px 12px 4px');

      document.body.removeChild(parent);
    });

    it('should add click handler to button', () => {
      const parent = document.createElement('div');
      const wrapper = document.createElement('div');
      const textarea = document.createElement('textarea');
      textarea.value = '# Test';
      wrapper.appendChild(textarea);
      parent.appendChild(wrapper);
      document.body.appendChild(parent);

      const mockConvert = vi.fn();
      addToolbarToField(textarea, mockConvert);

      const btn = parent.querySelector(`.${BUTTON_CLASS}`);
      btn.click();

      expect(mockConvert).toHaveBeenCalledWith(textarea);

      document.body.removeChild(parent);
    });

    it('should handle missing parent gracefully', () => {
      const textarea = document.createElement('textarea');
      // Textarea has no parent
      expect(() => addToolbarToField(textarea)).not.toThrow();
    });

    it('should handle missing grandparent gracefully', () => {
      const wrapper = document.createElement('div');
      const textarea = document.createElement('textarea');
      wrapper.appendChild(textarea);
      // Wrapper has no parent
      expect(() => addToolbarToField(textarea)).not.toThrow();
    });
  });

  describe('Toolbar Integration', () => {
    it('should create complete toolbar with button and styling', () => {
      const parent = document.createElement('div');
      const wrapper = document.createElement('div');
      const textarea = document.createElement('textarea');
      wrapper.appendChild(textarea);
      parent.appendChild(wrapper);
      document.body.appendChild(parent);

      addToolbarToField(textarea);

      const toolbar = parent.querySelector(`.${TOOLBAR_CLASS}`);
      const button = toolbar.querySelector(`.${BUTTON_CLASS}`);
      const img = button.querySelector('img');

      expect(toolbar).not.toBeNull();
      expect(button).not.toBeNull();
      expect(img).not.toBeNull();
      expect(button.type).toBe('button');
      expect(toolbar.style.display).toBe('inline-block');

      document.body.removeChild(parent);
    });

    it('should prevent adding multiple toolbars to same textarea', () => {
      const parent = document.createElement('div');
      const wrapper = document.createElement('div');
      const textarea = document.createElement('textarea');
      wrapper.appendChild(textarea);
      parent.appendChild(wrapper);
      document.body.appendChild(parent);

      addToolbarToField(textarea);
      addToolbarToField(textarea);
      addToolbarToField(textarea);

      const toolbars = parent.querySelectorAll(`.${TOOLBAR_CLASS}`);
      expect(toolbars.length).toBe(1);

      document.body.removeChild(parent);
    });
  });
});
