# Modular Chess

Modular Chess is a free, open-source desktop chess app built for casual players
who want a fun offline playing experience, while also leaving room for
developers to build and add their own modules.

The app includes offline play, analysis, archives, bots, tournaments, and
variant workflows in a modular desktop UI.

## Project Idea

- built first for casual offline chess play
- designed to feel fun and flexible instead of overly technical
- structured so new modules and features can be added over time
- free to use and open source

## License And Notices

This repository is released under the GNU GPL v3. See:

- `LICENSE`
- `THIRD_PARTY_NOTICES.md`
- `licenses/`

Bundled engines, bots, libraries, and retained third-party assets keep their
own licenses and notices. Please review the third-party notice files before
redistributing packaged builds.

Note: the public source repository may not include all bundled engine or bot
binaries used in packaged releases. Those binaries can be distributed as part
of release builds instead of the source tree.

## Bundled engine notice
Packaged releases of this app can bundle the Stockfish chess engine for offline
analysis/play support.

- Stockfish project: https://stockfishchess.org/
- Stockfish source: https://github.com/official-stockfish/Stockfish
- License: GPL-3.0-or-later

See `STOCKFISH_NOTICE.md` and the packaged release notice files for the relevant
license/source notices.

## Current milestone
- Local board play with legal move handling.
- Game recording (SAN move list).
- PGN load from text or file.
- PGN save to file.
- FEN load/copy (board editor foundation).
- UCI process bridge scaffold (load local engine exe, send UCI commands, receive output).

## Run
```bash
cd modular-chess
npm install
npm start
```

## Companion backend for Lichess OAuth (local host)
The app now includes a companion backend at `backend/` for OAuth login testing.

1. Setup backend env:
```bash
cd backend
copy .env.example .env
```
2. Edit `.env` and set `LICHESS_CLIENT_ID` (and `LICHESS_CLIENT_SECRET` if your app requires it).
3. Install and run backend:
```bash
npm install
npm start
```
4. Verify backend health:
```bash
http://127.0.0.1:3000/health
```
5. In app -> `Online Mode`:
- `Backend URL`: `http://127.0.0.1:3000`
- Click `Start Login`
- After browser callback page shows token, copy token
- Paste token in app `Access token` and click `Connect Token`
- Click `Fetch Account`, `Start Stream`, then `Sync Games` or `Create Challenge`

## Direct OAuth (no backend required)
The app also supports direct PKCE OAuth:

1. In app -> `Online Mode`
2. Keep `Lichess OAuth Client ID (optional)` as `offline-lichess-desktop-v1`
3. Click `Connect Lichess`
4. Authorize in browser; app reconnects automatically via `com.offlinechess.app://oauth/callback`
5. Click `Fetch Account`, `Start Stream`, `Sync Games` or `Create Challenge`

If deep-link callback is blocked on your system, use the token fallback fields in the same online modal.

## Planned milestones
1. Solid UCI integration
- Engine list management.
- Best line parsing (`info depth ... pv ...`).
- Eval bar and principal variation display.
- MultiPV and analysis stop/start.

2. Lichess-like board UX
- Switch from simple board to `chessground`.
- Drag-and-drop pieces.
- Arrows, highlights, premove-like interactions (optional).

3. Analysis board
- Move tree with variations.
- NAG/comments.
- Engine cloud disabled (offline only).

4. Board editor
- Piece placement mode.
- Side-to-move, castling rights, en passant, move counters.
- Export to FEN/PGN.

5. Storage
- Local database (`SQLite` or JSON files) for game library.
- Search by player/date/event/position.

## Lichess assets and code usage
Lichess server code is AGPL-3.0. If you copy/modify AGPL code and distribute your app, AGPL obligations apply.

For board and piece art, Lichess `COPYING.md` lists multiple licenses per asset set (for example CC BY-SA, GPL, public domain). You can use assets, but you must:
- Verify the exact license for each specific board/piece set you import.
- Keep attribution and license text in your app/repo.
- Follow share-alike/copyleft terms when required by the chosen assets.

Safer initial path:
- Use your own assets or public-domain sets first.
- Add Lichess-compatible themes later with explicit per-theme attribution.
