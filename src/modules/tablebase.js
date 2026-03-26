const { createEditorSharedHelpers } = require("./editorShared");

function createTablebaseModule({
  Chess,
  state,
  files,
  pieceAssetPath,
  render,
  showAppMessage,
  stopCurrentEngineSearch,
  clearAnalysisState,
  clearSelection,
  clearPremove,
  closePromotionMenu,
  clearBoardAnnotations,
  setAppMode,
  showGameScreen,
  showToolsScreen,
  startEditorPaletteDrag,
  resetTablebaseSessionState,
  startTablebaseSession,
  editorPieceGridEl,
  editorEraseBtnEl,
  editorFlipBtnEl,
  editorClearBtnEl,
  editorStartposBtnEl,
  editorHomeBtnEl,
  editorTurnWBtnEl,
  editorTurnBBtnEl,
  editorCastleKEl,
  editorCastleQEl,
  editorCastlekEl,
  editorCastleqEl,
  editorEpEl,
  editorHalfmoveEl,
  editorFullmoveEl,
  editorFenOutputEl,
  editorValidateBtnEl,
  editorUseAnalysisBtnEl,
  editorPlayEngineBtnEl,
  editorValidationMsgEl,
  editorControlsTitleEl,
  editorToolNoteEl
}) {
  const shared = createEditorSharedHelpers({ Chess, files });

  function getSetupState() {
    return state.tablebase.setup;
  }

  function setEditorValidationMessage(message, type = "") {
    if (!editorValidationMsgEl) return;
    editorValidationMsgEl.textContent = message || "";
    editorValidationMsgEl.classList.remove("error", "ok");
    if (type === "error") editorValidationMsgEl.classList.add("error");
    if (type === "ok") editorValidationMsgEl.classList.add("ok");
  }

  function applySetupUiMode() {
    if (editorControlsTitleEl) {
      editorControlsTitleEl.textContent =
        state.appMode === "tablebase-setup" ? "Tablebase Setup" : "Board Editor";
    }
    if (editorToolNoteEl) {
      editorToolNoteEl.textContent =
        state.appMode === "tablebase-setup"
          ? "Place up to 7 pieces, then start a tablebase session."
          : "Select a piece and click or drag on board squares.";
    }
    if (editorUseAnalysisBtnEl) {
      editorUseAnalysisBtnEl.classList.toggle("hidden", state.appMode === "tablebase-setup");
    }
    if (editorPlayEngineBtnEl) {
      editorPlayEngineBtnEl.textContent =
        state.appMode === "tablebase-setup" ? "Start Tablebase" : "Play vs Engine";
    }
    if (editorStartposBtnEl) {
      editorStartposBtnEl.textContent = state.appMode === "tablebase-setup" ? "Kings" : "Start";
    }
  }

  function setEditorBoard(board) {
    getSetupState().board = board || {};
  }

  function getEditorPiece(square) {
    return shared.getPiece(getSetupState().board, square);
  }

  function setEditorPiece(square, piece) {
    const setupState = getSetupState();
    const board = setupState.board || {};
    const existing = board[square];
    const nextPieceCount =
      piece && !existing ? shared.countPieces(board) + 1 : shared.countPieces(board);
    if (piece && !existing && nextPieceCount > 7) {
      const msg = "Tablebase setup supports at most 7 pieces.";
      setEditorValidationMessage(msg, "error");
      showAppMessage(msg);
      return false;
    }
    shared.setPiece(board, square, piece);
    if (piece || existing) {
      setEditorValidationMessage("");
    }
    return true;
  }

  function getEditorFen() {
    return shared.getFen(getSetupState());
  }

  function normalizeEditorEpSquare(value) {
    return shared.normalizeEpSquare(value);
  }

  function loadEditorFenFromText() {
    const raw = String(editorFenOutputEl?.value || "").trim();
    if (!raw) {
      const msg = "FEN is empty.";
      setEditorValidationMessage(msg, "error");
      showAppMessage(msg);
      return false;
    }
    try {
      shared.loadStateFromFen(getSetupState(), raw);
    } catch (_) {
      const msg = "Invalid FEN.";
      setEditorValidationMessage(msg, "error");
      showAppMessage(msg);
      return false;
    }
    const pieceCount = shared.countPieces(getSetupState().board);
    if (pieceCount > 7) {
      const msg = "Tablebase setup supports at most 7 pieces.";
      setEditorValidationMessage(msg, "error");
      showAppMessage(msg);
      return false;
    }
    setEditorValidationMessage("FEN loaded.", "ok");
    render();
    return true;
  }

  function validateEditorPosition() {
    return shared.validateEditorState(getSetupState(), { maxPieces: 7 });
  }

  function toolToPiece(tool) {
    if (!tool || tool === "erase") return null;
    if (tool.length !== 2) return null;
    const color = tool[0];
    const type = tool[1];
    if (!["w", "b"].includes(color)) return null;
    if (!["p", "n", "b", "r", "q", "k"].includes(type)) return null;
    return { color, type };
  }

  function updateEditorToolSelectionUi() {
    applySetupUiMode();
    const setupState = getSetupState();
    if (editorPieceGridEl) {
      const buttons = editorPieceGridEl.querySelectorAll(".editor-piece-btn");
      buttons.forEach((btn) => {
        btn.classList.toggle("selected", btn.dataset.tool === setupState.selectedTool);
      });
    }
    if (editorEraseBtnEl) {
      editorEraseBtnEl.classList.toggle("selected", setupState.selectedTool === "erase");
    }
    if (editorTurnWBtnEl) {
      editorTurnWBtnEl.classList.toggle("selected", setupState.turn !== "b");
    }
    if (editorTurnBBtnEl) {
      editorTurnBBtnEl.classList.toggle("selected", setupState.turn === "b");
    }
    if (editorCastleKEl) editorCastleKEl.checked = !!setupState.castling.K;
    if (editorCastleQEl) editorCastleQEl.checked = !!setupState.castling.Q;
    if (editorCastlekEl) editorCastlekEl.checked = !!setupState.castling.k;
    if (editorCastleqEl) editorCastleqEl.checked = !!setupState.castling.q;
    if (editorEpEl) {
      const options = shared.getEpOptions(setupState);
      const current = shared.normalizeEpSquare(setupState.ep);
      const next = options.includes(current) ? current : "-";
      setupState.ep = next;
      editorEpEl.innerHTML = "";
      const none = document.createElement("option");
      none.value = "-";
      none.textContent = "-";
      editorEpEl.appendChild(none);
      for (const ep of options) {
        const opt = document.createElement("option");
        opt.value = ep;
        opt.textContent = ep;
        editorEpEl.appendChild(opt);
      }
      editorEpEl.value = next;
    }
    if (editorFenOutputEl && document.activeElement !== editorFenOutputEl) {
      editorFenOutputEl.value = getEditorFen();
    }
  }

  function initEditorPalette() {
    if (!editorPieceGridEl) return;
    const setupState = getSetupState();
    const order = state.boardFlipped
      ? ["wk", "wq", "wr", "wb", "wn", "wp", "bk", "bq", "br", "bb", "bn", "bp"]
      : ["bk", "bq", "br", "bb", "bn", "bp", "wk", "wq", "wr", "wb", "wn", "wp"];
    editorPieceGridEl.innerHTML = "";
    for (const tool of order) {
      const piece = toolToPiece(tool);
      if (!piece) continue;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "editor-piece-btn";
      btn.dataset.tool = tool;
      const img = document.createElement("img");
      img.src = pieceAssetPath(piece);
      img.alt = tool;
      btn.appendChild(img);
      btn.addEventListener("pointerdown", (event) => {
        if (state.appMode !== "tablebase-setup") return;
        setupState.selectedTool = tool;
        updateEditorToolSelectionUi();
        startEditorPaletteDrag?.(event, piece);
      });
      btn.addEventListener("click", () => {
        if (state.appMode !== "tablebase-setup") return;
        setupState.selectedTool = tool;
        updateEditorToolSelectionUi();
      });
      editorPieceGridEl.appendChild(btn);
    }
    updateEditorToolSelectionUi();
  }

  function setDefaultKingsBoard() {
    setEditorBoard({
      e1: { color: "w", type: "k" },
      e8: { color: "b", type: "k" }
    });
  }

  function startSessionFromSetup() {
    const result = validateEditorPosition();
    if (!result.ok) {
      setEditorValidationMessage(result.error, "error");
      showAppMessage(result.error);
      return false;
    }
    setEditorValidationMessage("Starting tablebase session.", "ok");
    startTablebaseSession(result.fen);
    return true;
  }

  function openTablebaseSetup(options = {}) {
    const preserveSetup = !!options.preserveSetup;
    state.online.currentGameId = "";
    state.online.finished = false;
    state.online.finishStatus = "";
    state.online.finishWinner = "";
    state.online.userFlipped = false;
    stopCurrentEngineSearch();
    clearAnalysisState();
    resetTablebaseSessionState?.();
    state.analysis.optionsOpen = false;
    setAppMode("tablebase-setup");
    state.boardFlipped = false;
    state.game = new Chess();
    state.viewPly = 0;
    clearSelection();
    clearPremove();
    closePromotionMenu();
    clearBoardAnnotations();
    if (!preserveSetup) {
      setEditorBoard({});
      getSetupState().turn = "w";
      getSetupState().castling = { K: false, Q: false, k: false, q: false };
      getSetupState().ep = "-";
      getSetupState().halfmove = 0;
      getSetupState().fullmove = 1;
    }
    if (!getSetupState().selectedTool) {
      getSetupState().selectedTool = "wk";
    }
    setEditorValidationMessage("Place up to 7 pieces, including both kings.");
    initEditorPalette();
    showGameScreen();
    render();
  }

  function wire() {
    editorEraseBtnEl?.addEventListener("click", () => {
      if (state.appMode !== "tablebase-setup") return;
      getSetupState().selectedTool = "erase";
      updateEditorToolSelectionUi();
    });

    editorFlipBtnEl?.addEventListener("click", () => {
      if (state.appMode !== "tablebase-setup") return;
      state.boardFlipped = !state.boardFlipped;
      initEditorPalette();
      render();
    });

    editorClearBtnEl?.addEventListener("click", () => {
      if (state.appMode !== "tablebase-setup") return;
      setEditorBoard({});
      setEditorValidationMessage("");
      render();
    });

    editorStartposBtnEl?.addEventListener("click", () => {
      if (state.appMode !== "tablebase-setup") return;
      setDefaultKingsBoard();
      setEditorValidationMessage("Kings placed.");
      render();
    });

    editorTurnWBtnEl?.addEventListener("click", () => {
      if (state.appMode !== "tablebase-setup") return;
      getSetupState().turn = "w";
      updateEditorToolSelectionUi();
    });

    editorTurnBBtnEl?.addEventListener("click", () => {
      if (state.appMode !== "tablebase-setup") return;
      getSetupState().turn = "b";
      updateEditorToolSelectionUi();
    });

    editorCastleKEl?.addEventListener("change", () => {
      if (state.appMode !== "tablebase-setup") return;
      getSetupState().castling.K = !!editorCastleKEl.checked;
      updateEditorToolSelectionUi();
    });
    editorCastleQEl?.addEventListener("change", () => {
      if (state.appMode !== "tablebase-setup") return;
      getSetupState().castling.Q = !!editorCastleQEl.checked;
      updateEditorToolSelectionUi();
    });
    editorCastlekEl?.addEventListener("change", () => {
      if (state.appMode !== "tablebase-setup") return;
      getSetupState().castling.k = !!editorCastlekEl.checked;
      updateEditorToolSelectionUi();
    });
    editorCastleqEl?.addEventListener("change", () => {
      if (state.appMode !== "tablebase-setup") return;
      getSetupState().castling.q = !!editorCastleqEl.checked;
      updateEditorToolSelectionUi();
    });

    editorEpEl?.addEventListener("change", () => {
      if (state.appMode !== "tablebase-setup") return;
      getSetupState().ep = normalizeEditorEpSquare(editorEpEl.value);
      updateEditorToolSelectionUi();
    });
    editorHalfmoveEl?.addEventListener("input", () => {
      if (state.appMode !== "tablebase-setup") return;
      getSetupState().halfmove = Math.max(0, Math.floor(Number(editorHalfmoveEl.value) || 0));
      updateEditorToolSelectionUi();
    });
    editorFullmoveEl?.addEventListener("input", () => {
      if (state.appMode !== "tablebase-setup") return;
      getSetupState().fullmove = Math.max(1, Math.floor(Number(editorFullmoveEl.value) || 1));
      updateEditorToolSelectionUi();
    });

    editorHomeBtnEl?.addEventListener("click", () => {
      if (state.appMode !== "tablebase-setup") return;
      resetTablebaseSessionState?.();
      setAppMode("play");
      showToolsScreen();
      render();
    });

    editorValidateBtnEl?.addEventListener("click", () => {
      if (state.appMode !== "tablebase-setup") return;
      loadEditorFenFromText();
    });

    editorPlayEngineBtnEl?.addEventListener("click", () => {
      if (state.appMode !== "tablebase-setup") return;
      startSessionFromSetup();
    });
  }

  wire();

  return {
    setEditorBoard,
    getEditorPiece,
    setEditorPiece,
    normalizeEditorEpSquare,
    getEditorFen,
    loadEditorFenFromText,
    setEditorValidationMessage,
    validateEditorPosition,
    toolToPiece,
    updateEditorToolSelectionUi,
    initEditorPalette,
    openTablebaseSetup,
    startSessionFromSetup,
    applySetupUiMode
  };
}

module.exports = { createTablebaseModule };
