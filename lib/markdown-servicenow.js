// Bundled markdown-servicenow library for browser use
// Based on markdown-servicenow npm package v1.0.1

(function(global) {
  'use strict';

  // CSS Styles
  const CODE_CSS = `<style type="text/css">
code { color: crimson; background-color: #f1f1f1; padding-left: 4px; padding-right: 4px; font-size: 110%; }
</style>
`;

  const HIGHLIGHT_CSS = `<style type="text/css">
.highlight { background-color: #fff3b0; padding: 2px 4px; }
</style>
`;

  const ALERT_CSS = `<style type="text/css">
.note { color: #1f6feb; background-color: #e6ecff; padding: 8px 12px; border-left: 4px solid #1f6feb; display: block; margin: 8px 0; }
.tip { color: #1a7f37; background-color: #e6ffec; padding: 8px 12px; border-left: 4px solid #1a7f37; display: block; margin: 8px 0; }
.important { color: #8250df; background-color: #f3e8ff; padding: 8px 12px; border-left: 4px solid #8250df; display: block; margin: 8px 0; }
.warning { color: #9a6700; background-color: #fff8c5; padding: 8px 12px; border-left: 4px solid #9a6700; display: block; margin: 8px 0; }
.caution { color: #cf222e; background-color: #ffebe9; padding: 8px 12px; border-left: 4px solid #cf222e; display: block; margin: 8px 0; }
</style>
`;

  const TABLE_CSS = `<style type="text/css">
.tg  {border-collapse:collapse;border-spacing:0;}
.tg td{border-color:black;border-style:solid;border-width:1px;font-family:Arial, sans-serif;font-size:14px;
  overflow:hidden;padding:10px 5px;word-break:normal;}
.tg th{border-color:black;border-style:solid;border-width:1px;font-family:Arial, sans-serif;font-size:14px;
  font-weight:normal;overflow:hidden;padding:10px 5px;word-break:normal;}
.tg .tg-0pky{border-color:inherit;text-align:left;vertical-align:top}
</style>
`;

  // Header Conversion
  function convertHeaders(text) {
    return text.replace(/^(#{1,6})\s+(.*)$/gm, (_match, hashes, headerText) => {
      const level = hashes.length;
      return `<h${level}>${headerText}</h${level}>`;
    });
  }

  // Text Formatting
  function convertBoldItalic(text) {
    text = text.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
    text = text.replace(/___(.*?)___/g, '<strong><em>$1</em></strong>');
    return text;
  }

  function convertBold(text) {
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/__(.*?)__/g, '<strong>$1</strong>');
    return text;
  }

  function convertItalic(text) {
    text = text.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
    text = text.replace(/(?<!_)_([^_]+)_(?!_)/g, '<em>$1</em>');
    return text;
  }

  function convertStrikethrough(text) {
    return text.replace(/~~(.*?)~~/g, '<strike>$1</strike>');
  }

  function convertHighlight(text) {
    return text.replace(/==(.*?)==/g, '<span class="highlight">$1</span>');
  }

  function convertTextFormatting(text) {
    text = convertBoldItalic(text);
    text = convertBold(text);
    text = convertItalic(text);
    text = convertStrikethrough(text);
    text = convertHighlight(text);
    return text;
  }

  // Code Conversion
  function convertCodeBlocks(text) {
    return text.replace(/```[a-zA-Z]*\n([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  }

  function convertInlineCode(text) {
    return text.replace(/`([^`]+)`/g, '<code>$1</code>');
  }

  // Links and Images
  function convertImages(text) {
    return text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');
  }

  function convertLinks(text) {
    return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  }

  // Horizontal Rules
  function convertHorizontalRules(text) {
    return text.replace(/^[-*_]{3,}$/gm, '<hr>');
  }

  // List Conversion
  function convertList(text, pattern, wrapperTag) {
    const lines = text.split('\n');
    let inList = false;
    const formattedLines = [];
    let listItems = [];

    for (const line of lines) {
      if (pattern.test(line)) {
        if (!inList) {
          inList = true;
        }
        const item = line.replace(pattern, '');
        listItems.push(`<li>${item}</li>`);
      } else {
        if (inList) {
          formattedLines.push(`<${wrapperTag}>${listItems.join('')}</${wrapperTag}>`);
          listItems = [];
          inList = false;
        }
        formattedLines.push(line);
      }
    }

    if (inList) {
      formattedLines.push(`<${wrapperTag}>${listItems.join('')}</${wrapperTag}>`);
    }

    return formattedLines.join('\n');
  }

  function convertUnorderedLists(text) {
    return convertList(text, /^[-*]\s+/, 'ul');
  }

  function convertOrderedLists(text) {
    return convertList(text, /^\d+\.\s+/, 'ol');
  }

  // Blockquote Conversion
  function formatBlockquote(lines, alertType) {
    const content = lines.join('<br>');
    if (alertType) {
      return `<p class="${alertType}">ℹ️ <strong>${alertType.toUpperCase()}:</strong> ${content}</p>`;
    }
    return `<blockquote>${content}</blockquote>`;
  }

  function convertBlockquotes(text) {
    const lines = text.split('\n');
    let inBlockquote = false;
    const formattedLines = [];
    let blockquoteLines = [];
    let alertType = null;

    for (const line of lines) {
      if (line.startsWith('>')) {
        if (!inBlockquote) {
          inBlockquote = true;
        }
        let content = line.slice(1).trim();
        if (blockquoteLines.length === 0 && content.startsWith('[!')) {
          const match = content.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/);
          if (match) {
            alertType = match[1].toLowerCase();
            content = content.slice(match[0].length).trim();
            if (content) {
              blockquoteLines.push(content);
            }
            continue;
          }
        }
        blockquoteLines.push(content);
      } else {
        if (inBlockquote) {
          formattedLines.push(formatBlockquote(blockquoteLines, alertType));
          blockquoteLines = [];
          inBlockquote = false;
          alertType = null;
        }
        formattedLines.push(line);
      }
    }

    if (inBlockquote) {
      formattedLines.push(formatBlockquote(blockquoteLines, alertType));
    }

    return formattedLines.join('\n');
  }

  // Table Conversion
  function parseTable(tableText) {
    const tableLines = tableText.trim().split('\n');
    if (tableLines.length < 2) {
      return tableText;
    }

    const headerRow = tableLines[0];
    const separatorRow = tableLines[1];

    const headers = headerRow.split('|').slice(1, -1).map(cell => cell.trim());
    const separators = separatorRow.split('|').slice(1, -1).map(cell => cell.trim());

    if (!separators.every(sep => /^-+$/.test(sep) || sep === '')) {
      return tableText;
    }

    let html = '<table class="tg"><thead><tr>';
    for (const header of headers) {
      html += `<th class="tg-0pky">${header}</th>`;
    }
    html += '</tr></thead><tbody>';

    for (const row of tableLines.slice(2)) {
      if (row.trim()) {
        const cells = row.split('|').slice(1, -1).map(cell => cell.trim());
        html += '<tr>';
        for (const cell of cells) {
          html += `<td class="tg-0pky">${cell}</td>`;
        }
        html += '</tr>';
      }
    }

    html += '</tbody></table>';
    return html;
  }

  function convertTables(text) {
    return text.replace(/(?:^\|.*\|$\n?)+/gm, match => parseTable(match));
  }

  // Newline and Pretty-Print Handling
  function convertNewlinesOutsidePre(text) {
    const parts = text.split(/(<pre><code>[\s\S]*?<\/code><\/pre>)/);
    const result = [];

    for (const part of parts) {
      if (part.startsWith('<pre><code>')) {
        result.push(part);
      } else {
        let converted = part.replace(/\n/g, '<br/>');
        converted = converted.replace(/(\/h[1-6]>)<br\/>/g, '$1');
        result.push(converted);
      }
    }

    return result.join('');
  }

  function prettyPrintHtml(text) {
    text = text.replace(/<\/h[1-6]>|<\/ul>|<\/ol>|<\/blockquote>|<\/pre>/g, '$&\n');
    text = text.replace(/<br\/?>/g, '$&\n');
    text = text.replace(/<hr\/?>/g, '$&\n');
    text = text.replace(/<li>/g, '$&\n');
    text = text.replace(/<\/li>/g, '$&\n');
    return text;
  }

  // Output Wrapper
  function wrapWithCodeTags(text) {
    let css = '';
    if (text.includes('<code>')) {
      css += CODE_CSS;
    }
    if (text.includes('<span class="highlight">')) {
      css += HIGHLIGHT_CSS;
    }
    if (/class="(note|tip|important|warning|caution)"/.test(text)) {
      css += ALERT_CSS;
    }
    if (text.includes('<table class="tg">')) {
      css += TABLE_CSS;
    }
    if (css) {
      text = css + '\n' + text;
    }
    return `[code]${text}[/code]`;
  }

  // Main Converter
  function convertMarkdownToServiceNow(markdownText, options = {}) {
    let text = markdownText;

    text = convertHeaders(text);
    text = convertTextFormatting(text);
    text = convertCodeBlocks(text);
    text = convertInlineCode(text);
    text = convertImages(text);
    text = convertLinks(text);
    text = convertHorizontalRules(text);
    text = convertUnorderedLists(text);
    text = convertOrderedLists(text);
    text = convertBlockquotes(text);
    text = convertTables(text);
    text = convertNewlinesOutsidePre(text);

    if (!options.skipPrettyPrint) {
      text = prettyPrintHtml(text);
    }

    if (!options.skipCodeTags) {
      text = wrapWithCodeTags(text);
    }

    return text;
  }

  // Export for different environments
  const markdownServicenow = {
    convertMarkdownToServiceNow,
    convertHeaders,
    convertTextFormatting,
    convertCodeBlocks,
    convertInlineCode,
    convertImages,
    convertLinks,
    convertHorizontalRules,
    convertUnorderedLists,
    convertOrderedLists,
    convertBlockquotes,
    convertTables
  };

  // Browser global
  if (typeof window !== 'undefined') {
    window.markdownServicenow = markdownServicenow;
  }

  // Service Worker / Web Worker
  if (typeof self !== 'undefined' && typeof window === 'undefined') {
    self.markdownServicenow = markdownServicenow;
  }

  // CommonJS
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = markdownServicenow;
  }

})(typeof globalThis !== 'undefined' ? globalThis : typeof self !== 'undefined' ? self : this);
