export const markdownSamples = {
  // Headers
  headers: '# H1\n## H2\n### H3\n#### H4\n##### H5\n###### H6',
  singleHeader: '# Hello World',

  // Text formatting
  bold: '**bold text**',
  italic: '*italic text*',
  boldItalic: '***bold and italic***',
  strikethrough: '~~strikethrough~~',
  highlight: '==highlighted text==',

  // Code
  inlineCode: '`inline code`',
  codeBlock: '```javascript\nconst x = 1;\nconsole.log(x);\n```',
  codeBlockNoLang: '```\nPlain code block\n```',

  // Lists
  unorderedList: '- Item 1\n- Item 2\n- Item 3',
  orderedList: '1. First\n2. Second\n3. Third',
  nestedList: '- Parent\n  - Child 1\n  - Child 2\n    - Grandchild',

  // Links and images
  link: '[Link text](https://example.com)',
  image: '![Alt text](https://example.com/image.png)',

  // Blockquotes
  blockquote: '> This is a quote\n> spanning multiple lines',

  // Alert blocks
  alertImportant: '> [!IMPORTANT]\n> This is important',
  alertSuccess: '> [!SUCCESS]\n> Operation succeeded',
  alertWarning: '> [!WARNING]\n> This is a warning',
  alertNote: '> [!NOTE]\n> This is a note',
  alertTip: '> [!TIP]\n> Here\'s a tip',
  alertAttention: '> [!ATTENTION]\n> Pay attention',
  alertCaution: '> [!CAUTION]\n> Be cautious',
  alertBlocker: '> [!BLOCKER]\n> This blocks progress',
  alertStatus: '> [!STATUS]\n> Current status',
  alertQuestion: '> [!QUESTION]\n> Is this working?',

  // Tables
  table: '| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |\n| Cell 3   | Cell 4   |',
  tableSimple: '| Col 1 | Col 2 |\n|-------|-------|\n| A | B |',

  // Horizontal rule
  horizontalRule: '---',

  // Mixed content
  mixed: '# Title\n\nThis is a paragraph with **bold** and *italic* text.\n\n```javascript\nconst code = true;\n```\n\n- List item 1\n- List item 2\n\n> [!NOTE]\n> Important note here',

  // Edge cases
  empty: '',
  whitespace: '   \n\n   ',
  multipleNewlines: '\n\n\n',
  specialChars: 'Text with <html> & "quotes" and \'apostrophes\'',
  underscoreVsItalic: 'file_name_here vs *italic* text',

  // Complex scenarios
  nestedFormatting: '**Bold with *italic* inside**',
  codeWithMarkdown: '```\n# This should not be a header\n**Not bold**\n```',
  linkInBold: '**[Bold link](https://example.com)**'
};

export const expectedOutputs = {
  // These are partial matches to verify conversion worked
  singleHeader: '<h1>Hello World</h1>',
  bold: '<strong>bold text</strong>',
  italic: '<em>italic text</em>',
  inlineCode: '<code>inline code</code>',
  link: '<a href="https://example.com">Link text</a>',
  unorderedList: '<ul>',
  orderedList: '<ol>',
  blockquote: '<blockquote>',
  table: '<table>',
  horizontalRule: '<hr>'
};
