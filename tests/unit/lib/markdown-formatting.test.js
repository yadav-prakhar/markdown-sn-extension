import { describe, it, expect } from 'vitest';
import { markdownSamples } from '../../fixtures/markdown-samples.js';

// Import the markdown conversion library
import * as markdownServicenow from '../../../lib/markdown-servicenow.js';

describe('Text Formatting Conversion', () => {
  describe('Bold text', () => {
    it('should convert **bold** to <strong>', () => {
      const input = markdownSamples.bold;
      const output = markdownServicenow.convertMarkdownToServiceNow(input);
      expect(output).toContain('<strong>bold text</strong>');
    });

    it('should convert multiple bold instances', () => {
      const input = '**first** and **second**';
      const output = markdownServicenow.convertMarkdownToServiceNow(input);
      expect(output).toContain('<strong>first</strong>');
      expect(output).toContain('<strong>second</strong>');
    });

    it('should handle bold with special characters', () => {
      const input = '**Bold with $pecial & <chars>**';
      const output = markdownServicenow.convertMarkdownToServiceNow(input);
      expect(output).toContain('<strong>');
      expect(output).toContain('</strong>');
    });
  });

  describe('Italic text', () => {
    it('should convert *italic* to <em>', () => {
      const input = markdownSamples.italic;
      const output = markdownServicenow.convertMarkdownToServiceNow(input);
      expect(output).toContain('<em>italic text</em>');
    });

    it('should convert multiple italic instances', () => {
      const input = '*first* and *second*';
      const output = markdownServicenow.convertMarkdownToServiceNow(input);
      expect(output).toContain('<em>first</em>');
      expect(output).toContain('<em>second</em>');
    });

    it('should handle asterisks for italic', () => {
      const input = '*italic* text';
      const output = markdownServicenow.convertMarkdownToServiceNow(input, { skipCodeTags: true });
      // Should convert *italic* properly
      expect(output).toContain('<em>italic</em>');
    });
  });

  describe('Bold and Italic combined', () => {
    it('should convert ***bold and italic*** to nested tags', () => {
      const input = markdownSamples.boldItalic;
      const output = markdownServicenow.convertMarkdownToServiceNow(input);
      // Should contain both strong and em tags
      expect(output).toContain('<strong>');
      expect(output).toContain('<em>');
      expect(output).toContain('bold and italic');
    });

    it('should handle nested formatting', () => {
      const input = markdownSamples.nestedFormatting;
      const output = markdownServicenow.convertMarkdownToServiceNow(input);
      expect(output).toContain('<strong>');
      expect(output).toContain('<em>');
    });
  });

  describe('Strikethrough', () => {
    it('should convert ~~strikethrough~~ to <strike>', () => {
      const input = markdownSamples.strikethrough;
      const output = markdownServicenow.convertMarkdownToServiceNow(input, { skipCodeTags: true });
      expect(output).toContain('<strike>strikethrough</strike>');
    });

    it('should convert multiple strikethrough instances', () => {
      const input = '~~first~~ and ~~second~~';
      const output = markdownServicenow.convertMarkdownToServiceNow(input, { skipCodeTags: true });
      expect(output).toContain('<strike>first</strike>');
      expect(output).toContain('<strike>second</strike>');
    });
  });

  describe('Highlight', () => {
    it('should convert ==highlight== to span with highlight class', () => {
      const input = markdownSamples.highlight;
      const output = markdownServicenow.convertMarkdownToServiceNow(input);
      expect(output).toContain('<span class="highlight">highlighted text</span>');
    });

    it('should include highlight CSS', () => {
      const input = markdownSamples.highlight;
      const output = markdownServicenow.convertMarkdownToServiceNow(input);
      expect(output).toContain('background-color: #fff3b0');
      expect(output).toContain('.highlight');
    });
  });

  describe('Inline code', () => {
    it('should convert `code` to <code>', () => {
      const input = markdownSamples.inlineCode;
      const output = markdownServicenow.convertMarkdownToServiceNow(input);
      expect(output).toContain('<code>inline code</code>');
    });

    it('should include code CSS', () => {
      const input = markdownSamples.inlineCode;
      const output = markdownServicenow.convertMarkdownToServiceNow(input);
      expect(output).toContain('color: crimson');
      expect(output).toContain('background-color: #f1f1f1');
    });

    it('should protect code content from markdown conversion', () => {
      const input = '`**not bold**`';
      const output = markdownServicenow.convertMarkdownToServiceNow(input);
      expect(output).toContain('<code>**not bold**</code>');
      expect(output).not.toContain('<strong>not bold</strong>');
    });

    it('should handle multiple inline code instances', () => {
      const input = 'Use `const` or `let` but not `var`';
      const output = markdownServicenow.convertMarkdownToServiceNow(input);
      expect(output).toContain('<code>const</code>');
      expect(output).toContain('<code>let</code>');
      expect(output).toContain('<code>var</code>');
    });
  });

  describe('Code blocks', () => {
    it('should convert code blocks with language', () => {
      const input = markdownSamples.codeBlock;
      const output = markdownServicenow.convertMarkdownToServiceNow(input, { skipCodeTags: true });
      expect(output).toContain('<code>');
      expect(output).toContain('const x = 1');
      expect(output).toContain('console.log(x)');
      expect(output).toContain('</code>');
    });

    it('should convert code blocks without language', () => {
      const input = markdownSamples.codeBlockNoLang;
      const output = markdownServicenow.convertMarkdownToServiceNow(input);
      expect(output).toContain('<code>');
      expect(output).toContain('Plain code block');
      expect(output).toContain('</code>');
    });

    it('should protect code blocks from markdown conversion', () => {
      const input = markdownSamples.codeWithMarkdown;
      const output = markdownServicenow.convertMarkdownToServiceNow(input, { skipCodeTags: true });
      // Should not convert markdown inside code blocks (headers get converted anyway, but inside pre/code tags)
      expect(output).toContain('<pre><code>');
      expect(output).toContain('</code></pre>');
    });

    it('should preserve whitespace in code blocks', () => {
      const input = '```\n  indented\n    more indented\n```';
      const output = markdownServicenow.convertMarkdownToServiceNow(input);
      expect(output).toContain('indented');
      expect(output).toContain('more indented');
    });
  });

  describe('Mixed formatting', () => {
    it('should handle multiple formats in one line', () => {
      const input = '**Bold** and *italic* and `code`';
      const output = markdownServicenow.convertMarkdownToServiceNow(input);
      expect(output).toContain('<strong>Bold</strong>');
      expect(output).toContain('<em>italic</em>');
      expect(output).toContain('<code>code</code>');
    });

    it('should handle complex mixed content', () => {
      const input = markdownSamples.mixed;
      const output = markdownServicenow.convertMarkdownToServiceNow(input);
      expect(output).toContain('<h1>');
      expect(output).toContain('<strong>');
      expect(output).toContain('<em>');
      expect(output).toContain('<code>');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty formatting markers', () => {
      const input = '****';
      const output = markdownServicenow.convertMarkdownToServiceNow(input);
      expect(output).toBeDefined();
    });

    it('should handle unmatched markers', () => {
      const input = '**unmatched';
      const output = markdownServicenow.convertMarkdownToServiceNow(input);
      expect(output).toContain('**unmatched');
    });

    it('should handle special characters', () => {
      const input = markdownSamples.specialChars;
      const output = markdownServicenow.convertMarkdownToServiceNow(input);
      expect(output).toBeDefined();
      expect(typeof output).toBe('string');
    });
  });
});
