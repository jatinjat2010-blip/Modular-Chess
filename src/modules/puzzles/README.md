# Puzzle Module

This module is intentionally self-contained.

Planned file ownership:

- `index.js`: renderer-facing entry point
- `state.js`: local puzzle state
- `data.js`: local puzzle dataset loading and filtering
- `logic.js`: solution validation and next-puzzle flow
- `view.js`: puzzle-specific DOM rendering helpers
- `constants.js`: defaults and shared constants
- `puzzle.css`: puzzle-only styles

The goal is to keep new puzzle work out of the global `renderer.js` and `styles.css`
as much as possible.
