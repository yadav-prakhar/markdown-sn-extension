import { describe, it, expect } from 'vitest';
import { markdownSamples } from '../../fixtures/markdown-samples.js';

// Import the markdown conversion library
// Note: We need to adjust the import path to work with the actual library location
import * as markdownServicenow from '../../../lib/markdown-servicenow.js';

describe('Markdown to ServiceNow Conversion - Smoke Tests', () => {
  describe('convertMarkdownToServiceNow', () => {
    it('should be defined and exported', () => {
      expect(markdownServicenow.convertMarkdownToServiceNow).toBeDefined();
      expect(typeof markdownServicenow.convertMarkdownToServiceNow).toBe('function');
    });

    it('should convert simple header', () => {
      const input = markdownSamples.singleHeader;
      const output = markdownServicenow.convertMarkdownToServiceNow(input);
      expect(output).toContain('<h1>');
      expect(output).toContain('Hello World');
      expect(output).toContain('</h1>');
    });

    it('should convert bold text', () => {
      const input = markdownSamples.bold;
      const output = markdownServicenow.convertMarkdownToServiceNow(input);
      expect(output).toContain('<strong>');
      expect(output).toContain('bold text');
      expect(output).toContain('</strong>');
    });

    it('should convert italic text', () => {
      const input = markdownSamples.italic;
      const output = markdownServicenow.convertMarkdownToServiceNow(input);
      expect(output).toContain('<em>');
      expect(output).toContain('italic text');
      expect(output).toContain('</em>');
    });

    it('should convert inline code', () => {
      const input = markdownSamples.inlineCode;
      const output = markdownServicenow.convertMarkdownToServiceNow(input);
      expect(output).toContain('<code>');
      expect(output).toContain('inline code');
      expect(output).toContain('</code>');
    });

    it('should handle empty input', () => {
      const input = markdownSamples.empty;
      const output = markdownServicenow.convertMarkdownToServiceNow(input);
      expect(output).toBeDefined();
      expect(typeof output).toBe('string');
    });

    it('should convert unordered list', () => {
      const input = markdownSamples.unorderedList;
      const output = markdownServicenow.convertMarkdownToServiceNow(input);
      expect(output).toContain('<ul>');
      expect(output).toContain('<li>');
      expect(output).toContain('Item 1');
      expect(output).toContain('</ul>');
    });

    it('should convert ordered list', () => {
      const input = markdownSamples.orderedList;
      const output = markdownServicenow.convertMarkdownToServiceNow(input);
      expect(output).toContain('<ol>');
      expect(output).toContain('<li>');
      expect(output).toContain('First');
      expect(output).toContain('</ol>');
    });

    it('should convert link', () => {
      const input = markdownSamples.link;
      const output = markdownServicenow.convertMarkdownToServiceNow(input);
      expect(output).toContain('<a');
      expect(output).toContain('href="https://example.com"');
      expect(output).toContain('Link text');
      expect(output).toContain('</a>');
    });

    it('should convert mixed content', () => {
      const input = markdownSamples.mixed;
      const output = markdownServicenow.convertMarkdownToServiceNow(input);
      expect(output).toContain('<h1>');
      expect(output).toContain('<strong>');
      expect(output).toContain('<em>');
      expect(output).toContain('<code>');
      expect(output).toContain('<ul>');
    });
  });
});
