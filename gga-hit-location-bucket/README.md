# GGA Hit Location Bucket

This module adds a clickable GURPS hit-location picker for the Foundry VTT GGA bucket.

It uses `form.webp` as the visible body and `color.webp` as the technical hit map. Clicking a region adds the matching modifier to `GURPS.ModifierBucket`, and the previous module-added location is removed automatically.

## Features

- Clickable body regions with pixel-accurate detection
- Highlighted selected region
- `Vitals` integrated as part of the body image
- Automatic replacement of the previous location in the bucket
- Clear bucket action
- Foundry scene control button and keyboard shortcut

## Compatibility

- Foundry VTT 12+
- GURPS Game Aid

## Installation

### Manifest URL

`https://raw.githubusercontent.com/trezecete/gga-hit-location-bucket/main/gga-hit-location-bucket/module.json`

### Manual install

Copy the `gga-hit-location-bucket` folder into your Foundry `Data/modules` directory.

## Development

- Entry point: `scripts/main.js`
- Template: `templates/hit-location-picker.hbs`
- Styles: `styles/module.css`

## Release notes

See the repository root `CHANGELOG.md` for the version history.
