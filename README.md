# GGA Hit Location Bucket

Foundry VTT module for the GURPS Game Aid bucket. It lets you click a body map to send hit-location modifiers into the GGA Modifier Bucket and choose GURPS maneuvers for selected combat tokens.

## Highlights

- Clickable body map based on `form.webp`
- Pixel-based hit detection from `color.webp`
- Selected region is highlighted from the technical color mask
- `Eyes` included as a clickable facial region
- Per-location highlight colors are configurable with Foundry color pickers
- `Vitals` is part of the body map
- Previous module-added location is removed before the new one is added
- GURPS maneuver panel with built-in maneuver selection sound
- Expandable Bucket-first interface for Manobras and Hit Location panels
- Bucket state refreshes automatically while the picker is open
- Works with Foundry VTT 12+ and GURPS Game Aid

## Install

### From a manifest URL

Use this manifest URL in Foundry:

`https://github.com/trezecete/gga-hit-location-bucket/releases/latest/download/module.json`

### From a release

Download the latest release zip from GitHub Releases and extract the `gga-hit-location-bucket` folder into your Foundry `Data/modules` directory.

## Release Strategy

This repository follows SemVer:

- `1.0.0` for the first public release
- `1.0.1`, `1.0.2`, and so on for fixes
- `1.1.0` for backwards-compatible feature work
- `2.0.0` for major feature upgrades or breaking changes

Release tags should use the `v` prefix, like `v1.0.0`.

The release workflow packages only the `gga-hit-location-bucket` folder and publishes a zip asset for each tag.

## Repository Layout

- `gga-hit-location-bucket/module.json`: Foundry manifest
- `gga-hit-location-bucket/scripts/main.js`: module logic
- `gga-hit-location-bucket/templates/hit-location-picker.hbs`: UI template
- `gga-hit-location-bucket/styles/module.css`: module styles
- `gga-hit-location-bucket/assets/`: body images and maneuver sound

## Links

- Repository: `https://github.com/trezecete/gga-hit-location-bucket`
- Releases: `https://github.com/trezecete/gga-hit-location-bucket/releases`
- Issues: `https://github.com/trezecete/gga-hit-location-bucket/issues`
