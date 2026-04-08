Publish a GitHub release for this extension. Run `/release-prep` first if you haven't already.

## 1. Verify prerequisites

- Confirm the zip file `markdown-to-servicenow-v<VERSION>.zip` exists in the project root
- Confirm the working tree is clean (`git status`) — all doc/changelog changes should already be committed
- Confirm the local branch is ahead of or equal to `origin/main` (no unpushed divergence)

If the zip is missing, run `/release-prep` first and come back.

## 2. Push any unpushed commits

```bash
git push origin main
```

## 3. Create the GitHub release

```bash
gh release create v<VERSION> markdown-to-servicenow-v<VERSION>.zip \
  --title "v<VERSION> — <short description of the biggest new feature>" \
  --notes "<release notes>"
```

Use the CHANGELOG.md entry for the current version as the release notes body. Format it as:

```
## What's New in vX.X.X

### Added
- ...

### Changed / Fixed
- ...

### Installation

1. Download `markdown-to-servicenow-vX.X.X.zip`
2. Unzip it
3. Go to `chrome://extensions/` → Enable **Developer mode** → **Load unpacked**
4. Select the unzipped folder

Or install from the Chrome Web Store (coming soon).

---

See [CHANGELOG.md](https://github.com/yadav-prakhar/markdown-sn-extension/blob/main/CHANGELOG.md) for full history.
```

## 4. Confirm and report

After the release is created, output:
- The release URL returned by `gh release create`
- Zip filename and size
- Reminder: update the Chrome Web Store listing separately if already published
