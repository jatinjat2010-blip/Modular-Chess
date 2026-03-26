const { DEFAULT_PUZZLE_FILTERS } = require("./constants");

function clampNumber(value, fallback, min, max) {
  const next = Number(value);
  if (!Number.isFinite(next)) return fallback;
  return Math.max(min, Math.min(max, next));
}

function shuffle(values) {
  const out = Array.isArray(values) ? values.slice() : [];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function moveInputToUci(moveInput) {
  return `${String(moveInput?.from || "")}${String(moveInput?.to || "")}${String(moveInput?.promotion || "").toLowerCase()}`;
}

function sanitizeFilters(nextFilters) {
  return {
    ratingMin: clampNumber(nextFilters?.ratingMin, DEFAULT_PUZZLE_FILTERS.ratingMin, 0, 4000),
    ratingMax: clampNumber(nextFilters?.ratingMax, DEFAULT_PUZZLE_FILTERS.ratingMax, 0, 4000),
    popularityMin: clampNumber(nextFilters?.popularityMin, DEFAULT_PUZZLE_FILTERS.popularityMin, 0, 100),
    popularityMax: clampNumber(nextFilters?.popularityMax, DEFAULT_PUZZLE_FILTERS.popularityMax, 0, 100),
    playsMin: clampNumber(nextFilters?.playsMin, DEFAULT_PUZZLE_FILTERS.playsMin, 0, 10000000),
    playsMax: clampNumber(nextFilters?.playsMax, DEFAULT_PUZZLE_FILTERS.playsMax, 0, 10000000),
    ratingDeviationMax: clampNumber(
      nextFilters?.ratingDeviationMax,
      DEFAULT_PUZZLE_FILTERS.ratingDeviationMax,
      1,
      1000
    ),
    color: nextFilters?.color === "w" || nextFilters?.color === "b" ? nextFilters.color : "any",
    themesText: String(nextFilters?.themesText || "").trim(),
    openingsText: String(nextFilters?.openingsText || "").trim(),
    hintsEnabled: !!nextFilters?.hintsEnabled,
    autoNext: nextFilters?.autoNext !== false
  };
}

function getExpectedMove(state) {
  if (!state?.currentPuzzle || !Array.isArray(state.currentPuzzle.moves)) return "";
  return String(state.currentPuzzle.moves[state.progressIndex] || "");
}

function getHintMove(state) {
  return getExpectedMove(state);
}

function createPuzzleLogic() {
  function resetSession(state) {
    if (!state) return;
    state.queue = [];
    state.queueCursor = 0;
    state.currentPuzzle = null;
    state.progressIndex = 0;
    state.active = false;
    state.pendingReply = false;
    state.pendingNext = false;
    state.status = "idle";
    state.message = "";
    state.shownHintUci = "";
  }

  function applyFilterPatch(state, patch) {
    state.filters = sanitizeFilters({
      ...state.filters,
      ...patch
    });
  }

  function assignQueue(state, puzzles) {
    state.queue = shuffle(puzzles);
    state.queueCursor = 0;
  }

  function nextPuzzleFromQueue(state) {
    if (!Array.isArray(state.queue) || state.queue.length === 0) return null;
    const puzzle = state.queue[state.queueCursor % state.queue.length] || null;
    state.queueCursor = (state.queueCursor + 1) % state.queue.length;
    return puzzle;
  }

  return {
    applyFilterPatch,
    assignQueue,
    getExpectedMove,
    getHintMove,
    moveInputToUci,
    nextPuzzleFromQueue,
    resetSession,
    sanitizeFilters
  };
}

module.exports = { createPuzzleLogic };
