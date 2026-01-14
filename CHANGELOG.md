# Changelog

All notable changes to the "Markdown to ServiceNow" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.3] - 2026-01-14

### Fixed

- CSS bloat when using alert blocks - now only includes CSS for alert types actually used in the output instead of all 10 types (Issue #9)
- Context menu reliability issues with service worker lifecycle
- Selection handling in context menu - newlines are now preserved correctly

### Changed

- Refactored message passing: content script now retrieves and converts selection itself
- Improved multi-frame selection handling for ServiceNow pages with iframes
- Added error handling and logging throughout for better debugging

## [1.1.2] - 2026-01-14

### Added

- Support for a new `> [!QUESTION]` alert type with dedicated styling and emoji in both the extension and bundled markdown-servicenow library.

### Changed

- Updated the bundled markdown-servicenow library reference to v1.0.4 and refreshed docs to reflect the new alert support.

## [1.1.1] - 2026-01-14

### Fixed

- Prevent underscores inside markdown links from being converted into emphasis characters so links like `https://example.com/foo_bar` remain intact.


## [1.1.0] - 2026-01-13

### Added

- New alert types: `> [!STATUS]`, `> [!SUCCESS]`, `> [!ATTENTION]`, `> [!BLOCKER]`
- Specific emojis for each alert type (⏳, 📌, ✅, 📝, 💡, 👀, ⚠️, ⛔, 🚫)

### Changed

- Updated color scheme and styling for all alert types
- Improved alert visual consistency with better color contrast and typography
- Updated documentation to list all supported alert types

## [1.0.0] - 2025-12-16

### Added

- Initial release
- Popup converter with live preview
- Context menu integration for selected text conversion
- In-page convert buttons on ServiceNow journal fields (work notes, comments, close notes)
- Keyboard shortcut support (`Cmd+Shift+M` / `Ctrl+Shift+M`)
- Support for common Markdown elements:
  - Headers (H1-H6)
  - Bold, italic, strikethrough, highlight
  - Inline code and code blocks
  - Links and images
  - Ordered and unordered lists
  - Blockquotes and alerts
  - Tables
  - Horizontal rules
