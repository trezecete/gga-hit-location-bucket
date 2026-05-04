# GGA Hit Location Bucket

This module adds a clickable GURPS hit-location and maneuver picker for the Foundry VTT GGA bucket.

It uses `form.webp` as the visible body and `color.webp` as the technical hit map. Clicking a region adds the matching modifier to `GURPS.ModifierBucket`, and the previous module-added location is removed automatically. The same window can also assign GGA maneuvers to selected tokens that are already in combat.

## Features

- Clickable body regions with pixel-accurate detection
- Highlighted selected region
- `Eyes` integrated as part of the body image
- Per-location highlight colors configurable in Foundry settings
- `Vitals` integrated as part of the body image
- Automatic replacement of the previous location in the bucket
- GURPS maneuver buttons with selection sound
- Bucket-first interface with expandable Maneuvers and Hit Location panels
- Automatic bucket refresh while the window is open
- Clear bucket action
- Foundry scene control button and keyboard shortcut

## Settings

The module adds one color picker setting per hit location under Foundry's `Configure Settings` menu.

Each selected region uses its saved color when the highlight mask is drawn, so you can customize the look of the picker without changing the hit detection map.

## Macro

You can open the interface from a macro with:

```js
game.modules.get("gga-hit-location-bucket").api.openPicker();
```

## Compatibility

- Foundry VTT 12+
- GURPS Game Aid

## Installation

### Manifest URL

`https://github.com/trezecete/gga-hit-location-bucket/releases/latest/download/module.json`

### Manual install

Copy the `gga-hit-location-bucket` folder into your Foundry `Data/modules` directory.

## Development

- Entry point: `scripts/main.js`
- Template: `templates/hit-location-picker.hbs`
- Styles: `styles/module.css`

## Release notes

See the repository root `CHANGELOG.md` for the version history.
