const { app, BrowserWindow, dialog, ipcMain, shell, safeStorage, Menu } = require("electron");
const fs = require("fs/promises");
const path = require("path");
const { pathToFileURL } = require("url");
const { spawn } = require("child_process");
const crypto = require("crypto");
const XLSX = require("xlsx");
const { LichessApi } = require("./main/online/lichessApi");
const { SessionStore } = require("./main/online/sessionStore");
const { SyncService } = require("./main/online/syncService");
const { PlayService } = require("./main/online/playService");
const { VisionService } = require("./main/vision/visionService");

let mainWindow = null;
let runningEngine = null;
const tournamentEngines = new Map();

const lichessApi = new LichessApi({
  baseUrl: "https://lichess.org",
  userAgent: "modular-chess/1.0",
  minIntervalMs: 1100
});
let sessionStore = null;
let syncService = null;
let playService = null;
let onlineSession = null;
let pendingOAuth = null;
let visionService = null;

const OAUTH_PROTOCOL = "com.offlinechess.app";
const OAUTH_REDIRECT_URI = `${OAUTH_PROTOCOL}://oauth/callback`;
const OAUTH_DEFAULT_CLIENT_ID = "offline-lichess-desktop-v1";
const OAUTH_DEFAULT_SCOPES = "board:play challenge:read challenge:write preference:read";

function getBundledPath(...segments) {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "app.asar.unpacked", ...segments);
  }
  return path.join(__dirname, ...segments);
}

async function getBuiltinEngineRecords() {
  const items = [];
  const stockfishPath = getBundledPath(
    "Engines",
    "stockfish",
    "stockfish-windows-x86-64-avx2.exe"
  );
  try {
    await fs.access(stockfishPath);
    items.push({
      id: "builtin-stockfish",
      name: "Stockfish",
      path: stockfishPath
    });
  } catch (_) {
    // ignore missing bundled engine
  }
  const fairyPath = getBundledPath(
    "Engines",
    "fairy-stockfish",
    "fairy-stockfish_x86-64-modern.exe"
  );
  try {
    await fs.access(fairyPath);
    items.push({
      id: "builtin-fairy-stockfish",
      name: "Fairy-Stockfish",
      path: fairyPath
    });
  } catch (_) {
    // ignore missing bundled engine
  }
  return items;
}

async function getBuiltinBotRecords() {
  const items = [];
  const foxseePath = getBundledPath("bots", "foxsee_v8.2_win_x86-64.exe");
  try {
    await fs.access(foxseePath);
    items.push({
      id: "curated-bot-foxsee",
      name: "FoxSEE",
      path: foxseePath
    });
  } catch (_) {
    // ignore missing bundled bot
  }
  return items;
}

function sanitizeAssetSlug(input) {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "") || `asset-${Date.now()}`;
}

function getCustomAssetsDir() {
  return path.join(app.getPath("userData"), "custom-assets");
}

function getCustomBoardsDir() {
  return path.join(getCustomAssetsDir(), "boards");
}

function getCustomPiecesDir() {
  return path.join(getCustomAssetsDir(), "pieces");
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function uniquePath(dir, baseName, ext = "") {
  let candidate = path.join(dir, `${baseName}${ext}`);
  let index = 2;
  while (true) {
    try {
      await fs.access(candidate);
      candidate = path.join(dir, `${baseName}-${index}${ext}`);
      index += 1;
    } catch (_) {
      return candidate;
    }
  }
}

function toFileUrl(filePath) {
  return pathToFileURL(filePath).toString();
}

async function listCustomBoards() {
  try {
    const dir = getCustomBoardsDir();
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries
      .filter((e) => e.isFile())
      .map((e) => e.name)
      .filter((name) => /\.(png|jpg|jpeg|webp)$/i.test(name))
      .sort((a, b) => a.localeCompare(b))
      .map((name) => {
        const ext = path.extname(name);
        const base = name.slice(0, -ext.length);
        return {
          id: `custom:${base}`,
          name: `${base} (Imported)`,
          image: toFileUrl(path.join(dir, name)),
          imported: true
        };
      });
  } catch (_) {
    return [];
  }
}

async function listCustomPieceSets() {
  try {
    const dir = getCustomPiecesDir();
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const items = [];
    for (const ent of entries) {
      if (!ent.isDirectory()) continue;
      const setDir = path.join(dir, ent.name);
      try {
        const manifest = JSON.parse(await fs.readFile(path.join(setDir, "manifest.json"), "utf8"));
        const files = manifest?.files || {};
        if (!files.wN) continue;
        const fileUrls = {};
        for (const [key, relPath] of Object.entries(files)) {
          fileUrls[key] = toFileUrl(path.join(setDir, relPath));
        }
        items.push({
          id: `custom:${ent.name}`,
          name: `${manifest?.name || ent.name} (Imported)`,
          preview: fileUrls.wN,
          imported: true,
          files: fileUrls
        });
      } catch (_) {
        // ignore malformed imported sets
      }
    }
    items.sort((a, b) => a.name.localeCompare(b.name));
    return items;
  } catch (_) {
    return [];
  }
}

function randomBase64Url(bytes = 32) {
  return crypto
    .randomBytes(bytes)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function makeCodeChallenge(verifier) {
  return crypto
    .createHash("sha256")
    .update(verifier)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function safeSendToRenderer(channel, payload) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const { webContents } = mainWindow;
  if (!webContents || webContents.isDestroyed()) return;
  webContents.send(channel, payload);
}

function killTournamentEngine(engineId) {
  const key = String(engineId || "").trim();
  if (!key) return;
  const proc = tournamentEngines.get(key);
  if (!proc) return;
  proc._suppressCloseEvent = true;
  try {
    proc.kill();
  } catch (_) {
    // ignore
  }
  tournamentEngines.delete(key);
}

function killAllTournamentEngines() {
  for (const engineId of Array.from(tournamentEngines.keys())) {
    killTournamentEngine(engineId);
  }
}

function writeToTournamentEngine(engineId, line) {
  const key = String(engineId || "").trim();
  if (!key) return { ok: false, error: "Missing tournament engine id." };
  const proc = tournamentEngines.get(key);
  if (!proc || !proc.stdin || proc.killed) {
    return { ok: false, error: "Tournament engine is not running." };
  }
  const text = String(line ?? "").trim();
  if (!text) return { ok: false, error: "Empty command." };
  try {
    proc.stdin.write(`${text}\n`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err?.message || err) };
  }
}

async function finalizeOnlineSessionFromToken(accessToken, extras = {}) {
  const token = String(accessToken || "").trim();
  if (!token) throw new Error("Missing access token.");

  onlineSession = {
    accessToken: token,
    backendUrl: "",
    username: String(extras.username || "").trim(),
    scopes: Array.isArray(extras.scopes) ? extras.scopes : [],
    expiresAtMs: Number(extras.expiresAtMs || 0) || 0,
    connectedAtMs: Date.now()
  };

  try {
    const account = await lichessApi.requestJson("/api/account", {
      token,
      retries: 1
    });
    if (account?.username) {
      onlineSession.username = String(account.username);
    }
  } catch (_) {
    // session can still be used for limited scopes
  }

  await sessionStore.save(onlineSession);
  playService.setToken(onlineSession.accessToken);
  try {
    playService.startEventStream();
  } catch (_) {
    // stream may fail if missing stream scopes
  }
  safeSendToRenderer("online:auth:completed", {
    ok: true,
    username: onlineSession.username || "",
    scopes: onlineSession.scopes || []
  });
}

async function handleOAuthCallbackUrl(rawUrl) {
  try {
    if (!rawUrl || typeof rawUrl !== "string") return;
    let url;
    try {
      url = new URL(rawUrl);
    } catch (_) {
      return;
    }
    if (url.protocol !== `${OAUTH_PROTOCOL}:`) return;
    if (url.hostname !== "oauth") return;
    if (url.pathname !== "/callback") return;

    const error = String(url.searchParams.get("error") || "").trim();
    if (error) {
      const message = String(url.searchParams.get("error_description") || error);
      safeSendToRenderer("online:auth:error", { ok: false, error: message });
      return;
    }

    const code = String(url.searchParams.get("code") || "").trim();
    const state = String(url.searchParams.get("state") || "").trim();
    if (!code || !state) {
      safeSendToRenderer("online:auth:error", {
        ok: false,
        error: "OAuth callback missing code/state."
      });
      return;
    }

    if (!pendingOAuth || pendingOAuth.state !== state) {
      safeSendToRenderer("online:auth:error", {
        ok: false,
        error: "OAuth state mismatch or expired. Please reconnect."
      });
      return;
    }

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: OAUTH_REDIRECT_URI,
      client_id: pendingOAuth.clientId,
      code_verifier: pendingOAuth.verifier
    });

    const tokenJson = await lichessApi.requestJson("/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json"
      },
      body,
      retries: 1,
      timeoutMs: 20000
    });

    pendingOAuth = null;
    const accessToken = String(tokenJson?.access_token || "").trim();
    if (!accessToken) {
      throw new Error("Token exchange returned no access token.");
    }
    const scopeRaw = String(tokenJson?.scope || "").trim();
    const scopes = scopeRaw ? scopeRaw.split(/\s+/).filter(Boolean) : [];
    const expiresSec = Number(tokenJson?.expires_in || 0);
    const expiresAtMs =
      Number.isFinite(expiresSec) && expiresSec > 0 ? Date.now() + expiresSec * 1000 : 0;

    await finalizeOnlineSessionFromToken(accessToken, { scopes, expiresAtMs });
  } catch (err) {
    safeSendToRenderer("online:auth:error", {
      ok: false,
      error: String(err?.message || err)
    });
  }
}

function writeToEngine(line) {
  if (!runningEngine) return { ok: false, error: "Engine not running." };
  const stdin = runningEngine.stdin;
  if (!stdin || stdin.destroyed || stdin.writableEnded || runningEngine.killed) {
    return { ok: false, error: "Engine stdin is closed." };
  }
  try {
    stdin.write(`${line}\n`, (err) => {
      if (err) {
        safeSendToRenderer("engine:stderr", `Engine write error: ${err.message || String(err)}`);
      }
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err?.message || err) };
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1100,
    minHeight: 720,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: "#161512",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, "src", "index.html"));
  mainWindow.once("ready-to-show", () => {
    mainWindow.maximize();
    mainWindow.show();
    if (String(process.env.AUTO_OPEN_DEVTOOLS || "") === "1") {
      try {
        mainWindow.webContents.openDevTools({ mode: "detach" });
      } catch (_) {
        // ignore
      }
    }
  });
  mainWindow.on("enter-full-screen", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("window:fullscreen-changed", { isFullscreen: true });
    }
  });
  mainWindow.on("leave-full-screen", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("window:fullscreen-changed", { isFullscreen: false });
    }
  });
}

const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
}

app.on("second-instance", (_event, argv) => {
  const deepLinkArg = (argv || []).find((arg) => typeof arg === "string" && arg.startsWith(`${OAUTH_PROTOCOL}://`));
  if (deepLinkArg) {
    handleOAuthCallbackUrl(deepLinkArg);
  }
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.on("open-url", (event, url) => {
  event.preventDefault();
  handleOAuthCallbackUrl(url);
});

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient(OAUTH_PROTOCOL, process.execPath, [path.resolve(process.argv[1])]);
    }
  } else {
    app.setAsDefaultProtocolClient(OAUTH_PROTOCOL);
  }

  sessionStore = new SessionStore({ app, safeStorage });
  syncService = new SyncService({ app, lichessApi });
  visionService = new VisionService({
    pythonCommand: process.env.VISION_PYTHON || process.env.PYTHON || "python",
    scriptPath: getBundledPath("vision-backend", "server.py"),
    cwd: getBundledPath()
  });
  playService = new PlayService({
    lichessApi,
    onEvent: async (evt) => {
      safeSendToRenderer("online:event:stream", evt);
      try {
        if (evt?.type === "gameFinish") {
          const gameId = String(evt?.game?.id || evt?.id || "");
          if (gameId && onlineSession?.accessToken) {
            await syncService.saveOnlineGameById({
              gameId,
              token: onlineSession.accessToken,
              username: onlineSession.username || ""
            });
          }
        }
      } catch (err) {
        safeSendToRenderer("online:stream:error", {
          kind: "archive",
          message: `Auto-save finished game failed: ${String(err?.message || err)}`
        });
      }
    },
    onGameEvent: (gameId, evt) => {
      safeSendToRenderer("online:game:stream", { gameId, event: evt });
    },
    onError: (err) => {
      safeSendToRenderer("online:stream:error", err);
    }
  });
  onlineSession = (await sessionStore.load()) || null;
  if (onlineSession?.accessToken) {
    playService.setToken(onlineSession.accessToken);
    try {
      playService.startEventStream();
    } catch (_) {
      // will retry after user reconnects
    }
  }
  try {
    await visionService.start();
  } catch (_) {
    // Vision backend is optional and should not block app startup.
  }
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  if (runningEngine) {
    runningEngine.kill();
    runningEngine = null;
  }
  killAllTournamentEngines();
  if (playService) {
    playService.dispose();
  }
  if (visionService) {
    visionService.dispose();
  }
});

function requireOnlineSession() {
  if (!onlineSession?.accessToken) {
    const err = new Error("Not authenticated. Connect Lichess first.");
    err.code = "NO_SESSION";
    throw err;
  }
  return onlineSession;
}

function validateChallengeClock(limitSec, incrementSec) {
  const limit = Number(limitSec);
  const inc = Number(incrementSec);
  if (!Number.isFinite(limit) || limit < 0) {
    return { ok: false, error: "Invalid clock limit." };
  }
  if (!Number.isFinite(inc) || inc < 0 || inc > 60) {
    return { ok: false, error: "Increment must be between 0 and 60." };
  }
  const allowedSpecial = new Set([0, 15, 30, 45, 60, 90]);
  const isAllowed = allowedSpecial.has(limit) || (limit % 60 === 0 && limit <= 10800);
  if (!isAllowed) {
    return { ok: false, error: "Clock limit must be 0,15,30,45,60,90 or a multiple of 60 up to 10800." };
  }
  return { ok: true };
}

function validateSeekClock(timeMinutes, incrementSeconds) {
  const time = Number(timeMinutes);
  const inc = Number(incrementSeconds);
  if (!Number.isFinite(time) || time < 0 || time > 180) {
    return { ok: false, error: "Seek time must be between 0 and 180 minutes." };
  }
  if (!Number.isFinite(inc) || inc < 0 || inc > 180) {
    return { ok: false, error: "Seek increment must be between 0 and 180 seconds." };
  }
  return { ok: true };
}

ipcMain.handle("file:openText", async (_event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    filters: options?.filters ?? [{ name: "All Files", extensions: ["*"] }]
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  const filePath = result.filePaths[0];
  const content = await fs.readFile(filePath, "utf8");
  return { filePath, content };
});

ipcMain.handle("window:isFullscreen", async () => {
  if (!mainWindow || mainWindow.isDestroyed()) return false;
  return !!mainWindow.isFullScreen();
});

ipcMain.handle("window:setFullscreen", async (_event, payload) => {
  if (!mainWindow || mainWindow.isDestroyed()) return { ok: false, error: "Window unavailable." };
  const isFullscreen = !!payload?.isFullscreen;
  mainWindow.setFullScreen(isFullscreen);
  return { ok: true, isFullscreen: !!mainWindow.isFullScreen() };
});

ipcMain.handle("file:pickFile", async (_event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    filters: options?.filters ?? [{ name: "All Files", extensions: ["*"] }]
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return { filePath: result.filePaths[0] };
});

ipcMain.handle("file:saveText", async (_event, payload) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: payload?.defaultPath,
    filters: payload?.filters ?? [{ name: "Text", extensions: ["txt"] }]
  });
  if (result.canceled || !result.filePath) return null;
  await fs.writeFile(result.filePath, payload?.content ?? "", "utf8");
  return result.filePath;
});

ipcMain.handle("tournament:importPlayers", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    filters: [
      { name: "Player Imports", extensions: ["csv", "xls", "xlsx"] },
      { name: "CSV", extensions: ["csv"] },
      { name: "Excel", extensions: ["xls", "xlsx"] }
    ]
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  try {
    const filePath = result.filePaths[0];
    const workbook = XLSX.readFile(filePath, { raw: false });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) return { ok: false, error: "No worksheet found." };
    const sheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    if (!Array.isArray(rows) || !rows.length) {
      return { ok: false, error: "No rows found in import file." };
    }
    const sample = rows[0] && typeof rows[0] === "object" ? rows[0] : {};
    const normalizedKeys = Object.keys(sample).reduce((acc, key) => {
      acc[String(key).trim().toLowerCase()] = key;
      return acc;
    }, {});
    const playerKey = normalizedKeys.players || normalizedKeys.player || normalizedKeys.name;
    const ratingKey = normalizedKeys.ratings || normalizedKeys.rating;
    if (!playerKey || !ratingKey) {
      return { ok: false, error: "Import file must contain Players and Ratings columns." };
    }
    const players = rows.map((row, idx) => ({
      rowNo: idx + 2,
      name: String(row[playerKey] ?? "").trim(),
      rating: String(row[ratingKey] ?? "").trim()
    }));
    return { ok: true, filePath, players };
  } catch (err) {
    return { ok: false, error: String(err?.message || err || "Import failed.") };
  }
});

ipcMain.handle("vision:start", async () => {
  try {
    return await visionService.start();
  } catch (err) {
    return { ok: false, running: false, ready: false, error: String(err?.message || err) };
  }
});

ipcMain.handle("vision:stop", async () => {
  try {
    return await visionService.stop();
  } catch (err) {
    return { ok: false, running: false, error: String(err?.message || err) };
  }
});

ipcMain.handle("vision:status", async () => {
  try {
    return await visionService.status();
  } catch (err) {
    return { ok: false, running: false, ready: false, error: String(err?.message || err) };
  }
});

ipcMain.handle("vision:recognize-image", async (_event, payload) => {
  try {
    return await visionService.recognizeImage({
      imagePath: String(payload?.imagePath || "").trim(),
      imageDataUrl: String(payload?.imageDataUrl || "").trim(),
      whiteBottom: payload?.whiteBottom !== false
    });
  } catch (err) {
    return { ok: false, error: String(err?.message || err) };
  }
});

ipcMain.handle("games:autoSavePgn", async (_event, payload) => {
  const pgn = String(payload?.pgn ?? "").trim();
  if (!pgn) return { ok: false, error: "Empty PGN." };

  const userDataDir = app.getPath("userData");
  const gamesDir = path.join(userDataDir, "games");
  await fs.mkdir(gamesDir, { recursive: true });

  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  const resultToken = String(payload?.result || "unknown")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  const sideToken = String(payload?.playerSide || "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  const baseName = ["game", stamp, resultToken || "unknown", sideToken || "na"].join("_");
  const filePath = path.join(gamesDir, `${baseName}.pgn`);

  await fs.writeFile(filePath, `${pgn}\n`, "utf8");
  return { ok: true, filePath };
});

function getGamesDir() {
  return path.join(app.getPath("userData"), "games");
}

function resolveArchiveFilePath(filePath) {
  const gamesDir = getGamesDir();
  const requested = path.resolve(String(filePath || ""));
  const base = path.resolve(gamesDir);
  if (!requested || !requested.startsWith(base)) {
    throw new Error("Invalid file path.");
  }
  return requested;
}

function getAnalysisSidecarPath(filePath) {
  return `${filePath}.analysis.json`;
}

ipcMain.handle("games:readAnalysis", async (_event, payload) => {
  let requested;
  try {
    requested = resolveArchiveFilePath(payload?.filePath);
  } catch (err) {
    return { ok: false, error: String(err?.message || err) };
  }
  const sidecarPath = getAnalysisSidecarPath(requested);
  try {
    const content = await fs.readFile(sidecarPath, "utf8");
    const analysis = JSON.parse(content);
    return { ok: true, analysis, filePath: requested };
  } catch (err) {
    if (err && err.code === "ENOENT") {
      return { ok: true, analysis: null, filePath: requested };
    }
    return { ok: false, error: String(err?.message || err) };
  }
});

ipcMain.handle("games:writeAnalysis", async (_event, payload) => {
  const pgn = String(payload?.pgn ?? "").trim();
  if (!pgn) return { ok: false, error: "Empty PGN." };
  const analysis = payload?.analysis;
  if (!analysis || typeof analysis !== "object") {
    return { ok: false, error: "Missing analysis payload." };
  }
  let requested;
  try {
    requested = resolveArchiveFilePath(payload?.filePath);
  } catch (err) {
    return { ok: false, error: String(err?.message || err) };
  }
  const sidecarPath = getAnalysisSidecarPath(requested);
  const pgnHash = crypto.createHash("sha256").update(pgn).digest("hex");
  const nextPayload = {
    version: 1,
    sourceFilePath: requested,
    pgnHash,
    updatedAt: Date.now(),
    analysis
  };
  try {
    await fs.writeFile(sidecarPath, `${JSON.stringify(nextPayload, null, 2)}\n`, "utf8");
    return { ok: true, filePath: requested, analysisPath: sidecarPath, pgnHash };
  } catch (err) {
    return { ok: false, error: String(err?.message || err) };
  }
});

ipcMain.handle("games:list", async () => {
  const gamesDir = getGamesDir();
  await fs.mkdir(gamesDir, { recursive: true });
  const entries = await fs.readdir(gamesDir, { withFileTypes: true });
  const pgnFiles = [];
  for (const ent of entries) {
    if (!ent.isFile()) continue;
    if (!ent.name.toLowerCase().endsWith(".pgn")) continue;
    const filePath = path.join(gamesDir, ent.name);
    let mtimeMs = 0;
    try {
      const stat = await fs.stat(filePath);
      mtimeMs = Number(stat.mtimeMs || 0);
    } catch (_) {
      mtimeMs = 0;
    }
    pgnFiles.push({ name: ent.name, filePath, mtimeMs });
  }
  pgnFiles.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return { ok: true, items: pgnFiles };
});

ipcMain.handle("games:read", async (_event, payload) => {
  let requested;
  try {
    requested = resolveArchiveFilePath(payload?.filePath);
  } catch (err) {
    return { ok: false, error: String(err?.message || err) };
  }
  try {
    const content = await fs.readFile(requested, "utf8");
    return { ok: true, content, filePath: requested };
  } catch (err) {
    return { ok: false, error: String(err?.message || err) };
  }
});

ipcMain.handle("games:delete", async (_event, payload) => {
  let requested;
  try {
    requested = resolveArchiveFilePath(payload?.filePath);
  } catch (err) {
    return { ok: false, error: String(err?.message || err) };
  }
  try {
    await fs.unlink(requested);
    await fs.unlink(getAnalysisSidecarPath(requested)).catch((err) => {
      if (err && err.code !== "ENOENT") throw err;
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err?.message || err) };
  }
});

ipcMain.handle("tournament:exportCsv", async (_event, payload) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: payload?.defaultPath || "tournament_standings.csv",
      filters: [{ name: "CSV", extensions: ["csv"] }]
    });
    if (result.canceled || !result.filePath) return { ok: false, canceled: true };
    await fs.writeFile(result.filePath, String(payload?.content || ""), "utf8");
    return { ok: true, filePath: result.filePath };
  } catch (err) {
    return { ok: false, error: String(err?.message || err) };
  }
});

ipcMain.handle("assets:listBoards", async () => {
  try {
    const dir = path.join(__dirname, "assets", "board");
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = entries
      .filter((e) => e.isFile())
      .map((e) => e.name)
      .filter((name) => /\.(png|jpg|jpeg|webp)$/i.test(name))
      .filter((name) => !/\.thumbnail\./i.test(name));
    files.sort((a, b) => a.localeCompare(b));

    const items = files.map((name) => {
      const ext = path.extname(name);
      const base = name.slice(0, -ext.length);
      return {
        id: name,
        name: base,
        image: `../assets/board/${name}`
      };
    });
    return { ok: true, items: [...items, ...(await listCustomBoards())] };
  } catch (err) {
    return { ok: false, error: String(err?.message || err), items: [] };
  }
});

ipcMain.handle("assets:listPieceSets", async () => {
  try {
    const dir = path.join(__dirname, "assets", "Pieces");
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const dirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);
    dirs.sort((a, b) => a.localeCompare(b));
    const items = dirs.map((setName) => ({
      id: setName,
      name: setName,
      preview: `../assets/Pieces/${setName}/wN.svg`
    }));
    return { ok: true, items: [...items, ...(await listCustomPieceSets())] };
  } catch (err) {
    return { ok: false, error: String(err?.message || err), items: [] };
  }
});

ipcMain.handle("assets:importBoard", async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openFile"],
      filters: [{ name: "Images", extensions: ["png", "jpg", "jpeg", "webp"] }]
    });
    if (result.canceled || !result.filePaths?.[0]) return { ok: false, canceled: true };
    const sourcePath = result.filePaths[0];
    const sourceExt = path.extname(sourcePath).toLowerCase();
    const baseName = sanitizeAssetSlug(path.basename(sourcePath, sourceExt));
    const destDir = getCustomBoardsDir();
    await ensureDir(destDir);
    const destPath = await uniquePath(destDir, baseName, sourceExt);
    await fs.copyFile(sourcePath, destPath);
    return {
      ok: true,
      item: {
        id: `custom:${path.basename(destPath, sourceExt)}`,
        name: `${path.basename(destPath, sourceExt)} (Imported)`,
        image: toFileUrl(destPath),
        imported: true
      }
    };
  } catch (err) {
    return { ok: false, error: String(err?.message || err) };
  }
});

ipcMain.handle("assets:importPieceSet", async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openDirectory"]
    });
    if (result.canceled || !result.filePaths?.[0]) return { ok: false, canceled: true };
    const sourceDir = result.filePaths[0];
    const entries = await fs.readdir(sourceDir, { withFileTypes: true });
    const files = new Map();
    for (const ent of entries) {
      if (!ent.isFile()) continue;
      const ext = path.extname(ent.name).toLowerCase();
      if (![".svg", ".png", ".jpg", ".jpeg", ".webp"].includes(ext)) continue;
      const base = path.basename(ent.name, ext);
      files.set(base, path.join(sourceDir, ent.name));
    }
    const required = ["wK", "wQ", "wR", "wB", "wN", "wP", "bK", "bQ", "bR", "bB", "bN", "bP"];
    const missing = required.filter((name) => !files.has(name));
    if (missing.length) {
      return { ok: false, error: `Missing required files: ${missing.join(", ")}` };
    }
    const rootDir = getCustomPiecesDir();
    await ensureDir(rootDir);
    const folderSlug = sanitizeAssetSlug(path.basename(sourceDir));
    const setDir = await uniquePath(rootDir, folderSlug, "");
    await ensureDir(setDir);
    const manifestFiles = {};
    for (const key of required) {
      const sourcePath = files.get(key);
      const ext = path.extname(sourcePath).toLowerCase();
      const destName = `${key}${ext}`;
      await fs.copyFile(sourcePath, path.join(setDir, destName));
      manifestFiles[key] = destName;
    }
    const manifest = {
      name: path.basename(setDir),
      files: manifestFiles
    };
    await fs.writeFile(path.join(setDir, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
    const fileUrls = {};
    for (const [key, rel] of Object.entries(manifestFiles)) {
      fileUrls[key] = toFileUrl(path.join(setDir, rel));
    }
    return {
      ok: true,
      item: {
        id: `custom:${path.basename(setDir)}`,
        name: `${path.basename(setDir)} (Imported)`,
        preview: fileUrls.wN,
        imported: true,
        files: fileUrls
      }
    };
  } catch (err) {
    return { ok: false, error: String(err?.message || err) };
  }
});

ipcMain.handle("assets:deleteBoard", async (_event, payload) => {
  try {
    const id = String(payload?.id || "");
    if (!id.startsWith("custom:")) return { ok: false, error: "Only imported boards can be deleted." };
    const slug = sanitizeAssetSlug(id.slice("custom:".length));
    const dir = getCustomBoardsDir();
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const match = entries.find((e) => e.isFile() && path.basename(e.name, path.extname(e.name)) === slug);
    if (!match) return { ok: false, error: "Imported board not found." };
    await fs.unlink(path.join(dir, match.name));
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err?.message || err) };
  }
});

ipcMain.handle("assets:deletePieceSet", async (_event, payload) => {
  try {
    const id = String(payload?.id || "");
    if (!id.startsWith("custom:")) return { ok: false, error: "Only imported piece sets can be deleted." };
    const slug = sanitizeAssetSlug(id.slice("custom:".length));
    const setDir = path.join(getCustomPiecesDir(), slug);
    await fs.rm(setDir, { recursive: true, force: true });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err?.message || err) };
  }
});

ipcMain.handle("assets:listSoundSets", async () => {
  try {
    const dir = path.join(__dirname, "assets", "sound");
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const sets = [];
    const silenceOgg = path.join(dir, "Silence.ogg");
    const silenceMp3 = path.join(dir, "Silence.mp3");
    try {
      await fs.access(silenceOgg);
      sets.push({ id: "silence", name: "silence" });
    } catch (_) {
      try {
        await fs.access(silenceMp3);
        sets.push({ id: "silence", name: "silence" });
      } catch (_) {
        // ignore missing silence asset
      }
    }
    for (const ent of entries) {
      if (!ent.isDirectory()) continue;
      const setName = ent.name;
      const setDir = path.join(dir, setName);
      let files = [];
      try {
        files = await fs.readdir(setDir);
      } catch (_) {
        files = [];
      }
      const hasMove = files.some((f) => /^move\.(ogg|mp3)$/i.test(f));
      const hasCapture = files.some((f) => /^capture\.(ogg|mp3)$/i.test(f));
      const hasLowTime = files.some((f) => /^lowtime\.(ogg|mp3)$/i.test(f));
      const hasNotify = files.some((f) => /^genericnotify\.(ogg|mp3)$/i.test(f));
      if (!(hasMove && hasCapture && hasLowTime && hasNotify)) continue;
      sets.push({ id: setName, name: setName });
    }
    sets.sort((a, b) => a.name.localeCompare(b.name));
    return { ok: true, items: sets };
  } catch (err) {
    return { ok: false, error: String(err?.message || err), items: [] };
  }
});

ipcMain.handle("engine:start", async (_event, payload) => {
  if (!payload?.enginePath) return { ok: false, error: "Missing engine path." };

  if (runningEngine) {
    runningEngine._suppressCloseEvent = true;
    runningEngine.kill();
    runningEngine = null;
  }

  try {
    const enginePath = String(payload?.enginePath || "").trim();
    const proc = spawn(enginePath, [], {
      stdio: "pipe",
      cwd: path.dirname(enginePath)
    });
    runningEngine = proc;

    proc.on("error", (err) => {
      safeSendToRenderer("engine:stderr", `Engine process error: ${err.message || String(err)}`);
    });
    proc.stdout.on("data", (chunk) => {
      safeSendToRenderer("engine:stdout", chunk.toString("utf8"));
    });
    proc.stderr.on("data", (chunk) => {
      safeSendToRenderer("engine:stderr", chunk.toString("utf8"));
    });
    proc.stdin.on("error", (err) => {
      safeSendToRenderer("engine:stderr", `Engine stdin error: ${err.message || String(err)}`);
    });
    proc.on("close", (code, signal) => {
      if (!proc._suppressCloseEvent) {
        safeSendToRenderer("engine:closed", { code, signal });
      }
      if (runningEngine === proc) {
        runningEngine = null;
      }
    });

    const writeRes = writeToEngine("uci");
    if (!writeRes.ok) {
      runningEngine = null;
      proc.kill();
      return { ok: false, error: writeRes.error };
    }
    return { ok: true };
  } catch (err) {
    runningEngine = null;
    return { ok: false, error: String(err?.message || err) };
  }
});

ipcMain.handle("engine:listBuiltin", async () => {
  try {
    const items = await getBuiltinEngineRecords();
    return { ok: true, items };
  } catch (err) {
    return { ok: false, error: String(err?.message || err), items: [] };
  }
});

ipcMain.handle("bots:listBuiltin", async () => {
  try {
    const items = await getBuiltinBotRecords();
    return { ok: true, items };
  } catch (err) {
    return { ok: false, error: String(err?.message || err), items: [] };
  }
});

ipcMain.handle("engine:send", async (_event, line) => {
  return writeToEngine(line);
});

ipcMain.handle("engine:stop", async () => {
  if (!runningEngine) return { ok: true };
  runningEngine._suppressCloseEvent = true;
  runningEngine.kill();
  runningEngine = null;
  return { ok: true };
});

ipcMain.handle("tournament-engine:start", async (_event, payload) => {
  const engineId = String(payload?.engineId || "").trim();
  const enginePath = String(payload?.enginePath || "").trim();
  if (!engineId) return { ok: false, error: "Missing tournament engine id." };
  if (!enginePath) return { ok: false, error: "Missing engine path." };

  killTournamentEngine(engineId);

  try {
    const proc = spawn(enginePath, [], {
      stdio: "pipe",
      cwd: path.dirname(enginePath)
    });
    tournamentEngines.set(engineId, proc);

    proc.on("error", (err) => {
      safeSendToRenderer("tournament-engine:stderr", {
        id: engineId,
        text: `Engine process error: ${err.message || String(err)}`
      });
    });
    proc.stdout.on("data", (chunk) => {
      safeSendToRenderer("tournament-engine:stdout", {
        id: engineId,
        text: chunk.toString("utf8")
      });
    });
    proc.stderr.on("data", (chunk) => {
      safeSendToRenderer("tournament-engine:stderr", {
        id: engineId,
        text: chunk.toString("utf8")
      });
    });
    proc.stdin.on("error", (err) => {
      safeSendToRenderer("tournament-engine:stderr", {
        id: engineId,
        text: `Engine stdin error: ${err.message || String(err)}`
      });
    });
    proc.on("close", (code, signal) => {
      if (!proc._suppressCloseEvent) {
        safeSendToRenderer("tournament-engine:closed", { id: engineId, code, signal });
      }
      if (tournamentEngines.get(engineId) === proc) {
        tournamentEngines.delete(engineId);
      }
    });

    const writeRes = writeToTournamentEngine(engineId, "uci");
    if (!writeRes.ok) {
      killTournamentEngine(engineId);
      return { ok: false, error: writeRes.error };
    }
    return { ok: true };
  } catch (err) {
    killTournamentEngine(engineId);
    return { ok: false, error: String(err?.message || err) };
  }
});

ipcMain.handle("tournament-engine:send", async (_event, payload) => {
  return writeToTournamentEngine(payload?.engineId, payload?.line);
});

ipcMain.handle("tournament-engine:stop", async (_event, payload) => {
  const engineId = String(payload?.engineId || "").trim();
  if (!engineId) return { ok: false, error: "Missing tournament engine id." };
  killTournamentEngine(engineId);
  return { ok: true };
});

ipcMain.handle("tournament-engine:stopAll", async () => {
  killAllTournamentEngines();
  return { ok: true };
});

// Online IPC
ipcMain.handle("online:session:get", async () => {
  const hasSession = !!onlineSession?.accessToken;
  return {
    ok: true,
    connected: hasSession,
    backendUrl: onlineSession?.backendUrl || "",
    username: onlineSession?.username || "",
    scopes: Array.isArray(onlineSession?.scopes) ? onlineSession.scopes : []
  };
});

ipcMain.handle("online:auth:start", async (_event, payload) => {
  const clientId = String(payload?.clientId || OAUTH_DEFAULT_CLIENT_ID).trim();
  if (!clientId) {
    return { ok: false, error: "Missing OAuth client id." };
  }
  const verifier = randomBase64Url(48);
  const state = randomBase64Url(24);
  const challenge = makeCodeChallenge(verifier);
  const scopes = String(payload?.scopes || OAUTH_DEFAULT_SCOPES)
    .trim()
    .replace(/\s+/g, " ");
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: OAUTH_REDIRECT_URI,
    scope: scopes,
    state,
    code_challenge_method: "S256",
    code_challenge: challenge
  });
  const url = `https://lichess.org/oauth?${params.toString()}`;
  pendingOAuth = {
    state,
    verifier,
    clientId,
    scopes,
    createdAt: Date.now()
  };
  await shell.openExternal(url);
  return { ok: true, openedUrl: url };
});

ipcMain.handle("online:auth:callback", async (_event, payload) => {
  const accessToken = String(payload?.accessToken || "").trim();
  if (!accessToken) return { ok: false, error: "Missing access token." };
  await finalizeOnlineSessionFromToken(accessToken, {
    username: String(payload?.username || "").trim(),
    scopes: Array.isArray(payload?.scopes) ? payload.scopes : [],
    expiresAtMs: Number(payload?.expiresAtMs || 0) || 0
  });
  return { ok: true };
});

ipcMain.handle("online:auth:logout", async () => {
  try {
    if (onlineSession?.accessToken) {
      await lichessApi.requestText("/api/token", {
        method: "DELETE",
        token: onlineSession.accessToken,
        headers: { Accept: "application/json" },
        timeoutMs: 10000,
        retries: 0
      });
    }
  } catch (_) {
    // ignore revoke errors
  }
  if (playService) playService.dispose();
  onlineSession = null;
  await sessionStore.clear();
  return { ok: true };
});

ipcMain.handle("online:stream:start", async () => {
  const session = requireOnlineSession();
  playService.setToken(session.accessToken);
  playService.startEventStream();
  return { ok: true };
});

ipcMain.handle("online:stream:stop", async () => {
  if (playService) {
    playService.stopEventStream();
    playService.stopAllGameStreams();
  }
  return { ok: true };
});

ipcMain.handle("online:account:get", async () => {
  const session = requireOnlineSession();
  const account = await lichessApi.requestJson("/api/account", {
    token: session.accessToken,
    retries: 1
  });
  if (account?.username) {
    onlineSession.username = String(account.username);
    await sessionStore.save(onlineSession);
  }
  return { ok: true, account };
});

ipcMain.handle("online:ratings:get", async (_event, payload) => {
  const session = requireOnlineSession();
  const username = String(payload?.username || session.username || "").trim();
  if (!username) return { ok: false, error: "Missing username." };
  const user = await lichessApi.requestJson(`/api/user/${encodeURIComponent(username)}?profile=true&rank=true`, {
    token: session.accessToken,
    retries: 1
  });
  const history = await lichessApi.requestJson(`/api/user/${encodeURIComponent(username)}/rating-history`, {
    retries: 1
  });
  return { ok: true, user, history };
});

ipcMain.handle("online:games:sync", async (_event, payload) => {
  const session = requireOnlineSession();
  const username = String(payload?.username || session.username || "").trim();
  if (!username) return { ok: false, error: "Missing username." };
  const result = await syncService.syncUserGames({
    username,
    token: session.accessToken,
    sinceMs: payload?.sinceMs,
    max: payload?.max || 500,
    recent: !!payload?.recent
  });
  return result;
});

ipcMain.handle("online:games:list", async () => {
  return syncService.listOnlineGames();
});

ipcMain.handle("online:challenge:create", async (_event, payload) => {
  const session = requireOnlineSession();
  const username = String(payload?.username || "").trim();
  if (!username) return { ok: false, error: "Missing opponent username." };
  const clockCheck = validateChallengeClock(payload?.clockLimitSec, payload?.clockIncrementSec);
  if (!clockCheck.ok) return clockCheck;

  const body = new URLSearchParams();
  body.set("rated", payload?.rated ? "true" : "false");
  body.set("color", String(payload?.color || "random"));
  body.set("variant", String(payload?.variant || "standard"));
  body.set("clock.limit", String(Number(payload.clockLimitSec)));
  body.set("clock.increment", String(Number(payload.clockIncrementSec)));

  const res = await lichessApi.requestJson(`/api/challenge/${encodeURIComponent(username)}`, {
    method: "POST",
    token: session.accessToken,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    retries: 1,
    timeoutMs: 20000
  });
  return { ok: true, data: res };
});

ipcMain.handle("online:challenge:accept", async (_event, payload) => {
  const session = requireOnlineSession();
  const challengeId = String(payload?.challengeId || "").trim();
  if (!challengeId) return { ok: false, error: "Missing challenge ID." };
  const res = await lichessApi.requestJson(`/api/challenge/${encodeURIComponent(challengeId)}/accept`, {
    method: "POST",
    token: session.accessToken,
    retries: 1
  });
  return { ok: true, data: res };
});

ipcMain.handle("online:challenge:decline", async (_event, payload) => {
  const session = requireOnlineSession();
  const challengeId = String(payload?.challengeId || "").trim();
  if (!challengeId) return { ok: false, error: "Missing challenge ID." };
  const res = await lichessApi.requestJson(`/api/challenge/${encodeURIComponent(challengeId)}/decline`, {
    method: "POST",
    token: session.accessToken,
    retries: 1
  });
  return { ok: true, data: res };
});

ipcMain.handle("online:challenge:cancel", async (_event, payload) => {
  const session = requireOnlineSession();
  const challengeId = String(payload?.challengeId || "").trim();
  if (!challengeId) return { ok: false, error: "Missing challenge ID." };
  const res = await lichessApi.requestJson(`/api/challenge/${encodeURIComponent(challengeId)}/cancel`, {
    method: "POST",
    token: session.accessToken,
    retries: 1
  });
  return { ok: true, data: res };
});

ipcMain.handle("online:seek:start", async (_event, payload) => {
  const session = requireOnlineSession();
  const check = validateSeekClock(payload?.timeMinutes, payload?.incrementSeconds);
  if (!check.ok) return check;
  playService.setToken(session.accessToken);
  try {
    playService.startEventStream();
  } catch (_) {
    // ignore, seek can still be attempted
  }
  playService.startSeek({
    timeMinutes: Number(payload.timeMinutes),
    incrementSeconds: Number(payload.incrementSeconds),
    rated: !!payload?.rated,
    color: String(payload?.color || "random"),
    variant: String(payload?.variant || "standard")
  });
  return { ok: true };
});

ipcMain.handle("online:seek:cancel", async () => {
  if (playService) {
    playService.cancelSeek();
  }
  return { ok: true };
});

ipcMain.handle("online:game:join", async (_event, payload) => {
  const session = requireOnlineSession();
  const gameId = String(payload?.gameId || "").trim();
  if (!gameId) return { ok: false, error: "Missing game ID." };
  playService.setToken(session.accessToken);
  playService.joinGameStream(gameId);
  return { ok: true };
});

ipcMain.handle("online:game:move", async (_event, payload) => {
  const session = requireOnlineSession();
  const gameId = String(payload?.gameId || "").trim();
  const move = String(payload?.move || "").trim();
  if (!gameId || !move) return { ok: false, error: "Missing gameId or move." };
  const offeringDraw = payload?.offeringDraw ? "?offeringDraw=true" : "";
  const res = await lichessApi.requestJson(
    `/api/board/game/${encodeURIComponent(gameId)}/move/${encodeURIComponent(move)}${offeringDraw}`,
    {
      method: "POST",
      token: session.accessToken,
      retries: 1,
      timeoutMs: 12000
    }
  );
  return { ok: true, data: res };
});

ipcMain.handle("online:game:resign", async (_event, payload) => {
  const session = requireOnlineSession();
  const gameId = String(payload?.gameId || "").trim();
  if (!gameId) return { ok: false, error: "Missing gameId." };
  const res = await lichessApi.requestJson(`/api/board/game/${encodeURIComponent(gameId)}/resign`, {
    method: "POST",
    token: session.accessToken,
    retries: 1
  });
  return { ok: true, data: res };
});

ipcMain.handle("online:game:draw", async (_event, payload) => {
  const session = requireOnlineSession();
  const gameId = String(payload?.gameId || "").trim();
  const accept = payload?.accept === false ? "no" : "yes";
  if (!gameId) return { ok: false, error: "Missing gameId." };
  const res = await lichessApi.requestJson(`/api/board/game/${encodeURIComponent(gameId)}/draw/${accept}`, {
    method: "POST",
    token: session.accessToken,
    retries: 1
  });
  return { ok: true, data: res };
});

ipcMain.handle("online:game:takeback", async (_event, payload) => {
  const session = requireOnlineSession();
  const gameId = String(payload?.gameId || "").trim();
  const accept = payload?.accept === false ? "no" : "yes";
  if (!gameId) return { ok: false, error: "Missing gameId." };
  const res = await lichessApi.requestJson(
    `/api/board/game/${encodeURIComponent(gameId)}/takeback/${accept}`,
    {
      method: "POST",
      token: session.accessToken,
      retries: 1
    }
  );
  return { ok: true, data: res };
});

ipcMain.handle("online:game:chat", async (_event, payload) => {
  const session = requireOnlineSession();
  const gameId = String(payload?.gameId || "").trim();
  const text = String(payload?.text || "").trim();
  const room = String(payload?.room || "player").trim() || "player";
  if (!gameId || !text) return { ok: false, error: "Missing gameId or text." };
  const res = await lichessApi.requestText(`/api/board/game/${encodeURIComponent(gameId)}/chat`, {
    method: "POST",
    token: session.accessToken,
    body: new URLSearchParams({ room, text }),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    retries: 1
  });
  return { ok: true, data: res };
});

ipcMain.handle("online:game:save", async (_event, payload) => {
  const session = requireOnlineSession();
  const gameId = String(payload?.gameId || "").trim();
  if (!gameId) return { ok: false, error: "Missing gameId." };
  return syncService.saveOnlineGameById({
    gameId,
    token: session.accessToken,
    username: session.username || ""
  });
});

