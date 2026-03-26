function createTournamentModule({
  ipcRenderer,
  homeProfileEl,
  homeScreenEl,
  toolsScreenEl,
  chess960ScreenEl,
  tournamentScreenEl,
  gameScreenEl,
  closeHomeProfileMenu,
  closeHomeOnlinePanels,
  updateHomeOnlineToolbarVisibility
}) {
  const el = {
    page: document.querySelector(".page"),
    back: document.getElementById("btn-tournament-back"),
    header: document.getElementById("tournament-screen-header"),
    layout: tournamentScreenEl ? tournamentScreenEl.querySelector(".tournament-layout") : null,
    entryView: document.getElementById("tournament-entry-view"),
    setupView: document.getElementById("tournament-setup-view"),
    liveView: document.getElementById("tournament-live-view"),
    standingsView: document.getElementById("tournament-standings-view"),
    displayView: document.getElementById("tournament-display-view"),
    standingsDisplayView: document.getElementById("tournament-standings-display-view"),
    btnEntryNew: document.getElementById("btn-tournament-entry-new"),
    btnEntryLoad: document.getElementById("btn-tournament-entry-load"),
    name: document.getElementById("tournament-name-input"),
    format: document.getElementById("tournament-format-select"),
    rounds: document.getElementById("tournament-rounds-input"),
    override: document.getElementById("tournament-arbiter-override"),
    randomKo: document.getElementById("tournament-randomize-ko"),
    btnStart: document.getElementById("btn-tournament-start"),
    pName: document.getElementById("tournament-player-name"),
    pRating: document.getElementById("tournament-player-rating"),
    playerSearch: document.getElementById("tournament-player-search"),
    btnAddPlayer: document.getElementById("btn-tournament-add-player"),
    btnImportPlayers: document.getElementById("btn-tournament-import-players"),
    playerList: document.getElementById("tournament-player-list"),
    pairings: document.getElementById("tournament-pairings-list"),
    standings: document.getElementById("tournament-standings-list"),
    roundLabel: document.getElementById("tournament-round-label"),
    btnGenerate: document.getElementById("btn-tournament-generate-round"),
    btnUndo: document.getElementById("btn-tournament-undo"),
    btnDisplay: document.getElementById("btn-tournament-display"),
    btnStandings: document.getElementById("btn-tournament-standings"),
    btnStandingsDisplay: document.getElementById("btn-tournament-standings-display"),
    btnFinalize: document.getElementById("btn-tournament-finalize"),
    btnSave: document.getElementById("btn-tournament-save"),
    btnExportCsv: document.getElementById("btn-tournament-export-csv"),
    pairingSearch: document.getElementById("tournament-pairing-search"),
    standingsSearch: document.getElementById("tournament-standings-search"),
    displayRoundLabel: document.getElementById("tournament-display-round-label"),
    displaySearch: document.getElementById("tournament-display-search"),
    btnDisplayPrev: document.getElementById("btn-tournament-display-prev"),
    displayPageLabel: document.getElementById("tournament-display-page-label"),
    btnDisplayNext: document.getElementById("btn-tournament-display-next"),
    btnDisplayExit: document.getElementById("btn-tournament-display-exit"),
    displayBody: document.getElementById("tournament-display-body"),
    displayColumns: document.getElementById("tournament-display-columns"),
    standingsDisplaySearch: document.getElementById("tournament-standings-display-search"),
    btnStandingsDisplayPrev: document.getElementById("btn-tournament-standings-display-prev"),
    standingsDisplayPageLabel: document.getElementById("tournament-standings-display-page-label"),
    btnStandingsDisplayNext: document.getElementById("btn-tournament-standings-display-next"),
    btnStandingsDisplayExit: document.getElementById("btn-tournament-standings-display-exit"),
    standingsDisplayBody: document.getElementById("tournament-standings-display-body"),
    standingsDisplayColumns: document.getElementById("tournament-standings-display-columns"),
    status: document.getElementById("tournament-status")
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
  function msg(text, isErr = false) {
    if (!el.status) return;
    el.status.textContent = String(text || "");
    el.status.style.color = isErr ? "#e08f8f" : "#bdbdbd";
    el.status.classList.toggle("hidden", state.view === "entry" || !String(text || "").trim());
  }
  function emptyTournament() {
    return {
      id: makeId("t"),
      name: "New Tournament",
      createdAt: now(),
      updatedAt: now(),
      format: "swiss_dutch",
      status: "draft",
      totalRounds: 7,
      scoringProfile: { win: 1, draw: 0.5, loss: 0 },
      tiebreakProfile: ["buchholz", "medianBuchholz", "sonnebornBerger", "directEncounter"],
      arbiterOverrideEnabled: false,
      randomizeKo: false,
      players: [],
      rounds: [],
      standings: [],
      auditLog: []
    };
  }
  const state = {
    tournament: emptyTournament(),
    view: "entry",
    undoStack: [],
    playerSearchQuery: "",
    editingPlayerId: "",
    pairingSearchQuery: "",
    standingsSearchQuery: "",
    displaySearchQuery: "",
    displayPageIndex: 0,
    standingsDisplaySearchQuery: "",
    standingsDisplayPageIndex: 0
  };

  function playerById(id) {
    return state.tournament.players.find((p) => p.playerId === id) || null;
  }
  function playerName(id) {
    return playerById(id)?.name || "Unknown";
  }
  function cloneTournamentState() {
    return JSON.parse(JSON.stringify(serializeTournament()));
  }
  function pushUndoSnapshot(kind) {
    state.undoStack.push({
      kind: String(kind || "action"),
      snapshot: cloneTournamentState()
    });
  }
  function restoreTournamentState(snapshot) {
    state.tournament = hydrateTournament(snapshot);
    recomputeStandings();
    render();
  }
  function addAudit(action, details = "") {
    state.tournament.auditLog.push({ at: now(), action: String(action), details: String(details) });
    state.tournament.updatedAt = now();
  }
  function latestRound() {
    const rounds = state.tournament.rounds;
    return rounds.length ? rounds[rounds.length - 1] : null;
  }
  function roundDisplayLabel(round = latestRound()) {
    if (!round) return "Round -";
    const totalRounds = formatRoundLimit();
    return `Round ${round.roundNo}${totalRounds > 0 ? `/${totalRounds}` : ""}`;
  }
  function pairingDisplayNames(pairing) {
    if (!pairing) return { white: "", black: "", searchText: "" };
    if (pairing.isBye) {
      const white = `${playerName(pairing.whitePlayerId)} (bye)`;
      return {
        white,
        black: "-",
        searchText: white.toLowerCase()
      };
    }
    const white = playerName(pairing.whitePlayerId);
    const black = playerName(pairing.blackPlayerId);
    return {
      white,
      black,
      searchText: `${white} ${black}`.toLowerCase()
    };
  }
  function nextRoundNo() {
    return state.tournament.rounds.length + 1;
  }
  function activePlayers() {
    return state.tournament.players.filter((p) => p.active !== false);
  }
  function playedOpponents(playerId) {
    const set = new Set();
    for (const round of state.tournament.rounds) {
      if (round.status !== "completed") continue;
      for (const p of round.pairings) {
        if (p.isBye) continue;
        if (p.whitePlayerId === playerId && p.blackPlayerId) set.add(p.blackPlayerId);
        if (p.blackPlayerId === playerId && p.whitePlayerId) set.add(p.whitePlayerId);
      }
    }
    return set;
  }
  function colorCount(playerId, color) {
    let n = 0;
    for (const round of state.tournament.rounds) {
      for (const p of round.pairings) {
        if (p.isBye) continue;
        if (color === "w" && p.whitePlayerId === playerId) n += 1;
        if (color === "b" && p.blackPlayerId === playerId) n += 1;
      }
    }
    return n;
  }
  function colorPref(playerId) {
    const w = colorCount(playerId, "w");
    const b = colorCount(playerId, "b");
    if (w > b) return "b";
    if (b > w) return "w";
    return null;
  }
  function scoreResult(result, side) {
    if (result === "1-0") return side === "w" ? 1 : 0;
    if (result === "0-1") return side === "b" ? 1 : 0;
    if (result === "1/2-1/2") return 0.5;
    if (result === "forfeit-w") return side === "w" ? 1 : 0;
    if (result === "forfeit-b") return side === "b" ? 1 : 0;
    return 0;
  }
  function winnerFromPairing(p) {
    if (p.isBye) return p.whitePlayerId;
    if (p.result === "1-0" || p.result === "forfeit-w") return p.whitePlayerId;
    if (p.result === "0-1" || p.result === "forfeit-b") return p.blackPlayerId;
    return null;
  }
  function chooseSwissBye(sorted) {
    const never = sorted.filter((p) => !p.hadBye);
    const pool = never.length ? never : sorted;
    const copy = [...pool].sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      return byRatingName(a, b);
    });
    return copy[0] || null;
  }
  function chooseSwissOpponent(p1, candidates) {
    const played = playedOpponents(p1.playerId);
    const ordered = [...candidates].sort((a, b) => {
      const aRep = played.has(a.playerId) ? 1 : 0;
      const bRep = played.has(b.playerId) ? 1 : 0;
      if (aRep !== bRep) return aRep - bRep;
      const aDiff = Math.abs(Number(a.score) - Number(p1.score));
      const bDiff = Math.abs(Number(b.score) - Number(p1.score));
      if (aDiff !== bDiff) return aDiff - bDiff;
      return byRatingName(a, b);
    });
    return ordered[0] || null;
  }
  function assignColors(a, b) {
    const ap = colorPref(a.playerId);
    const bp = colorPref(b.playerId);
    if (ap === "w" || bp === "b") return { w: a, b };
    if (ap === "b" || bp === "w") return { w: b, b: a };
    return Number(a.rating || 0) >= Number(b.rating || 0) ? { w: a, b } : { w: b, b: a };
  }
  function buildSwissRound(roundNo) {
    const players = activePlayers()
      .map((p) => ({ ...p }))
      .sort((a, b) => (b.score !== a.score ? b.score - a.score : byRatingName(a, b)));
    if (players.length < 2) throw new Error("At least 2 active players are required.");
    const pairings = [];
    const diagnostics = [];
    const work = [...players];
    if (work.length % 2 === 1) {
      const bye = chooseSwissBye(work);
      if (bye) {
        const idx = work.findIndex((p) => p.playerId === bye.playerId);
        if (idx >= 0) work.splice(idx, 1);
        pairings.push({
          boardNo: 1,
          whitePlayerId: bye.playerId,
          blackPlayerId: null,
          result: "1-0",
          isBye: true,
          manualOverride: false
        });
      }
    }
    while (work.length > 0) {
      const p1 = work.shift();
      const p2 = chooseSwissOpponent(p1, work);
      if (!p2) {
        diagnostics.push(`No legal opponent for ${p1.name}`);
        break;
      }
      const idx = work.findIndex((p) => p.playerId === p2.playerId);
      if (idx >= 0) work.splice(idx, 1);
      const asn = assignColors(p1, p2);
      pairings.push({
        boardNo: pairings.length + 1,
        whitePlayerId: asn.w.playerId,
        blackPlayerId: asn.b.playerId,
        result: "pending",
        isBye: false,
        manualOverride: false
      });
    }
    return {
      roundNo,
      status: "generated",
      pairings,
      generatedAt: now(),
      lockedAt: 0,
      completedAt: 0,
      generatorMeta: { diagnostics }
    };
  }
  function buildRrSchedule(doubleRound) {
    const ids = activePlayers()
      .slice()
      .sort(byRatingName)
      .map((p) => p.playerId);
    const arr = [...ids];
    if (arr.length % 2 === 1) arr.push(null);
    const n = arr.length;
    const rounds = n - 1;
    const schedule = [];
    let cur = [...arr];
    for (let r = 0; r < rounds; r += 1) {
      const pairings = [];
      for (let i = 0; i < n / 2; i += 1) {
        const a = cur[i];
        const b = cur[n - 1 - i];
        if (!a && !b) continue;
        if (!a || !b) {
          const bye = a || b;
          pairings.push({
            boardNo: pairings.length + 1,
            whitePlayerId: bye,
            blackPlayerId: null,
            result: "1-0",
            isBye: true,
            manualOverride: false
          });
          continue;
        }
        const even = r % 2 === 0;
        pairings.push({
          boardNo: pairings.length + 1,
          whitePlayerId: even ? a : b,
          blackPlayerId: even ? b : a,
          result: "pending",
          isBye: false,
          manualOverride: false
        });
      }
      schedule.push(pairings);
      const fixed = cur[0];
      const rest = cur.slice(1);
      rest.unshift(rest.pop());
      cur = [fixed, ...rest];
    }
    if (!doubleRound) return schedule;
    const mirror = schedule.map((round) =>
      round.map((p) => ({
        ...p,
        whitePlayerId: p.blackPlayerId,
        blackPlayerId: p.whitePlayerId,
        result: p.isBye ? "1-0" : "pending"
      }))
    );
    return [...schedule, ...mirror];
  }
  function buildKoRound(roundNo) {
    let ids = [];
    if (roundNo === 1) {
      ids = activePlayers()
        .slice()
        .sort(byRatingName)
        .map((p) => p.playerId);
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
      if (!prev || prev.status !== "completed") throw new Error("Complete previous KO round first.");
      ids = prev.pairings.map(winnerFromPairing).filter(Boolean);
    }
    if (ids.length < 2) throw new Error("Knockout requires at least 2 players.");
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
        manualOverride: false
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
        manualOverride: false
      });
    }
    return {
      roundNo,
      status: "generated",
      pairings,
      generatedAt: now(),
      lockedAt: 0,
      completedAt: 0,
      generatorMeta: {}
    };
  }
  function validateRound(round) {
    const issues = [];
    if (!round) return ["No active round."];
    const seen = new Set();
    for (const p of round.pairings) {
      if (!p.whitePlayerId) issues.push(`Board ${p.boardNo}: missing white.`);
      if (!p.isBye && !p.blackPlayerId) issues.push(`Board ${p.boardNo}: missing black.`);
      if (p.whitePlayerId && p.blackPlayerId && p.whitePlayerId === p.blackPlayerId) {
        issues.push(`Board ${p.boardNo}: same player both colors.`);
      }
      for (const id of [p.whitePlayerId, p.blackPlayerId].filter(Boolean)) {
        if (seen.has(id)) issues.push(`Duplicate player in round: ${playerName(id)}.`);
        seen.add(id);
      }
    }
    return issues;
  }
  function collectSwissRepeatWarnings(round) {
    const warnings = [];
    if (!round || state.tournament.format !== "swiss_dutch") return warnings;
    for (const p of round.pairings) {
      if (p.isBye || !p.whitePlayerId || !p.blackPlayerId) continue;
      if (playedOpponents(p.whitePlayerId).has(p.blackPlayerId)) {
        warnings.push(`Swiss repeat pair: ${playerName(p.whitePlayerId)} vs ${playerName(p.blackPlayerId)}.`);
      }
    }
    return warnings;
  }
  function recomputeStandings() {
    for (const p of state.tournament.players) {
      p.score = 0;
      p.hadBye = false;
      p._games = [];
    }
    for (const round of state.tournament.rounds) {
      if (round.status !== "completed") continue;
      for (const pair of round.pairings) {
        const white = playerById(pair.whitePlayerId);
        const black = pair.blackPlayerId ? playerById(pair.blackPlayerId) : null;
        if (!white) continue;
        if (pair.isBye) {
          white.hadBye = true;
          white.score += 1;
          white._games.push({ oppId: null, points: 1 });
          continue;
        }
        if (!black) continue;
        const wp = scoreResult(pair.result, "w");
        const bp = scoreResult(pair.result, "b");
        white.score += wp;
        black.score += bp;
        white._games.push({ oppId: black.playerId, points: wp });
        black._games.push({ oppId: white.playerId, points: bp });
      }
    }
    const players = activePlayers();
    const scoreMap = new Map(players.map((p) => [p.playerId, Number(p.score || 0)]));
    const rows = players.map((p) => {
      const oppScores = p._games.filter((g) => g.oppId).map((g) => Number(scoreMap.get(g.oppId) || 0));
      const buchholz = oppScores.reduce((a, b) => a + b, 0);
      let medianBuchholz = buchholz;
      if (oppScores.length >= 3) {
        const s = [...oppScores].sort((a, b) => a - b);
        medianBuchholz = s.slice(1, s.length - 1).reduce((a, b) => a + b, 0);
      }
      let sonnebornBerger = 0;
      for (const g of p._games) {
        if (!g.oppId) continue;
        sonnebornBerger += Number(g.points || 0) * Number(scoreMap.get(g.oppId) || 0);
      }
      return {
        rank: 0,
        playerId: p.playerId,
        name: p.name,
        rating: Number(p.rating || 0),
        points: Number(p.score || 0),
        buchholz,
        medianBuchholz,
        sonnebornBerger,
        directEncounter: 0
      };
    });

    const groups = new Map();
    for (const r of rows) {
      const key = String(r.points);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(r);
    }
    for (const groupRows of groups.values()) {
      if (groupRows.length <= 1) continue;
      const ids = new Set(groupRows.map((r) => r.playerId));
      for (const row of groupRows) {
        const p = playerById(row.playerId);
        row.directEncounter = (p?._games || [])
          .filter((g) => g.oppId && ids.has(g.oppId))
          .reduce((acc, g) => acc + Number(g.points || 0), 0);
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
    rows.forEach((r, idx) => {
      r.rank = idx + 1;
    });
    state.tournament.standings = rows;
    state.tournament.updatedAt = now();
  }
  function formatRoundLimit() {
    const n = activePlayers().length;
    if (state.tournament.format === "swiss_dutch") return clampInt(state.tournament.totalRounds, 1, 30, 7);
    if (state.tournament.format === "rr") return n < 2 ? 0 : n % 2 === 0 ? n - 1 : n;
    if (state.tournament.format === "drr") {
      if (n < 2) return 0;
      const base = n % 2 === 0 ? n - 1 : n;
      return base * 2;
    }
    if (state.tournament.format === "ko") return n < 2 ? 0 : Math.ceil(Math.log2(n));
    return 0;
  }
  function generateRoundCore() {
    if (activePlayers().length < 2) {
      return { ok: false, error: "At least 2 active players are required." };
    }
    const last = latestRound();
    if (last && last.status !== "completed") {
      return { ok: false, error: "Complete current round first." };
    }
    const roundNo = nextRoundNo();
    const limit = formatRoundLimit();
    if (state.tournament.format !== "ko" && limit > 0 && roundNo > limit) {
      return { ok: false, error: "No more rounds to generate.", terminal: true };
    }
    let round = null;
    try {
      if (state.tournament.format === "swiss_dutch") round = buildSwissRound(roundNo);
      else if (state.tournament.format === "rr" || state.tournament.format === "drr") {
        const schedule = buildRrSchedule(state.tournament.format === "drr");
        if (roundNo > schedule.length) {
          return { ok: false, error: "No more rounds in schedule.", terminal: true };
        }
        round = {
          roundNo,
          status: "generated",
          pairings: schedule[roundNo - 1],
          generatedAt: now(),
          lockedAt: 0,
          completedAt: 0,
          generatorMeta: {}
        };
      } else if (state.tournament.format === "ko") round = buildKoRound(roundNo);
    } catch (err) {
      return { ok: false, error: String(err?.message || err) };
    }
    state.tournament.rounds.push(round);
    state.tournament.status = "active";
    addAudit("generate_round", `round=${roundNo}`);
    const issues = validateRound(round);
    const warnings = [
      ...issues,
      ...collectSwissRepeatWarnings(round),
      ...(Array.isArray(round.generatorMeta?.diagnostics) ? round.generatorMeta.diagnostics : [])
    ];
    return {
      ok: true,
      roundNo,
      warnings,
      message: warnings.length ? `Generated with warnings: ${warnings[0]}` : `Round ${roundNo} generated.`
    };
  }
  function completeRoundCore() {
    const round = latestRound();
    if (!round) return { ok: false, error: "No round to complete." };
    if (round.status === "completed") return { ok: false, error: "Round already completed." };
    const issues = validateRound(round);
    if (issues.length && !state.tournament.arbiterOverrideEnabled) {
      return { ok: false, error: `Cannot complete: ${issues[0]}` };
    }
    for (const p of round.pairings) {
      if (p.isBye) continue;
      if (!p.result || p.result === "pending") return { ok: false, error: `Board ${p.boardNo} pending.` };
      if (state.tournament.format === "ko" && (p.result === "1/2-1/2" || p.result === "forfeit-both")) {
        return { ok: false, error: "KO does not allow draw/forfeit-both in V1." };
      }
    }
    const repeatWarnings = collectSwissRepeatWarnings(round);
    round.status = "completed";
    if (!round.lockedAt) round.lockedAt = now();
    round.completedAt = now();
    addAudit("complete_round", `round=${round.roundNo}`);
    recomputeStandings();
    if (state.tournament.format === "ko") {
      const winners = round.pairings.map(winnerFromPairing).filter(Boolean);
      if (winners.length === 1) {
        state.tournament.status = "finished";
        addAudit("finish_tournament", `champion=${playerName(winners[0])}`);
      }
    }
    return {
      ok: true,
      roundNo: round.roundNo,
      warnings: repeatWarnings,
      finished: state.tournament.status === "finished",
      message:
        repeatWarnings.length
          ? `Round ${round.roundNo} completed. Warning: ${repeatWarnings[0]}`
          : `Round ${round.roundNo} completed.`
    };
  }
  function advanceRound() {
    const current = latestRound();
    if (!current) {
      const gen = generateRoundCore();
      render();
      msg(gen.message || gen.error || "Unable to generate round.", !gen.ok || (gen.warnings && gen.warnings.length > 0));
      return;
    }
    if (current.status !== "completed") {
      pushUndoSnapshot("advance_round");
      const completed = completeRoundCore();
      if (!completed.ok) {
        state.undoStack.pop();
        render();
        msg(completed.error || "Unable to complete round.", true);
        return;
      }
      if (completed.finished) {
        render();
        msg(completed.message, !!(completed.warnings && completed.warnings.length));
        return;
      }
      const gen = generateRoundCore();
      render();
      if (!gen.ok) {
        const terminal = !!gen.terminal;
        msg(terminal ? completed.message : gen.error || "Unable to generate next round.", !terminal);
        return;
      }
      const summary = gen.warnings && gen.warnings.length ? gen.message : `Round ${completed.roundNo} completed. Round ${gen.roundNo} generated.`;
      msg(summary, !!(gen.warnings && gen.warnings.length));
      return;
    }
    pushUndoSnapshot("generate_round");
    const gen = generateRoundCore();
    if (!gen.ok) {
      state.undoStack.pop();
      render();
      msg(gen.error || "Unable to generate round.", !gen.terminal);
      return;
    }
    render();
    msg(gen.message, !!(gen.warnings && gen.warnings.length));
  }
  function finalizeTournament() {
    pushUndoSnapshot("finalize_tournament");
    recomputeStandings();
    state.tournament.status = "finished";
    addAudit("finalize", "manual");
    render();
    msg("Tournament finalized.");
  }
  function undoLastAction() {
    const entry = state.undoStack.pop();
    if (!entry || !entry.snapshot) {
      return msg("Nothing to undo.", true);
    }
    restoreTournamentState(entry.snapshot);
    msg(entry.kind === "finalize_tournament" ? "Tournament completion undone." : "Tournament step undone.");
  }
  function serializeTournament() {
    return {
      id: state.tournament.id,
      name: state.tournament.name,
      createdAt: state.tournament.createdAt,
      updatedAt: now(),
      format: state.tournament.format,
      status: state.tournament.status,
      totalRounds: state.tournament.totalRounds,
      scoringProfile: { ...state.tournament.scoringProfile },
      tiebreakProfile: [...state.tournament.tiebreakProfile],
      arbiterOverrideEnabled: !!state.tournament.arbiterOverrideEnabled,
      randomizeKo: !!state.tournament.randomizeKo,
      players: state.tournament.players.map((p) => ({
        playerId: p.playerId,
        name: p.name,
        rating: Number(p.rating || 0),
        seed: Number(p.seed || 0),
        active: p.active !== false
      })),
      rounds: state.tournament.rounds,
      standings: state.tournament.standings,
      auditLog: state.tournament.auditLog
    };
  }
  function hydrateTournament(t) {
    const x = emptyTournament();
    if (!t || typeof t !== "object") return x;
    x.id = String(t.id || x.id);
    x.name = safeName(t.name || x.name);
    x.createdAt = Number(t.createdAt || now());
    x.updatedAt = Number(t.updatedAt || now());
    x.format = ["swiss_dutch", "rr", "drr", "ko"].includes(t.format) ? t.format : "swiss_dutch";
    x.status = ["draft", "active", "finished"].includes(t.status) ? t.status : "draft";
    x.totalRounds = clampInt(t.totalRounds, 1, 30, 7);
    x.arbiterOverrideEnabled = !!t.arbiterOverrideEnabled;
    x.randomizeKo = !!t.randomizeKo;
    x.players = Array.isArray(t.players)
      ? t.players.map((p, idx) => ({
          playerId: String(p.playerId || makeId("p")),
          name: safeName(p.name || `Player ${idx + 1}`, 64),
          rating: clampInt(p.rating, 0, 5000, 0),
          seed: clampInt(p.seed, 0, 9999, idx + 1),
          active: p.active !== false,
          score: 0,
          hadBye: false
        }))
      : [];
    x.rounds = Array.isArray(t.rounds) ? t.rounds : [];
    x.auditLog = Array.isArray(t.auditLog) ? t.auditLog.slice(-500) : [];
    return x;
  }
  function csvRows() {
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const header = ["Rank", "Name", "Rating", "Points", "Buchholz", "Median Buchholz", "Sonneborn-Berger", "Direct Encounter"];
    const lines = [header.map(esc).join(",")];
    for (const row of state.tournament.standings || []) {
      lines.push(
        [row.rank, row.name, row.rating, row.points, row.buchholz, row.medianBuchholz, row.sonnebornBerger, row.directEncounter]
          .map(esc)
          .join(",")
      );
    }
    return lines.join("\n");
  }
  function pairingsCsvRows() {
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const round = latestRound();
    if (!round) return '"Round","-"\n"Pairings","No rounds yet."';
    const totalRounds = formatRoundLimit();
    const roundLabel = `Round ${round.roundNo}${totalRounds > 0 ? `/${totalRounds}` : ""}`;
    const lines = [
      [roundLabel, "Pairings"].map(esc).join(","),
      ["Board", "White", "Black", "Result"].map(esc).join(",")
    ];
    for (const pairing of round.pairings || []) {
      if (pairing.isBye) {
        lines.push(
          [pairing.boardNo, `${playerName(pairing.whitePlayerId)} (bye)`, "-", pairing.result || "1-0"]
            .map(esc)
            .join(",")
        );
      } else {
        lines.push(
          [pairing.boardNo, playerName(pairing.whitePlayerId), playerName(pairing.blackPlayerId), pairing.result || "pending"]
            .map(esc)
            .join(",")
        );
      }
    }
    return lines.join("\n");
  }
  async function saveTournament() {
    const safe = safeName(state.tournament.name || "tournament", 60)
      .replace(/[^a-z0-9]+/gi, "_")
      .replace(/^_+|_+$/g, "");
    const filePath = await ipcRenderer.invoke("file:saveText", {
      defaultPath: `${safe || "tournament"}.json`,
      filters: [{ name: "Tournament", extensions: ["json"] }],
      content: `${JSON.stringify(serializeTournament(), null, 2)}\n`
    });
    if (!filePath) return;
    msg("Tournament saved.");
  }
  async function loadTournament() {
    const picked = await ipcRenderer.invoke("file:openText", {
      filters: [{ name: "Tournament", extensions: ["json"] }]
    });
    if (!picked?.content) return;
    let parsed;
    try {
      parsed = JSON.parse(String(picked.content || ""));
    } catch (_) {
      return msg("Load failed: invalid tournament file.", true);
    }
    state.tournament = hydrateTournament(parsed);
    state.undoStack = [];
    state.view = state.tournament.rounds.length > 0 || state.tournament.status !== "draft" ? "live" : "setup";
    recomputeStandings();
    render();
    msg("Tournament loaded.");
  }
  async function exportCsv() {
    recomputeStandings();
    const safe = safeName(state.tournament.name || "tournament", 60).replace(/[^a-z0-9]+/gi, "_");
    const exportingPairings = state.view === "live";
    const round = latestRound();
    const totalRounds = formatRoundLimit();
    const roundSuffix =
      exportingPairings && round
        ? `_round_${round.roundNo}${totalRounds > 0 ? `of${totalRounds}` : ""}_pairings`
        : "_standings";
    const res = await ipcRenderer.invoke("tournament:exportCsv", {
      defaultPath: `${safe || "tournament"}${roundSuffix}.csv`,
      content: exportingPairings ? pairingsCsvRows() : csvRows()
    });
    if (!res?.ok) return msg(res?.error || "Export failed.", true);
    msg(exportingPairings ? "Round pairings exported." : "Standings exported.");
  }
  function addPlayerRecord(name, rating) {
    state.tournament.players.push({
      playerId: makeId("p"),
      name,
      rating,
      seed: state.tournament.players.length + 1,
      active: true,
      score: 0,
      hadBye: false
    });
  }
  async function importPlayers() {
    if (state.tournament.rounds.length) return msg("Cannot import players after round generation.", true);
    const res = await ipcRenderer.invoke("tournament:importPlayers");
    if (!res) return;
    if (!res.ok) return msg(res.error || "Import failed.", true);
    const existingNames = new Set(state.tournament.players.map((p) => p.name.toLowerCase()));
    const seenImported = new Set();
    let added = 0;
    let skippedDuplicates = 0;
    let skippedInvalid = 0;
    for (const item of res.players || []) {
      const name = safeName(item?.name || "", 64);
      if (!name) {
        skippedInvalid += 1;
        continue;
      }
      const lowered = name.toLowerCase();
      if (existingNames.has(lowered) || seenImported.has(lowered)) {
        skippedDuplicates += 1;
        continue;
      }
      const rawRating = String(item?.rating ?? "").trim();
      let rating = 0;
      if (rawRating) {
        const parsed = Number.parseInt(rawRating, 10);
        if (!Number.isFinite(parsed) || parsed < 0 || parsed > 5000) {
          skippedInvalid += 1;
          continue;
        }
        rating = parsed;
      }
      addPlayerRecord(name, rating);
      seenImported.add(lowered);
      added += 1;
    }
    state.tournament.players.sort(byRatingName);
    state.tournament.players.forEach((p, i) => (p.seed = i + 1));
    recomputeStandings();
    render();
    addAudit("import_players", `${added} imported`);
    msg(
      `Imported ${added} players.${skippedDuplicates ? ` Skipped ${skippedDuplicates} duplicates.` : ""}${skippedInvalid ? ` Skipped ${skippedInvalid} invalid rows.` : ""}`,
      added === 0
    );
  }
  function renderConfig() {
    if (el.name) el.name.value = state.tournament.name || "";
    if (el.format) el.format.value = state.tournament.format || "swiss_dutch";
    if (el.rounds) {
      el.rounds.value = String(state.tournament.totalRounds || 7);
      el.rounds.disabled = state.tournament.format !== "swiss_dutch";
    }
    if (el.override) {
      el.override.checked = !!state.tournament.arbiterOverrideEnabled;
      el.override.disabled = state.tournament.format === "rr" || state.tournament.format === "drr";
    }
    if (el.randomKo) {
      el.randomKo.checked = !!state.tournament.randomizeKo;
      el.randomKo.disabled = state.tournament.format !== "ko" || state.tournament.rounds.length > 0;
    }
    if (el.playerSearch && document.activeElement !== el.playerSearch) {
      el.playerSearch.value = state.playerSearchQuery || "";
    }
    if (el.pairingSearch && document.activeElement !== el.pairingSearch) {
      el.pairingSearch.value = state.pairingSearchQuery || "";
    }
    if (el.standingsSearch && document.activeElement !== el.standingsSearch) {
      el.standingsSearch.value = state.standingsSearchQuery || "";
    }
    if (el.displaySearch && document.activeElement !== el.displaySearch) {
      el.displaySearch.value = state.displaySearchQuery || "";
    }
  }
  function renderPlayers() {
    if (!el.playerList) return;
    el.playerList.innerHTML = "";
    const players = activePlayers().slice().sort(byRatingName);
    const query = String(state.playerSearchQuery || "").trim().toLowerCase();
    const canEditPlayers = state.tournament.rounds.length === 0;
    if (!players.length) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="4">No players</td>`;
      el.playerList.appendChild(tr);
      return;
    }
    players.forEach((p, idx) => {
      const tr = document.createElement("tr");
      tr.dataset.playerName = String(p.name || "").toLowerCase();
      if (canEditPlayers && state.editingPlayerId === p.playerId) {
        tr.innerHTML = `<td>${idx + 1}</td><td><input class="setup-select tournament-player-inline-name" data-edit-name="${p.playerId}" type="text" value="${String(p.name || "").replace(/"/g, "&quot;")}"></td><td><input class="setup-select tournament-player-inline-rating" data-edit-rating="${p.playerId}" type="number" min="0" max="5000" step="1" value="${Number(p.rating || 0)}"></td><td><div class="tournament-player-actions"><button class="mini-btn" data-save-player="${p.playerId}">Save</button><button class="mini-btn" data-cancel-player="${p.playerId}">Cancel</button></div></td>`;
      } else {
        tr.innerHTML = `<td>${idx + 1}</td><td>${p.name}</td><td>${Number(p.rating || 0)}</td><td><div class="tournament-player-actions"><button class="mini-btn" data-edit-player="${p.playerId}" ${canEditPlayers ? "" : "disabled"}>Edit</button><button class="mini-btn" data-del-player="${p.playerId}" ${canEditPlayers ? "" : "disabled"}>Del</button></div></td>`;
      }
      el.playerList.appendChild(tr);
    });
    if (!query) return;
    const rows = Array.from(el.playerList.querySelectorAll("tr"));
    const match =
      rows.find((row) => String(row.dataset.playerName || "").startsWith(query)) ||
      rows.find((row) => String(row.dataset.playerName || "").includes(query));
    if (!match) return;
    match.classList.add("tournament-search-match");
    match.scrollIntoView({ block: "nearest" });
  }
  function renderPairings() {
    if (!el.pairings || !el.roundLabel) return;
    el.pairings.innerHTML = "";
    const round = latestRound();
    const query = String(state.pairingSearchQuery || "").trim().toLowerCase();
    if (!round) {
      el.roundLabel.textContent = "Round: -";
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="4">No rounds yet.</td>`;
      el.pairings.appendChild(tr);
      return;
    }
    el.roundLabel.textContent = `${roundDisplayLabel(round)} (${round.status})`;
    const canOverridePairings =
      state.tournament.arbiterOverrideEnabled &&
      round.status === "generated" &&
      state.tournament.format !== "rr" &&
      state.tournament.format !== "drr";
    const editPair = canOverridePairings;
    const editRes = round.status === "generated";
    for (const p of round.pairings) {
      const tr = document.createElement("tr");
      const td0 = document.createElement("td");
      td0.textContent = String(p.boardNo);
      const td1 = document.createElement("td");
      const td2 = document.createElement("td");
      const td3 = document.createElement("td");
      const names = pairingDisplayNames(p);
      if (p.isBye) {
        if (editPair) {
          const byeSel = document.createElement("select");
          const players = activePlayers().slice().sort(byRatingName);
          players.forEach((pl) => {
            const opt = document.createElement("option");
            opt.value = pl.playerId;
            opt.textContent = pl.name;
            opt.selected = pl.playerId === p.whitePlayerId;
            byeSel.appendChild(opt);
          });
          byeSel.addEventListener("change", () => {
            p.whitePlayerId = byeSel.value;
            p.manualOverride = true;
          });
          td1.appendChild(byeSel);
          td2.textContent = "-";
        } else {
          td1.textContent = names.white;
          td2.textContent = "-";
        }
      } else {
        if (editPair) {
          const wSel = document.createElement("select");
          const bSel = document.createElement("select");
          const players = activePlayers().slice().sort(byRatingName);
          players.forEach((pl) => {
            const o1 = document.createElement("option");
            o1.value = pl.playerId;
            o1.textContent = pl.name;
            o1.selected = pl.playerId === p.whitePlayerId;
            wSel.appendChild(o1);
            const o2 = document.createElement("option");
            o2.value = pl.playerId;
            o2.textContent = pl.name;
            o2.selected = pl.playerId === p.blackPlayerId;
            bSel.appendChild(o2);
          });
          wSel.addEventListener("change", () => {
            p.whitePlayerId = wSel.value;
            p.manualOverride = true;
          });
          bSel.addEventListener("change", () => {
            p.blackPlayerId = bSel.value;
            p.manualOverride = true;
          });
          td1.appendChild(wSel);
          td2.appendChild(bSel);
        } else {
          td1.textContent = names.white;
          td2.textContent = names.black;
        }
      }
      tr.dataset.searchText = names.searchText;
      const rSel = document.createElement("select");
      const opts = ["pending", "1-0", "0-1", "1/2-1/2", "forfeit-w", "forfeit-b", "forfeit-both"];
      opts.forEach((it) => {
        if (state.tournament.format === "ko" && (it === "1/2-1/2" || it === "forfeit-both")) return;
        const o = document.createElement("option");
        o.value = it;
        o.textContent = it;
        o.selected = String(p.result || "pending") === it;
        rSel.appendChild(o);
      });
      rSel.disabled = p.isBye || !editRes;
      rSel.addEventListener("change", () => {
        p.result = rSel.value;
      });
      td3.appendChild(rSel);
      tr.append(td0, td1, td2, td3);
      el.pairings.appendChild(tr);
    }
    if (!query) return;
    const rows = Array.from(el.pairings.querySelectorAll("tr"));
    const match =
      rows.find((row) => String(row.dataset.searchText || "").startsWith(query)) ||
      rows.find((row) => String(row.dataset.searchText || "").includes(query));
    if (!match) return;
    match.classList.add("tournament-search-match");
    match.scrollIntoView({ block: "nearest" });
  }
  function renderStandings() {
    if (!el.standings) return;
    el.standings.innerHTML = "";
    const rows = state.tournament.standings || [];
    const query = String(state.standingsSearchQuery || "").trim().toLowerCase();
    if (!rows.length) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="7">No standings yet.</td>`;
      el.standings.appendChild(tr);
      return;
    }
    for (const row of rows) {
      const tr = document.createElement("tr");
      tr.dataset.playerName = String(row.name || "").toLowerCase();
      tr.innerHTML = `<td>${row.rank}</td><td>${row.name}</td><td>${Number(row.points || 0).toFixed(1)}</td><td>${Number(row.buchholz || 0).toFixed(1)}</td><td>${Number(row.medianBuchholz || 0).toFixed(1)}</td><td>${Number(row.sonnebornBerger || 0).toFixed(1)}</td><td>${Number(row.directEncounter || 0).toFixed(1)}</td>`;
      el.standings.appendChild(tr);
    }
    if (!query) return;
    const tableRows = Array.from(el.standings.querySelectorAll("tr"));
    const match =
      tableRows.find((row) => String(row.dataset.playerName || "").startsWith(query)) ||
      tableRows.find((row) => String(row.dataset.playerName || "").includes(query));
    if (!match) return;
    match.classList.add("tournament-search-match");
    match.scrollIntoView({ block: "nearest" });
  }
  function estimateDisplayRowsPerColumn() {
    if (!el.displayBody) return 12;
    const availableHeight = el.displayBody.clientHeight || 0;
    if (availableHeight <= 0) return 12;
    const probe = document.createElement("div");
    probe.className = "tournament-display-row";
    probe.innerHTML = `
      <div class="tournament-display-boardno">1</div>
      <div class="tournament-display-player">White Player Example</div>
      <div class="tournament-display-player">Black Player Example</div>
      <select class="tournament-display-result">
        <option>1-0</option>
      </select>
    `;
    probe.style.visibility = "hidden";
    probe.style.position = "absolute";
    probe.style.pointerEvents = "none";
    el.displayBody.appendChild(probe);
    const rowHeight = Math.max(40, probe.offsetHeight || 40) + 5;
    probe.remove();
    return Math.max(1, Math.floor(availableHeight / rowHeight));
  }
  function estimateDisplayColumnCount() {
    if (!el.displayBody) return 4;
    const availableWidth = el.displayBody.clientWidth || 0;
    if (availableWidth <= 0) return 4;
    const gap = 8;
    const minColumnWidth = 340;
    const estimated = Math.floor((availableWidth + gap) / (minColumnWidth + gap));
    return Math.max(1, Math.min(4, estimated));
  }
  function estimateStandingsDisplayRowsPerColumn() {
    if (!el.standingsDisplayBody) return 14;
    const availableHeight = el.standingsDisplayBody.clientHeight || 0;
    if (availableHeight <= 0) return 14;
    const probe = document.createElement("div");
    probe.className = "tournament-standings-display-row";
    probe.innerHTML = `
      <div class="tournament-standings-display-rank">1</div>
      <div class="tournament-standings-display-name">Sample Player Name 2450</div>
      <div class="tournament-standings-display-points">5.5</div>
    `;
    probe.style.visibility = "hidden";
    probe.style.position = "absolute";
    probe.style.pointerEvents = "none";
    el.standingsDisplayBody.appendChild(probe);
    const rowHeight = Math.max(38, probe.offsetHeight || 38) + 5;
    probe.remove();
    return Math.max(1, Math.floor(availableHeight / rowHeight));
  }
  function estimateStandingsDisplayColumnCount() {
    if (!el.standingsDisplayBody) return 4;
    const availableWidth = el.standingsDisplayBody.clientWidth || 0;
    if (availableWidth <= 0) return 4;
    const gap = 8;
    const minColumnWidth = 250;
    const estimated = Math.floor((availableWidth + gap) / (minColumnWidth + gap));
    return Math.max(1, Math.min(5, estimated));
  }
  function renderDisplayMode() {
    if (!el.displayColumns || !el.displayRoundLabel || !el.displayPageLabel || !el.btnDisplayPrev || !el.btnDisplayNext) return;
    el.displayColumns.innerHTML = "";
    const round = latestRound();
    if (!round) {
      el.displayRoundLabel.textContent = "Round -";
      el.displayPageLabel.textContent = "Page 0/0";
      el.btnDisplayPrev.disabled = true;
      el.btnDisplayNext.disabled = true;
      return;
    }
    const rowsPerColumn = estimateDisplayRowsPerColumn();
    const columnCount = estimateDisplayColumnCount();
    el.displayColumns.style.setProperty("--display-columns", String(columnCount));
    const pairings = Array.isArray(round.pairings) ? round.pairings : [];
    const perPage = Math.max(1, rowsPerColumn * columnCount);
    const totalPages = Math.max(1, Math.ceil(pairings.length / perPage));
    const query = String(state.displaySearchQuery || "").trim().toLowerCase();
    let highlightIndex = -1;
    if (query) {
      highlightIndex = pairings.findIndex((pairing) => pairingDisplayNames(pairing).searchText.startsWith(query));
      if (highlightIndex < 0) {
        highlightIndex = pairings.findIndex((pairing) => pairingDisplayNames(pairing).searchText.includes(query));
      }
      if (highlightIndex >= 0) {
        state.displayPageIndex = Math.floor(highlightIndex / perPage);
      }
    }
    state.displayPageIndex = Math.max(0, Math.min(state.displayPageIndex, totalPages - 1));
    el.displayRoundLabel.textContent = roundDisplayLabel(round);
    el.displayPageLabel.textContent = `Page ${state.displayPageIndex + 1}/${totalPages}`;
    el.btnDisplayPrev.disabled = state.displayPageIndex <= 0;
    el.btnDisplayNext.disabled = state.displayPageIndex >= totalPages - 1;
    const pageStart = state.displayPageIndex * perPage;
    const pageSlice = pairings.slice(pageStart, pageStart + perPage);
    const editRes = round.status === "generated";
    for (let col = 0; col < columnCount; col += 1) {
      const colStart = col * rowsPerColumn;
      const colSlice = pageSlice.slice(colStart, colStart + rowsPerColumn);
      if (!colSlice.length) break;
      const colEl = document.createElement("div");
      colEl.className = "tournament-display-column";
      colSlice.forEach((pairing, idx) => {
        const names = pairingDisplayNames(pairing);
        const absoluteIndex = pageStart + colStart + idx;
        const rowEl = document.createElement("div");
        rowEl.className = "tournament-display-row";
        if (absoluteIndex === highlightIndex) rowEl.classList.add("tournament-search-match");
        const boardNo = document.createElement("div");
        boardNo.className = "tournament-display-boardno";
        boardNo.textContent = String(pairing.boardNo);
        const whiteEl = document.createElement("div");
        whiteEl.className = "tournament-display-player";
        whiteEl.textContent = names.white;
        if (pairing.isBye) whiteEl.classList.add("tournament-display-player-bye");
        const blackEl = document.createElement("div");
        blackEl.className = "tournament-display-player";
        blackEl.textContent = names.black;
        if (pairing.isBye) blackEl.classList.add("tournament-display-player-bye");
        const resultSel = document.createElement("select");
        resultSel.className = "tournament-display-result";
        ["pending", "1-0", "0-1", "1/2-1/2", "forfeit-w", "forfeit-b", "forfeit-both"].forEach((it) => {
          if (state.tournament.format === "ko" && (it === "1/2-1/2" || it === "forfeit-both")) return;
          const option = document.createElement("option");
          option.value = it;
          option.textContent = it;
          option.selected = String(pairing.result || "pending") === it;
          resultSel.appendChild(option);
        });
        resultSel.disabled = pairing.isBye || !editRes;
        resultSel.addEventListener("change", () => {
          pairing.result = resultSel.value;
        });
        rowEl.append(boardNo, whiteEl, blackEl, resultSel);
        colEl.appendChild(rowEl);
      });
      el.displayColumns.appendChild(colEl);
    }
  }
  function renderStandingsDisplayMode() {
    if (!el.standingsDisplayColumns || !el.standingsDisplayPageLabel || !el.btnStandingsDisplayPrev || !el.btnStandingsDisplayNext) return;
    el.standingsDisplayColumns.innerHTML = "";
    const rows = Array.isArray(state.tournament.standings) ? state.tournament.standings : [];
    if (!rows.length) {
      el.standingsDisplayPageLabel.textContent = "Page 0/0";
      el.btnStandingsDisplayPrev.disabled = true;
      el.btnStandingsDisplayNext.disabled = true;
      return;
    }
    const rowsPerColumn = estimateStandingsDisplayRowsPerColumn();
    const columnCount = estimateStandingsDisplayColumnCount();
    el.standingsDisplayColumns.style.setProperty("--standings-display-columns", String(columnCount));
    const perPage = Math.max(1, rowsPerColumn * columnCount);
    const totalPages = Math.max(1, Math.ceil(rows.length / perPage));
    const query = String(state.standingsDisplaySearchQuery || "").trim().toLowerCase();
    let highlightIndex = -1;
    if (query) {
      highlightIndex = rows.findIndex((row) => String(row.name || "").toLowerCase().startsWith(query));
      if (highlightIndex < 0) {
        highlightIndex = rows.findIndex((row) => String(row.name || "").toLowerCase().includes(query));
      }
      if (highlightIndex >= 0) {
        state.standingsDisplayPageIndex = Math.floor(highlightIndex / perPage);
      }
    }
    state.standingsDisplayPageIndex = Math.max(0, Math.min(state.standingsDisplayPageIndex, totalPages - 1));
    el.standingsDisplayPageLabel.textContent = `Page ${state.standingsDisplayPageIndex + 1}/${totalPages}`;
    el.btnStandingsDisplayPrev.disabled = state.standingsDisplayPageIndex <= 0;
    el.btnStandingsDisplayNext.disabled = state.standingsDisplayPageIndex >= totalPages - 1;
    const pageStart = state.standingsDisplayPageIndex * perPage;
    const pageSlice = rows.slice(pageStart, pageStart + perPage);
    for (let col = 0; col < columnCount; col += 1) {
      const colStart = col * rowsPerColumn;
      const colSlice = pageSlice.slice(colStart, colStart + rowsPerColumn);
      if (!colSlice.length) break;
      const colEl = document.createElement("div");
      colEl.className = "tournament-standings-display-column";
      colSlice.forEach((row, idx) => {
        const absoluteIndex = pageStart + colStart + idx;
        const rowEl = document.createElement("div");
        rowEl.className = "tournament-standings-display-row";
        if (absoluteIndex === highlightIndex) rowEl.classList.add("tournament-search-match");
        const rankEl = document.createElement("div");
        rankEl.className = "tournament-standings-display-rank";
        rankEl.textContent = String(row.rank ?? "-");
        const nameEl = document.createElement("div");
        nameEl.className = "tournament-standings-display-name";
        nameEl.textContent = String(row.name || "");
        const ptsEl = document.createElement("div");
        ptsEl.className = "tournament-standings-display-points";
        ptsEl.textContent = Number(row.points || 0).toFixed(1);
        rowEl.append(rankEl, nameEl, ptsEl);
        colEl.appendChild(rowEl);
      });
      el.standingsDisplayColumns.appendChild(colEl);
    }
  }
  function renderView() {
    if (el.entryView) el.entryView.classList.toggle("hidden", state.view !== "entry");
    if (el.setupView) el.setupView.classList.toggle("hidden", state.view !== "setup");
    if (el.liveView) el.liveView.classList.toggle("hidden", state.view !== "live");
    if (el.standingsView) el.standingsView.classList.toggle("hidden", state.view !== "standings");
    if (el.displayView) el.displayView.classList.toggle("hidden", state.view !== "display");
    if (el.standingsDisplayView) el.standingsDisplayView.classList.toggle("hidden", state.view !== "standingsDisplay");
    if (el.status) {
      el.status.classList.toggle("hidden", state.view === "entry" || state.view === "display" || state.view === "standingsDisplay" || !String(el.status.textContent || "").trim());
    }
    if (el.back) {
      el.back.textContent = "Back";
      el.back.classList.toggle("hidden", state.view === "display" || state.view === "standingsDisplay");
    }
    if (el.header) el.header.classList.toggle("hidden", state.view === "display" || state.view === "standingsDisplay");
    if (el.layout) el.layout.classList.toggle("tournament-display-mode", state.view === "display" || state.view === "standingsDisplay");
    if (tournamentScreenEl) tournamentScreenEl.classList.toggle("tournament-display-active", state.view === "display" || state.view === "standingsDisplay");
    if (document.body) document.body.classList.toggle("tournament-display-active", state.view === "display" || state.view === "standingsDisplay");
    if (el.page) el.page.classList.toggle("tournament-display-active", state.view === "display" || state.view === "standingsDisplay");
    if (el.btnExportCsv) {
      el.btnExportCsv.classList.toggle("hidden", state.view !== "live" && state.view !== "standings");
      el.btnExportCsv.disabled = state.tournament.status === "draft";
    }
    const isFinished = state.tournament.status === "finished";
    if (el.btnGenerate) el.btnGenerate.disabled = isFinished;
    if (el.btnFinalize) el.btnFinalize.disabled = isFinished;
    if (el.btnUndo) el.btnUndo.disabled = state.undoStack.length === 0;
    if (el.btnDisplay) el.btnDisplay.disabled = !latestRound();
    if (el.override) {
      el.override.disabled =
        state.tournament.format === "rr" || state.tournament.format === "drr";
    }
  }
  function render() {
    renderView();
    renderConfig();
    renderPlayers();
    renderPairings();
    renderStandings();
    renderDisplayMode();
    renderStandingsDisplayMode();
  }
  function showScreen() {
    closeHomeProfileMenu();
    closeHomeOnlinePanels();
    if (homeProfileEl) homeProfileEl.classList.add("hidden");
    if (homeScreenEl) homeScreenEl.classList.add("hidden");
    if (toolsScreenEl) toolsScreenEl.classList.add("hidden");
    if (chess960ScreenEl) chess960ScreenEl.classList.add("hidden");
    if (gameScreenEl) gameScreenEl.classList.add("hidden");
    if (tournamentScreenEl) tournamentScreenEl.classList.remove("hidden");
    updateHomeOnlineToolbarVisibility();
    state.view = "entry";
    recomputeStandings();
    render();
  }
  function backToTools() {
    closeHomeProfileMenu();
    closeHomeOnlinePanels();
    if (homeProfileEl) homeProfileEl.classList.add("hidden");
    if (homeScreenEl) homeScreenEl.classList.add("hidden");
    if (toolsScreenEl) toolsScreenEl.classList.remove("hidden");
    if (chess960ScreenEl) chess960ScreenEl.classList.add("hidden");
    if (gameScreenEl) gameScreenEl.classList.add("hidden");
    if (tournamentScreenEl) tournamentScreenEl.classList.add("hidden");
    updateHomeOnlineToolbarVisibility();
  }
  function wire() {
    if (el.back) {
      el.back.addEventListener("click", () => {
        if (state.view === "display") {
          state.view = "live";
          render();
          return;
        }
        if (state.view === "standingsDisplay") {
          state.view = "standings";
          render();
          return;
        }
        if (state.view === "standings") {
          state.view = "live";
          render();
          return;
        }
        if (state.view === "live") {
          state.view = "setup";
          render();
          return;
        }
        if (state.view === "setup") {
          state.view = "entry";
          render();
          return;
        }
        backToTools();
      });
    }
    if (el.btnEntryNew) {
      el.btnEntryNew.addEventListener("click", () => {
        state.tournament = emptyTournament();
        state.view = "setup";
        state.undoStack = [];
        recomputeStandings();
        render();
        msg("Created new tournament.");
      });
    }
    if (el.btnEntryLoad) {
      el.btnEntryLoad.addEventListener("click", () => {
        loadTournament().catch((e) => msg(String(e), true));
      });
    }
    if (el.btnStart) {
      el.btnStart.addEventListener("click", () => {
        if (activePlayers().length < 2) return msg("Add at least 2 players before starting.", true);
        state.view = "live";
        if (state.tournament.status === "draft") state.tournament.status = "active";
        render();
        msg("Tournament started.");
      });
    }
    if (el.btnAddPlayer) {
      el.btnAddPlayer.addEventListener("click", () => {
        const name = safeName(el.pName?.value || "", 64);
        if (!name) return msg("Enter player name.", true);
        if (state.tournament.rounds.length) return msg("Cannot add players after round generation.", true);
        if (state.tournament.players.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
          return msg("Duplicate player name.", true);
        }
        const rawRating = String(el.pRating?.value ?? "").trim();
        let rating = 0;
        if (rawRating) {
          const parsed = Number.parseInt(rawRating, 10);
          if (!Number.isFinite(parsed) || parsed < 0 || parsed > 5000) {
            return msg("Rating must be between 0-5000.", true);
          }
          rating = parsed;
        }
        addPlayerRecord(name, rating);
        state.tournament.players.sort(byRatingName);
        state.tournament.players.forEach((p, i) => (p.seed = i + 1));
        addAudit("add_player", name);
        if (el.pName) el.pName.value = "";
        if (el.pRating) el.pRating.value = "";
        recomputeStandings();
        render();
        msg(`Added ${name}.`);
      });
    }
    if (el.btnImportPlayers) {
      el.btnImportPlayers.addEventListener("click", () => {
        importPlayers().catch((e) => msg(String(e), true));
      });
    }
    if (el.playerList) {
      el.playerList.addEventListener("click", (event) => {
        const editBtn = event.target.closest("[data-edit-player]");
        if (editBtn) {
          if (state.tournament.rounds.length) return msg("Cannot edit players after round generation.", true);
          state.editingPlayerId = editBtn.getAttribute("data-edit-player") || "";
          renderPlayers();
          return;
        }
        const cancelBtn = event.target.closest("[data-cancel-player]");
        if (cancelBtn) {
          state.editingPlayerId = "";
          renderPlayers();
          return;
        }
        const saveBtn = event.target.closest("[data-save-player]");
        if (saveBtn) {
          if (state.tournament.rounds.length) return msg("Cannot edit players after round generation.", true);
          const id = saveBtn.getAttribute("data-save-player");
          const player = state.tournament.players.find((p) => p.playerId === id);
          if (!player) return;
          const row = saveBtn.closest("tr");
          const nameInput = row?.querySelector(`[data-edit-name="${id}"]`);
          const ratingInput = row?.querySelector(`[data-edit-rating="${id}"]`);
          const name = safeName(nameInput?.value || "", 64);
          if (!name) return msg("Enter player name.", true);
          if (state.tournament.players.some((p) => p.playerId !== id && p.name.toLowerCase() === name.toLowerCase())) {
            return msg("Duplicate player name.", true);
          }
          const rawRating = String(ratingInput?.value ?? "").trim();
          let rating = 0;
          if (rawRating) {
            const parsed = Number.parseInt(rawRating, 10);
            if (!Number.isFinite(parsed) || parsed < 0 || parsed > 5000) {
              return msg("Rating must be between 0-5000.", true);
            }
            rating = parsed;
          }
          const beforeName = player.name;
          player.name = name;
          player.rating = rating;
          state.tournament.players.sort(byRatingName);
          state.tournament.players.forEach((pl, i) => (pl.seed = i + 1));
          state.editingPlayerId = "";
          addAudit("edit_player", `${beforeName} -> ${name}`);
          recomputeStandings();
          render();
          msg(`Updated ${name}.`);
          return;
        }
        const btn = event.target.closest("[data-del-player]");
        if (!btn) return;
        if (state.tournament.rounds.length) return msg("Cannot remove players after round generation.", true);
        const id = btn.getAttribute("data-del-player");
        const idx = state.tournament.players.findIndex((p) => p.playerId === id);
        if (idx < 0) return;
        const removed = state.tournament.players.splice(idx, 1)[0];
        if (state.editingPlayerId === id) state.editingPlayerId = "";
        addAudit("remove_player", removed?.name || id);
        recomputeStandings();
        render();
        msg(`Removed ${removed?.name || "player"}.`);
      });
    }
    if (el.playerSearch) {
      el.playerSearch.addEventListener("input", () => {
        state.playerSearchQuery = String(el.playerSearch.value || "");
        renderPlayers();
      });
    }
    if (el.pairingSearch) {
      el.pairingSearch.addEventListener("input", () => {
        state.pairingSearchQuery = String(el.pairingSearch.value || "");
        renderPairings();
      });
    }
    if (el.standingsSearch) {
      el.standingsSearch.addEventListener("input", () => {
        state.standingsSearchQuery = String(el.standingsSearch.value || "");
        renderStandings();
      });
    }
    if (el.standingsDisplaySearch) {
      el.standingsDisplaySearch.addEventListener("input", () => {
        state.standingsDisplaySearchQuery = String(el.standingsDisplaySearch.value || "");
        renderStandingsDisplayMode();
      });
    }
    if (el.displaySearch) {
      el.displaySearch.addEventListener("input", () => {
        state.displaySearchQuery = String(el.displaySearch.value || "");
        renderDisplayMode();
      });
    }
    if (el.name) el.name.addEventListener("input", () => (state.tournament.name = safeName(el.name.value)));
    if (el.format) {
      el.format.addEventListener("change", () => {
        if (state.tournament.rounds.length) {
          el.format.value = state.tournament.format;
          return msg("Cannot change format after rounds start.", true);
        }
        state.tournament.format = el.format.value;
        renderConfig();
      });
    }
    if (el.rounds) el.rounds.addEventListener("change", () => (state.tournament.totalRounds = clampInt(el.rounds.value, 1, 30, 7)));
    if (el.override) {
      el.override.addEventListener("change", () => {
        state.tournament.arbiterOverrideEnabled =
          (state.tournament.format !== "rr" && state.tournament.format !== "drr")
            ? !!el.override.checked
            : false;
        render();
      });
    }
    if (el.randomKo) el.randomKo.addEventListener("change", () => (state.tournament.randomizeKo = !!el.randomKo.checked));
    if (el.btnGenerate) el.btnGenerate.addEventListener("click", advanceRound);
    if (el.btnUndo) el.btnUndo.addEventListener("click", undoLastAction);
    if (el.btnDisplay) el.btnDisplay.addEventListener("click", () => {
      if (!latestRound()) return;
      state.displayPageIndex = 0;
      state.view = "display";
      render();
    });
    if (el.btnStandings) el.btnStandings.addEventListener("click", () => {
      state.view = "standings";
      render();
    });
    if (el.btnStandingsDisplay) el.btnStandingsDisplay.addEventListener("click", () => {
      state.standingsDisplayPageIndex = 0;
      state.view = "standingsDisplay";
      render();
    });
    if (el.btnFinalize) el.btnFinalize.addEventListener("click", finalizeTournament);
    if (el.btnDisplayPrev) el.btnDisplayPrev.addEventListener("click", () => {
      state.displayPageIndex = Math.max(0, state.displayPageIndex - 1);
      renderDisplayMode();
    });
    if (el.btnDisplayNext) el.btnDisplayNext.addEventListener("click", () => {
      state.displayPageIndex += 1;
      renderDisplayMode();
    });
    if (el.btnDisplayExit) el.btnDisplayExit.addEventListener("click", () => {
      state.view = "live";
      render();
    });
    if (el.btnStandingsDisplayPrev) el.btnStandingsDisplayPrev.addEventListener("click", () => {
      state.standingsDisplayPageIndex = Math.max(0, state.standingsDisplayPageIndex - 1);
      renderStandingsDisplayMode();
    });
    if (el.btnStandingsDisplayNext) el.btnStandingsDisplayNext.addEventListener("click", () => {
      state.standingsDisplayPageIndex += 1;
      renderStandingsDisplayMode();
    });
    if (el.btnStandingsDisplayExit) el.btnStandingsDisplayExit.addEventListener("click", () => {
      state.view = "standings";
      render();
    });
    if (el.btnSave) el.btnSave.addEventListener("click", () => saveTournament().catch((e) => msg(String(e), true)));
    if (el.btnExportCsv) el.btnExportCsv.addEventListener("click", () => exportCsv().catch((e) => msg(String(e), true)));
    window.addEventListener("resize", () => {
      if (state.view === "display") renderDisplayMode();
      if (state.view === "standingsDisplay") renderStandingsDisplayMode();
    });
  }
  wire();
  recomputeStandings();
  render();
  return { showScreen, backToTools, onThemeChange() {} };
}

module.exports = { createTournamentModule };


