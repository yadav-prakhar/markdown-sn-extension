import { describe, it, expect } from 'vitest';
import { markdownSamples } from '../../fixtures/markdown-samples.js';

// Import the markdown conversion library
import * as markdownServicenow from '../../../lib/markdown-servicenow.js';

describe('Header Conversion', () => {
  describe('convertHeaders function', () => {
    it('should convert h1 headers', () => {
      const input = '# H1 Header';
      const output = markdownServicenow.convertHeaders(input);
      expect(output).toBe('<h1>H1 Header</h1>');
    });

    it('should convert h2 headers', () => {
      const input = '## H2 Header';
      const output = markdownServicenow.convertHeaders(input);
      expect(output).toBe('<h2>H2 Header</h2>');
    });

    it('should convert h3 headers', () => {
      const input = '### H3 Header';
      const output = markdownServicenow.convertHeaders(input);
      expect(output).toBe('<h3>H3 Header</h3>');
    });

    it('should convert h4 headers', () => {
      const input = '#### H4 Header';
      const output = markdownServicenow.convertHeaders(input);
      expect(output).toBe('<h4>H4 Header</h4>');
    });

    it('should convert h5 headers', () => {
      const input = '##### H5 Header';
      const output = markdownServicenow.convertHeaders(input);
      expect(output).toBe('<h5>H5 Header</h5>');
    });

    it('should convert h6 headers', () => {
      const input = '###### H6 Header';
      const output = markdownServicenow.convertHeaders(input);
      expect(output).toBe('<h6>H6 Header</h6>');
    });

    it('should convert multiple headers of different levels', () => {
      const input = '# H1\n## H2\n### H3';
      const output = markdownServicenow.convertHeaders(input);
      expect(output).toContain('<h1>H1</h1>');
      expect(output).toContain('<h2>H2</h2>');
      expect(output).toContain('<h3>H3</h3>');
    });

    it('should not convert more than 6 hashes', () => {
      const input = '####### Seven Hashes';
      const output = markdownServicenow.convertHeaders(input);
      expect(output).toBe(input); // Should remain unchanged
    });

    it('should not convert headers without space after hash', () => {
      const input = '#NoSpace';
      const output = markdownServicenow.convertHeaders(input);
      expect(output).toBe(input); // Should remain unchanged
    });

    it('should handle headers with special characters', () => {
      const input = '# Header with $pecial & <chars>';
      const output = markdownServicenow.convertHeaders(input);
      expect(output).toContain('<h1>Header with $pecial & <chars></h1>');
    });

    it('should handle empty header text', () => {
      const input = '# ';
      const output = markdownServicenow.convertHeaders(input);
      expect(output).toContain('<h1></h1>');
    });

    it('should preserve inline formatting in headers', () => {
      const input = '# **Bold** Header';
      const output = markdownServicenow.convertHeaders(input);
      expect(output).toContain('<h1>**Bold** Header</h1>');
    });
  });

  describe('Full conversion with headers', () => {
    it('should convert all header levels in full conversion', () => {
      const input = markdownSamples.headers;
      const output = markdownServicenow.convertMarkdownToServiceNow(input);
      expect(output).toContain('<h1>H1</h1>');
      expect(output).toContain('<h2>H2</h2>');
      expect(output).toContain('<h3>H3</h3>');
      expect(output).toContain('<h4>H4</h4>');
      expect(output).toContain('<h5>H5</h5>');
      expect(output).toContain('<h6>H6</h6>');
    });

    it('should convert single header in context', () => {
      const input = markdownSamples.singleHeader;
      const output = markdownServicenow.convertMarkdownToServiceNow(input);
      expect(output).toContain('<h1>Hello World</h1>');
    });
  });
});
