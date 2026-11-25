# miyapad-plugin-example

Minimal `.miyaplugin` reference and test fixture for Miyapad.

Replaces `{date}` / `{{date}}` in prompts via `miyapad.context.setPlaceholder`, adds an inline format setting (`hooks.settings` + `miyapad.ui.SelectBox`), editor toolbar buttons (`hooks.toolbar` + `miyapad.editor`), a sidebar widget (`hooks.sidebar`), and a custom date picker modal (`hooks.modals` + `miyapad.ui.Modal`, also reachable from Quick Switcher `hooks.commands`). Source lives in `src/main.ts` importing `src/util.ts`, bundled with `esbuild` into `main.js`.

Storage showcase:
- Tracks startup loads and `dateFormat` in `miyapad.storage` (default namespace).
- Records inserted dates in a named namespace `miyapad.db('history')` using `set`, `keys('entry/')`, `get`, and `clear` (isolated from `miyapad.storage`) in both standalone IndexedDB and server modes.
- Automatically detects server-only raw SQL (`typeof db.query === 'function'`) and creates/queries a `date_log` SQLite table via `exec` and parameterized `query` when connected to the Miyapad server, falling back to IndexedDB KV in standalone mode.

## Install addresses

Paste any of these addresses into **Preferences → Plugins → Import from URL…**:

- **Latest release:** `https://github.com/LordFoogThe4rd/miyapad-plugin-example`
- **Pinned tag:** `https://github.com/LordFoogThe4rd/miyapad-plugin-example/releases/tag/v1.4.0`
- **Pinned branch:** `https://github.com/LordFoogThe4rd/miyapad-plugin-example/tree/main/dist/example.miyaplugin`
- **Pinned commit:** `https://github.com/LordFoogThe4rd/miyapad-plugin-example/blob/<commit-sha>/dist/example.miyaplugin`

`dist/example.miyaplugin` is committed to `main` so branch and commit URLs resolve directly to a built archive without running a build step.

## Development

```bash
npm install
npm run typecheck
npm run build
```

`npm run build` bundles `src/main.ts` into `main.js` and packs `manifest.json`, `main.js` and `CHANGELOG.md` into `dist/example.miyaplugin`.

## Releasing

1. Add a `## [<version>] - YYYY-MM-DD` section to `CHANGELOG.md`.
2. Update `"version"` in `manifest.json` and `package.json`.
3. Run `npm run build` and commit `CHANGELOG.md`, `manifest.json`, `package.json`, and `dist/example.miyaplugin`.
4. Tag `v<version>` and push both `main` and the tag. `.github/workflows/release.yml` verifies the tag matches `manifest.json`, builds `example.miyaplugin`, extracts the changelog section, and publishes the GitHub Release asset.
