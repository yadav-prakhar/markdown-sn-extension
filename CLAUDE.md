# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Chrome extension (Manifest V3) that converts Markdown to ServiceNow journal field format. The extension provides three ways to convert: popup converter, context menu, and in-page buttons on ServiceNow journal fields.

### Core Dependencies

- **markdown-servicenow library** (`lib/markdown-servicenow.js`) - Bundled conversion library (based on npm package v1.0.2) that performs the actual Markdown to ServiceNow HTML conversion
- No build process or package.json - this is a pure JavaScript extension that can be loaded directly into Chrome

## Architecture

### Extension Components

The extension follows the Chrome Extension V3 architecture with four main components:

1. **Background Service Worker** (`background/background.js`)
   - Loads markdown-servicenow library via `importScripts()`
   - Creates and handles context menu for selected text conversion
   - Listens for messages from popup and content scripts
   - Manages clipboard operations and notifications

2. **Content Script** (`content/content.js`)
   - Injected into all ServiceNow pages (`*.service-now.com`, `*.servicenow.com`)
   - Scans for journal field textareas (work_notes, comments, activity streams)
   - Dynamically injects convert buttons via toolbars positioned outside textarea parents
   - Uses MutationObserver to detect dynamically added fields
   - Handles in-place conversion and triggers ServiceNow's change detection events
   - **Field Detection Logic**: Uses specific selectors (`JOURNAL_SELECTORS`) and explicitly excludes non-journal fields like description, short_description, resolution_notes via `EXCLUDED_PATTERNS`

3. **Popup UI** (`popup/popup.html`, `popup.js`, `popup.css`)
   - Standalone converter interface
   - Debounced live conversion (150ms delay)
   - Persists last input in chrome.storage.local
   - Copy to clipboard functionality

4. **Icons** (`icons/`)
   - Multiple sizes (16x16, 32x32, 48x48, 64x64, 128x128)
   - SVG source available for regeneration via `scripts/generate-icons.js` (Node.js script)

### Key Interaction Patterns

**Context Menu Flow**: User selects text → Right-clicks → Background worker converts → Sends message to content script → Content script replaces selection or copies to clipboard

**In-Page Button Flow**: Content script detects journal fields → Creates toolbar with convert button → User clicks button → Converts textarea value in-place → Triggers ServiceNow events (`input`, `change`, `keyup`, `onchange`)

**Popup Flow**: User enters Markdown → Live conversion with debouncing → Click copy button → Uses navigator.clipboard API

### ServiceNow Integration Details

- Content script runs at `document_idle` in `all_frames: true` to catch iframes
- Toolbar positioning: Inserted as sibling AFTER textarea's parent node with `insertBefore(toolbar, textareaParent.nextSibling)`
- Field enhancement tracking via `dataset.mdSnEnhanced` to prevent duplicate buttons
- Explicit event triggering after conversion ensures ServiceNow's onChange handlers detect the change

## Development Workflow

### Loading the Extension

```bash
# No build step required - load directly into Chrome
# 1. Navigate to chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the extension root directory
```

### Testing Changes

1. Make code changes to JS/CSS/HTML files
2. Go to `chrome://extensions/`
3. Click reload icon for "Markdown to ServiceNow" extension
4. Test on a ServiceNow instance (requires access to `*.service-now.com` or `*.servicenow.com`)

### Debugging

- **Background worker**: `chrome://extensions/` → Click "service worker" link under extension
- **Content script**: Open DevTools on ServiceNow page, check Console for `MD-SN:` prefixed logs
- **Popup**: Right-click extension icon → Inspect popup

## Important Implementation Notes

### Content Script Injection

- The `markdown-servicenow.js` library MUST be listed before `content.js` in manifest.json's content_scripts.js array
- Content script accesses library via global `markdownServicenow` object
- Background worker uses `importScripts()` for the same library

### Field Detection

- Only targets journal fields: work_notes, comments, activity stream textareas
- Explicitly excludes description fields to avoid interfering with normal text entry
- Logs all textarea IDs/names in console for debugging selector issues
- Fallback: Scans ALL textareas and filters via `isJournalField()` if selectors miss fields

### Toolbar Styling

- Toolbar must be positioned outside textarea parent to avoid ServiceNow's DOM manipulations
- Uses inline styles (`display: inline-block`, `margin: 4px 0 12px 4px`) for consistent positioning
- CSS classes: `.md-sn-toolbar`, `.md-sn-convert-btn`, `.md-sn-notification`

### Message Passing

- Background → Content: `{action: 'convertSelection'}` (content script retrieves selection and converts)
- Popup/Content → Background: `{action: 'convert', text: markdown}` (returns `{success, result}`)

## Supported Markdown Syntax

Headers (h1-h6), bold, italic, strikethrough, highlight (`==text==`), inline code, code blocks, links, images, lists (ordered/unordered), blockquotes, tables, horizontal rules, and alert blocks (`> [!STATUS]`, `> [!IMPORTANT]`, `> [!SUCCESS]`, `> [!NOTE]`, `> [!TIP]`, `> [!ATTENTION]`, `> [!WARNING]`, `> [!CAUTION]`, `> [!BLOCKER]`)

## Extension Permissions

- `activeTab`: Access active tab for context menu
- `contextMenus`: Create right-click menu item
- `clipboardWrite`: Copy converted text
- `storage`: Persist last popup input
- Host permissions: `*://*.service-now.com/*`, `*://*.servicenow.com/*`
