const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");
const { PUZZLE_APP_MODES } = require("./constants");
const { createPuzzleState } = require("./state");
const { createPuzzleDataService } = require("./data");
const { createPuzzleLogic } = require("./logic");
const { createPuzzleView } = require("./view");

function createPuzzleModule({
  Chess,
  homeProfileEl,
  homeScreenEl,
  toolsScreenEl,
  puzzleScreenEl,
  puzzleRootEl,
  chess960ScreenEl,
  tournamentScreenEl,
  visionScreenEl,
  gameScreenEl,
  closeHomeProfileMenu,
  closeHomeOnlinePanels,
  updateHomeOnlineToolbarVisibility,
  setAppMode,
  showAppMessage,
  showGameScreen,
  render,
  resetStandaloneGame,
  openAnalysisForFen,
  applySystemMove,
  setBoardHintArrow,
  clearBoardHintArrow
}) {
  const state = createPuzzleState();
  const data = createPuzzleDataService({ Chess });
  const logic = createPuzzleLogic();
  const view = createPuzzleView({
    state,
    elements: { puzzleRootEl }
  });
  const generatedPackPath = path.join(__dirname, "data", "puzzlePack.generated.json");
  const refreshScriptPath = path.join(__dirname, "scripts", "refresh_pack.py");
  let datasetLoadedOnce = false;

  function syncDatasetState() {
    const meta = data.getDatasetMeta();
    state.availableThemes = data.getAvailableThemes();
    state.availableOpenings = data.getAvailableOpenings();
    state.datasetCount = Number(meta.count || 0);
  }

  function pickRandomSuggestions(values, count = 10) {
    const list = (Array.isArray(values) ? values : []).filter((value) => String(value || "").trim().length > 0 && String(value).trim().length < 25);
    for (let i = list.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list.slice(0, Math.min(count, list.length)).sort((a, b) => a.localeCompare(b));
  }

  function refreshSuggestions() {
    state.suggestedThemes = pickRandomSuggestions(state.availableThemes, 10);
    state.suggestedOpenings = pickRandomSuggestions(state.availableOpenings, 10);
  }

  function loadGeneratedPackFromDisk() {
    let loaded = false;
    if (fs.existsSync(generatedPackPath)) {
      try {
        const payload = JSON.parse(fs.readFileSync(generatedPackPath, "utf8"));
        const count = data.replaceDataset(payload?.puzzles || []);
        loaded = count > 0;
      } catch (_) {
        loaded = false;
      }
    }
    if (!loaded) {
      data.replaceDataset([]);
    }
    syncDatasetState();
    refreshSuggestions();
    datasetLoadedOnce = true;
    return loaded;
  }

  function ensureDatasetLoaded() {
    if (datasetLoadedOnce) return;
    loadGeneratedPackFromDisk();
  }

  function runPythonRefresh(limit = 1000) {
    const attempts = [
      { command: "python", args: [refreshScriptPath, "--output", generatedPackPath, "--limit", String(limit)] },
      { command: "py", args: ["-3", refreshScriptPath, "--output", generatedPackPath, "--limit", String(limit)] }
    ];

    return new Promise((resolve, reject) => {
      let index = 0;
      function tryNext(lastError) {
        if (index >= attempts.length) {
          reject(lastError || new Error("Python was not found."));
          return;
        }
        const attempt = attempts[index];
        index += 1;
        execFile(attempt.command, attempt.args, { windowsHide: true }, (error, stdout, stderr) => {
          if (error) {
            tryNext(new Error(String(stderr || error.message || error)));
            return;
          }
          resolve({ stdout, stderr });
        });
      }
      tryNext(null);
    });
  }

  async function refreshGeneratedPack() {
    state.setupBusy = true;
    state.setupMessage = "Refreshing 1K puzzles from Lichess...";
    renderSetup();
    try {
      await runPythonRefresh(1000);
      loadGeneratedPackFromDisk();
      state.setupMessage = `Refreshed ${state.datasetCount} puzzles from the Lichess dump.`;
      showAppMessage(`Puzzle pack refreshed: ${state.datasetCount} puzzles.`);
    } catch (err) {
      loadGeneratedPackFromDisk();
      state.setupMessage = `Refresh failed: ${String(err?.message || err)}`;
      showAppMessage(state.setupMessage);
    } finally {
      state.setupBusy = false;
      renderSetup();
    }
  }

  function clearTimers() {
    if (state.autoReplyTimerId !== null) {
      window.clearTimeout(state.autoReplyTimerId);
      state.autoReplyTimerId = null;
    }
    if (state.nextPuzzleTimerId !== null) {
      window.clearTimeout(state.nextPuzzleTimerId);
      state.nextPuzzleTimerId = null;
    }
  }

  function clearHint() {
    state.shownHintUci = "";
    clearBoardHintArrow();
  }

  function showScreen() {
    closeHomeProfileMenu();
    if (homeProfileEl) homeProfileEl.classList.add("hidden");
    closeHomeOnlinePanels();
    if (homeScreenEl) homeScreenEl.classList.add("hidden");
    if (toolsScreenEl) toolsScreenEl.classList.add("hidden");
    if (puzzleScreenEl) puzzleScreenEl.classList.remove("hidden");
    if (chess960ScreenEl) chess960ScreenEl.classList.add("hidden");
    if (tournamentScreenEl) tournamentScreenEl.classList.add("hidden");
    if (visionScreenEl) visionScreenEl.classList.add("hidden");
    if (gameScreenEl) gameScreenEl.classList.add("hidden");
    updateHomeOnlineToolbarVisibility();
  }

  function renderSetup() {
    const matchCount = data.getMatchingPuzzles(state.filters).length;
    view.renderSetup(matchCount);
  }

  function backToTools() {
    clearTimers();
    clearHint();
    logic.resetSession(state);
    if (homeProfileEl) homeProfileEl.classList.add("hidden");
    if (puzzleScreenEl) puzzleScreenEl.classList.add("hidden");
    if (toolsScreenEl) toolsScreenEl.classList.remove("hidden");
    setAppMode("play");
    updateHomeOnlineToolbarVisibility();
  }

  function openSetup() {
    clearTimers();
    clearHint();
    logic.resetSession(state);
    state.setupMessage = "";
    ensureDatasetLoaded();
    showScreen();
    setAppMode(PUZZLE_APP_MODES.SETUP);
    renderSetup();
  }

  function loadPuzzle(puzzle) {
    if (!puzzle) return false;
    clearTimers();
    clearHint();
    const openingMove = Array.isArray(puzzle.moves) ? String(puzzle.moves[0] || "") : "";
    const prepGame = new Chess();
    try {
      prepGame.load(puzzle.fen);
    } catch (_) {
      return false;
    }
    if (openingMove.length >= 4) {
      const applied = prepGame.move({
        from: openingMove.slice(0, 2),
        to: openingMove.slice(2, 4),
        promotion: openingMove.slice(4) || undefined
      });
      if (!applied) return false;
    }
    const presentedFen = prepGame.fen();
    const userColor = prepGame.turn() === "b" ? "b" : "w";
    state.currentPuzzle = puzzle;
    state.currentPuzzleStartFen = presentedFen;
    state.currentPuzzleUserColor = userColor;
    state.progressIndex = 0;
    state.active = true;
    state.pendingReply = !!openingMove;
    state.pendingNext = false;
    state.status = "active";
    state.message = openingMove ? "Puzzle is starting..." : "Find the best move.";
    showGameScreen();
    setAppMode(PUZZLE_APP_MODES.PLAY);
    resetStandaloneGame(puzzle.fen, { boardFlipped: userColor === "b" });
    if (openingMove) {
      state.autoReplyTimerId = window.setTimeout(() => {
        state.autoReplyTimerId = null;
        applySystemMove({
          from: openingMove.slice(0, 2),
          to: openingMove.slice(2, 4),
          promotion: openingMove.slice(4) || undefined
        });
      }, 420);
    }
    render();
    return true;
  }

  function loadNextPuzzle() {
    const puzzle = logic.nextPuzzleFromQueue(state);
    if (!puzzle) {
      state.setupMessage = "No matching puzzles were found for these filters.";
      openSetup();
      return;
    }
    loadPuzzle(puzzle);
  }

  function startSession() {
    const matches = data.getMatchingPuzzles(state.filters);
    if (!matches.length) {
      state.setupMessage = "No matching puzzles found. Adjust the filters and try again.";
      renderSetup();
      return;
    }
    state.setupMessage = "";
    logic.assignQueue(state, matches);
    loadNextPuzzle();
    showAppMessage(`Puzzle session started with ${matches.length} matching puzzle${matches.length === 1 ? "" : "s"}.`);
  }

  function exitSession() {
    clearTimers();
    clearHint();
    logic.resetSession(state);
    state.setupMessage = "";
    showScreen();
    setAppMode(PUZZLE_APP_MODES.SETUP);
    renderSetup();
  }

  function getMoveRejectionMessage(moveInput) {
    if (!state.active || state.status !== "active") return "";
    if (state.pendingReply || state.pendingNext) {
      return "Wait for the puzzle to continue.";
    }
    return "";
  }

  function applyPuzzleResult(status, messageBase) {
    clearHint();
    state.pendingReply = false;
    state.status = status;
    if (state.filters.autoNext) {
      state.pendingNext = true;
      state.message = `${messageBase} Loading the next puzzle...`;
    } else {
      state.pendingNext = false;
      state.message = `${messageBase}`;
    }
    render();
    if (state.filters.autoNext) {
      state.nextPuzzleTimerId = window.setTimeout(() => {
        state.nextPuzzleTimerId = null;
        state.pendingNext = false;
        loadNextPuzzle();
      }, 1000);
    }
  }

  function scheduleAutoReply() {
    const replyUci = logic.getExpectedMove(state);
    if (!replyUci) {
      completePuzzle();
      return;
    }
    state.pendingReply = true;
    state.message = "Puzzle reply incoming...";
    render();
    state.autoReplyTimerId = window.setTimeout(() => {
      state.autoReplyTimerId = null;
      applySystemMove({
        from: replyUci.slice(0, 2),
        to: replyUci.slice(2, 4),
        promotion: replyUci.slice(4) || undefined
      });
    }, 420);
  }

  function completePuzzle() {
    applyPuzzleResult(
      "solved",
      state.filters.autoNext ? "Solved." : "Solved. Choose next puzzle or analyze this position."
    );
  }

  function onMoveApplied(_move, options = {}) {
    if (!state.active || !state.currentPuzzle) return;
    clearHint();
    state.progressIndex += 1;
    if (state.progressIndex >= state.currentPuzzle.moves.length) {
      completePuzzle();
      return;
    }
    if (options.system) {
      state.pendingReply = false;
      state.message = "Find the best move.";
      render();
      return;
    }
    scheduleAutoReply();
  }

  function isUsersTurn() {
    return state.active && state.status === "active" && !state.pendingReply && !state.pendingNext;
  }

  function isInteractionLocked() {
    return state.active && (state.pendingReply || state.pendingNext);
  }

  function getInfoMessage() {
    if (!state.active) return null;
    if (state.pendingReply) return "Puzzle is playing the expected reply.";
    if (state.pendingNext) return state.message || "Loading next puzzle...";
    return state.message || "Find the best move.";
  }

  function isHintVisible() {
    return state.active && !!state.filters.hintsEnabled;
  }

  function isNextVisible() {
    return state.active && !state.filters.autoNext && state.status === "solved" && !state.pendingNext;
  }

  function isAnalyzeVisible() {
    return state.active && !state.filters.autoNext && state.status === "solved" && !state.pendingNext;
  }

  function isHintDisabled() {
    return !isHintVisible() || !isUsersTurn() || !logic.getHintMove(state);
  }

  function isAnalyzeDisabled() {
    return !state.currentPuzzle;
  }

  function showHint() {
    if (isHintDisabled()) return;
    const hintUci = logic.getHintMove(state);
    if (!hintUci) return;
    state.shownHintUci = hintUci;
    setBoardHintArrow(hintUci);
    render();
  }

  function goToNextPuzzle() {
    if (!isNextVisible()) return;
    loadNextPuzzle();
  }

  function analyzeCurrentPuzzle() {
    if (!state.currentPuzzleStartFen) return;
    clearTimers();
    clearHint();
    openAnalysisForFen(state.currentPuzzleStartFen, "Puzzle loaded into analysis.");
  }

  function getState() {
    return state;
  }

  function bindSetupEvents() {
    if (!puzzleRootEl || puzzleRootEl.dataset.bound === "1") return;
    puzzleRootEl.dataset.bound = "1";
    puzzleRootEl.addEventListener("change", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const patch = {};
      switch (target.id) {
        case "puzzle-rating-min":
          patch.ratingMin = target.value;
          break;
        case "puzzle-rating-max":
          patch.ratingMax = target.value;
          break;
        case "puzzle-popularity-min":
          patch.popularityMin = target.value;
          break;
        case "puzzle-popularity-max":
          patch.popularityMax = target.value;
          break;
        case "puzzle-plays-min":
          patch.playsMin = target.value;
          break;
        case "puzzle-plays-max":
          patch.playsMax = target.value;
          break;
        case "puzzle-rating-deviation-max":
          patch.ratingDeviationMax = target.value;
          break;
        case "puzzle-color":
          patch.color = target.value;
          break;
        case "puzzle-themes-text":
          patch.themesText = target.value;
          break;
        case "puzzle-openings-text":
          patch.openingsText = target.value;
          break;
        case "puzzle-hints-enabled":
          patch.hintsEnabled = !!target.checked;
          break;
        case "puzzle-auto-next":
          patch.autoNext = !!target.checked;
          break;
        default:
          return;
      }
      logic.applyFilterPatch(state, patch);
      state.setupMessage = "";
      renderSetup();
    });
    puzzleRootEl.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const button = target.closest("button");
      if (!button) return;
      if (button.id === "btn-puzzle-start") {
        startSession();
      } else if (button.id === "btn-puzzle-refresh") {
        refreshGeneratedPack();
      } else if (button.matches(".puzzle-tag-button")) {
        const value = String(button.dataset.tagValue || "").trim();
        const kind = String(button.dataset.tagKind || "");
        if (!value || !kind) return;
        const field = kind === "opening" ? "openingsText" : "themesText";
        const current = String(state.filters[field] || "")
          .split(",")
          .map((token) => token.trim())
          .filter(Boolean);
        const lower = current.map((token) => token.toLowerCase());
        const valueLower = value.toLowerCase();
        const next = lower.includes(valueLower)
          ? current.filter((token) => token.toLowerCase() !== valueLower)
          : current.concat(value);
        logic.applyFilterPatch(state, {
          [field]: next.join(", ")
        });
        state.setupMessage = "";
        renderSetup();
      }
    });
  }

  bindSetupEvents();

  return {
    backToTools,
    exitSession,
    getExpectedMoveUci: () => logic.getExpectedMove(state),
    getInfoMessage,
    getMoveRejectionMessage,
    getState,
    goToNextPuzzle,
    isHintDisabled,
    isHintVisible,
    isNextVisible,
    isAnalyzeVisible,
    isAnalyzeDisabled,
    isInteractionLocked,
    isUsersTurn,
    onMoveApplied,
    analyzeCurrentPuzzle,
    openSetup,
    showHint,
    showScreen
  };
}

module.exports = { createPuzzleModule };
