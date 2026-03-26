# Third-Party Notices

This project includes third-party software, engines, libraries, and assets.
Their respective authors and licenses remain in effect.

This file is a practical notice file for distribution. It is not a substitute
for the original license texts. Where required, include the full license text
in a `licenses/` directory and preserve any upstream notices.

## Core App Dependencies

### Electron
- Project: Electron
- Use: Desktop app runtime
- License: MIT
- Upstream: https://www.electronjs.org/

### chess.js
- Project: chess.js
- Use: Standard chess rules / PGN / move handling
- License: BSD-2-Clause
- Local reference: `node_modules/chess.js/package.json`
- Upstream: https://github.com/jhlywa/chess.js

### ffish-es6
- Project: ffish-es6
- Use: Variant / Chess960 / fairy rules integration
- License: GPL-3.0
- Local reference: `node_modules/ffish-es6/package.json`
- Upstream: https://github.com/fairy-stockfish/ffishjs

### xlsx
- Project: SheetJS xlsx
- Use: Spreadsheet import/export features
- License: Apache-2.0
- Local reference: `node_modules/xlsx/package.json`
- Upstream: https://github.com/SheetJS/sheetjs

## Bundled Engines

### Stockfish
- Project: Stockfish
- Use: Standard chess engine analysis / play
- License: GPL
- Bundled path: `Engines/stockfish/`
- Upstream: https://stockfishchess.org/

### Fairy-Stockfish
- Project: Fairy-Stockfish
- Use: Variant engine support
- License: GPL
- Bundled path: `Engines/fairy-stockfish/`
- Upstream: https://fairy-stockfish.github.io/

## Bundled Bots

The following bot engines or engine profiles are intended for bundled
distribution with the app.

### Seer
- License: GPL-3.0

### Obsidian
- License: GPL-3.0

### FoxSEE
- License: Apache-2.0

### Berserk
- License: GPL-3.0

### Maia
- License: GPL-3.0
- Notes: Maia is typically distributed as weights used with an Lc0-compatible
  engine. Preserve the relevant upstream notices for both the Maia weights and
  the Lc0 runtime used with them.

### Fire
- License: GPL-3.0

### Leela Chess Zero (Lc0)
- License: GPL-3.0

## Visual / Audio Assets

### Lucide Icons
- Project: Lucide
- Use: Application UI icons
- License: ISC
- Upstream: https://lucide.dev/

### Lichess-derived Assets
- Use: Board textures, approved piece sets, and sounds retained from Lichess
- License: See upstream and local attribution records
- Local reference: `assets/sound/COPYING.md`
- Upstream reference: https://github.com/lichess-org/lila/blob/master/COPYING.md

## Distribution Notes

- Preserve upstream copyright notices where required.
- Include the full text of all required licenses in a `licenses/` directory.
- If you distribute binaries that bundle GPL components, make the corresponding
  source code for the distributed version available to recipients.
- If bundled bot lists change, update this file before release.
