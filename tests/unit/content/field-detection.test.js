import { describe, it, expect, beforeEach } from 'vitest';

describe('Content Script - Field Detection', () => {
  let isJournalField;

  beforeEach(() => {
    // Mock the global markdownServicenow
    global.markdownServicenow = {
      convertMarkdownToServiceNow: (text) => `<p>${text}</p>`
    };

    // Define the isJournalField function from content.js
    const JOURNAL_SELECTORS = [
      'textarea[id$=".work_notes"]',
      'textarea[id$=".comments"]',
      'textarea[id^="activity-stream"]',
      '#activity-stream-textarea',
      '#activity-stream-work_notes-textarea',
      '#activity-stream-comments-textarea',
      '[data-type="journal_input"] textarea'
    ];

    const EXCLUDED_PATTERNS = [
      'description',
      'short_description',
      'resolution_notes',
      'justification'
    ];

    isJournalField = function(element) {
      if (!element || element.tagName !== 'TEXTAREA') return false;
      if (element.dataset.mdSnEnhanced) return false;

      const id = (element.id || '').toLowerCase();
      const name = (element.name || '').toLowerCase();

      const isExcluded = EXCLUDED_PATTERNS.some(pattern =>
        id.includes(pattern) || name.includes(pattern)
      );
      if (isExcluded) return false;

      const matches = JOURNAL_SELECTORS.some(selector => {
        try {
          return element.matches(selector);
        } catch {
          return false;
        }
      });

      return matches;
    };
  });

  describe('Work Notes Detection', () => {
    it('should detect work_notes textarea', () => {
      const textarea = document.createElement('textarea');
      textarea.id = 'incident.work_notes';
      expect(isJournalField(textarea)).toBe(true);
    });

    it('should detect task work_notes textarea', () => {
      const textarea = document.createElement('textarea');
      textarea.id = 'task.work_notes';
      expect(isJournalField(textarea)).toBe(true);
    });

    it('should detect change_request work_notes textarea', () => {
      const textarea = document.createElement('textarea');
      textarea.id = 'change_request.work_notes';
      expect(isJournalField(textarea)).toBe(true);
    });
  });

  describe('Comments Detection', () => {
    it('should detect comments textarea', () => {
      const textarea = document.createElement('textarea');
      textarea.id = 'incident.comments';
      expect(isJournalField(textarea)).toBe(true);
    });

    it('should detect task comments textarea', () => {
      const textarea = document.createElement('textarea');
      textarea.id = 'task.comments';
      expect(isJournalField(textarea)).toBe(true);
    });
  });

  describe('Activity Stream Detection', () => {
    it('should detect activity-stream textarea by ID', () => {
      const textarea = document.createElement('textarea');
      textarea.id = 'activity-stream-textarea';
      expect(isJournalField(textarea)).toBe(true);
    });

    it('should detect activity-stream-work_notes textarea', () => {
      const textarea = document.createElement('textarea');
      textarea.id = 'activity-stream-work_notes-textarea';
      expect(isJournalField(textarea)).toBe(true);
    });

    it('should detect activity-stream-comments textarea', () => {
      const textarea = document.createElement('textarea');
      textarea.id = 'activity-stream-comments-textarea';
      expect(isJournalField(textarea)).toBe(true);
    });

    it('should detect activity-stream with prefix', () => {
      const textarea = document.createElement('textarea');
      textarea.id = 'activity-stream-custom-field';
      expect(isJournalField(textarea)).toBe(true);
    });
  });

  describe('Workspace UI Detection', () => {
    it('should detect journal_input textarea', () => {
      const container = document.createElement('div');
      container.setAttribute('data-type', 'journal_input');
      const textarea = document.createElement('textarea');
      container.appendChild(textarea);
      document.body.appendChild(container);

      expect(isJournalField(textarea)).toBe(true);

      document.body.removeChild(container);
    });
  });

  describe('Exclusion Patterns', () => {
    it('should exclude description field', () => {
      const textarea = document.createElement('textarea');
      textarea.id = 'incident.description';
      expect(isJournalField(textarea)).toBe(false);
    });

    it('should exclude short_description field', () => {
      const textarea = document.createElement('textarea');
      textarea.id = 'incident.short_description';
      expect(isJournalField(textarea)).toBe(false);
    });

    it('should exclude resolution_notes field', () => {
      const textarea = document.createElement('textarea');
      textarea.id = 'incident.resolution_notes';
      expect(isJournalField(textarea)).toBe(false);
    });

    it('should exclude justification field', () => {
      const textarea = document.createElement('textarea');
      textarea.id = 'change_request.justification';
      expect(isJournalField(textarea)).toBe(false);
    });

    it('should exclude field with description in name', () => {
      const textarea = document.createElement('textarea');
      textarea.name = 'sys_description';
      expect(isJournalField(textarea)).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should return false for non-textarea elements', () => {
      const input = document.createElement('input');
      input.id = 'incident.work_notes';
      expect(isJournalField(input)).toBe(false);
    });

    it('should return false for null element', () => {
      expect(isJournalField(null)).toBe(false);
    });

    it('should return false for undefined element', () => {
      expect(isJournalField(undefined)).toBe(false);
    });

    it('should return false for textarea without ID or name', () => {
      const textarea = document.createElement('textarea');
      expect(isJournalField(textarea)).toBe(false);
    });

    it('should return false if already enhanced', () => {
      const textarea = document.createElement('textarea');
      textarea.id = 'incident.work_notes';
      textarea.dataset.mdSnEnhanced = 'true';
      expect(isJournalField(textarea)).toBe(false);
    });

    it('should handle lowercase ID matching', () => {
      // CSS selectors are case-sensitive for ID matching, but function converts to lowercase
      const textarea = document.createElement('textarea');
      textarea.id = 'incident.work_notes';
      expect(isJournalField(textarea)).toBe(true);
    });

    it('should exclude description even if work_notes is also present', () => {
      const textarea = document.createElement('textarea');
      textarea.id = 'incident.description_work_notes';
      expect(isJournalField(textarea)).toBe(false);
    });
  });

  describe('Selector Matching', () => {
    it('should match work_notes with any prefix', () => {
      const cases = [
        'incident.work_notes',
        'task.work_notes',
        'change_request.work_notes',
        'problem.work_notes'
      ];

      cases.forEach(id => {
        const textarea = document.createElement('textarea');
        textarea.id = id;
        expect(isJournalField(textarea)).toBe(true);
      });
    });

    it('should match comments with any prefix', () => {
      const cases = [
        'incident.comments',
        'task.comments',
        'change_request.comments'
      ];

      cases.forEach(id => {
        const textarea = document.createElement('textarea');
        textarea.id = id;
        expect(isJournalField(textarea)).toBe(true);
      });
    });

    it('should not match work_notes in the middle of ID', () => {
      const textarea = document.createElement('textarea');
      textarea.id = 'work_notes.something_else';
      expect(isJournalField(textarea)).toBe(false);
    });
  });
});
