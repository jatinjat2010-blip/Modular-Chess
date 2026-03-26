const fs = require("fs/promises");
const path = require("path");
const { Chess } = require("chess.js");

class SyncService {
  constructor({ app, lichessApi }) {
    this.app = app;
    this.lichessApi = lichessApi;
  }

  get syncFilePath() {
    return path.join(this.app.getPath("userData"), "online-sync.json");
  }

  async syncUserGames({ username, token, sinceMs, max = 200, recent = false }) {
    const useRecentMode = !!recent;
    const startSince = useRecentMode
      ? null
      : Number.isFinite(Number(sinceMs))
        ? Number(sinceMs)
        : await this.getCheckpoint(username);
    const gamesDir = path.join(this.app.getPath("userData"), "games");
    await fs.mkdir(gamesDir, { recursive: true });

    const params = new URLSearchParams({
      max: String(Math.max(1, Math.min(5000, Number(max) || 200))),
      pgnInJson: "true",
      moves: "true",
      tags: "true",
      clocks: "true",
      evals: "true",
      opening: "true"
    });
    if (!useRecentMode) {
      params.set("since", String(Math.max(0, startSince || 0)));
    }

    const text = await this.lichessApi.requestText(
      `/api/games/user/${encodeURIComponent(username)}?${params.toString()}`,
      {
        token,
        headers: { Accept: "application/x-ndjson" },
        timeoutMs: 120000,
        retries: 2
      }
    );

    const lines = String(text || "")
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);

    let imported = 0;
    let skipped = 0;
    let newestMs = startSince || 0;

    for (const line of lines) {
      let game;
      try {
        game = JSON.parse(line);
      } catch (_) {
        continue;
      }
      const gameId = String(game?.id || "").trim();
      const pgn = String(game?.pgn || "").trim();
      if (!gameId || !pgn) {
        skipped += 1;
        continue;
      }
      if (!this.#isStandardOnlineGame(game, pgn)) {
        skipped += 1;
        continue;
      }
      const filePath = path.join(gamesDir, `lichess_${gameId}.pgn`);
      const endedAt = Number(game?.lastMoveAt || game?.createdAt || 0);
      newestMs = Math.max(newestMs, Number.isFinite(endedAt) ? endedAt : 0);

      try {
        await fs.access(filePath);
        skipped += 1;
        continue;
      } catch (_) {
        // file doesn't exist
      }

      const enriched = this.#normalizeAndEnrichPgn(pgn, {
        gameId,
        username,
        endedAtMs: Number(game?.lastMoveAt || 0),
        createdAtMs: Number(game?.createdAt || 0)
      });

      await fs.writeFile(filePath, `${enriched.pgn.trim()}\n`, "utf8");

      const mtimeMs = Number.isFinite(enriched.playedAtMs) && enriched.playedAtMs > 0 ? enriched.playedAtMs : endedAt;
      if (Number.isFinite(mtimeMs) && mtimeMs > 0) {
        const d = new Date(mtimeMs);
        try {
          await fs.utimes(filePath, d, d);
        } catch (_) {
          // ignore mtime set failures
        }
      }

      imported += 1;
    }

    if (!useRecentMode && newestMs > (startSince || 0)) {
      await this.setCheckpoint(username, newestMs + 1);
    }

    return {
      ok: true,
      imported,
      skipped,
      total: lines.length,
      checkpointMs: newestMs
    };
  }

  async listOnlineGames() {
    const gamesDir = path.join(this.app.getPath("userData"), "games");
    await fs.mkdir(gamesDir, { recursive: true });
    const entries = await fs.readdir(gamesDir, { withFileTypes: true });
    const list = [];
    for (const ent of entries) {
      if (!ent.isFile()) continue;
      if (!/^lichess_.+\.pgn$/i.test(ent.name)) continue;
      const filePath = path.join(gamesDir, ent.name);
      let mtimeMs = 0;
      try {
        const stat = await fs.stat(filePath);
        mtimeMs = Number(stat.mtimeMs || 0);
      } catch (_) {
        mtimeMs = 0;
      }
      list.push({ filePath, name: ent.name, mtimeMs });
    }
    list.sort((a, b) => b.mtimeMs - a.mtimeMs);
    return { ok: true, items: list };
  }

  async saveOnlineGameById({ gameId, token, username }) {
    const id = String(gameId || "").trim();
    if (!id) return { ok: false, error: "Missing gameId." };
    const pgn = await this.lichessApi.requestText(
      `/game/export/${encodeURIComponent(id)}?moves=true&tags=true&clocks=true&evals=true&opening=true&literate=true`,
      {
        token,
        headers: { Accept: "application/x-chess-pgn" },
        timeoutMs: 30000,
        retries: 1
      }
    );
    const gamesDir = path.join(this.app.getPath("userData"), "games");
    await fs.mkdir(gamesDir, { recursive: true });
    const filePath = path.join(gamesDir, `lichess_${id}.pgn`);

    const enriched = this.#normalizeAndEnrichPgn(String(pgn || "").trim(), {
      gameId: id,
      username
    });
    await fs.writeFile(filePath, `${enriched.pgn.trim()}\n`, "utf8");

    if (Number.isFinite(enriched.playedAtMs) && enriched.playedAtMs > 0) {
      const d = new Date(enriched.playedAtMs);
      try {
        await fs.utimes(filePath, d, d);
      } catch (_) {
        // ignore mtime set failures
      }
    }

    return { ok: true, filePath };
  }

  async getCheckpoint(username) {
    const state = await this.#readSyncState();
    const key = String(username || "").toLowerCase();
    return Number(state?.users?.[key]?.lastSyncMs || 0);
  }

  async setCheckpoint(username, ms) {
    const state = await this.#readSyncState();
    const key = String(username || "").toLowerCase();
    if (!state.users) state.users = {};
    state.users[key] = {
      ...(state.users[key] || {}),
      lastSyncMs: Number(ms) || 0,
      updatedAtMs: Date.now()
    };
    await fs.writeFile(this.syncFilePath, JSON.stringify(state, null, 2), "utf8");
  }

  async #readSyncState() {
    try {
      const raw = await fs.readFile(this.syncFilePath, "utf8");
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed;
      return { users: {} };
    } catch (_) {
      return { users: {} };
    }
  }

  #normalizeAndEnrichPgn(rawPgn, meta = {}) {
    const src = String(rawPgn || "").replace(/\r\n/g, "\n").trim();
    if (!src) return { pgn: "", playedAtMs: 0 };

    const { tags, order, moveText } = this.#parsePgn(src);
    const gameId = String(meta.gameId || "").trim();
    const username = String(meta.username || "").trim();

    if (gameId && !tags.LichessGameId) tags.LichessGameId = gameId;
    if (!tags.Source) tags.Source = "Lichess";
    if (username && !tags.UserName) tags.UserName = username;

    let finalFen = "";
    try {
      const game = new Chess();
      game.loadPgn(src, { strict: false });
      finalFen = game.fen();
    } catch (_) {
      finalFen = "";
    }
    if (finalFen) tags.FinalFEN = finalFen;

    if (!tags.UserSide && username) {
      const lowerUser = username.toLowerCase();
      const white = String(tags.White || "").trim().toLowerCase();
      const black = String(tags.Black || "").trim().toLowerCase();
      if (white && white === lowerUser) tags.UserSide = "white";
      if (black && black === lowerUser) tags.UserSide = "black";
    }

    const playedAtMs = this.#derivePlayedAtMs(tags, meta);

    const preferred = [
      "Event",
      "Site",
      "Date",
      "UTCDate",
      "UTCTime",
      "Round",
      "White",
      "Black",
      "Result",
      "TimeControl",
      "Termination",
      "LichessGameId",
      "Source",
      "UserName",
      "UserSide",
      "FinalFEN"
    ];

    for (const key of preferred) {
      if (key in tags && !order.includes(key)) order.push(key);
    }
    for (const key of Object.keys(tags)) {
      if (!order.includes(key)) order.push(key);
    }

    const header = order
      .filter((k) => k in tags)
      .map((k) => `[${k} "${this.#escapePgnTagValue(tags[k])}"]`)
      .join("\n");

    const body = String(moveText || "").trim();
    const pgn = body ? `${header}\n\n${body}\n` : `${header}\n`;
    return { pgn, playedAtMs };
  }

  #parsePgn(src) {
    const split = src.match(/^([\s\S]*?)\n\s*\n([\s\S]*)$/);
    const headerText = split ? split[1] : "";
    const moveText = split ? split[2] : src;
    const tags = {};
    const order = [];

    for (const line of String(headerText || "").split("\n")) {
      const m = line.match(/^\s*\[([A-Za-z0-9_]+)\s+"((?:\\.|[^"])*)"\]\s*$/);
      if (!m) continue;
      const key = m[1];
      const value = m[2].replace(/\\"/g, '"').replace(/\\\\/g, "\\");
      tags[key] = value;
      order.push(key);
    }

    return { tags, order, moveText };
  }

  #escapePgnTagValue(v) {
    return String(v ?? "")
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"');
  }

  #isStandardOnlineGame(game, rawPgn = "") {
    const apiVariant = String(game?.variant || game?.variantKey || game?.perf || "")
      .trim()
      .toLowerCase();
    if (apiVariant) {
      if (apiVariant === "standard" || apiVariant === "chess" || apiVariant === "correspondence") {
        return true;
      }
      return false;
    }

    const src = String(rawPgn || "").replace(/\r\n/g, "\n").trim();
    if (!src) return false;
    const { tags } = this.#parsePgn(src);
    const variantTag = String(tags.Variant || tags.VariantName || "").trim().toLowerCase();
    if (!variantTag) return true;
    return variantTag === "standard" || variantTag === "chess";
  }

  #derivePlayedAtMs(tags, meta = {}) {
    const endedAtMs = Number(meta.endedAtMs || 0);
    if (Number.isFinite(endedAtMs) && endedAtMs > 0) return endedAtMs;

    const createdAtMs = Number(meta.createdAtMs || 0);
    if (Number.isFinite(createdAtMs) && createdAtMs > 0) return createdAtMs;

    const utcDate = String(tags.UTCDate || tags.Date || "").trim();
    const utcTime = String(tags.UTCTime || "00:00:00").trim();
    const dateMatch = utcDate.match(/^(\d{4})\.(\d{2})\.(\d{2})$/);
    const timeMatch = utcTime.match(/^(\d{2}):(\d{2}):(\d{2})$/);
    if (!dateMatch || !timeMatch) return 0;

    const y = Number(dateMatch[1]);
    const mo = Number(dateMatch[2]);
    const d = Number(dateMatch[3]);
    const hh = Number(timeMatch[1]);
    const mm = Number(timeMatch[2]);
    const ss = Number(timeMatch[3]);

    if ([y, mo, d, hh, mm, ss].some((n) => !Number.isFinite(n))) return 0;
    return Date.UTC(y, mo - 1, d, hh, mm, ss);
  }
}

module.exports = { SyncService };
