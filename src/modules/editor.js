const { createEditorSharedHelpers } = require("./editorShared");

function createBoardEditorModule({
  Chess,
  state,
  files,
  pieceAssetPath,
  render,
  showAppMessage,
  stopCurrentEngineSearch,
  clearAnalysisState,
  createAnalysisTreeRoot,
  getAnalysisTree,
  buildGameFromAnalysisNode,
  markAnalysisPgnDirty,
  clearSelection,
  clearPremove,
  closePromotionMenu,
  clearBoardAnnotations,
  setAppMode,
  showGameScreen,
  showHomeScreen,
  openSetupModal,
  setPendingEditorPlayFen,
  startEditorPaletteDrag,
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

  function getEditorState() {
    return state.editor;
  }

  function applyEditorUiMode() {
    if (editorControlsTitleEl) {
      editorControlsTitleEl.textContent = "Board Editor";
    }
    if (editorToolNoteEl) {
      editorToolNoteEl.textContent = "Select a piece and click or drag on board squares.";
    }
    if (editorUseAnalysisBtnEl) {
      editorUseAnalysisBtnEl.classList.remove("hidden");
    }
    if (editorPlayEngineBtnEl) {
      editorPlayEngineBtnEl.textContent = "Play vs Engine";
    }
    if (editorStartposBtnEl) {
      editorStartposBtnEl.textContent = "Start";
    }
  }

  function setEditorBoard(board) {
    getEditorState().board = board || {};
  }

  function getEditorPiece(square) {
    return shared.getPiece(getEditorState().board, square);
  }

  function setEditorPiece(square, piece) {
    shared.setPiece(getEditorState().board, square, piece);
    return true;
  }

  function normalizeEditorEpSquare(value) {
    return shared.normalizeEpSquare(value);
  }

  function getEditorFen() {
    return shared.getFen(getEditorState());
  }

  function setEditorValidationMessage(message, type = "") {
    if (!editorValidationMsgEl) return;
    editorValidationMsgEl.textContent = message || "";
    editorValidationMsgEl.classList.remove("error", "ok");
    if (type === "error") editorValidationMsgEl.classList.add("error");
    if (type === "ok") editorValidationMsgEl.classList.add("ok");
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
      shared.loadStateFromFen(getEditorState(), raw);
    } catch (_) {
      const msg = "Invalid FEN.";
      setEditorValidationMessage(msg, "error");
      showAppMessage(msg);
      return false;
    }

    setEditorValidationMessage("FEN loaded.", "ok");
    render();
    return true;
  }

  function validateEditorPosition() {
    return shared.validateEditorState(getEditorState());
  }

  function useEditorPositionInAnalysis() {
    const result = validateEditorPosition();
    if (!result.ok) {
      setEditorValidationMessage(result.error, "error");
      showAppMessage(result.error);
      return;
    }
    stopCurrentEngineSearch();
    clearAnalysisState();
    state.analysisPgnMeta = { tags: {}, rootComments: [] };
    state.analysisTree = createAnalysisTreeRoot(result.fen);
    const tree = getAnalysisTree();
    tree.currentId = tree.rootId;
    state.game = buildGameFromAnalysisNode(tree.rootId);
    state.viewPly = 0;
    markAnalysisPgnDirty();
    clearSelection();
    clearPremove();
    closePromotionMenu();
    clearBoardAnnotations();
    setEditorValidationMessage("Position loaded into analysis.", "ok");
    setAppMode("analysis");
    showGameScreen();
    render();
  }

  function setupPlayFromEditorPosition() {
    const result = validateEditorPosition();
    if (!result.ok) {
      setEditorValidationMessage(result.error, "error");
      showAppMessage(result.error);
      return;
    }
    setPendingEditorPlayFen(result.fen);
    setEditorValidationMessage("Position ready. Select time and side.", "ok");
    setAppMode("play");
    showHomeScreen();
    openSetupModal();
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
    applyEditorUiMode();
    const editorState = getEditorState();
    if (editorPieceGridEl) {
      const buttons = editorPieceGridEl.querySelectorAll(".editor-piece-btn");
      buttons.forEach((btn) => {
        btn.classList.toggle("selected", btn.dataset.tool === editorState.selectedTool);
      });
    }
    if (editorEraseBtnEl) {
      editorEraseBtnEl.classList.toggle("selected", editorState.selectedTool === "erase");
    }
    if (editorTurnWBtnEl) {
      editorTurnWBtnEl.classList.toggle("selected", editorState.turn !== "b");
    }
    if (editorTurnBBtnEl) {
      editorTurnBBtnEl.classList.toggle("selected", editorState.turn === "b");
    }
    if (editorCastleKEl) editorCastleKEl.checked = !!editorState.castling.K;
    if (editorCastleQEl) editorCastleQEl.checked = !!editorState.castling.Q;
    if (editorCastlekEl) editorCastlekEl.checked = !!editorState.castling.k;
    if (editorCastleqEl) editorCastleqEl.checked = !!editorState.castling.q;
    if (editorEpEl) {
      const options = shared.getEpOptions(editorState);
      const current = shared.normalizeEpSquare(editorState.ep);
      const next = options.includes(current) ? current : "-";
      editorState.ep = next;
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
    const editorState = getEditorState();
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
        if (state.appMode !== "editor") return;
        editorState.selectedTool = tool;
        updateEditorToolSelectionUi();
        startEditorPaletteDrag?.(event, piece);
      });
      btn.addEventListener("click", () => {
        if (state.appMode !== "editor") return;
        editorState.selectedTool = tool;
        updateEditorToolSelectionUi();
      });
      editorPieceGridEl.appendChild(btn);
    }
    updateEditorToolSelectionUi();
  }

  function openBoardEditor() {
    state.online.currentGameId = "";
    state.online.finished = false;
    state.online.finishStatus = "";
    state.online.finishWinner = "";
    state.online.userFlipped = false;
    stopCurrentEngineSearch();
    clearAnalysisState();
    state.analysis.optionsOpen = false;
    setAppMode("editor");
    state.player2Color = "w";
    state.boardFlipped = false;
    state.game = new Chess();
    state.viewPly = 0;
    clearSelection();
    clearPremove();
    closePromotionMenu();
    clearBoardAnnotations();
    setEditorBoard(shared.makeEditorStartBoard());
    getEditorState().turn = "w";
    getEditorState().castling = { K: true, Q: true, k: true, q: true };
    getEditorState().ep = "-";
    getEditorState().halfmove = 0;
    getEditorState().fullmove = 1;
    if (!getEditorState().selectedTool) {
      getEditorState().selectedTool = "wp";
    }
    setEditorValidationMessage("");
    initEditorPalette();
    showGameScreen();
    render();
  }

  function wire() {
    editorEraseBtnEl?.addEventListener("click", () => {
      if (state.appMode !== "editor") return;
      getEditorState().selectedTool = "erase";
      updateEditorToolSelectionUi();
    });

    editorFlipBtnEl?.addEventListener("click", () => {
      if (state.appMode !== "editor") return;
      state.boardFlipped = !state.boardFlipped;
      initEditorPalette();
      render();
    });

    editorClearBtnEl?.addEventListener("click", () => {
      if (state.appMode !== "editor") return;
      setEditorBoard({});
      render();
    });

    editorStartposBtnEl?.addEventListener("click", () => {
      if (state.appMode !== "editor") return;
      setEditorBoard(shared.makeEditorStartBoard());
      setEditorValidationMessage("");
      render();
    });

    editorTurnWBtnEl?.addEventListener("click", () => {
      if (state.appMode !== "editor") return;
      getEditorState().turn = "w";
      updateEditorToolSelectionUi();
    });

    editorTurnBBtnEl?.addEventListener("click", () => {
      if (state.appMode !== "editor") return;
      getEditorState().turn = "b";
      updateEditorToolSelectionUi();
    });

    editorCastleKEl?.addEventListener("change", () => {
      if (state.appMode !== "editor") return;
      getEditorState().castling.K = !!editorCastleKEl.checked;
      updateEditorToolSelectionUi();
    });
    editorCastleQEl?.addEventListener("change", () => {
      if (state.appMode !== "editor") return;
      getEditorState().castling.Q = !!editorCastleQEl.checked;
      updateEditorToolSelectionUi();
    });
    editorCastlekEl?.addEventListener("change", () => {
      if (state.appMode !== "editor") return;
      getEditorState().castling.k = !!editorCastlekEl.checked;
      updateEditorToolSelectionUi();
    });
    editorCastleqEl?.addEventListener("change", () => {
      if (state.appMode !== "editor") return;
      getEditorState().castling.q = !!editorCastleqEl.checked;
      updateEditorToolSelectionUi();
    });

    editorEpEl?.addEventListener("change", () => {
      if (state.appMode !== "editor") return;
      getEditorState().ep = normalizeEditorEpSquare(editorEpEl.value);
      updateEditorToolSelectionUi();
    });
    editorHalfmoveEl?.addEventListener("input", () => {
      if (state.appMode !== "editor") return;
      getEditorState().halfmove = Math.max(0, Math.floor(Number(editorHalfmoveEl.value) || 0));
      updateEditorToolSelectionUi();
    });
    editorFullmoveEl?.addEventListener("input", () => {
      if (state.appMode !== "editor") return;
      getEditorState().fullmove = Math.max(1, Math.floor(Number(editorFullmoveEl.value) || 1));
      updateEditorToolSelectionUi();
    });

    editorHomeBtnEl?.addEventListener("click", () => {
      if (state.appMode !== "editor") return;
      setAppMode("play");
      showHomeScreen();
      render();
    });

    editorValidateBtnEl?.addEventListener("click", () => {
      if (state.appMode !== "editor") return;
      loadEditorFenFromText();
    });

    editorUseAnalysisBtnEl?.addEventListener("click", () => {
      if (state.appMode !== "editor") return;
      useEditorPositionInAnalysis();
    });

    editorPlayEngineBtnEl?.addEventListener("click", () => {
      if (state.appMode !== "editor") return;
      setupPlayFromEditorPosition();
    });
  }

  wire();

  return {
    makeEditorStartBoard: shared.makeEditorStartBoard,
    setEditorBoard,
    getEditorPiece,
    setEditorPiece,
    normalizeEditorEpSquare,
    getEditorFen,
    loadEditorFenFromText,
    setEditorValidationMessage,
    validateEditorPosition,
    useEditorPositionInAnalysis,
    setupPlayFromEditorPosition,
    toolToPiece,
    updateEditorToolSelectionUi,
    initEditorPalette,
    openBoardEditor,
    applyEditorUiMode
  };
}

module.exports = { createBoardEditorModule };
