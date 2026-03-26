const { DEFAULT_PUZZLE_FILTERS } = require("./constants");

function createPuzzleState() {
  return {
    filters: { ...DEFAULT_PUZZLE_FILTERS },
    availableThemes: [],
    availableOpenings: [],
    suggestedThemes: [],
    suggestedOpenings: [],
    datasetCount: 0,
    queue: [],
    queueCursor: 0,
    currentPuzzle: null,
    currentPuzzleStartFen: "",
    currentPuzzleUserColor: "w",
    progressIndex: 0,
    active: false,
    pendingReply: false,
    pendingNext: false,
    status: "idle",
    message: "",
    setupMessage: "",
    setupBusy: false,
    shownHintUci: "",
    autoReplyTimerId: null,
    nextPuzzleTimerId: null
  };
}

module.exports = { createPuzzleState };
