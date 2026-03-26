# Closed Alpha Release Checklist

## Release model
- Free closed alpha
- Binary distribution only
- Do not publish the full source repo publicly yet

## Important distribution note
- A public GitHub repository is not a closed alpha
- If you want the app to stay closed for now, use one of:
  - private GitHub repository + private Releases
  - Google Drive / Dropbox / OneDrive release folder
  - itch.io hidden/unlisted page
  - small website / Discord distribution

## Before building
1. Update `package.json` version
2. Confirm icon/licensing decisions for bundled assets
3. Confirm Chess Vision remains hidden unless intentionally enabled
4. Run manual regression:
   - offline game -> archive -> analysis
   - custom position game -> archive -> analysis
   - online game as white
   - online game as black
   - tournament create / import / save / load / display mode
   - board editor -> analysis / play
   - profile/theme/background persistence after restart

## Build commands
### Portable test build
```powershell
npm run pack:win
```

### Closed alpha distributable build
```powershell
npm run dist:win
```

Output goes to:
- `release/`

Targets produced:
- portable `.exe`
- NSIS installer `.exe`

## Packaging notes
- `vision-backend/` and `Engines/` are unpacked outside `app.asar`
- Vision backend is still optional
- If vision is not part of your alpha scope, keep it hidden and do not document it for testers

## What to send testers
1. Installer or portable `.exe`
2. Short install/run notes
3. Known limitations list
4. Feedback form or issue template

## Recommended tester note
- This is a closed alpha build
- Features may change rapidly
- Do not redistribute outside the test group
- Report:
  - crashes
  - save/load problems
  - online game issues
  - tournament issues
  - UI glitches

## Suggested versioning
- `0.1.0-alpha.1`
- `0.1.0-alpha.2`
- `0.1.0-alpha.3`

## Go / no-go rule
Do not send the build if:
- packaging fails
- archive save/load regresses
- online white/black orientation is broken
- tournament display mode is broken
