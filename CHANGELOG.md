# Changelog

All notable changes to this project are documented here.

## [Unreleased]

## [2.0.0] - 2026-05-04

### Added

- GURPS maneuver panel with the same maneuver buttons from `manu.html`
- Built-in maneuver selection sound packaged with the module
- Public API for applying maneuvers from module integrations

### Changed

- The picker now auto-refreshes every 2 seconds while open instead of using a manual refresh button
- The default window is wider to fit hit locations, current selection, maneuvers, and bucket state together

## [1.1.3] - 2026-05-04

### Fixed

- Selected-region highlights now follow the connected body region from the clicked seed point, which prevents adjacent locations from inheriting the wrong color

## [1.1.2] - 2026-05-04

### Added

- Per-location highlight colors exposed as Foundry color pickers in module settings
- GitHub release packaging now publishes `module.json` alongside the module zip
- The recommended install URL now points to the latest GitHub release manifest
- `Eyes` now has its own clickable region in the pixel hit map

## [1.0.0] - 2026-05-04

### Added

- Initial public release of the GGA hit-location bucket module
- Pixel-based body map click detection
- Selected-region highlight derived from the technical color mask
- Automatic replacement of the previously added module modifier
- Foundry scene control button and keyboard shortcut
