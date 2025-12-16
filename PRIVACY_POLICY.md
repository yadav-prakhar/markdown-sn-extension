# Privacy Policy for Markdown to ServiceNow Extension

**Last Updated:** December 2025

## Overview

The "Markdown to ServiceNow" Chrome extension is committed to protecting your privacy. This policy explains what data the extension accesses and how it is used.

## Data Collection

**This extension does not collect, store, or transmit any personal data.**

### What the extension accesses:

1. **Active Tab Content** - The extension reads text from ServiceNow journal fields only when you explicitly click the convert button or use the context menu. This data is processed locally in your browser.

2. **Clipboard** - When you use the "Copy to Clipboard" feature, the converted text is written to your clipboard. No clipboard data is read or stored.

3. **Local Storage** - The extension may use Chrome's local storage API to save user preferences. This data never leaves your browser.

## Data Processing

- All Markdown-to-ServiceNow conversion happens **entirely within your browser**
- No data is sent to external servers
- No analytics or tracking is implemented
- No user accounts or authentication required

## Permissions Explained

| Permission | Purpose |
|------------|---------|
| `activeTab` | Access the current tab to read/modify ServiceNow journal fields |
| `contextMenus` | Add "Convert Markdown" option to right-click menu |
| `clipboardWrite` | Copy converted text to clipboard |
| `storage` | Save user preferences locally |
| `host_permissions` for `*.service-now.com` and `*.servicenow.com` | Enable the extension to work on ServiceNow instances |

## Third-Party Services

This extension does not use any third-party services, analytics, or tracking tools.

## Changes to This Policy

Any changes to this privacy policy will be posted here and the "Last Updated" date will be revised.

## Contact

If you have questions about this privacy policy, please open an issue on the [GitHub repository](https://github.com/yadav-prakhar/markdown-sn-extension/issues).

## Open Source

This extension is open source. You can review the complete source code on [GitHub](https://github.com/yadav-prakhar/markdown-sn-extension).
