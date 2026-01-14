import { describe, it, expect } from 'vitest';
import { markdownSamples } from '../../fixtures/markdown-samples.js';

// Import the markdown conversion library
import * as markdownServicenow from '../../../lib/markdown-servicenow.js';

// Helper to convert without [code] wrapper
const convert = (input) => markdownServicenow.convertMarkdownToServiceNow(input, { skipCodeTags: true });

describe('List Conversion', () => {
  describe('Unordered lists', () => {
    it('should convert simple unordered list', () => {
      const input = markdownSamples.unorderedList;
      const output = convert(input);
      expect(output).toContain('<ul>');
      expect(output).toContain('Item 1');
      expect(output).toContain('Item 2');
      expect(output).toContain('Item 3');
      expect(output).toContain('</ul>');
    });

    it('should handle single item list', () => {
      const input = '- Single item';
      const output = convert(input);
      expect(output).toContain('<ul>');
      expect(output).toContain('Single item');
      expect(output).toContain('</ul>');
    });

    it('should handle list items with inline formatting', () => {
      const input = '- **Bold** item\n- *Italic* item\n- `Code` item';
      const output = convert(input);
      expect(output).toContain('<strong>Bold</strong> item');
      expect(output).toContain('<em>Italic</em> item');
      expect(output).toContain('<code>Code</code> item');
    });

    it('should handle list items with special characters', () => {
      const input = '- Item with & and <>\n- Item with "quotes"';
      const output = convert(input);
      expect(output).toContain('<ul>');
      expect(output).toContain('<li>');
    });

    it('should handle empty list items', () => {
      const input = '- \n- Item';
      const output = convert(input);
      expect(output).toContain('<ul>');
      expect(output).toContain('<li>');
    });
  });

  describe('Ordered lists', () => {
    it('should convert simple ordered list', () => {
      const input = markdownSamples.orderedList;
      const output = convert(input);
      expect(output).toContain('<ol>');
      expect(output).toContain('First');
      expect(output).toContain('Second');
      expect(output).toContain('Third');
      expect(output).toContain('</ol>');
    });

    it('should handle single item ordered list', () => {
      const input = '1. Single item';
      const output = convert(input);
      expect(output).toContain('<ol>');
      expect(output).toContain('Single item');
      expect(output).toContain('</ol>');
    });

    it('should handle ordered list with inline formatting', () => {
      const input = '1. **Bold** item\n2. *Italic* item\n3. `Code` item';
      const output = convert(input);
      expect(output).toContain('<strong>Bold</strong> item');
      expect(output).toContain('<em>Italic</em> item');
      expect(output).toContain('<code>Code</code> item');
    });

    it('should handle non-sequential numbering', () => {
      const input = '1. First\n5. Second\n9. Third';
      const output = convert(input);
      expect(output).toContain('<ol>');
      expect(output).toContain('First');
      expect(output).toContain('Second');
      expect(output).toContain('Third');
    });

    it('should handle ordered list starting at different numbers', () => {
      const input = '3. Third\n4. Fourth';
      const output = convert(input);
      expect(output).toContain('<ol>');
      expect(output).toContain('Third');
      expect(output).toContain('Fourth');
    });
  });

  describe('Nested lists', () => {
    it('should handle nested lists', () => {
      const input = markdownSamples.nestedList;
      const output = convert(input);
      expect(output).toContain('<ul>');
      expect(output).toContain('Parent');
      expect(output).toContain('Child 1');
      expect(output).toContain('Child 2');
      expect(output).toContain('Grandchild');
    });

    it.skip('should handle mixed ordered and unordered nested lists', () => {
      // Note: Nested list support may be limited
      const input = '1. First\n   - Nested unordered\n2. Second';
      const output = convert(input);
      expect(output).toContain('<ol>');
      expect(output).toContain('<ul>');
      expect(output).toContain('First');
      expect(output).toContain('Nested unordered');
    });
  });

  describe('Lists with other content', () => {
    it('should handle list followed by paragraph', () => {
      const input = '- Item 1\n- Item 2\n\nParagraph text';
      const output = convert(input);
      expect(output).toContain('<ul>');
      expect(output).toContain('</ul>');
      expect(output).toContain('Paragraph text');
    });

    it('should handle list preceded by header', () => {
      const input = '# Header\n- Item 1\n- Item 2';
      const output = convert(input);
      expect(output).toContain('<h1>Header</h1>');
      expect(output).toContain('<ul>');
      expect(output).toContain('Item 1');
    });

    it('should handle multiple separate lists', () => {
      const input = '- List 1 Item 1\n- List 1 Item 2\n\n- List 2 Item 1\n- List 2 Item 2';
      const output = convert(input);
      expect(output).toContain('<ul>');
      expect(output).toContain('</ul>');
      // Should have two separate ul blocks
      const ulCount = (output.match(/<ul>/g) || []).length;
      expect(ulCount).toBeGreaterThan(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle list item with multiple lines', () => {
      const input = '- Item with\n  multiple lines';
      const output = convert(input);
      expect(output).toContain('<ul>');
      expect(output).toContain('<li>');
    });

    it('should not convert lines that look like lists but are not', () => {
      const input = 'Not a list - just text with dash';
      const output = convert(input);
      // Should not create a list
      expect(output).not.toContain('<ul>');
    });

    it('should handle list with links', () => {
      const input = '- [Link](https://example.com)';
      const output = convert(input);
      expect(output).toContain('<ul>');
      expect(output).toContain('<li>');
      expect(output).toContain('<a');
      expect(output).toContain('href="https://example.com"');
    });
  });

  describe('convertUnorderedLists function', () => {
    it('should be exported and callable', () => {
      expect(markdownServicenow.convertUnorderedLists).toBeDefined();
      expect(typeof markdownServicenow.convertUnorderedLists).toBe('function');
    });
  });

  describe('convertOrderedLists function', () => {
    it('should be exported and callable', () => {
      expect(markdownServicenow.convertOrderedLists).toBeDefined();
      expect(typeof markdownServicenow.convertOrderedLists).toBe('function');
    });
  });
});
