# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-03-22

### Changed
- Switched from npx distribution to local installation via `install.sh`
- Version checking now uses GitHub raw instead of npm registry (avoids npx cache staleness)

### Added
- `install.sh` — curl-able installer that copies files to `~/.claude/statusline/co2/`
- `/co2:update` skill — check for and apply updates (mirrors GSD's update pattern)
- `update-check.js` — SessionStart hook for background update checking
- `--uninstall` flag for `install.sh`
- `--wrap` flag for `install.sh` to compose with existing statuslines

## [1.0.2] - 2026-03-22

### Added
- Water usage calculation and display

## [1.0.1] - 2026-03-22

### Fixed
- README updates

## [1.0.0] - 2026-03-22

### Added
- Initial release
- Energy estimation from token counts
- CO2 equivalent calculation
- `--wrap` flag for composing with other statuslines
- `--track` flag for all-time totals
