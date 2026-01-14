# CLAUDE.md

Project instructions for Claude Code when working with this repository.

## Project Overview

**Markdown to ServiceNow** is a Chrome Extension (Manifest V3) that converts Markdown to ServiceNow journal field format. It provides three conversion methods:
1. **Popup converter** - Click extension icon, paste markdown, copy output
2. **Context menu** - Right-click selected text to convert
3. **In-page buttons** - Convert buttons on ServiceNow journal fields

**Version:** 1.1.3
**Library:** markdown-servicenow v1.0.5 (bundled)

## Quick Reference

```bash
# Install dependencies (also installs git hooks)
npm install

# Run tests
npm test

# Run tests with watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- tests/unit/lib/markdown-blockquotes.test.js

# Manually install git hooks
bash scripts/install-hooks.sh
```

## Git Hooks

**Pre-push hook** - Automatically runs tests before pushing. Push is blocked if tests fail.

Hooks are installed automatically via `npm install` (prepare script). To reinstall manually:
```bash
bash scripts/install-hooks.sh
```

## Project Structure

```
├── manifest.json              # Chrome Extension manifest (V3)
├── background/
│   └── background.js          # Service worker - context menu, message handling
├── content/
│   ├── content.js             # Injected into ServiceNow pages
│   └── content.css            # Toolbar and notification styles
├── popup/
│   ├── popup.html             # Popup UI structure
│   ├── popup.js               # Live conversion with debouncing
│   └── popup.css              # Popup styles
├── lib/
│   └── markdown-servicenow.js # Bundled conversion library
├── icons/
│   ├── Icon.svg               # Source SVG
│   └── Icon{16,32,48,64,128}.png
├── tests/
│   ├── fixtures/              # Test data (markdown-samples.js)
│   ├── mocks/                 # Chrome API mocks
│   ├── setup/                 # Vitest setup and helpers
│   └── unit/                  # Unit tests by component
├── vitest.config.js           # Test configuration
└── package.json               # Test dependencies only
```

## Architecture

### Component Responsibilities

| Component | File | Purpose |
|-----------|------|---------|
| **Background Worker** | `background/background.js` | Context menu, message routing |
| **Content Script** | `content/content.js` | Field detection, toolbar injection, in-place conversion |
| **Popup** | `popup/popup.js` | Standalone converter UI |
| **Library** | `lib/markdown-servicenow.js` | Core markdown conversion logic |

### Message Flow

```
┌─────────────┐     convertSelection      ┌─────────────────┐
│  Background │ ───────────────────────▶  │  Content Script │
│   Worker    │                           │  (does convert) │
└─────────────┘                           └─────────────────┘

┌─────────────┐   {action:'convert',text}  ┌─────────────────┐
│   Popup     │ ──────────────────────────▶│    Background   │
│             │◀────────────────────────── │  (returns HTML) │
└─────────────┘    {success, result}       └─────────────────┘
```

**Key messages:**
- `{action: 'convertSelection'}` - Background → Content: trigger conversion of selected text
- `{action: 'convert', text}` - Popup → Background: convert text, returns `{success, result}`

### Content Script Field Detection

**Targeted selectors** (journal fields only):
```javascript
const JOURNAL_SELECTORS = [
  'textarea[id$=".work_notes"]',
  'textarea[id$=".comments"]',
  'textarea[id^="activity-stream"]',
  '#activity-stream-textarea',
  '#activity-stream-work_notes-textarea',
  '#activity-stream-comments-textarea',
  '[data-type="journal_input"] textarea'
];
```

**Excluded patterns** (not journal fields):
- `description`, `short_description`, `resolution_notes`, `justification`

### Library Exports

```javascript
markdownServicenow.convertMarkdownToServiceNow(text, options)
// options: { skipCodeTags: bool, skipPrettyPrint: bool }

// Individual converters (for testing):
markdownServicenow.convertHeaders(text)
markdownServicenow.convertTextFormatting(text)
markdownServicenow.convertCodeBlocks(text)
markdownServicenow.convertInlineCode(text)
markdownServicenow.convertImages(text)
markdownServicenow.convertLinks(text)
markdownServicenow.convertHorizontalRules(text)
markdownServicenow.convertUnorderedLists(text)
markdownServicenow.convertOrderedLists(text)
markdownServicenow.convertBlockquotes(text)
markdownServicenow.convertTables(text)
```

## Supported Markdown

| Element | Syntax |
|---------|--------|
| Headers | `#` through `######` |
| Bold | `**text**` or `__text__` |
| Italic | `*text*` or `_text_` |
| Bold+Italic | `***text***` |
| Strikethrough | `~~text~~` |
| Highlight | `==text==` |
| Inline code | `` `code` `` |
| Code blocks | ` ``` ` fenced |
| Links | `[text](url)` |
| Images | `![alt](url)` |
| Unordered lists | `- item` or `* item` |
| Ordered lists | `1. item` |
| Blockquotes | `> quote` |
| Tables | Pipe-delimited |
| Horizontal rules | `---` or `***` |

### Alert Blocks

All 10 alert types with their colors:

| Alert | Syntax | Background |
|-------|--------|------------|
| STATUS | `> [!STATUS]` | `#f1f3f5` gray |
| IMPORTANT | `> [!IMPORTANT]` | `#f4ecff` purple |
| SUCCESS | `> [!SUCCESS]` | `#e0f2f1` teal |
| NOTE | `> [!NOTE]` | `#eaf2f8` blue |
| TIP | `> [!TIP]` | `#e6fffb` cyan |
| ATTENTION | `> [!ATTENTION]` | `#f6efe3` tan |
| WARNING | `> [!WARNING]` | `#faf3d1` yellow |
| CAUTION | `> [!CAUTION]` | `#fdecef` pink |
| BLOCKER | `> [!BLOCKER]` | `#ede7f6` violet |
| QUESTION | `> [!QUESTION]` | `#f6f4ea` beige |

## Testing

### Test Structure

```
tests/
├── fixtures/markdown-samples.js    # Input samples for all markdown types
├── mocks/chrome-api.js             # Chrome extension API mocks
├── setup/
│   ├── vitest.setup.js             # Global test setup (DOM, Chrome)
│   └── test-helpers.js             # Shared test utilities
└── unit/
    ├── lib/                        # Library conversion tests
    ├── background/                 # Service worker tests
    ├── content/                    # Content script tests
    └── popup/                      # Popup UI tests
```

### Writing Tests

```javascript
// Import samples and library
import { markdownSamples } from '../../fixtures/markdown-samples.js';
import * as markdownServicenow from '../../../lib/markdown-servicenow.js';

// Helper to skip [code] wrapper
const convert = (input) =>
  markdownServicenow.convertMarkdownToServiceNow(input, { skipCodeTags: true });

// Test pattern
it('should convert X to Y', () => {
  const input = markdownSamples.someInput;
  const output = convert(input);
  expect(output).toContain('<expected>');
});
```

### Coverage Thresholds

```javascript
// vitest.config.js
thresholds: {
  lines: 80,
  functions: 80,
  branches: 75,
  statements: 80
}
```

## Development Workflow

### Loading the Extension

1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the extension root directory

### After Code Changes

1. Make changes to JS/CSS/HTML files
2. Go to `chrome://extensions/`
3. Click reload icon on the extension
4. Test on a ServiceNow instance

### Debugging

| Component | How to Debug |
|-----------|--------------|
| Background worker | `chrome://extensions/` → Click "service worker" link |
| Content script | DevTools on ServiceNow page, filter console by `MD-SN:` |
| Popup | Right-click extension icon → Inspect popup |

## Implementation Notes

### Content Script Injection Order

The library MUST load before content.js. In `manifest.json`:
```json
"js": ["lib/markdown-servicenow.js", "content/content.js"]
```

### Toolbar Positioning

Toolbar is inserted OUTSIDE textarea parent to avoid ServiceNow's DOM manipulations:
```javascript
textareaParent.parentNode.insertBefore(toolbar, textareaParent.nextSibling);
```

### Event Triggering for ServiceNow

After converting textarea content, trigger these events:
```javascript
textarea.dispatchEvent(new Event('input', { bubbles: true }));
textarea.dispatchEvent(new Event('change', { bubbles: true }));
textarea.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
if (typeof textarea.onchange === 'function') textarea.onchange();
```

### Protection System

The library protects certain content from text formatting:
1. Code blocks, inline code, images, links are replaced with placeholders
2. Text formatting (bold/italic) is applied
3. Placeholders are restored
4. Then code/images/links are converted to HTML

## Common Tasks

### Adding a New Alert Type

1. Add CSS rule in `lib/markdown-servicenow.js` → `ALERT_CSS_RULES`
2. Add emoji in `ALERT_EMOJIS`
3. Add type to regex in `convertBlockquotes()` function
4. Add test sample in `tests/fixtures/markdown-samples.js`
5. Add test cases in `tests/unit/lib/markdown-blockquotes.test.js`

### Adding a New Field Selector

1. Add selector to `JOURNAL_SELECTORS` in `content/content.js`
2. Add test cases in `tests/unit/content/field-detection.test.js`

### Updating the Library Version

1. Update `lib/markdown-servicenow.js` (port changes from npm package)
2. Update version comment at top of file
3. Run tests to verify: `npm test`

## Extension Permissions

| Permission | Purpose |
|------------|---------|
| `activeTab` | Access active tab for context menu |
| `contextMenus` | Create right-click menu |
| `clipboardWrite` | Copy converted text |
| `storage` | Persist last popup input |
| Host: `*.service-now.com/*` | Inject content script |
| Host: `*.servicenow.com/*` | Inject content script |
