const { Chess } = require("chess.js");

function createBotTournamentModule({
  ipcRenderer,
  homeProfileEl,
  homeScreenEl,
  toolsScreenEl,
  botsScreenEl,
  botTournamentScreenEl,
  gameScreenEl,
  closeHomeProfileMenu,
  closeHomeOnlinePanels,
  updateHomeOnlineToolbarVisibility,
  getCuratedBots,
  getProfileName,
  openHumanMatch,
  openSpectatorGame,
  updateSpectatorGame,
  closeSpectatorGame
}) {
  const el = {
    back: document.getElementById("btn-bot-tournament-back"),
    setupView: document.getElementById("bot-tournament-setup-view"),
    liveView: document.getElementById("bot-tournament-live-view"),
    standingsView: document.getElementById("bot-tournament-standings-view"),
    name: document.getElementById("bot-tournament-name-input"),
    format: document.getElementById("bot-tournament-format-select"),
    rounds: document.getElementById("bot-tournament-rounds-input"),
    randomKo: document.getElementById("bot-tournament-randomize-ko"),
    timeMain: document.getElementById("bot-tournament-time-main"),
    timeIncrement: document.getElementById("bot-tournament-time-increment"),
    btnSave: document.getElementById("btn-bot-tournament-save"),
    btnStart: document.getElementById("btn-bot-tournament-start"),
    playerName: document.getElementById("bot-tournament-player-name"),
    playerRating: document.getElementById("bot-tournament-player-rating"),
    btnAddPlayer: document.getElementById("btn-bot-tournament-add-player"),
    playerSearch: document.getElementById("bot-tournament-player-search"),
    playerList: document.getElementById("bot-tournament-player-list"),
    roundLabel: document.getElementById("bot-tournament-round-label"),
    pairingsList: document.getElementById("bot-tournament-pairings-list"),
    pairingsStatus: document.getElementById("bot-tournament-pairings-status"),
    btnNextRound: document.getElementById("btn-bot-tournament-next-round"),
    btnLiveStandings: document.getElementById("btn-bot-tournament-standings"),
    btnFinalize: document.getElementById("btn-bot-tournament-finalize"),
    btnLiveBackToSetup: document.getElementById("btn-bot-tournament-live-back"),
    standingsList: document.getElementById("bot-tournament-standings-list"),
    standingsSearch: document.getElementById("bot-tournament-standings-search"),
    btnStandingsBack: document.getElementById("btn-bot-tournament-standings-back"),
    status: document.getElementById("bot-tournament-status"),
    exitModal: document.getElementById("bot-tournament-exit-modal"),
    exitText: document.getElementById("bot-tournament-exit-text"),
    btnExitClose: document.getElementById("btn-bot-tournament-exit-close"),
    btnExitCancel: document.getElementById("btn-bot-tournament-exit-cancel"),
    btnExitAccept: document.getElementById("btn-bot-tournament-exit-accept"),
    humanModal: document.getElementById("bot-tournament-human-modal"),
    humanName: document.getElementById("bot-tournament-human-name"),
    humanRating: document.getElementById("bot-tournament-human-rating"),
    btnHumanClose: document.getElementById("btn-bot-tournament-human-close"),
    btnHumanCancel: document.getElementById("btn-bot-tournament-human-cancel"),
    btnHumanSave: document.getElementById("btn-bot-tournament-human-save")
  };

  function now() {
    return Date.now();
  }

  function makeId(prefix) {
    return `${prefix}_${now()}_${Math.random().toString(16).slice(2, 8)}`;
  }

  function clampInt(v, min, max, fallback) {
    const n = Number.parseInt(String(v), 10);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, n));
  }

  function safeName(v, max = 80) {
    return String(v || "").replace(/\s+/g, " ").trim().slice(0, max);
  }

  function byRatingName(a, b) {
    const ar = Number(a.rating || 0);
    const br = Number(b.rating || 0);
    if (br !== ar) return br - ar;
    return String(a.name || "").localeCompare(String(b.name || ""));
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function msg(text, isErr = false) {
    if (!el.status) return;
    el.status.textContent = String(text || "");
    el.status.style.color = isErr ? "#e08f8f" : "#bdbdbd";
    el.status.classList.toggle("hidden", !String(text || "").trim());
  }

  function closeExitConfirm(answer = false) {
    if (el.exitModal) el.exitModal.classList.add("hidden");
    const resolver = state.exitConfirmResolver;
    state.exitConfirmResolver = null;
    if (resolver) resolver(answer);
  }

  function openExitConfirm() {
    if (el.exitText) {
      el.exitText.textContent = "Are you sure you want to exit? The current bot tournament will stop.";
    }
    if (el.exitModal) el.exitModal.classList.remove("hidden");
    return new Promise((resolve) => {
      state.exitConfirmResolver = resolve;
    });
  }

  function emptyTournament() {
    return {
      id: makeId("bt"),
      name: "New Bots Tournament",
      createdAt: now(),
      updatedAt: now(),
      format: "swiss_dutch",
      status: "draft",
      totalRounds: 7,
      randomizeKo: false,
      timeControl: {
        mainMinutes: 5,
        incrementSeconds: 3
      },
      players: [],
      rounds: [],
      standings: []
    };
  }

  const state = {
    tournament: emptyTournament(),
    view: "setup",
    playerSearchQuery: "",
    standingsSearchQuery: "",
    runner: {
      active: false,
      stopping: false,
      currentPairingKey: "",
      currentMatchLabel: "",
      currentMoveCount: 0,
      awaitingJoinPairingKey: "",
      humanMatchCompleted: false
    },
    exitConfirmResolver: null,
    humanModalOpen: false
  };

  const engineSessions = new Map();

  function playerById(id) {
    return state.tournament.players.find((player) => player.playerId === id) || null;
  }

  function playerName(id) {
    return playerById(id)?.name || "Unknown";
  }

  function latestRound() {
    const rounds = state.tournament.rounds;
    return rounds.length ? rounds[rounds.length - 1] : null;
  }

  function nextRoundNo() {
    return state.tournament.rounds.length + 1;
  }

  function activePlayers() {
    return state.tournament.players.filter((player) => player.active !== false);
  }

  function scoreResult(result, side) {
    if (result === "1-0") return side === "w" ? 1 : 0;
    if (result === "0-1") return side === "b" ? 1 : 0;
    if (result === "1/2-1/2") return 0.5;
    if (result === "forfeit-w") return side === "w" ? 1 : 0;
    if (result === "forfeit-b") return side === "b" ? 1 : 0;
    return 0;
  }

  function winnerFromPairing(pairing) {
    const sides = getPairingSides(pairing);
    if (pairing.isBye) return sides.whitePlayerId;
    if (pairing.result === "1-0" || pairing.result === "forfeit-w") return sides.whitePlayerId;
    if (pairing.result === "0-1" || pairing.result === "forfeit-b") return sides.blackPlayerId;
    return null;
  }

  function isDrawResult(result) {
    return String(result || "").trim() === "1/2-1/2";
  }

  function getPairingSides(pairing) {
    if (
      pairing?.armageddonActive &&
      pairing?.armageddonWhitePlayerId &&
      pairing?.armageddonBlackPlayerId
    ) {
      return {
        whitePlayerId: pairing.armageddonWhitePlayerId,
        blackPlayerId: pairing.armageddonBlackPlayerId
      };
    }
    return {
      whitePlayerId: pairing?.whitePlayerId || "",
      blackPlayerId: pairing?.blackPlayerId || ""
    };
  }

  function isKnockoutArmageddonPairing(pairing) {
    return state.tournament.format === "ko" && !!pairing?.armageddonActive;
  }

  function prepareArmageddonForPairing(pairing) {
    if (!pairing || pairing.isBye || pairing.armageddonActive) return false;
    const baseWhiteMs = Math.max(1000, Math.floor((state.tournament.timeControl?.mainMinutes || 5) * 60000));
    pairing.armageddonActive = true;
    pairing.armageddonWhitePlayerId = pairing.blackPlayerId;
    pairing.armageddonBlackPlayerId = pairing.whitePlayerId;
    pairing.armageddonWhiteMs = baseWhiteMs;
    pairing.armageddonBlackMs = Math.max(1000, Math.floor(baseWhiteMs * 0.75));
    pairing.armageddonIncrementMs = Math.max(0, Math.floor((state.tournament.timeControl?.incrementSeconds || 0) * 1000));
    pairing.result = "pending";
    pairing.status = "pending";
    state.tournament.updatedAt = now();
    return true;
  }

  function serializeTournament() {
    return JSON.parse(JSON.stringify(state.tournament));
  }

  async function saveTournament() {
    const suggestedName = safeName(state.tournament.name || "bots-tournament", 80).replace(/[^\w -]+/g, "").trim() || "bots-tournament";
    const filePath = await ipcRenderer.invoke("file:saveText", {
      title: "Save Bot Tournament",
      defaultPath: `${suggestedName}.json`,
      filters: [
        { name: "JSON Files", extensions: ["json"] },
        { name: "All Files", extensions: ["*"] }
      ],
      text: JSON.stringify(serializeTournament(), null, 2)
    });
    if (!filePath) {
      msg("Save cancelled.");
      return;
    }
    msg("Bot tournament saved.");
  }

  function availableBots() {
    const allBots = Array.isArray(getCuratedBots?.()) ? getCuratedBots() : [];
    const selectedIds = new Set(state.tournament.players.map((player) => player.botId));
    const bots = allBots
      .filter((bot) => bot.enabled !== false)
      .filter((bot) => bot.id && !selectedIds.has(bot.id))
      .sort((a, b) => byRatingName({ name: a.name, rating: a.rating }, { name: b.name, rating: b.rating }));
    const hasHuman = state.tournament.players.some((player) => player.isHuman);
    if (!hasHuman) {
      bots.unshift({
        id: "__human__",
        name: "Add Human Player",
        displayName: "Add Human Player",
        rating: ""
      });
    }
    return bots;
  }

  function getHumanDefaultName() {
    return safeName(getProfileName?.() || "Human", 64) || "Human";
  }

  function closeHumanModal() {
    state.humanModalOpen = false;
    if (el.humanModal) el.humanModal.classList.add("hidden");
  }

  function openHumanModal() {
    state.humanModalOpen = true;
    if (el.humanName) el.humanName.value = getHumanDefaultName();
    if (el.humanRating) el.humanRating.value = "";
    if (el.humanModal) el.humanModal.classList.remove("hidden");
    if (el.humanName) {
      window.setTimeout(() => {
        el.humanName?.focus();
        el.humanName?.select();
      }, 0);
    }
  }

  function pairingHasHuman(pairing) {
    if (!pairing) return false;
    return !!playerById(pairing.whitePlayerId)?.isHuman || !!playerById(pairing.blackPlayerId)?.isHuman;
  }

  function humanPlayerForPairing(pairing) {
    if (!pairing) return null;
    return playerById(pairing.whitePlayerId)?.isHuman
      ? playerById(pairing.whitePlayerId)
      : playerById(pairing.blackPlayerId)?.isHuman
        ? playerById(pairing.blackPlayerId)
        : null;
  }

  function syncSelectedBotDetails() {
    if (!el.playerName || !el.playerRating) return;
    const selectedId = String(el.playerName.value || "");
    const bot = availableBots().find((item) => item.id === selectedId) || null;
    if (!bot || bot.id === "__human__") {
      el.playerRating.value = "";
      return;
    }
    el.playerRating.value = String(Math.max(100, Math.round(Number(bot.rating || 2500))));
  }

  function renderBotOptions() {
    if (!el.playerName) return;
    const bots = availableBots();
    const currentValue = String(el.playerName.value || "");
    const options = ['<option value="">Select a player</option>'].concat(
      bots.map((bot) => `<option value="${escapeHtml(bot.id)}">${escapeHtml(bot.displayName || bot.name)}</option>`)
    );
    el.playerName.innerHTML = options.join("");
    if (bots.some((bot) => bot.id === currentValue)) {
      el.playerName.value = currentValue;
    } else {
      el.playerName.value = "";
    }
    syncSelectedBotDetails();
  }

  function renderConfig() {
    if (el.name) el.name.value = state.tournament.name || "";
    if (el.format) el.format.value = state.tournament.format || "swiss_dutch";
    if (el.rounds) el.rounds.value = String(clampInt(state.tournament.totalRounds, 1, 30, 7));
    if (el.randomKo) {
      const koOnly = state.tournament.format === "ko";
      if (!koOnly) {
        state.tournament.randomizeKo = false;
      }
      el.randomKo.checked = koOnly && !!state.tournament.randomizeKo;
      el.randomKo.disabled = !koOnly;
      const koLabel = el.randomKo.closest(".opt-check");
      if (koLabel) {
        koLabel.classList.toggle("disabled", !koOnly);
      }
    }
    if (el.timeMain) el.timeMain.value = String(clampInt(state.tournament.timeControl?.mainMinutes, 1, 180, 5));
    if (el.timeIncrement) el.timeIncrement.value = String(clampInt(state.tournament.timeControl?.incrementSeconds, 0, 30, 3));
    if (el.rounds) el.rounds.disabled = state.tournament.format !== "swiss_dutch";
    renderBotOptions();
  }

  function renderPlayers() {
    if (!el.playerList) return;
    const query = String(state.playerSearchQuery || "").trim().toLowerCase();
    const players = [...state.tournament.players].sort(byRatingName).filter((player) => {
      if (!query) return true;
      return `${player.name} ${player.rating}`.toLowerCase().includes(query);
    });
    if (!players.length) {
      el.playerList.innerHTML = '<tr><td colspan="4" class="tournament-empty-cell">No players added yet.</td></tr>';
      return;
    }
    el.playerList.innerHTML = players.map((player, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(player.name)}${player.isHuman ? ' <span class="archive-meta-inline">(Human)</span>' : ""}</td>
        <td>${escapeHtml(player.rating)}</td>
        <td><button type="button" class="engine-btn tournament-mini-btn" data-del-player="${escapeHtml(player.playerId)}">Delete</button></td>
      </tr>
    `).join("");
  }

  function showLiveScreen() {
    closeHomeProfileMenu();
    closeHomeOnlinePanels();
    if (homeProfileEl) homeProfileEl.classList.add("hidden");
    if (homeScreenEl) homeScreenEl.classList.add("hidden");
    if (toolsScreenEl) toolsScreenEl.classList.add("hidden");
    if (botsScreenEl) botsScreenEl.classList.add("hidden");
    if (gameScreenEl) gameScreenEl.classList.add("hidden");
    if (botTournamentScreenEl) botTournamentScreenEl.classList.remove("hidden");
    updateHomeOnlineToolbarVisibility();
    state.view = "live";
    render();
  }

  function getLc0WeightsOptionValue(enginePath, weightsPath) {
    const engine = String(enginePath || "").trim();
    const weights = String(weightsPath || "").trim();
    if (!engine || !weights) return weights;
    const engineParts = engine.split(/[\\/]+/);
    const weightsParts = weights.split(/[\\/]+/);
    if (engineParts.length < 2 || weightsParts.length < 1) return weights;
    const engineDir = engineParts.slice(0, -1).join("\\").toLowerCase();
    const weightsDir = weightsParts.slice(0, -1).join("\\").toLowerCase();
    if (engineDir && weightsDir && engineDir === weightsDir) {
      return weightsParts[weightsParts.length - 1] || weights;
    }
    return weights;
  }

  function getBotRecordByPlayerId(playerId) {
    const player = playerById(playerId);
    if (!player) return null;
    return (Array.isArray(getCuratedBots?.()) ? getCuratedBots() : []).find((bot) => bot.id === player.botId) || null;
  }

  function getEngineSession(engineId) {
    let session = engineSessions.get(engineId);
    if (!session) {
      session = {
        id: engineId,
        buffer: "",
        stderr: [],
        idName: "",
        gotUciOk: false,
        readyWaiters: [],
        uciWaiters: [],
        moveWaiter: null,
        closeWaiters: []
      };
      engineSessions.set(engineId, session);
    }
    return session;
  }

  function settleWaiters(waiters, payload, isError = false) {
    const list = Array.isArray(waiters) ? waiters.splice(0, waiters.length) : [];
    for (const waiter of list) {
      try {
        if (isError) waiter.reject(payload);
        else waiter.resolve(payload);
      } catch (_) {
        // ignore
      }
    }
  }

  function onTournamentEngineStdout(payload) {
    const engineId = String(payload?.id || "").trim();
    if (!engineId) return;
    const session = getEngineSession(engineId);
    session.buffer += String(payload?.text || "");
    const lines = session.buffer.split(/\r?\n/);
    session.buffer = lines.pop() || "";
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;
      if (line.startsWith("id name ")) {
        session.idName = line.slice("id name ".length).trim();
        continue;
      }
      if (line === "uciok") {
        session.gotUciOk = true;
        settleWaiters(session.uciWaiters, true);
        continue;
      }
      if (line === "readyok") {
        settleWaiters(session.readyWaiters, true);
        continue;
      }
      if (line.startsWith("bestmove ")) {
        const move = line.split(/\s+/)[1] || "";
        const waiter = session.moveWaiter;
        session.moveWaiter = null;
        if (waiter) waiter.resolve(move);
      }
    }
  }

  function onTournamentEngineStderr(payload) {
    const engineId = String(payload?.id || "").trim();
    if (!engineId) return;
    const session = getEngineSession(engineId);
    session.stderr.push(String(payload?.text || ""));
    if (session.stderr.length > 30) {
      session.stderr = session.stderr.slice(-30);
    }
  }

  function onTournamentEngineClosed(payload) {
    const engineId = String(payload?.id || "").trim();
    if (!engineId) return;
    const session = getEngineSession(engineId);
    const err = new Error(`Tournament engine closed: ${engineId}`);
    settleWaiters(session.uciWaiters, err, true);
    settleWaiters(session.readyWaiters, err, true);
    if (session.moveWaiter) {
      session.moveWaiter.reject(err);
      session.moveWaiter = null;
    }
    settleWaiters(session.closeWaiters, true);
    engineSessions.delete(engineId);
  }

  function waitForUciOk(engineId, timeoutMs = 12000) {
    const session = getEngineSession(engineId);
    if (session.gotUciOk) return Promise.resolve(true);
    return new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => {
        reject(new Error(`Engine ${engineId} did not respond with uciok.`));
      }, timeoutMs);
      session.uciWaiters.push({
        resolve: (value) => {
          window.clearTimeout(timer);
          resolve(value);
        },
        reject: (err) => {
          window.clearTimeout(timer);
          reject(err);
        }
      });
    });
  }

  function waitForReady(engineId, timeoutMs = 15000) {
    const session = getEngineSession(engineId);
    return new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => {
        reject(new Error(`Engine ${engineId} did not respond with readyok.`));
      }, timeoutMs);
      session.readyWaiters.push({
        resolve: (value) => {
          window.clearTimeout(timer);
          resolve(value);
        },
        reject: (err) => {
          window.clearTimeout(timer);
          reject(err);
        }
      });
    });
  }

  function waitForBestMove(engineId, timeoutMs) {
    const session = getEngineSession(engineId);
    if (session.moveWaiter) {
      try {
        session.moveWaiter.reject(new Error("Superseded bestmove waiter."));
      } catch (_) {
        // ignore
      }
      session.moveWaiter = null;
    }
    return new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => {
        session.moveWaiter = null;
        reject(new Error(`Engine ${engineId} move timed out.`));
      }, timeoutMs);
      session.moveWaiter = {
        resolve: (value) => {
          window.clearTimeout(timer);
          resolve(value);
        },
        reject: (err) => {
          window.clearTimeout(timer);
          reject(err);
        }
      };
    });
  }

  async function sendTournamentEngine(engineId, line) {
    const res = await ipcRenderer.invoke("tournament-engine:send", { engineId, line });
    if (!res?.ok) {
      throw new Error(res?.error || `Failed to send command to ${engineId}.`);
    }
  }

  async function stopTournamentEngine(engineId) {
    await ipcRenderer.invoke("tournament-engine:stop", { engineId }).catch(() => {});
    engineSessions.delete(engineId);
  }

  async function startTournamentEngine(engineId, bot) {
    const res = await ipcRenderer.invoke("tournament-engine:start", {
      engineId,
      enginePath: bot.enginePath
    });
    if (!res?.ok) {
      throw new Error(res?.error || `Unable to start ${bot.displayName || bot.name}.`);
    }
    await waitForUciOk(engineId);
    if (bot.kind === "lc0" && bot.weightsPath) {
      await sendTournamentEngine(engineId, `setoption name WeightsFile value ${getLc0WeightsOptionValue(bot.enginePath, bot.weightsPath)}`);
    }
    await sendTournamentEngine(engineId, "isready");
    await waitForReady(engineId);
    await sendTournamentEngine(engineId, "ucinewgame");
    await sendTournamentEngine(engineId, "isready");
    await waitForReady(engineId);
  }

  function playedOpponents(playerId) {
    const set = new Set();
    for (const round of state.tournament.rounds) {
      if (round.status !== "completed") continue;
      for (const pairing of round.pairings) {
        if (pairing.isBye) continue;
        if (pairing.whitePlayerId === playerId && pairing.blackPlayerId) set.add(pairing.blackPlayerId);
        if (pairing.blackPlayerId === playerId && pairing.whitePlayerId) set.add(pairing.whitePlayerId);
      }
    }
    return set;
  }

  function colorCount(playerId, color) {
    let count = 0;
    for (const round of state.tournament.rounds) {
      for (const pairing of round.pairings) {
        if (pairing.isBye) continue;
        if (color === "w" && pairing.whitePlayerId === playerId) count += 1;
        if (color === "b" && pairing.blackPlayerId === playerId) count += 1;
      }
    }
    return count;
  }

  function colorPref(playerId) {
    const whiteCount = colorCount(playerId, "w");
    const blackCount = colorCount(playerId, "b");
    if (whiteCount > blackCount) return "b";
    if (blackCount > whiteCount) return "w";
    return null;
  }

  function chooseSwissBye(sorted) {
    const never = sorted.filter((player) => !player.hadBye);
    const pool = never.length ? never : sorted;
    const copy = [...pool].sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      return byRatingName(a, b);
    });
    return copy[0] || null;
  }

  function chooseSwissOpponent(player, candidates) {
    const played = playedOpponents(player.playerId);
    const ordered = [...candidates].sort((a, b) => {
      const aRepeat = played.has(a.playerId) ? 1 : 0;
      const bRepeat = played.has(b.playerId) ? 1 : 0;
      if (aRepeat !== bRepeat) return aRepeat - bRepeat;
      const aDiff = Math.abs(Number(a.score) - Number(player.score));
      const bDiff = Math.abs(Number(b.score) - Number(player.score));
      if (aDiff !== bDiff) return aDiff - bDiff;
      return byRatingName(a, b);
    });
    return ordered[0] || null;
  }

  function assignColors(a, b) {
    const aPref = colorPref(a.playerId);
    const bPref = colorPref(b.playerId);
    if (aPref === "w" || bPref === "b") return { w: a, b };
    if (aPref === "b" || bPref === "w") return { w: b, b: a };
    return Number(a.rating || 0) >= Number(b.rating || 0) ? { w: a, b } : { w: b, b: a };
  }

  function buildSwissRound(roundNo) {
    const players = activePlayers()
      .map((player) => ({ ...player }))
      .sort((a, b) => (b.score !== a.score ? b.score - a.score : byRatingName(a, b)));
    if (players.length < 2) throw new Error("At least 2 active bots are required.");
    const pairings = [];
    const diagnostics = [];
    const work = [...players];
    if (work.length % 2 === 1) {
      const bye = chooseSwissBye(work);
      if (bye) {
        const idx = work.findIndex((player) => player.playerId === bye.playerId);
        if (idx >= 0) work.splice(idx, 1);
        pairings.push({
          boardNo: 1,
          whitePlayerId: bye.playerId,
          blackPlayerId: null,
          result: "1-0",
          isBye: true,
          status: "completed"
        });
      }
    }
    while (work.length > 0) {
      const player = work.shift();
      const opponent = chooseSwissOpponent(player, work);
      if (!opponent) {
        diagnostics.push(`No legal opponent for ${player.name}`);
        break;
      }
      const idx = work.findIndex((entry) => entry.playerId === opponent.playerId);
      if (idx >= 0) work.splice(idx, 1);
      const asn = assignColors(player, opponent);
      pairings.push({
        boardNo: pairings.length + 1,
        whitePlayerId: asn.w.playerId,
        blackPlayerId: asn.b.playerId,
        result: "pending",
        isBye: false,
        status: "pending"
      });
    }
    return {
      roundNo,
      status: "generated",
      pairings,
      generatedAt: now(),
      completedAt: 0,
      generatorMeta: { diagnostics }
    };
  }

  function buildRrSchedule(doubleRound) {
    const ids = activePlayers().slice().sort(byRatingName).map((player) => player.playerId);
    const arr = [...ids];
    if (arr.length % 2 === 1) arr.push(null);
    const total = arr.length;
    const rounds = total - 1;
    const schedule = [];
    let cur = [...arr];
    for (let roundIndex = 0; roundIndex < rounds; roundIndex += 1) {
      const pairings = [];
      for (let i = 0; i < total / 2; i += 1) {
        const a = cur[i];
        const b = cur[total - 1 - i];
        if (!a && !b) continue;
        if (!a || !b) {
          const bye = a || b;
          pairings.push({
            boardNo: pairings.length + 1,
            whitePlayerId: bye,
            blackPlayerId: null,
            result: "1-0",
            isBye: true,
            status: "completed"
          });
          continue;
        }
        const even = roundIndex % 2 === 0;
        pairings.push({
          boardNo: pairings.length + 1,
          whitePlayerId: even ? a : b,
          blackPlayerId: even ? b : a,
          result: "pending",
          isBye: false,
          status: "pending"
        });
      }
      schedule.push(pairings);
      const fixed = cur[0];
      const rest = cur.slice(1);
      rest.unshift(rest.pop());
      cur = [fixed, ...rest];
    }
    if (!doubleRound) return schedule;
    return schedule.concat(schedule.map((round) =>
      round.map((pairing) => ({
        ...pairing,
        whitePlayerId: pairing.blackPlayerId,
        blackPlayerId: pairing.whitePlayerId,
        result: pairing.isBye ? "1-0" : "pending",
        status: pairing.isBye ? "completed" : "pending"
      }))
    ));
  }

  function buildKoRound(roundNo) {
    let ids = [];
    if (roundNo === 1) {
      ids = activePlayers().slice().sort(byRatingName).map((player) => player.playerId);
      if (state.tournament.randomizeKo) {
        for (let i = ids.length - 1; i > 0; i -= 1) {
          const j = Math.floor(Math.random() * (i + 1));
          const tmp = ids[i];
          ids[i] = ids[j];
          ids[j] = tmp;
        }
      }
    } else {
      const prev = latestRound();
      if (!prev || prev.status !== "completed") throw new Error("Complete previous knockout round first.");
      ids = prev.pairings.map(winnerFromPairing).filter(Boolean);
    }
    if (ids.length < 2) throw new Error("Knockout requires at least 2 bots.");
    const pairings = [];
    const work = [...ids];
    if (work.length % 2 === 1) {
      const bye = work.pop();
      pairings.push({
        boardNo: 1,
        whitePlayerId: bye,
        blackPlayerId: null,
        result: "1-0",
        isBye: true,
        status: "completed"
      });
    }
    while (work.length) {
      const hi = work.shift();
      const lo = work.pop();
      pairings.push({
        boardNo: pairings.length + 1,
        whitePlayerId: hi,
        blackPlayerId: lo,
        result: "pending",
        isBye: false,
        status: "pending"
      });
    }
    return {
      roundNo,
      status: "generated",
      pairings,
      generatedAt: now(),
      completedAt: 0,
      generatorMeta: {}
    };
  }

  function formatRoundLimit() {
    const totalPlayers = activePlayers().length;
    if (state.tournament.format === "swiss_dutch") return clampInt(state.tournament.totalRounds, 1, 30, 7);
    if (state.tournament.format === "rr") return totalPlayers < 2 ? 0 : totalPlayers % 2 === 0 ? totalPlayers - 1 : totalPlayers;
    if (state.tournament.format === "drr") {
      if (totalPlayers < 2) return 0;
      const base = totalPlayers % 2 === 0 ? totalPlayers - 1 : totalPlayers;
      return base * 2;
    }
    if (state.tournament.format === "ko") return totalPlayers < 2 ? 0 : Math.ceil(Math.log2(totalPlayers));
    return 0;
  }

  function generateRoundCore() {
    if (activePlayers().length < 2) {
      return { ok: false, error: "At least 2 bots are required." };
    }
    const last = latestRound();
    if (last && last.status !== "completed") {
      return { ok: false, error: "Current round is still pending." };
    }
    const roundNo = nextRoundNo();
    const limit = formatRoundLimit();
    if (state.tournament.format !== "ko" && limit > 0 && roundNo > limit) {
      return { ok: false, error: "No more rounds to generate.", terminal: true };
    }
    let round = null;
    try {
      if (state.tournament.format === "swiss_dutch") {
        round = buildSwissRound(roundNo);
      } else if (state.tournament.format === "rr" || state.tournament.format === "drr") {
        const schedule = buildRrSchedule(state.tournament.format === "drr");
        if (roundNo > schedule.length) {
          return { ok: false, error: "No more rounds in schedule.", terminal: true };
        }
        round = {
          roundNo,
          status: "generated",
          pairings: schedule[roundNo - 1],
          generatedAt: now(),
          completedAt: 0,
          generatorMeta: {}
        };
      } else if (state.tournament.format === "ko") {
        round = buildKoRound(roundNo);
      }
    } catch (err) {
      return { ok: false, error: String(err?.message || err) };
    }
    state.tournament.rounds.push(round);
    state.tournament.status = "active";
    state.tournament.updatedAt = now();
    return {
      ok: true,
      roundNo,
      warnings: Array.isArray(round.generatorMeta?.diagnostics) ? round.generatorMeta.diagnostics : [],
      message: `Round ${roundNo} generated.`
    };
  }

  function finalizeTournament() {
    recomputeStandings();
    state.tournament.status = "finished";
    state.tournament.updatedAt = now();
    render();
    msg("Tournament finalized.");
  }

  function formatPassiveResult(pairing) {
    if (!pairing) return "-";
    if (pairing.isBye) return "Bye";
    if (pairing.status === "awaiting_join") return "Waiting to join";
    if (pairing.status === "in_progress") return "In Progress";
    if (pairing.result === "1-0") return "1-0";
    if (pairing.result === "0-1") return "0-1";
    if (pairing.result === "1/2-1/2") return "1/2-1/2";
    if (pairing.result === "forfeit-w") return "White win";
    if (pairing.result === "forfeit-b") return "Black win";
    return "Pending";
  }

  function renderLiveView() {
    const round = latestRound();
    const limit = formatRoundLimit();
    if (el.roundLabel) {
      el.roundLabel.textContent = round ? `Round ${round.roundNo}${limit > 0 ? `/${limit}` : ""}` : "Round -";
    }
    if (el.pairingsList) {
      const pairings = Array.isArray(round?.pairings) ? round.pairings : [];
      if (!pairings.length) {
        el.pairingsList.innerHTML = '<tr><td colspan="4" class="tournament-empty-cell">No pairings yet.</td></tr>';
      } else {
        el.pairingsList.innerHTML = pairings.map((pairing) => `
          <tr class="${pairing.status === "in_progress" && !pairingHasHuman(pairing) ? "tournament-clickable-row" : ""}" data-bot-pairing-key="${round.roundNo}:${pairing.boardNo}">
            <td>${pairing.boardNo}</td>
            <td>${escapeHtml(playerName(getPairingSides(pairing).whitePlayerId))}</td>
            <td>${pairing.isBye ? "-" : escapeHtml(playerName(getPairingSides(pairing).blackPlayerId))}</td>
            <td>${
              pairing.status === "awaiting_join"
                ? `<button type="button" class="engine-btn tournament-mini-btn" data-join-human-pairing="${round.roundNo}:${pairing.boardNo}">Join</button>`
                : escapeHtml(formatPassiveResult(pairing))
            }</td>
          </tr>
        `).join("");
      }
    }
    if (el.pairingsStatus) {
      const main = state.tournament.timeControl?.mainMinutes || 5;
      const inc = state.tournament.timeControl?.incrementSeconds || 3;
      const totalPlayers = state.tournament.players.length;
      const runnerSummary = state.runner.active && state.runner.currentMatchLabel
        ? `In Progress • ${state.runner.currentMatchLabel} • ${state.runner.currentMoveCount} ply`
        : state.runner.awaitingJoinPairingKey
          ? `Waiting for you to join • ${state.runner.currentMatchLabel}`
          : state.tournament.status === "finished"
            ? "Tournament finished"
            : "Waiting for next pairing";
      const summary = `${totalPlayers} players • ${main}+${inc} • ${runnerSummary}`;
      el.pairingsStatus.innerHTML = `
        <div class="tournament-placeholder-card">
          <div class="tournament-placeholder-title">${escapeHtml(summary)}</div>
          <div class="tournament-placeholder-text">Tournament games run one board at a time. Bot pairings start automatically, and human pairings wait for Join. You can leave this screen only after confirming that the tournament should stop.</div>
        </div>
      `;
    }
    if (el.btnNextRound) {
      const canStartNextRound =
        !state.runner.active
        && !state.runner.awaitingJoinPairingKey
        && state.tournament.status !== "finished"
        && !!round
        && round.status === "completed"
        && !isTournamentFinishedByStructure();
      el.btnNextRound.disabled = !canStartNextRound;
      el.btnNextRound.title = canStartNextRound ? "Generate the next round and continue the tournament." : "Next round becomes available after the current round finishes.";
    }
    if (el.btnFinalize) {
      el.btnFinalize.disabled = state.tournament.status === "finished" && !state.runner.active;
    }
  }

  function recomputeStandings() {
    for (const player of state.tournament.players) {
      player.score = 0;
      player.hadBye = false;
      player._games = [];
    }
    for (const round of state.tournament.rounds) {
      if (round.status !== "completed") continue;
      for (const pairing of round.pairings) {
        const sides = getPairingSides(pairing);
        const white = playerById(sides.whitePlayerId);
        const black = sides.blackPlayerId ? playerById(sides.blackPlayerId) : null;
        if (!white) continue;
        if (pairing.isBye) {
          white.hadBye = true;
          white.score += 1;
          white._games.push({ oppId: null, points: 1 });
          continue;
        }
        if (!black) continue;
        const whitePoints = scoreResult(pairing.result, "w");
        const blackPoints = scoreResult(pairing.result, "b");
        white.score += whitePoints;
        black.score += blackPoints;
        white._games.push({ oppId: black.playerId, points: whitePoints });
        black._games.push({ oppId: white.playerId, points: blackPoints });
      }
    }
    const players = activePlayers();
    const scoreMap = new Map(players.map((player) => [player.playerId, Number(player.score || 0)]));
    const rows = players.map((player) => {
      const oppScores = player._games.filter((game) => game.oppId).map((game) => Number(scoreMap.get(game.oppId) || 0));
      const buchholz = oppScores.reduce((sum, score) => sum + score, 0);
      let medianBuchholz = buchholz;
      if (oppScores.length >= 3) {
        const sorted = [...oppScores].sort((a, b) => a - b);
        medianBuchholz = sorted.slice(1, sorted.length - 1).reduce((sum, score) => sum + score, 0);
      }
      let sonnebornBerger = 0;
      for (const game of player._games) {
        if (!game.oppId) continue;
        sonnebornBerger += Number(game.points || 0) * Number(scoreMap.get(game.oppId) || 0);
      }
      return {
        rank: 0,
        playerId: player.playerId,
        name: player.name,
        rating: Number(player.rating || 0),
        points: Number(player.score || 0),
        buchholz,
        medianBuchholz,
        sonnebornBerger,
        directEncounter: 0
      };
    });

    const groups = new Map();
    for (const row of rows) {
      const key = String(row.points);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(row);
    }
    for (const groupRows of groups.values()) {
      if (groupRows.length <= 1) continue;
      const ids = new Set(groupRows.map((row) => row.playerId));
      for (const row of groupRows) {
        const player = playerById(row.playerId);
        row.directEncounter = (player?._games || [])
          .filter((game) => game.oppId && ids.has(game.oppId))
          .reduce((sum, game) => sum + Number(game.points || 0), 0);
      }
    }

    rows.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.buchholz !== a.buchholz) return b.buchholz - a.buchholz;
      if (b.medianBuchholz !== a.medianBuchholz) return b.medianBuchholz - a.medianBuchholz;
      if (b.sonnebornBerger !== a.sonnebornBerger) return b.sonnebornBerger - a.sonnebornBerger;
      if (b.directEncounter !== a.directEncounter) return b.directEncounter - a.directEncounter;
      if (b.rating !== a.rating) return b.rating - a.rating;
      return String(a.name || "").localeCompare(String(b.name || ""));
    });
    rows.forEach((row, index) => {
      row.rank = index + 1;
    });
    state.tournament.standings = rows;
    state.tournament.updatedAt = now();
  }

  function currentPairingLabel(pairing) {
    if (!pairing) return "";
    const sides = getPairingSides(pairing);
    return `${playerName(sides.whitePlayerId)} vs ${pairing.isBye ? "-" : playerName(sides.blackPlayerId)}`;
  }

  function setPairingStatus(pairing, status) {
    if (!pairing) return;
    pairing.status = status;
    state.tournament.updatedAt = now();
    render();
  }

  function markPairingResult(pairing, result) {
    if (!pairing) return;
    pairing.result = result;
    pairing.status = "completed";
    state.tournament.updatedAt = now();
  }

  function finalizeRoundIfComplete(round) {
    if (!round) return false;
    const allDone = round.pairings.every((pairing) => pairing.isBye || pairing.status === "completed");
    if (!allDone) return false;
    round.status = "completed";
    round.completedAt = now();
    recomputeStandings();
    return true;
  }

  function isTournamentFinishedByStructure() {
    const totalLimit = formatRoundLimit();
    if (state.tournament.format === "ko") {
      const round = latestRound();
      if (!round || round.status !== "completed") return false;
      const winners = round.pairings.map(winnerFromPairing).filter(Boolean);
      return winners.length <= 1;
    }
    return totalLimit > 0 && state.tournament.rounds.length >= totalLimit && latestRound()?.status === "completed";
  }

  function buildPositionCommand(moveList) {
    return moveList.length ? `position startpos moves ${moveList.join(" ")}` : "position startpos";
  }

  function buildSpectatorSnapshot() {
    const match = state.runner.currentMatch;
    if (!match) return null;
    const game = match.game;
    if (!(game instanceof Chess)) return null;
    const sides = getPairingSides(match.pairing);
    const moves = game.history({ verbose: true }).map((move) => `${move.from}${move.to}${move.promotion || ""}`);
    return {
      tournamentId: state.tournament.id,
      pairingKey: state.runner.currentPairingKey,
      whiteName: playerName(sides.whitePlayerId),
      blackName: playerName(sides.blackPlayerId),
      startFen: new Chess().fen(),
      moves,
      whiteStartMs: Math.max(0, Math.floor(match.clocks.whiteStartMs || match.clocks.whiteMs)),
      blackStartMs: Math.max(0, Math.floor(match.clocks.blackStartMs || match.clocks.blackMs)),
      whiteMs: Math.max(0, Math.floor(match.clocks.whiteMs)),
      blackMs: Math.max(0, Math.floor(match.clocks.blackMs)),
      incrementMs: Math.max(0, Math.floor(match.clocks.incrementMs)),
      initialMs: Math.max(1000, Math.floor((state.tournament.timeControl?.mainMinutes || 5) * 60000)),
      activeColor: String(game.turn() || "w")
    };
  }

  function parseUciMove(uci) {
    const text = String(uci || "").trim().toLowerCase();
    if (!/^[a-h][1-8][a-h][1-8][nbrq]?$/.test(text)) return null;
    const move = { from: text.slice(0, 2), to: text.slice(2, 4) };
    if (text.length > 4) move.promotion = text.slice(4, 5);
    return move;
  }

  function resultFromGame(game, sideJustMoved) {
    if (game.isCheckmate()) {
      return sideJustMoved === "w" ? "1-0" : "0-1";
    }
    if (game.isDraw() || game.isStalemate() || game.isInsufficientMaterial() || game.isThreefoldRepetition()) {
      return "1/2-1/2";
    }
    return "";
  }

  async function saveBotVsBotArchiveGame({ game, round, pairing, result } = {}) {
    if (!(game instanceof Chess) || !round || !pairing || !result) return;
    const date = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const dateTag = `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
    const sides = getPairingSides(pairing);
    const whiteName = playerName(sides.whitePlayerId);
    const blackName = playerName(sides.blackPlayerId);
    game.header("Event", pairing.armageddonActive ? "Bot vs Bot Tournament Armageddon" : "Bot vs Bot Tournament");
    game.header("Site", "Local");
    game.header("Date", dateTag);
    game.header("White", whiteName);
    game.header("Black", blackName);
    game.header("Result", result);
    game.header("Round", String(round.roundNo));
    game.header("Board", String(pairing.boardNo));
    game.header("TournamentName", state.tournament.name || "Bots Tournament");
    game.header("BotVsBot", "1");
    if (pairing.armageddonActive) {
      game.header("Armageddon", "1");
    }
    game.header("TimeControl", `${Math.max(0, Number(state.tournament.timeControl?.mainMinutes || 0) * 60)}+${Math.max(0, Number(state.tournament.timeControl?.incrementSeconds || 0))}`);
    game.header("FinalFEN", game.fen());
    await ipcRenderer.invoke("games:autoSavePgn", {
      pgn: game.pgn({ maxWidth: 0 }),
      result: String(result).replace(/[^a-z0-9]+/gi, "-").toLowerCase(),
      playerSide: "bot-vs-bot"
    });
  }

  async function requestEngineMove(engineId, moveList, clocks) {
    const positionCmd = buildPositionCommand(moveList);
    await sendTournamentEngine(engineId, positionCmd);
    await sendTournamentEngine(
      engineId,
      `go wtime ${Math.max(1, Math.floor(clocks.whiteMs))} btime ${Math.max(1, Math.floor(clocks.blackMs))} winc ${Math.max(0, Math.floor(clocks.incrementMs))} binc ${Math.max(0, Math.floor(clocks.incrementMs))}`
    );
    return waitForBestMove(engineId, Math.max(3000, Math.floor(Math.max(clocks.whiteMs, clocks.blackMs) + 5000)));
  }

  async function stopAllTournamentEngines() {
    state.runner.active = false;
    state.runner.currentPairingKey = "";
    state.runner.currentMatchLabel = "";
    state.runner.currentMoveCount = 0;
    await ipcRenderer.invoke("tournament-engine:stopAll").catch(() => {});
    engineSessions.clear();
  }

  async function abortCurrentMatchWithoutResult() {
    const match = state.runner.currentMatch;
    const awaitingJoinKey = state.runner.awaitingJoinPairingKey;
    state.runner.stopping = true;
    state.runner.currentMatch = null;
    state.runner.active = false;
    state.runner.currentPairingKey = "";
    state.runner.currentMatchLabel = "";
    state.runner.currentMoveCount = 0;
    state.runner.awaitingJoinPairingKey = "";
    state.runner.humanMatchCompleted = false;
    if (match?.pairing) {
      match.pairing.status = "pending";
      match.pairing.result = "pending";
    } else if (awaitingJoinKey) {
      const round = latestRound();
      const waitingPairing = Array.isArray(round?.pairings)
        ? round.pairings.find((pairing) => `${round.roundNo}:${pairing.boardNo}` === awaitingJoinKey)
        : null;
      if (waitingPairing) {
        waitingPairing.status = "pending";
        waitingPairing.result = "pending";
      }
    }
    await stopAllTournamentEngines();
    state.runner.stopping = false;
    render();
  }

  async function startHumanPairing(round, pairing) {
    const sides = getPairingSides(pairing);
    const human = humanPlayerForPairing(pairing);
    const botPlayerId = sides.whitePlayerId === human?.playerId ? sides.blackPlayerId : sides.whitePlayerId;
    const bot = getBotRecordByPlayerId(botPlayerId);
    if (!human || !bot) {
      throw new Error("Human or bot configuration missing for this pairing.");
    }
    const humanColor = sides.whitePlayerId === human.playerId ? "w" : "b";
    state.runner.active = true;
    state.runner.stopping = false;
    state.runner.awaitingJoinPairingKey = "";
    state.runner.currentPairingKey = `${round.roundNo}:${pairing.boardNo}`;
    state.runner.currentMatchLabel = currentPairingLabel(pairing);
    state.runner.currentMoveCount = 0;
    state.runner.humanMatchCompleted = false;
    state.runner.currentMatch = { round, pairing, humanPlayerId: human.playerId };
    setPairingStatus(pairing, "in_progress");
    await Promise.resolve(openHumanMatch?.({
      tournamentId: state.tournament.id,
      pairingKey: state.runner.currentPairingKey,
      roundNo: round.roundNo,
      boardNo: pairing.boardNo,
      humanColor,
      humanName: human.name,
      bot,
      whiteName: playerName(sides.whitePlayerId),
      blackName: playerName(sides.blackPlayerId),
      initialMs: humanColor === "w"
        ? Math.max(1000, Number(pairing.armageddonWhiteMs || Math.floor((state.tournament.timeControl?.mainMinutes || 5) * 60000)))
        : Math.max(1000, Number(pairing.armageddonBlackMs || Math.floor((state.tournament.timeControl?.mainMinutes || 5) * 60000))),
      incrementMs: Math.max(0, Number(pairing.armageddonIncrementMs || Math.floor((state.tournament.timeControl?.incrementSeconds || 0) * 1000)))
    }));
    render();
  }

  async function runSinglePairing(round, pairing) {
    const sides = getPairingSides(pairing);
    const whiteBot = getBotRecordByPlayerId(sides.whitePlayerId);
    const blackBot = sides.blackPlayerId ? getBotRecordByPlayerId(sides.blackPlayerId) : null;
    if (!whiteBot || !blackBot) {
      throw new Error("Bot configuration missing for a tournament pairing.");
    }
    const game = new Chess();
    const matchId = `${state.tournament.id}-${round.roundNo}-${pairing.boardNo}`;
    const whiteEngineId = `${matchId}-w`;
    const blackEngineId = `${matchId}-b`;
    const clocks = {
      whiteStartMs: Math.max(1000, Number(pairing.armageddonWhiteMs || Math.floor((state.tournament.timeControl?.mainMinutes || 5) * 60000))),
      blackStartMs: Math.max(1000, Number(pairing.armageddonBlackMs || Math.floor((state.tournament.timeControl?.mainMinutes || 5) * 60000))),
      whiteMs: Math.max(1000, Number(pairing.armageddonWhiteMs || Math.floor((state.tournament.timeControl?.mainMinutes || 5) * 60000))),
      blackMs: Math.max(1000, Number(pairing.armageddonBlackMs || Math.floor((state.tournament.timeControl?.mainMinutes || 5) * 60000))),
      incrementMs: Math.max(0, Number(pairing.armageddonIncrementMs || Math.floor((state.tournament.timeControl?.incrementSeconds || 0) * 1000)))
    };
    let needArmageddon = false;

    state.runner.active = true;
    state.runner.stopping = false;
    state.runner.currentPairingKey = `${round.roundNo}:${pairing.boardNo}`;
    state.runner.currentMatchLabel = currentPairingLabel(pairing);
    state.runner.currentMoveCount = 0;
    state.runner.currentMatch = { round, pairing, whiteEngineId, blackEngineId, clocks, game };
    setPairingStatus(pairing, "in_progress");
    updateSpectatorGame?.(buildSpectatorSnapshot());

    try {
      await startTournamentEngine(whiteEngineId, whiteBot);
      await startTournamentEngine(blackEngineId, blackBot);
      while (!state.runner.stopping) {
        if (game.isGameOver()) break;
        const turn = game.turn();
        const engineId = turn === "w" ? whiteEngineId : blackEngineId;
        const startAt = Date.now();
        const moveList = game.history({ verbose: true }).map((move) => `${move.from}${move.to}${move.promotion || ""}`);
        const bestMove = await requestEngineMove(engineId, moveList, clocks);
        const elapsed = Date.now() - startAt;
        if (turn === "w") {
          clocks.whiteMs -= elapsed;
        } else {
          clocks.blackMs -= elapsed;
        }
        if ((turn === "w" ? clocks.whiteMs : clocks.blackMs) <= 0) {
          markPairingResult(pairing, turn === "w" ? "0-1" : "1-0");
          break;
        }
        const parsedMove = parseUciMove(bestMove);
        if (!parsedMove) {
          markPairingResult(pairing, turn === "w" ? "0-1" : "1-0");
          break;
        }
        const applied = game.move(parsedMove);
        if (!applied) {
          markPairingResult(pairing, turn === "w" ? "0-1" : "1-0");
          break;
        }
        if (turn === "w") clocks.whiteMs += clocks.incrementMs;
        else clocks.blackMs += clocks.incrementMs;
        state.runner.currentMoveCount += 1;
        updateSpectatorGame?.(buildSpectatorSnapshot());
        render();
        const terminalResult = resultFromGame(game, turn);
        if (terminalResult) {
          if (isDrawResult(terminalResult) && isKnockoutArmageddonPairing(pairing)) {
            markPairingResult(pairing, "1-0");
          } else {
            markPairingResult(pairing, terminalResult);
          }
          break;
        }
      }
      if (state.runner.stopping && pairing.status === "in_progress") {
        pairing.status = "pending";
        pairing.result = "pending";
      } else if (state.tournament.format === "ko" && isDrawResult(pairing.result) && !pairing.armageddonActive) {
        needArmageddon = prepareArmageddonForPairing(pairing);
      } else if (pairing.status === "completed" && pairing.result && pairing.result !== "pending") {
        updateSpectatorGame?.(buildSpectatorSnapshot());
        await saveBotVsBotArchiveGame({
          game,
          round,
          pairing,
          result: pairing.result
        }).catch(() => {});
      }
    } finally {
      await stopTournamentEngine(whiteEngineId);
      await stopTournamentEngine(blackEngineId);
      state.runner.currentMatch = null;
      state.runner.active = false;
      state.runner.currentPairingKey = "";
      state.runner.currentMatchLabel = "";
      state.runner.currentMoveCount = 0;
      if (!state.runner.stopping && pairing.status === "in_progress") {
        pairing.status = "pending";
      }
      render();
    }
    if (needArmageddon && !state.runner.stopping) {
      msg("Knockout draw. Starting Armageddon rematch with reversed colors.");
      return runSinglePairing(round, pairing);
    }
  }

  async function continueTournamentAutomation() {
    const currentRound = latestRound();
    if (!currentRound || state.tournament.status === "finished" || state.runner.stopping) return;
    const nextPairing = currentRound.pairings.find((pairing) => !pairing.isBye && pairing.status === "pending") || null;
    if (nextPairing) {
      if (pairingHasHuman(nextPairing)) {
        nextPairing.status = "awaiting_join";
        state.runner.awaitingJoinPairingKey = `${currentRound.roundNo}:${nextPairing.boardNo}`;
        state.runner.currentPairingKey = state.runner.awaitingJoinPairingKey;
        state.runner.currentMatchLabel = currentPairingLabel(nextPairing);
        state.runner.currentMoveCount = 0;
        render();
        msg("Human pairing ready. Click Join to start the game.");
        return;
      }
      try {
        await runSinglePairing(currentRound, nextPairing);
      } catch (err) {
        if (!state.runner.stopping) {
          msg(String(err?.message || err || "Tournament match failed."), true);
        }
        state.runner.stopping = true;
      }
      if (state.runner.stopping) return;
      return continueTournamentAutomation();
    }
    const completed = finalizeRoundIfComplete(currentRound);
    render();
    if (!completed) return;
    if (isTournamentFinishedByStructure()) {
      state.tournament.status = "finished";
      render();
      msg("Bots tournament complete.");
      return;
    }
    msg(`Round ${currentRound.roundNo} complete. Click Next Round to continue.`);
  }

  function renderStandings() {
    if (!el.standingsList) return;
    const query = String(state.standingsSearchQuery || "").trim().toLowerCase();
    const rows = (state.tournament.standings || []).filter((entry) => {
      if (!query) return true;
      return `${entry.name} ${entry.rating}`.toLowerCase().includes(query);
    });
    if (!rows.length) {
      el.standingsList.innerHTML = '<tr><td colspan="7" class="tournament-empty-cell">No standings yet.</td></tr>';
      return;
    }
    el.standingsList.innerHTML = rows.map((entry) => `
      <tr>
        <td>${entry.rank}</td>
        <td>${escapeHtml(entry.name)}</td>
        <td>${entry.points.toFixed(1)}</td>
        <td>${entry.buchholz.toFixed(1)}</td>
        <td>${entry.medianBuchholz.toFixed(1)}</td>
        <td>${entry.sonnebornBerger.toFixed(1)}</td>
        <td>${typeof entry.directEncounter === "number" ? entry.directEncounter.toFixed(1) : escapeHtml(entry.directEncounter)}</td>
      </tr>
    `).join("");
  }

  function render() {
    if (!botTournamentScreenEl) return;
    if (el.setupView) el.setupView.classList.toggle("hidden", state.view !== "setup");
    if (el.liveView) el.liveView.classList.toggle("hidden", state.view !== "live");
    if (el.standingsView) el.standingsView.classList.toggle("hidden", state.view !== "standings");
    renderConfig();
    renderPlayers();
    recomputeStandings();
    renderLiveView();
    renderStandings();
  }

  function showScreen() {
    closeHomeProfileMenu();
    closeHomeOnlinePanels();
    if (homeProfileEl) homeProfileEl.classList.add("hidden");
    if (homeScreenEl) homeScreenEl.classList.add("hidden");
    if (toolsScreenEl) toolsScreenEl.classList.add("hidden");
    if (botsScreenEl) botsScreenEl.classList.add("hidden");
    if (gameScreenEl) gameScreenEl.classList.add("hidden");
    if (botTournamentScreenEl) botTournamentScreenEl.classList.remove("hidden");
    updateHomeOnlineToolbarVisibility();
    state.view = "setup";
    msg("");
    render();
  }

  function backToBots() {
    closeHomeProfileMenu();
    closeHomeOnlinePanels();
    if (homeProfileEl) homeProfileEl.classList.add("hidden");
    if (homeScreenEl) homeScreenEl.classList.add("hidden");
    if (toolsScreenEl) toolsScreenEl.classList.add("hidden");
    if (botsScreenEl) botsScreenEl.classList.remove("hidden");
    if (botTournamentScreenEl) botTournamentScreenEl.classList.add("hidden");
    if (gameScreenEl) gameScreenEl.classList.add("hidden");
    updateHomeOnlineToolbarVisibility();
  }

  function addPlayerRecord(bot) {
    state.tournament.players.push({
      playerId: makeId("btp"),
      botId: bot.id,
      name: safeName(bot.displayName || bot.name, 64),
      rating: Math.max(100, Math.round(Number(bot.rating || 2500))),
      active: true
    });
    state.tournament.players.sort(byRatingName);
    state.tournament.updatedAt = now();
  }

  function addHumanPlayerRecord(name, rating) {
    state.tournament.players.push({
      playerId: makeId("btp"),
      botId: "__human__",
      isHuman: true,
      name: safeName(name, 64) || getHumanDefaultName(),
      rating: Math.max(0, Math.round(Number(rating) || 0)),
      active: true
    });
    state.tournament.players.sort(byRatingName);
    state.tournament.updatedAt = now();
  }

  function startTournament() {
    if (state.tournament.players.length < 2) {
      msg("Add at least 2 bots before starting.", true);
      return;
    }
    state.tournament.rounds = [];
    state.tournament.status = "draft";
    const generated = generateRoundCore();
    if (!generated.ok) {
      msg(generated.error || "Unable to start tournament.", true);
      return;
    }
    state.view = "live";
    render();
    msg(generated.message || "Tournament started.");
    window.setTimeout(() => {
      continueTournamentAutomation().catch((err) => {
        msg(String(err?.message || err || "Tournament automation failed."), true);
      });
    }, 0);
  }

  async function confirmExitFromLive() {
    const confirmed = await openExitConfirm();
    if (!confirmed) {
      return;
    }
    closeSpectatorGame?.();
    await abortCurrentMatchWithoutResult();
    state.tournament.status = "draft";
    state.view = "setup";
    render();
    msg("Bot tournament stopped.");
  }

  async function completeTournamentNow() {
    if (state.runner.active) {
      closeSpectatorGame?.();
      await abortCurrentMatchWithoutResult();
    }
    finalizeTournament();
  }

  function completeHumanMatch({ tournamentId, pairingKey, result } = {}) {
    if (String(tournamentId || "") !== String(state.tournament.id || "")) return;
    if (String(pairingKey || "") !== String(state.runner.currentPairingKey || "")) return;
    const match = state.runner.currentMatch;
    const pairing = match?.pairing;
    if (!pairing || pairing.isBye) return;
    let normalized = String(result || "").trim();
    if (!normalized || normalized === "*") return;
    if (isDrawResult(normalized) && state.tournament.format === "ko") {
      if (isKnockoutArmageddonPairing(pairing)) {
        normalized = "1-0";
      } else if (prepareArmageddonForPairing(pairing)) {
        pairing.status = "awaiting_join";
        state.runner.awaitingJoinPairingKey = String(pairingKey || "");
        state.runner.currentPairingKey = String(pairingKey || "");
        state.runner.currentMatchLabel = currentPairingLabel(pairing);
        state.runner.currentMoveCount = 0;
        state.runner.currentMatch = null;
        render();
        msg("Knockout draw. Armageddon rematch ready. Click Join.");
        return;
      }
    }
    pairing.result = normalized;
    pairing.status = "completed";
    state.runner.humanMatchCompleted = true;
    state.runner.active = false;
    state.tournament.updatedAt = now();
    finalizeRoundIfComplete(match.round);
    render();
    msg("Human match complete. Click Exit to return to the tournament.");
  }

  function handleHumanMatchExit({ tournamentId, pairingKey } = {}) {
    if (String(tournamentId || "") !== String(state.tournament.id || "")) return;
    if (String(pairingKey || "") !== String(state.runner.currentPairingKey || "")) return;
    state.runner.awaitingJoinPairingKey = "";
    state.runner.active = false;
    state.runner.humanMatchCompleted = false;
    state.runner.currentMatch = null;
    state.runner.currentPairingKey = "";
    state.runner.currentMatchLabel = "";
    state.runner.currentMoveCount = 0;
    showLiveScreen();
    const currentRound = latestRound();
    if (currentRound?.status === "completed") {
      if (isTournamentFinishedByStructure()) {
        state.tournament.status = "finished";
        render();
        msg("Bots tournament complete.");
      } else {
        msg(`Round ${currentRound.roundNo} complete. Click Next Round to continue.`);
      }
      return;
    }
    window.setTimeout(() => {
      continueTournamentAutomation().catch((err) => {
        msg(String(err?.message || err || "Tournament automation failed."), true);
      });
    }, 0);
  }

  function wire() {
    if (el.back) {
      el.back.addEventListener("click", () => {
        if (state.view === "standings") {
          state.view = "live";
          render();
          return;
        }
        if (state.view === "live") {
          confirmExitFromLive().catch((err) => msg(String(err?.message || err || "Unable to stop tournament."), true));
          return;
        }
        backToBots();
      });
    }
    if (el.name) {
      el.name.addEventListener("input", () => {
        state.tournament.name = safeName(el.name.value, 80) || "New Bots Tournament";
      });
    }
    if (el.format) {
      el.format.addEventListener("change", () => {
        state.tournament.format = String(el.format.value || "swiss_dutch");
        if (state.tournament.format !== "ko") {
          state.tournament.randomizeKo = false;
        }
        renderConfig();
      });
    }
    if (el.rounds) {
      el.rounds.addEventListener("change", () => {
        state.tournament.totalRounds = clampInt(el.rounds.value, 1, 30, 7);
      });
    }
    if (el.randomKo) {
      el.randomKo.addEventListener("change", () => {
        if (state.tournament.format !== "ko") {
          el.randomKo.checked = false;
          state.tournament.randomizeKo = false;
          return;
        }
        state.tournament.randomizeKo = !!el.randomKo.checked;
      });
    }
    if (el.timeMain) {
      el.timeMain.addEventListener("change", () => {
        state.tournament.timeControl.mainMinutes = clampInt(el.timeMain.value, 1, 180, 5);
      });
    }
    if (el.timeIncrement) {
      el.timeIncrement.addEventListener("change", () => {
        state.tournament.timeControl.incrementSeconds = clampInt(el.timeIncrement.value, 0, 30, 3);
      });
    }
    if (el.playerName) {
      el.playerName.addEventListener("change", () => {
        syncSelectedBotDetails();
      });
    }
    if (el.btnAddPlayer) {
      el.btnAddPlayer.addEventListener("click", () => {
        const selectedId = String(el.playerName?.value || "");
        if (!selectedId) {
          msg("Select a player first.", true);
          return;
        }
        if (selectedId === "__human__") {
          openHumanModal();
          return;
        }
        const bot = availableBots().find((item) => item.id === selectedId) || null;
        if (!bot) {
          msg("Select a player first.", true);
          return;
        }
        addPlayerRecord(bot);
        render();
        msg(`Added ${bot.displayName || bot.name}.`);
      });
    }
    if (el.playerSearch) {
      el.playerSearch.addEventListener("input", () => {
        state.playerSearchQuery = String(el.playerSearch.value || "");
        renderPlayers();
      });
    }
    if (el.playerList) {
      el.playerList.addEventListener("click", (event) => {
        const btn = event.target.closest("[data-del-player]");
        if (!btn) return;
        const id = String(btn.getAttribute("data-del-player") || "");
        const idx = state.tournament.players.findIndex((player) => player.playerId === id);
        if (idx < 0) return;
        const removed = state.tournament.players.splice(idx, 1)[0];
        state.tournament.updatedAt = now();
        render();
        msg(`Removed ${removed?.name || "bot"}.`);
      });
    }
    if (el.pairingsList) {
      el.pairingsList.addEventListener("click", (event) => {
        const joinBtn = event.target.closest("[data-join-human-pairing]");
        if (joinBtn) {
          const joinKey = String(joinBtn.getAttribute("data-join-human-pairing") || "");
          const round = latestRound();
          const pairing = Array.isArray(round?.pairings)
            ? round.pairings.find((item) => `${round.roundNo}:${item.boardNo}` === joinKey)
            : null;
          if (!round || !pairing || pairing.status !== "awaiting_join") return;
          startHumanPairing(round, pairing).catch((err) => {
            pairing.status = "awaiting_join";
            state.runner.awaitingJoinPairingKey = joinKey;
            state.runner.active = false;
            render();
            msg(String(err?.message || err || "Unable to start human match."), true);
          });
          return;
        }
        const row = event.target.closest("[data-bot-pairing-key]");
        if (!row) return;
        const key = String(row.getAttribute("data-bot-pairing-key") || "");
        if (!key || key !== String(state.runner.currentPairingKey || "")) return;
        if (state.runner.awaitingJoinPairingKey) return;
        const snapshot = buildSpectatorSnapshot();
        if (!snapshot) return;
        openSpectatorGame?.(snapshot);
      });
    }
    if (el.btnSave) {
      el.btnSave.addEventListener("click", () => {
        saveTournament().catch((err) => msg(String(err?.message || err || "Unable to save."), true));
      });
    }
    if (el.btnStart) {
      el.btnStart.addEventListener("click", startTournament);
    }
    if (el.btnNextRound) {
      el.btnNextRound.addEventListener("click", () => {
        const generated = generateRoundCore();
        if (!generated.ok) {
          if (generated.terminal) {
            state.tournament.status = "finished";
            render();
            msg("Bots tournament complete.");
          } else {
            msg(generated.error || "Unable to generate next round.", true);
          }
          return;
        }
        render();
        msg(generated.message || "Next round generated.");
        window.setTimeout(() => {
          continueTournamentAutomation().catch((err) => {
            msg(String(err?.message || err || "Tournament automation failed."), true);
          });
        }, 0);
      });
    }
    if (el.btnLiveStandings) {
      el.btnLiveStandings.addEventListener("click", () => {
        state.view = "standings";
        render();
      });
    }
    if (el.btnFinalize) {
      el.btnFinalize.addEventListener("click", () => {
        completeTournamentNow().catch((err) => msg(String(err?.message || err || "Unable to complete tournament."), true));
      });
    }
    if (el.btnLiveBackToSetup) {
      el.btnLiveBackToSetup.addEventListener("click", () => {
        confirmExitFromLive().catch((err) => msg(String(err?.message || err || "Unable to stop tournament."), true));
      });
    }
    if (el.standingsSearch) {
      el.standingsSearch.addEventListener("input", () => {
        state.standingsSearchQuery = String(el.standingsSearch.value || "");
        renderStandings();
      });
    }
    if (el.btnStandingsBack) {
      el.btnStandingsBack.addEventListener("click", () => {
        state.view = "live";
        render();
      });
    }
    if (el.exitModal) {
      el.exitModal.addEventListener("click", (event) => {
        if (event.target === el.exitModal) closeExitConfirm(false);
      });
    }
    if (el.btnExitClose) {
      el.btnExitClose.addEventListener("click", () => closeExitConfirm(false));
    }
    if (el.btnExitCancel) {
      el.btnExitCancel.addEventListener("click", () => closeExitConfirm(false));
    }
    if (el.btnExitAccept) {
      el.btnExitAccept.addEventListener("click", () => closeExitConfirm(true));
    }
    if (el.btnHumanClose) {
      el.btnHumanClose.addEventListener("click", closeHumanModal);
    }
    if (el.btnHumanCancel) {
      el.btnHumanCancel.addEventListener("click", closeHumanModal);
    }
    if (el.btnHumanSave) {
      el.btnHumanSave.addEventListener("click", () => {
        const name = safeName(el.humanName?.value, 64) || getHumanDefaultName();
        const rating = clampInt(el.humanRating?.value, 0, 5000, 0);
        if (state.tournament.players.some((player) => player.isHuman)) {
          msg("Only one human player is allowed.", true);
          closeHumanModal();
          return;
        }
        addHumanPlayerRecord(name, rating);
        closeHumanModal();
        render();
        msg(`Added ${name}.`);
      });
    }
  }

  ipcRenderer.on("tournament-engine:stdout", (_event, payload) => {
    onTournamentEngineStdout(payload);
  });
  ipcRenderer.on("tournament-engine:stderr", (_event, payload) => {
    onTournamentEngineStderr(payload);
  });
  ipcRenderer.on("tournament-engine:closed", (_event, payload) => {
    onTournamentEngineClosed(payload);
  });
  window.addEventListener("beforeunload", () => {
    ipcRenderer.invoke("tournament-engine:stopAll").catch(() => {});
  });

  wire();
  render();
  return {
    showScreen,
    showLiveScreen,
    backToBots,
    render,
    completeHumanMatch,
    handleHumanMatchExit
  };
}

module.exports = { createBotTournamentModule };
