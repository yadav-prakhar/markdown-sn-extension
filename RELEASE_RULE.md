# Release Rules
<!-- last-analyzed: 2026-04-27T00:00:00Z -->

## Version Sources
- `package.json` → `"version"` field
- `package-lock.json` → `"version"` field (top-level)
- `manifest.json` → `"version"` field

All three must be bumped in sync.

## Release Trigger
**Manual** — no CI release workflow exists. Full release steps in order:
1. Bump version in all version source files
2. Run tests locally (`npm test`)
3. Commit: `chore(release): bump version to X.Y.Z`
4. Create annotated git tag (NO "v" prefix): `git tag -a X.Y.Z -m "X.Y.Z"`
5. Push branch and tag: `git push origin main && git push origin X.Y.Z`
6. Create GitHub Release via `gh release create X.Y.Z` (no "v" prefix in tag or title)
7. Create zip of extension for Chrome Web Store upload
8. Update Chrome Web Store listing: description + "What's New" section

**Tag/release title format:** `X.Y.Z` — NEVER `vX.Y.Z`. No "v" prefix ever.

## Test Gate
Command: `npm test` (runs `vitest run`)
CI job: none — run locally before tagging.

## Registry / Distribution
**Chrome Web Store** — browser extension distributed manually:
- Create a zip of the extension directory (excluding dev files like `node_modules`, `tests`, `scripts`, `.omc`, `vitest.config.js`, `package*.json`)
- Upload zip to Chrome Web Store developer dashboard
- Update the store listing description (see ## Chrome Web Store Description below)

**GitHub Release** — via `gh release create X.Y.Z`:
- Title: `X.Y.Z` (no "v" prefix)
- Body: proper release notes with `### What's New`, bug fixes, etc.
- Attach the zip as a release asset

## Release Notes Strategy
`CHANGELOG.md` exists. Convention: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) with Semantic Versioning. Add a new `## [X.Y.Z] - YYYY-MM-DD` section at the top.

GitHub Release body should mirror the CHANGELOG entry, formatted for markdown with grouped sections (New Features, Bug Fixes, etc.).

The Chrome Web Store "What's New" note (added to the description) should be a short bullet summary — same style as the existing `WHAT'S NEW` section in the description (see below).

## CI Workflow Files
None — no `.github/workflows/` directory exists.

## First-Time Setup Gaps
- No GitHub Actions release workflow. Releases are fully manual.
- Git tags exist and are used (latest: `3.1.0` — no "v" prefix convention).
- No build artifacts to gitignore (extension ships source files directly).

---

## Chrome Web Store Description

The full current store description to use as base when updating for new releases.
Update the `WHAT'S NEW` section at the top when releasing, keeping prior versions below.

```
Write your ServiceNow journal entries in Markdown — and convert them with a single click.

ServiceNow's text editor fights you. Asterisks don't bold. Backticks stay as backticks. Tables break. If you've ever pasted carefully formatted Markdown into a work note only to watch it fall apart, Markdown to ServiceNow solves that permanently.

Write naturally in Markdown. Convert it to properly formatted ServiceNow journal output in one click. Works in work notes, comments, close notes, and activity stream fields.


——————————————————————————
HOW IT WORKS
——————————————————————————

Four ways to convert:

📝 Popup Converter
Click the extension icon, paste your Markdown, preview the output, and copy it to any ServiceNow field.

🖱️ Context Menu
Select Markdown text anywhere on a page, right-click, and choose "Convert Markdown to ServiceNow" — converted text lands on your clipboard instantly.

⚡ In-Page Toolbar (SN Markdown Utility Belt)
On any ServiceNow instance, a toolbar appears directly next to journal fields. Convert in-place, preview before applying, undo with one click after. Works in classic UI and ServiceNow Workspace.

⌨️ Keyboard Shortcut
Open the popup with Cmd+Shift+M (Mac) or Ctrl+Shift+M (Windows/Linux).


——————————————————————————
SUPPORTED MARKDOWN
——————————————————————————

✔ Headers (H1–H6)
✔ Bold, Italic, Bold+Italic
✔ Strikethrough and Highlight
✔ Inline code and fenced code blocks
✔ Unordered and ordered lists
✔ Blockquotes
✔ Tables
✔ Links and Images
✔ Horizontal rules
✔ Alert blocks (10 built-in types + custom)


——————————————————————————
ALERT BLOCKS
——————————————————————————

Draw attention to critical information with colored alert blocks:

> [!NOTE]       — informational callout (blue)
> [!WARNING]    — caution flag (yellow)
> [!IMPORTANT]  — high priority (purple)
> [!SUCCESS]    — confirmation (teal)
> [!CAUTION]    — risk flag (pink)
> [!TIP]        — helpful hint (cyan)
> [!STATUS]     — progress update (gray)
> [!BLOCKER]    — blocked / escalation (violet)
> [!QUESTION]   — open question (beige)
> [!ATTENTION]  — urgent notice (tan)

Each alert renders with a distinct background color and emoji. You can also create your own custom types — any name, any emoji, any color — and share them with your team.


——————————————————————————
CUSTOM ALERTS
——————————————————————————

Create alert types that match your team's language:

• Set a custom name, emoji, text color, background color, and border color
• Edit or reset any built-in preset
• Export your alert configs as JSON to share with teammates
• Import configs from a JSON file


——————————————————————————
SNIPPETS
——————————————————————————

Save your most-used Markdown blocks as reusable snippets:

• Insert snippets from the in-page toolbar or popup with one click
• Save raw Markdown or the converted output directly from the preview
• Delete snippets inline from the picker — no settings screen needed
• Manage all snippets from the Snippets Manager in both toolbar and popup


——————————————————————————
  WHAT'S NEW
——————————————————————————

v3.1.0 — Snippet improvements
• Save snippets directly from the preview modal (Markdown or converted output)
• Delete snippets inline from the picker — no detour to the manager
• Wider snippet picker for better readability

v3.0.0 — Major update: Utility Belt
• Preview modal — side-by-side live preview before applying changes
• Per-field undo — restore original Markdown after converting
• Alert Picker — insert any alert type at cursor from a toolbar dropdown
• Snippets Manager — save and reuse Markdown blocks across tickets
• Markdown Cheatsheet — built-in syntax reference with click-to-insert
• ServiceNow Workspace support (shadow DOM injection)

v2.0.0 — Custom alerts
• Create alert types with custom names, emojis, and full color control
• Import/export alert configs as JSON for team sharing
• Settings UI with built-in preset editor

v1.1.0 — More alert types
• Added STATUS, SUCCESS, ATTENTION, BLOCKER, and QUESTION alert types
• Improved color scheme and visual consistency across all alerts

v1.0.0 — Initial release
• Popup converter, context menu, in-page toolbar, keyboard shortcut


——————————————————————————
  PRIVACY
——————————————————————————

🔒 Everything runs locally in your browser. No data is collected, transmitted, or stored on any server. No accounts, no tracking, no analytics.


——————————————————————————
  PERMISSIONS USED
——————————————————————————

• activeTab — to read/modify the active ServiceNow tab
• contextMenus — to add the right-click convert option
• clipboardWrite — to copy converted output to clipboard
• storage — to save your preferences, snippets, and custom alerts locally
• Access to *.service-now.com and *.servicenow.com — to inject the in-page toolbar


——————————————————————————
  OPEN SOURCE
——————————————————————————

Fully open source under the MIT license.
Source code: https://github.com/yadav-prakhar/markdown-sn-extension
Bug reports and feature requests welcome via GitHub Issues.
```
