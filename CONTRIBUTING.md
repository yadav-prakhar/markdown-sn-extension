# Contributing to Markdown to ServiceNow

Thanks for your interest in contributing! This guide will help you get started.

## Getting Started

### Prerequisites

- Node.js 18+
- Chrome browser
- Access to a ServiceNow instance (for testing content script changes)

### Setup

```bash
# Clone the repository
git clone https://github.com/yadav-prakhar/markdown-sn-extension.git
cd markdown-sn-extension

# Install dependencies (also installs git hooks)
npm install
```

### Load the Extension

1. Open `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the extension folder

## Development Workflow

### Making Changes

1. Create a feature branch from `main`
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes

3. Run tests
   ```bash
   npm test
   ```

4. Test manually in Chrome (reload extension after changes)

5. Commit and push

### Project Structure

```
├── background/background.js    # Service worker
├── content/content.js          # Injected into ServiceNow
├── popup/popup.js              # Extension popup
├── lib/markdown-servicenow.js  # Conversion library
└── tests/                      # Test suite
```

## Testing

### Run Tests

```bash
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage report
```

### Writing Tests

Add test samples to `tests/fixtures/markdown-samples.js`:
```javascript
export const markdownSamples = {
  // ... existing samples
  yourNewSample: '> [!NEWTYPE]\n> Content here',
};
```

Write tests in the appropriate file under `tests/unit/`:
```javascript
import { markdownSamples } from '../../fixtures/markdown-samples.js';
import * as markdownServicenow from '../../../lib/markdown-servicenow.js';

const convert = (input) =>
  markdownServicenow.convertMarkdownToServiceNow(input, { skipCodeTags: true });

it('should convert new feature', () => {
  const output = convert(markdownSamples.yourNewSample);
  expect(output).toContain('<expected-html>');
});
```

### Coverage Requirements

- Lines: 80%
- Functions: 80%
- Branches: 75%
- Statements: 80%

## Code Style

### JavaScript

- Use `'use strict';` in all files
- Prefer `const` over `let`, never use `var`
- Use arrow functions for callbacks
- Prefix console logs with `MD-SN:` for easy filtering

### CSS

- Prefix all classes with `md-sn-` to avoid conflicts with ServiceNow
- Use `!important` only when necessary to override ServiceNow styles

### Commits

Write clear commit messages:
```
feat: add QUESTION alert type
fix: links with underscores incorrectly converted
docs: update README with new alert types
chore: update test coverage thresholds
```

## Git Hooks

A **pre-push hook** runs automatically before each push:
- Executes `npm test`
- Blocks push if tests fail

This is installed automatically via `npm install`. To reinstall:
```bash
bash scripts/install-hooks.sh
```

## Pull Requests

### Before Submitting

- [ ] Tests pass (`npm test`)
- [ ] New features have tests
- [ ] Code follows existing style
- [ ] Tested manually in Chrome

### PR Process

1. Push your branch
2. Open a PR against `main`
3. Fill out the PR template
4. Wait for review

### PR Title Format

```
feat: add new markdown feature
fix: resolve conversion bug
docs: update documentation
chore: update dependencies
```

## Common Tasks

### Adding a New Alert Type

1. Edit `lib/markdown-servicenow.js`:
   - Add CSS to `ALERT_CSS_RULES`
   - Add emoji to `ALERT_EMOJIS`
   - Add type to regex in `convertBlockquotes()`

2. Add sample to `tests/fixtures/markdown-samples.js`

3. Add tests to `tests/unit/lib/markdown-blockquotes.test.js`

### Adding a New Field Selector

1. Edit `content/content.js`:
   - Add selector to `JOURNAL_SELECTORS`

2. Add tests to `tests/unit/content/field-detection.test.js`

### Updating the Conversion Library

1. Port changes to `lib/markdown-servicenow.js`
2. Update version comment at top of file
3. Add/update tests
4. Run full test suite

## Questions?

- Open an [issue](https://github.com/yadav-prakhar/markdown-sn-extension/issues)
- Check existing issues for similar questions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
