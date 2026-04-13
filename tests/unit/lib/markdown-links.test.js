import { describe, it, expect } from 'vitest';
import { markdownSamples } from '../../fixtures/markdown-samples.js';
import * as markdownServicenow from '../../../lib/markdown-servicenow.js';

const convert = (input) =>
  markdownServicenow.convertMarkdownToServiceNow(input, { skipCodeTags: true, skipPrettyPrint: true });

describe('Link Conversion', () => {
  describe('Markdown link syntax', () => {
    it('should convert a simple link', () => {
      const output = convert(markdownSamples.link);
      expect(output).toContain('<a href="https://example.com">Link text</a>');
    });

    it('should preserve underscores in link URL', () => {
      const output = convert(markdownSamples.linkWithUnderscoreInUrl);
      expect(output).not.toContain('<em>');
      expect(output).toContain('sys_id=abc_123');
      expect(output).toContain('<a href=');
    });

    it('should preserve underscores in link text', () => {
      const output = convert(markdownSamples.linkWithUnderscoreInText);
      expect(output).not.toContain('<em>');
      expect(output).toContain('>my_api_docs<');
    });

    it('should handle link with two underscores in URL path', () => {
      const output = convert('[text](https://example.com/foo_bar_baz)');
      expect(output).not.toContain('<em>');
      expect(output).toContain('href="https://example.com/foo_bar_baz"');
    });

    it('should handle link with _foo_ pattern in URL', () => {
      const output = convert('[text](https://example.com/_foo_/bar)');
      expect(output).not.toContain('<em>');
      expect(output).toContain('/_foo_/');
    });
  });

  describe('Bare URLs (regression: underscore broken as italic)', () => {
    it('should preserve underscores in bare URL', () => {
      const output = convert(markdownSamples.bareUrlWithUnderscores);
      expect(output).not.toContain('<em>');
      expect(output).toContain('https://some_api_service.example.com');
    });

    it('should preserve bare URL with two underscores forming italic pattern', () => {
      const output = convert('Check https://api_v2_server.example.com for info');
      expect(output).not.toContain('<em>');
      expect(output).toContain('https://api_v2_server.example.com');
    });

    it('should preserve ServiceNow bare URL with sys_id', () => {
      const output = convert('Link: https://myinstance.service-now.com/kb_view.do?sysparm_article=KB_001_foo_bar');
      expect(output).not.toContain('<em>');
      expect(output).toContain('KB_001_foo_bar');
    });

    it('should still convert italic text near a bare URL', () => {
      const output = convert('Use _italic_ and https://example.com/api_v2 here');
      expect(output).toContain('<em>italic</em>');
      expect(output).toContain('https://example.com/api_v2');
      expect(output).not.toContain('api<em>v2</em>');
    });
  });
});
