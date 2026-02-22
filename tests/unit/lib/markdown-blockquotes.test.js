import { describe, it, expect } from 'vitest';
import { markdownSamples } from '../../fixtures/markdown-samples.js';

// Import the markdown conversion library
import * as markdownServicenow from '../../../lib/markdown-servicenow.js';

// Helper to convert without [code] wrapper
const convert = (input) => markdownServicenow.convertMarkdownToServiceNow(input, { skipCodeTags: true });

describe('Blockquotes and Alerts', () => {
  describe('Simple blockquotes', () => {
    it('should convert simple blockquote', () => {
      const input = markdownSamples.blockquote;
      const output = convert(input);
      expect(output).toContain('<blockquote>');
      expect(output).toContain('This is a quote');
      expect(output).toContain('spanning multiple lines');
      expect(output).toContain('</blockquote>');
    });

    it('should convert single line blockquote', () => {
      const input = '> Single line quote';
      const output = convert(input);
      expect(output).toContain('<blockquote>');
      expect(output).toContain('Single line quote');
      expect(output).toContain('</blockquote>');
    });

    it('should handle blockquote with inline formatting', () => {
      const input = '> **Bold** and *italic* quote';
      const output = convert(input);
      expect(output).toContain('<blockquote>');
      expect(output).toContain('<strong>Bold</strong>');
      expect(output).toContain('<em>italic</em>');
    });
  });

  describe('Lists inside blockquotes', () => {
    it('should convert unordered list items inside a blockquote', () => {
      const input = '> - Item one\n> - Item two\n> - Item three';
      const output = convert(input);
      expect(output).toContain('<blockquote>');
      expect(output).toContain('<ul>');
      expect(output).toContain('<li>Item one</li>');
      expect(output).toContain('<li>Item two</li>');
      expect(output).toContain('<li>Item three</li>');
      expect(output).toContain('</ul>');
    });

    it('should convert ordered list items inside a blockquote', () => {
      const input = '> 1. First step\n> 2. Second step\n> 3. Third step';
      const output = convert(input);
      expect(output).toContain('<blockquote>');
      expect(output).toContain('<ol>');
      expect(output).toContain('<li>First step</li>');
      expect(output).toContain('<li>Second step</li>');
      expect(output).toContain('<li>Third step</li>');
      expect(output).toContain('</ol>');
    });

    it('should handle mixed text and unordered list inside a blockquote', () => {
      const input = '> Here are the steps:\n> - Do this\n> - Then that';
      const output = convert(input);
      expect(output).toContain('<blockquote>');
      expect(output).toContain('Here are the steps:');
      expect(output).toContain('<ul>');
      expect(output).toContain('<li>Do this</li>');
      expect(output).toContain('<li>Then that</li>');
    });

    it('should handle mixed text and ordered list inside a blockquote', () => {
      const input = '> Steps to follow:\n> 1. Step one\n> 2. Step two';
      const output = convert(input);
      expect(output).toContain('<blockquote>');
      expect(output).toContain('Steps to follow:');
      expect(output).toContain('<ol>');
      expect(output).toContain('<li>Step one</li>');
      expect(output).toContain('<li>Step two</li>');
    });

    it('should convert unordered list items inside an alert block', () => {
      const input = '> [!NOTE]\n> - Point one\n> - Point two\n> - Point three';
      const output = convert(input);
      expect(output).toContain('<p class="note">');
      expect(output).toContain('<ul>');
      expect(output).toContain('<li>Point one</li>');
      expect(output).toContain('<li>Point two</li>');
      expect(output).toContain('<li>Point three</li>');
      expect(output).toContain('</ul>');
    });

    it('should convert ordered list items inside an alert block', () => {
      const input = '> [!IMPORTANT]\n> 1. First item\n> 2. Second item\n> 3. Third item';
      const output = convert(input);
      expect(output).toContain('<p class="important">');
      expect(output).toContain('<ol>');
      expect(output).toContain('<li>First item</li>');
      expect(output).toContain('<li>Second item</li>');
      expect(output).toContain('<li>Third item</li>');
      expect(output).toContain('</ol>');
    });

    it('should handle list items with inline formatting inside blockquote', () => {
      const input = '> - **Bold item**\n> - *Italic item*';
      const output = convert(input);
      expect(output).toContain('<blockquote>');
      expect(output).toContain('<ul>');
      expect(output).toContain('<strong>Bold item</strong>');
      expect(output).toContain('<em>Italic item</em>');
    });
  });

  describe('Alert blocks - STATUS', () => {
    it('should convert STATUS alert', () => {
      const input = markdownSamples.alertStatus;
      const output = convert(input);
      expect(output).toContain('<p class="status">');
      expect(output).toContain('STATUS:');
      expect(output).toContain('Current status');
      expect(output).toContain('</p>');
    });

    it('should include STATUS alert CSS', () => {
      const input = markdownSamples.alertStatus;
      const output = markdownServicenow.convertMarkdownToServiceNow(input);
      expect(output).toContain('.status');
      expect(output).toContain('background-color: #f1f3f5');
    });
  });

  describe('Alert blocks - IMPORTANT', () => {
    it('should convert IMPORTANT alert', () => {
      const input = markdownSamples.alertImportant;
      const output = convert(input);
      expect(output).toContain('<p class="important">');
      expect(output).toContain('IMPORTANT:');
      expect(output).toContain('This is important');
      expect(output).toContain('</p>');
    });

    it('should include IMPORTANT alert CSS', () => {
      const input = markdownSamples.alertImportant;
      const output = markdownServicenow.convertMarkdownToServiceNow(input);
      expect(output).toContain('.important');
      expect(output).toContain('background-color: #f4ecff');
    });
  });

  describe('Alert blocks - SUCCESS', () => {
    it('should convert SUCCESS alert', () => {
      const input = markdownSamples.alertSuccess;
      const output = convert(input);
      expect(output).toContain('<p class="success">');
      expect(output).toContain('SUCCESS:');
      expect(output).toContain('Operation succeeded');
      expect(output).toContain('</p>');
    });

    it('should include SUCCESS alert CSS', () => {
      const input = markdownSamples.alertSuccess;
      const output = markdownServicenow.convertMarkdownToServiceNow(input);
      expect(output).toContain('.success');
      expect(output).toContain('background-color: #e0f2f1');
    });
  });

  describe('Alert blocks - NOTE', () => {
    it('should convert NOTE alert', () => {
      const input = markdownSamples.alertNote;
      const output = convert(input);
      expect(output).toContain('<p class="note">');
      expect(output).toContain('NOTE:');
      expect(output).toContain('This is a note');
      expect(output).toContain('</p>');
    });

    it('should include NOTE alert CSS', () => {
      const input = markdownSamples.alertNote;
      const output = markdownServicenow.convertMarkdownToServiceNow(input);
      expect(output).toContain('.note');
      expect(output).toContain('background-color: #eaf2f8');
    });
  });

  describe('Alert blocks - TIP', () => {
    it('should convert TIP alert', () => {
      const input = markdownSamples.alertTip;
      const output = convert(input);
      expect(output).toContain('<p class="tip">');
      expect(output).toContain('TIP:');
      expect(output).toContain("Here's a tip");
      expect(output).toContain('</p>');
    });

    it('should include TIP alert CSS', () => {
      const input = markdownSamples.alertTip;
      const output = markdownServicenow.convertMarkdownToServiceNow(input);
      expect(output).toContain('.tip');
      expect(output).toContain('background-color: #e6fffb');
    });
  });

  describe('Alert blocks - ATTENTION', () => {
    it('should convert ATTENTION alert', () => {
      const input = markdownSamples.alertAttention;
      const output = convert(input);
      expect(output).toContain('<p class="attention">');
      expect(output).toContain('ATTENTION:');
      expect(output).toContain('Pay attention');
      expect(output).toContain('</p>');
    });

    it('should include ATTENTION alert CSS', () => {
      const input = markdownSamples.alertAttention;
      const output = markdownServicenow.convertMarkdownToServiceNow(input);
      expect(output).toContain('.attention');
      expect(output).toContain('background-color: #f6efe3');
    });
  });

  describe('Alert blocks - WARNING', () => {
    it('should convert WARNING alert', () => {
      const input = markdownSamples.alertWarning;
      const output = convert(input);
      expect(output).toContain('<p class="warning">');
      expect(output).toContain('WARNING:');
      expect(output).toContain('This is a warning');
      expect(output).toContain('</p>');
    });

    it('should include WARNING alert CSS', () => {
      const input = markdownSamples.alertWarning;
      const output = markdownServicenow.convertMarkdownToServiceNow(input);
      expect(output).toContain('.warning');
      expect(output).toContain('background-color: #faf3d1');
    });
  });

  describe('Alert blocks - CAUTION', () => {
    it('should convert CAUTION alert', () => {
      const input = markdownSamples.alertCaution;
      const output = convert(input);
      expect(output).toContain('<p class="caution">');
      expect(output).toContain('CAUTION:');
      expect(output).toContain('Be cautious');
      expect(output).toContain('</p>');
    });

    it('should include CAUTION alert CSS', () => {
      const input = markdownSamples.alertCaution;
      const output = markdownServicenow.convertMarkdownToServiceNow(input);
      expect(output).toContain('.caution');
      expect(output).toContain('background-color: #fdecef');
    });
  });

  describe('Alert blocks - BLOCKER', () => {
    it('should convert BLOCKER alert', () => {
      const input = markdownSamples.alertBlocker;
      const output = convert(input);
      expect(output).toContain('<p class="blocker">');
      expect(output).toContain('BLOCKER:');
      expect(output).toContain('This blocks progress');
      expect(output).toContain('</p>');
    });

    it('should include BLOCKER alert CSS', () => {
      const input = markdownSamples.alertBlocker;
      const output = markdownServicenow.convertMarkdownToServiceNow(input);
      expect(output).toContain('.blocker');
      expect(output).toContain('background-color: #ede7f6');
    });
  });

  describe('Alert blocks - QUESTION', () => {
    it('should convert QUESTION alert', () => {
      const input = markdownSamples.alertQuestion;
      const output = convert(input);
      expect(output).toContain('<p class="question">');
      expect(output).toContain('QUESTION:');
      expect(output).toContain('Is this working?');
      expect(output).toContain('</p>');
    });

    it('should include QUESTION alert CSS', () => {
      const input = markdownSamples.alertQuestion;
      const output = markdownServicenow.convertMarkdownToServiceNow(input);
      expect(output).toContain('.question');
      expect(output).toContain('background-color: #f6f4ea');
    });
  });

  describe('Multiple alerts in one document', () => {
    it('should convert multiple different alert types', () => {
      const input = `> [!NOTE]\n> Note content\n\n> [!WARNING]\n> Warning content`;
      const output = convert(input);
      expect(output).toContain('<p class="note">');
      expect(output).toContain('<p class="warning">');
      expect(output).toContain('Note content');
      expect(output).toContain('Warning content');
    });

    it('should include CSS for alerts', () => {
      const input = `> [!NOTE]\n> First\n\n> [!NOTE]\n> Second`;
      const output = markdownServicenow.convertMarkdownToServiceNow(input);
      // Should contain alert CSS
      expect(output).toContain('.note');
    });
  });

  describe('Alert blocks with inline formatting', () => {
    it('should handle bold text in alerts', () => {
      const input = '> [!IMPORTANT]\n> **Bold** important text';
      const output = convert(input);
      expect(output).toContain('<p class="important">');
      expect(output).toContain('<strong>Bold</strong>');
    });

    it('should handle links in alerts', () => {
      const input = '> [!NOTE]\n> Check [this link](https://example.com)';
      const output = convert(input);
      expect(output).toContain('<p class="note">');
      expect(output).toContain('<a');
      expect(output).toContain('href="https://example.com"');
    });

    it('should handle code in alerts', () => {
      const input = '> [!TIP]\n> Use `const` instead of `var`';
      const output = convert(input);
      expect(output).toContain('<p class="tip">');
      expect(output).toContain('<code>const</code>');
      expect(output).toContain('<code>var</code>');
    });
  });

  describe('Edge cases', () => {
    it('should handle alert without content', () => {
      const input = '> [!NOTE]\n> ';
      const output = convert(input);
      expect(output).toContain('<p class="note">');
    });

    it('should handle multiline alert content', () => {
      const input = '> [!IMPORTANT]\n> Line 1\n> Line 2\n> Line 3';
      const output = convert(input);
      expect(output).toContain('<p class="important">');
      expect(output).toContain('Line 1');
      expect(output).toContain('Line 2');
      expect(output).toContain('Line 3');
    });

    it('should handle unknown alert types as regular blockquotes', () => {
      const input = '> [!UNKNOWN]\n> This is unknown';
      const output = convert(input);
      // Should fall back to blockquote or handle gracefully
      expect(output).toBeDefined();
    });
  });

  describe('convertBlockquotes function', () => {
    it('should be exported and callable', () => {
      expect(markdownServicenow.convertBlockquotes).toBeDefined();
      expect(typeof markdownServicenow.convertBlockquotes).toBe('function');
    });
  });

  describe('Custom alert types', () => {
    const customAlerts = {
      myalert: {
        displayName: 'MY ALERT',
        emoji: '🎯',
        backgroundColor: '#f0f0f0',
        textColor: '#333333',
        borderColor: '#666666'
      }
    };

    it('should convert custom alert type', () => {
      const input = '> [!MYALERT]\n> Custom alert content';
      const output = markdownServicenow.convertMarkdownToServiceNow(input, {
        skipCodeTags: true,
        customAlerts
      });
      expect(output).toContain('<p class="myalert">');
      expect(output).toContain('🎯');
      expect(output).toContain('MY ALERT:');
      expect(output).toContain('Custom alert content');
    });

    it('should generate CSS for custom alert', () => {
      const input = '> [!MYALERT]\n> Custom alert content';
      const output = markdownServicenow.convertMarkdownToServiceNow(input, { customAlerts });
      expect(output).toContain('.myalert');
      expect(output).toContain('background-color: #f0f0f0');
      expect(output).toContain('color: #333333');
      expect(output).toContain('border-left: 4px solid #666666');
    });

    it('should allow custom alerts to override built-in alerts', () => {
      const customNote = {
        note: {
          displayName: 'CUSTOM NOTE',
          emoji: '📓',
          backgroundColor: '#e8f4fd',
          textColor: '#1a5276',
          borderColor: '#3498db'
        }
      };
      const input = '> [!NOTE]\n> Overridden note';
      const output = markdownServicenow.convertMarkdownToServiceNow(input, {
        skipCodeTags: true,
        customAlerts: customNote
      });
      expect(output).toContain('📓');
      expect(output).toContain('CUSTOM NOTE:');
    });

    it('should generate correct CSS for overridden built-in alert', () => {
      const customNote = {
        note: {
          displayName: 'CUSTOM NOTE',
          emoji: '📓',
          backgroundColor: '#e8f4fd',
          textColor: '#1a5276',
          borderColor: '#3498db'
        }
      };
      const input = '> [!NOTE]\n> Overridden note';
      const output = markdownServicenow.convertMarkdownToServiceNow(input, { customAlerts: customNote });
      expect(output).toContain('background-color: #e8f4fd');
      expect(output).toContain('color: #1a5276');
    });

    it('should handle multiple custom alerts', () => {
      const multipleCustom = {
        alert1: { displayName: 'ALERT ONE', emoji: '1️⃣', backgroundColor: '#fff', textColor: '#000', borderColor: '#111' },
        alert2: { displayName: 'ALERT TWO', emoji: '2️⃣', backgroundColor: '#eee', textColor: '#222', borderColor: '#333' }
      };
      const input = '> [!ALERT1]\n> First\n\n> [!ALERT2]\n> Second';
      const output = markdownServicenow.convertMarkdownToServiceNow(input, {
        skipCodeTags: true,
        customAlerts: multipleCustom
      });
      expect(output).toContain('<p class="alert1">');
      expect(output).toContain('<p class="alert2">');
      expect(output).toContain('ALERT ONE:');
      expect(output).toContain('ALERT TWO:');
    });

    it('should still convert built-in alerts when custom alerts are provided', () => {
      const input = '> [!NOTE]\n> Built-in note\n\n> [!MYALERT]\n> Custom alert';
      const output = markdownServicenow.convertMarkdownToServiceNow(input, {
        skipCodeTags: true,
        customAlerts
      });
      expect(output).toContain('<p class="note">');
      expect(output).toContain('<p class="myalert">');
    });

    it('should handle empty customAlerts object', () => {
      const input = '> [!NOTE]\n> Regular note';
      const output = markdownServicenow.convertMarkdownToServiceNow(input, {
        skipCodeTags: true,
        customAlerts: {}
      });
      expect(output).toContain('<p class="note">');
      expect(output).toContain('📝');
    });
  });

  describe('getBuiltInAlerts function', () => {
    it('should be exported and callable', () => {
      expect(markdownServicenow.getBuiltInAlerts).toBeDefined();
      expect(typeof markdownServicenow.getBuiltInAlerts).toBe('function');
    });

    it('should return all 10 built-in alerts', () => {
      const builtIn = markdownServicenow.getBuiltInAlerts();
      expect(Object.keys(builtIn)).toHaveLength(10);
      expect(builtIn.status).toBeDefined();
      expect(builtIn.important).toBeDefined();
      expect(builtIn.success).toBeDefined();
      expect(builtIn.note).toBeDefined();
      expect(builtIn.tip).toBeDefined();
      expect(builtIn.attention).toBeDefined();
      expect(builtIn.warning).toBeDefined();
      expect(builtIn.caution).toBeDefined();
      expect(builtIn.blocker).toBeDefined();
      expect(builtIn.question).toBeDefined();
    });

    it('should return complete alert configurations', () => {
      const builtIn = markdownServicenow.getBuiltInAlerts();
      const note = builtIn.note;
      expect(note.name).toBe('note');
      expect(note.displayName).toBe('NOTE');
      expect(note.emoji).toBe('📝');
      expect(note.backgroundColor).toBe('#eaf2f8');
      expect(note.textColor).toBe('#325d7a');
      expect(note.borderColor).toBe('#5b8def');
    });

    it('should return a copy (not a reference)', () => {
      const builtIn1 = markdownServicenow.getBuiltInAlerts();
      const builtIn2 = markdownServicenow.getBuiltInAlerts();
      builtIn1.note.emoji = 'modified';
      expect(builtIn2.note.emoji).toBe('📝');
    });
  });
});
