<div align="center">
  <img src="icons/Icon128.png" alt="Markdown to ServiceNow" width="128" height="128">

  <h1 align="center">Markdown to ServiceNow</h1>

[Outputs](#output) • [Installation](#installation) • [Usage](#usage) • [Support](#support)

  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>

</div>

Convert Markdown to ServiceNow journal field format directly in your browser. Write in Markdown, convert with one click, and paste into ServiceNow.


## Features

- **📝 Popup Converter** — Click the extension icon, paste markdown, get ServiceNow-ready output
- **🖱️ Context Menu** — Right-click selected text to convert in place
- **⚡ ServiceNow Integration** — Adds a convert button directly on journal fields
- **⌨️ Keyboard Shortcut** — `Cmd+Shift+M` (Mac) / `Ctrl+Shift+M` (Windows/Linux)
- **🔒 Privacy-First** — All processing happens locally, no data sent to servers

### Output

| <img width="600" alt="screenshot 1" src="https://github.com/user-attachments/assets/c4281708-21ae-40fb-8bb3-e925475cb1e1" /> | <img width="600" alt="screenshot 2" src="https://github.com/user-attachments/assets/1263da67-1041-4a7c-9f4f-59f8e6252dae" /> |
| -- | -- |


## Installation

1. **Download** the latest release from [GitHub Releases](https://github.com/yadav-prakhar/markdown-sn-extension/releases) or clone the repository:
   ```bash
   git clone https://github.com/yadav-prakhar/markdown-sn-extension.git
   ```
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right)
4. Click **Load unpacked**
5. Select the `markdown-sn-extension` folder
6. Pin the extension to your toolbar for easy access

## Usage

### Popup

1. Click the extension icon in the toolbar
2. Paste your Markdown in the input area
3. Click **Copy to Clipboard**
4. Paste into ServiceNow journal field

<img width="600" alt="convert through popup" src="https://github.com/user-attachments/assets/5bdb4d43-d8ec-4911-8278-91b46bd185d6" />

### Context Menu

1. Select text on any webpage
2. Right-click → **Convert Markdown to ServiceNow**
3. Converted text is copied to clipboard

<img width="1400" height="900" alt="convert through context menu" src="https://github.com/user-attachments/assets/f036e076-16fd-48b2-af1b-523d7ea0f742" />

### On ServiceNow

1. Look for the &nbsp; <img src="./icons/Icon.svg" alt="Markdown ServiceNow extension icon" width="23"> &nbsp; button near journal/comment fields
2. Write markdown in the field
3. Click the button to convert in-place

<img width="600" alt="convert through button" src="https://github.com/user-attachments/assets/ff1b108b-efe0-43bd-bf84-0f8c3c3eeaff" />

## Supported Markdown

| Element | Syntax |
|---------|--------|
| Headers | `#`, `##`, `###`, etc. |
| Bold | `**text**` or `__text__` |
| Italic | `*text*` or `_text_` |
| Bold + Italic | `***text***` |
| Strikethrough | `~~text~~` |
| Highlight | `==text==` |
| Inline code | `` `code` `` |
| Code blocks | ` ``` ` fenced blocks |
| Links | `[text](url)` |
| Images | `![alt](url)` |
| Unordered lists | `- item` or `* item` |
| Ordered lists | `1. item` |
| Blockquotes | `> quote` |
| Alerts | `> [!NOTE]`, `> [!TIP]`, `> [!WARNING]`, etc. |
| Tables | Pipe-delimited tables |
| Horizontal rules | `---` or `***` |

## Project Structure

```
markdown-sn-extension/
├── manifest.json        # Chrome Extension manifest (V3)
├── popup/               # Popup UI
├── background/          # Service worker (context menu)
├── content/             # Content script for ServiceNow pages
├── lib/                 # Bundled markdown-servicenow library
└── icons/               # Extension icons
```

## Privacy

This extension processes all data locally in your browser. No data is collected, stored, or transmitted to external servers. See our [Privacy Policy](./PRIVACY_POLICY.md) for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Development

```bash
# Clone the repository
git clone https://github.com/yadav-prakhar/markdown-sn-extension.git

# Load in Chrome
# 1. Go to chrome://extensions/
# 2. Enable Developer mode
# 3. Click "Load unpacked"
# 4. Select the extension folder
```

## Credits

Uses the [markdown-servicenow](https://www.npmjs.com/package/markdown-servicenow) library for conversion.

## License

MIT License - see [LICENSE](./LICENSE) for details.

## Support

- 🐛 [Report a bug](https://github.com/yadav-prakhar/markdown-sn-extension/issues/new?labels=bug)
- 💡 [Request a feature](https://github.com/yadav-prakhar/markdown-sn-extension/issues/new?labels=enhancement)
- ⭐ Star this repo if you find it useful!
