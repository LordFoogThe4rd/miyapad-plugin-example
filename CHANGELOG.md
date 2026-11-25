# Changelog

## [1.3.0] - 2026-11-25

### Added
- Custom date picker modal (`hooks.modals` + `miyapad.ui.Modal`), opened from the sidebar panel or the Quick Switcher command (`> Example Plugin: Insert Custom Date…`)

## [1.2.0] - 2026-11-25

### Added
- Inline settings drawer (`hooks.settings`) to choose between ISO (`YYYY-MM-DD`) and browser locale date formats
- Editor toolbar button (`hooks.toolbar`) and sidebar panel (`hooks.sidebar`) that insert the current date at the cursor via `miyapad.editor`

### Changed
- Switched `{date}` / `{{date}}` expansion to `miyapad.context.setPlaceholder` so dates expand before World Info scanning and context truncation

## [1.1.0] - 2026-11-24

### Changed
- Replaced locale date strings with `YYYY-MM-DD` ISO dates for deterministic prompts

## [1.0.0] - 2026-11-01

### Added
- Initial example plugin replacing `{{date}}` in prompts and counting startup loads
