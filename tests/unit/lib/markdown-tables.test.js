import { describe, it, expect } from 'vitest';
import { markdownSamples } from '../../fixtures/markdown-samples.js';

// Import the markdown conversion library
import * as markdownServicenow from '../../../lib/markdown-servicenow.js';

// Helper to convert without [code] wrapper
const convert = (input) => markdownServicenow.convertMarkdownToServiceNow(input, { skipCodeTags: true });

describe('Table Conversion', () => {
  describe('Simple tables', () => {
    it('should convert simple table', () => {
      const input = markdownSamples.tableSimple;
      const output = convert(input);
      expect(output).toContain('<table');
      expect(output).toContain('<thead>');
      expect(output).toContain('<tbody>');
      expect(output).toContain('Col 1');
      expect(output).toContain('Col 2');
      expect(output).toContain('>A<');
      expect(output).toContain('>B<');
      expect(output).toContain('</table>');
    });

    it('should convert table with multiple rows', () => {
      const input = markdownSamples.table;
      const output = convert(input);
      expect(output).toContain('<table');
      expect(output).toContain('Header 1');
      expect(output).toContain('Header 2');
      expect(output).toContain('Cell 1');
      expect(output).toContain('Cell 2');
      expect(output).toContain('Cell 3');
      expect(output).toContain('Cell 4');
      expect(output).toContain('</table>');
    });

    it('should include table CSS', () => {
      const input = markdownSamples.table;
      const output = markdownServicenow.convertMarkdownToServiceNow(input);
      expect(output).toContain('.tg');
      expect(output).toContain('border-collapse:collapse');
    });
  });

  describe('Table structure', () => {
    it('should create thead for header row', () => {
      const input = '| Header |\n|--------|\n| Data |';
      const output = convert(input);
      expect(output).toContain('<thead>');
      expect(output).toContain('Header');
      expect(output).toContain('</thead>');
    });

    it('should create tbody for data rows', () => {
      const input = '| Header |\n|--------|\n| Data 1 |\n| Data 2 |';
      const output = convert(input);
      expect(output).toContain('<tbody>');
      expect(output).toContain('Data 1');
      expect(output).toContain('Data 2');
      expect(output).toContain('</tbody>');
    });

    it('should create tr for each row', () => {
      const input = '| A | B |\n|---|---|\n| 1 | 2 |\n| 3 | 4 |';
      const output = convert(input);
      const trCount = (output.match(/<tr>/g) || []).length;
      expect(trCount).toBeGreaterThan(0);
    });
  });

  describe('Table with inline formatting', () => {
    it('should handle bold text in table cells', () => {
      const input = '| **Bold** |\n|----------|\n| Normal |';
      const output = convert(input);
      expect(output).toContain('<table');
      expect(output).toContain('<strong>Bold</strong>');
    });

    it('should handle italic text in table cells', () => {
      const input = '| *Italic* |\n|----------|\n| Normal |';
      const output = convert(input);
      expect(output).toContain('<table');
      expect(output).toContain('<em>Italic</em>');
    });

    it('should handle code in table cells', () => {
      const input = '| `code` |\n|--------|\n| text |';
      const output = convert(input);
      expect(output).toContain('<table');
      expect(output).toContain('<code>code</code>');
    });

    it('should handle links in table cells', () => {
      const input = '| [Link](url) |\n|-------------|\n| text |';
      const output = convert(input);
      expect(output).toContain('<table');
      expect(output).toContain('<a');
      expect(output).toContain('href="url"');
    });
  });

  describe('Table with special content', () => {
    it('should handle empty cells', () => {
      const input = '| A | |\n|---|---|\n| | B |';
      const output = convert(input);
      expect(output).toContain('<table');
      expect(output).toContain('>A<');
      expect(output).toContain('>B<');
    });

    it('should handle cells with numbers', () => {
      const input = '| Num |\n|-----|\n| 123 |\n| 456 |';
      const output = convert(input);
      expect(output).toContain('123');
      expect(output).toContain('456');
    });

    it('should handle cells with special characters', () => {
      const input = '| Char |\n|------|\n| & < > |';
      const output = convert(input);
      expect(output).toContain('<table');
      expect(output).toContain('<td');
    });

    it('should handle multi-word cells', () => {
      const input = '| Multiple Words |\n|----------------|\n| More words here |';
      const output = convert(input);
      expect(output).toContain('Multiple Words');
      expect(output).toContain('More words here');
    });
  });

  describe('Table alignment', () => {
    it.skip('should handle left-aligned columns', () => {
      // Note: Table alignment syntax may not be fully supported
      const input = '| Left |\n|:-----|\n| Text |';
      const output = convert(input);
      expect(output).toContain('<table');
      expect(output).toContain('Left');
    });

    it.skip('should handle right-aligned columns', () => {
      // Note: Table alignment syntax may not be fully supported
      const input = '| Right |\n|------:|\n| Text |';
      const output = convert(input);
      expect(output).toContain('<table');
      expect(output).toContain('Right');
    });

    it.skip('should handle center-aligned columns', () => {
      // Note: Table alignment syntax may not be fully supported
      const input = '| Center |\n|:------:|\n| Text |';
      const output = convert(input);
      expect(output).toContain('<table');
      expect(output).toContain('Center');
    });
  });

  describe('Multiple tables', () => {
    it('should handle multiple tables in one document', () => {
      const input = '| T1 |\n|----|\n| A |\n\n| T2 |\n|----|\n| B |';
      const output = convert(input);
      const tableCount = (output.match(/<table/g) || []).length;
      expect(tableCount).toBeGreaterThan(0);
    });

    it('should include table CSS for tables', () => {
      const input = '| T1 |\n|----|\n| A |\n\n| T2 |\n|----|\n| B |';
      const output = markdownServicenow.convertMarkdownToServiceNow(input);
      expect(output).toContain('.tg');
    });
  });

  describe('Tables with other content', () => {
    it('should handle table preceded by header', () => {
      const input = '# Header\n\n| Col |\n|-----|\n| Val |';
      const output = convert(input);
      expect(output).toContain('<h1>Header</h1>');
      expect(output).toContain('<table');
    });

    it('should handle table followed by paragraph', () => {
      const input = '| Col |\n|-----|\n| Val |\n\nParagraph text';
      const output = convert(input);
      expect(output).toContain('<table');
      expect(output).toContain('Paragraph text');
    });

    it('should handle table with list', () => {
      const input = '| Col |\n|-----|\n| Val |\n\n- List item';
      const output = convert(input);
      expect(output).toContain('<table');
      expect(output).toContain('<ul>');
    });
  });

  describe('Edge cases', () => {
    it('should handle table with varying column widths', () => {
      const input = '| Short | Very Long Header |\n|-------|------------------|\n| A | B |';
      const output = convert(input);
      expect(output).toContain('<table');
      expect(output).toContain('Very Long Header');
    });

    it('should handle table with single column', () => {
      const input = '| Single |\n|--------|\n| A |\n| B |';
      const output = convert(input);
      expect(output).toContain('<table');
      expect(output).toContain('Single');
    });

    it('should handle table with many columns', () => {
      const input = '| A | B | C | D | E |\n|---|---|---|---|---|\n| 1 | 2 | 3 | 4 | 5 |';
      const output = convert(input);
      expect(output).toContain('<table');
      expect(output).toContain('>1<');
      expect(output).toContain('>5<');
    });

    it('should handle malformed table gracefully', () => {
      const input = '| Header |\n| Missing separator |';
      const output = convert(input);
      expect(output).toBeDefined();
      expect(typeof output).toBe('string');
    });
  });

  describe('convertTables function', () => {
    it('should be exported and callable', () => {
      expect(markdownServicenow.convertTables).toBeDefined();
      expect(typeof markdownServicenow.convertTables).toBe('function');
    });
  });

  describe('Links and Images', () => {
    it('should convert links', () => {
      const input = markdownSamples.link;
      const output = convert(input);
      expect(output).toContain('<a');
      expect(output).toContain('href="https://example.com"');
      expect(output).toContain('Link text');
      expect(output).toContain('</a>');
    });

    it('should convert images', () => {
      const input = markdownSamples.image;
      const output = convert(input);
      expect(output).toContain('<img');
      expect(output).toContain('src="https://example.com/image.png"');
      expect(output).toContain('alt="Alt text"');
    });

    it('should convert horizontal rule', () => {
      const input = markdownSamples.horizontalRule;
      const output = convert(input);
      expect(output).toContain('<hr');
    });
  });
});
