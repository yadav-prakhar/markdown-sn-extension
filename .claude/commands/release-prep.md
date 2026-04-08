Prepare this extension for a new release. Follow these steps in order:

## 1. Confirm the version

Read `manifest.json` & `package.json` and confirm the `version` field. This is the release version.

## 2. Run tests

Run `npm test` and verify all tests pass. If any fail, stop and report them — do not proceed.

## 3. Audit CHANGELOG.md

Read `CHANGELOG.md` and check that the top entry matches the version in `manifest.json`.

- Compare it against recent git commits (`git log --oneline -20`) to find any features, fixes, or changes that were committed but not documented.
- If anything is missing, add it to the correct section (`### Added`, `### Changed`, `### Fixed`) under the existing version header. Do not create a new version entry — only fill in gaps.

## 4. Update docs and GitHub Pages site

### README.md
- Check that the version badge reflects the new version
- Verify the Output section screenshots are up to date (they reference `docs/screenshots/`)
- Update any feature descriptions or usage instructions that changed in this version

### docs/index.html (GitHub Pages)
- Update any version string displayed on the page (e.g. hero badge "Version X.X.X")
- Check the features section — add `<span class="feature-tag">vX.X.X New</span>` to any newly added features
- Check the screenshots grid — if new screenshots were added to `docs/screenshots/`, add corresponding `screenshot-card` entries
- Remove any `TODO` comments that have been resolved
- Verify all screenshot `src` paths in the grid point to existing files in `docs/screenshots/`

### CONTRIBUTING.md / PRIVACY_POLICY.md
- Only update if content changed (e.g. new contribution steps, updated privacy date)

After updating, commit all doc changes together:

```
git add README.md docs/index.html CONTRIBUTING.md PRIVACY_POLICY.md
git commit -m "docs: update docs and site for vX.X.X"
```

Only include files that actually changed.

## 5. Build the release package

Create a zip containing only the extension files — no dev/test/docs files:

```bash
zip -r markdown-to-servicenow-v<VERSION>.zip manifest.json background/ content/ popup/ lib/ icons/ --exclude "*.DS_Store"
```

Replace `<VERSION>` with the actual version string (e.g. `3.0.0`).

Confirm the zip is created and report its file size.

## 6. Verify zip contents

Run `unzip -l markdown-to-servicenow-v<VERSION>.zip` and confirm only these paths are present:
- `manifest.json`
- `background/`
- `content/`
- `popup/`
- `lib/`
- `icons/`

No `node_modules`, `tests`, `docs`, `screenshots`, or config files.

## 7. Commit CHANGELOG if updated

If CHANGELOG.md was updated separately from the docs commit above, stage and commit it:

```
git add CHANGELOG.md
git commit -m "docs: update CHANGELOG for vX.X.X"
```

## 8. Report

Summarise:
- Version confirmed
- Test result (pass/fail count)
- What was added to CHANGELOG (if anything)
- Zip filename and size
- Ready to run `/release` to publish
