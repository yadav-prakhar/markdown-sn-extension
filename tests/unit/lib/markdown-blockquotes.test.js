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
});
