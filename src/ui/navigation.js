function createNavigationHelpers({
  state,
  elements,
  hideMoveContextMenu,
  hideVariationPickerMenu,
  closeHomeProfileMenu,
  closeHomeOnlinePanels,
  updateHomeOnlineToolbarVisibility,
  renderHomePlayModeBar,
  getBotsModule,
  getChess960Module,
  getComputerAnalysisModule,
  getPuzzleModule,
  getVariantsModule,
  getTournamentModule,
  getVisionModule,
  visionExperimentalEnabled,
  showAppMessage,
  applyBoardSize,
  getMinBoardSize,
  getBoardWidth
}) {
  function setAppMode(mode) {
    state.appMode = mode;
    hideMoveContextMenu();
    hideVariationPickerMenu();
    elements.gameScreenEl.classList.toggle("analysis-mode", mode === "analysis");
    elements.gameScreenEl.classList.toggle("editor-mode", mode === "editor");
    elements.gameScreenEl.classList.toggle("tablebase-setup-mode", mode === "tablebase-setup");
    elements.gameScreenEl.classList.toggle("tablebase-mode", mode === "tablebase");
    if (elements.analysisEvalBarEl) {
      elements.analysisEvalBarEl.classList.toggle("hidden", mode !== "analysis");
    }
    if (elements.analysisEnabledToggleEl) {
      elements.analysisEnabledToggleEl.checked = state.analysis.enabled;
    }
    if (mode === "analysis") {
      if (elements.analysisTopPanelEl) elements.analysisTopPanelEl.classList.remove("hidden");
      if (elements.analysisLinesPanelEl) elements.analysisLinesPanelEl.classList.remove("hidden");
      if (elements.analysisFunctionBarEl) elements.analysisFunctionBarEl.classList.remove("hidden");
      if (elements.analysisLeftColumnEl) elements.analysisLeftColumnEl.classList.remove("hidden");
      if (elements.analysisFenPanelEl) elements.analysisFenPanelEl.classList.remove("hidden");
      if (elements.analysisPgnPanelEl) elements.analysisPgnPanelEl.classList.remove("hidden");
      if (elements.analysisInfoPanelEl) elements.analysisInfoPanelEl.classList.remove("hidden");
      return;
    }
    if (mode === "tablebase") {
      if (elements.analysisTopPanelEl) elements.analysisTopPanelEl.classList.add("hidden");
      if (elements.analysisLinesPanelEl) elements.analysisLinesPanelEl.classList.add("hidden");
      if (elements.analysisFunctionBarEl) elements.analysisFunctionBarEl.classList.add("hidden");
      if (elements.analysisLeftColumnEl) elements.analysisLeftColumnEl.classList.remove("hidden");
      if (elements.analysisFenPanelEl) elements.analysisFenPanelEl.classList.add("hidden");
      if (elements.analysisPgnPanelEl) elements.analysisPgnPanelEl.classList.add("hidden");
      if (elements.analysisInfoPanelEl) elements.analysisInfoPanelEl.classList.add("hidden");
      return;
    }
    state.analysis.optionsOpen = false;
    if (elements.analysisOptionsPanelEl) elements.analysisOptionsPanelEl.classList.add("hidden");
    if (elements.analysisTopPanelEl) elements.analysisTopPanelEl.classList.add("hidden");
    if (elements.analysisLinesPanelEl) elements.analysisLinesPanelEl.classList.add("hidden");
    if (elements.analysisFunctionBarEl) elements.analysisFunctionBarEl.classList.add("hidden");
    if (elements.analysisLeftColumnEl) elements.analysisLeftColumnEl.classList.add("hidden");
    if (elements.analysisFenPanelEl) elements.analysisFenPanelEl.classList.add("hidden");
    if (elements.analysisPgnPanelEl) elements.analysisPgnPanelEl.classList.add("hidden");
    if (elements.analysisInfoPanelEl) elements.analysisInfoPanelEl.classList.add("hidden");
    if (elements.sidePanelEl) elements.sidePanelEl.style.height = "";
    if (elements.analysisLeftColumnEl) elements.analysisLeftColumnEl.style.height = "";
    if (elements.analysisFenPanelEl) elements.analysisFenPanelEl.style.height = "";
    if (elements.analysisPgnPanelEl) elements.analysisPgnPanelEl.style.height = "";
    if (elements.analysisInfoPanelEl) elements.analysisInfoPanelEl.style.height = "";
  }

  function showHomeScreen() {
    closeHomeProfileMenu();
    if (elements.homeProfileEl) elements.homeProfileEl.classList.remove("hidden");
    elements.homeScreenEl.classList.remove("hidden");
    if (elements.toolsScreenEl) elements.toolsScreenEl.classList.add("hidden");
    if (elements.puzzleScreenEl) elements.puzzleScreenEl.classList.add("hidden");
    if (elements.computerAnalysisScreenEl) elements.computerAnalysisScreenEl.classList.add("hidden");
    if (elements.botsScreenEl) elements.botsScreenEl.classList.add("hidden");
    if (elements.botTournamentScreenEl) elements.botTournamentScreenEl.classList.add("hidden");
    if (elements.variantsScreenEl) elements.variantsScreenEl.classList.add("hidden");
    if (elements.chess960ScreenEl) elements.chess960ScreenEl.classList.add("hidden");
    if (elements.tournamentScreenEl) elements.tournamentScreenEl.classList.add("hidden");
    if (elements.visionScreenEl) elements.visionScreenEl.classList.add("hidden");
    elements.gameScreenEl.classList.add("hidden");
    if (elements.onlineChatInputEl) elements.onlineChatInputEl.value = "";
    updateHomeOnlineToolbarVisibility();
    renderHomePlayModeBar();
  }

  function showToolsScreen() {
    closeHomeProfileMenu();
    if (elements.homeProfileEl) elements.homeProfileEl.classList.add("hidden");
    closeHomeOnlinePanels();
    elements.homeScreenEl.classList.add("hidden");
    if (elements.toolsScreenEl) elements.toolsScreenEl.classList.remove("hidden");
    if (elements.puzzleScreenEl) elements.puzzleScreenEl.classList.add("hidden");
    if (elements.computerAnalysisScreenEl) elements.computerAnalysisScreenEl.classList.add("hidden");
    if (elements.botsScreenEl) elements.botsScreenEl.classList.add("hidden");
    if (elements.botTournamentScreenEl) elements.botTournamentScreenEl.classList.add("hidden");
    if (elements.variantsScreenEl) elements.variantsScreenEl.classList.add("hidden");
    if (elements.chess960ScreenEl) elements.chess960ScreenEl.classList.add("hidden");
    if (elements.tournamentScreenEl) elements.tournamentScreenEl.classList.add("hidden");
    if (elements.visionScreenEl) elements.visionScreenEl.classList.add("hidden");
    elements.gameScreenEl.classList.add("hidden");
    updateHomeOnlineToolbarVisibility();
  }

  function showPuzzleScreen() {
    const module = getPuzzleModule();
    if (module) module.showScreen();
  }

  function showComputerAnalysisScreen() {
    const module = getComputerAnalysisModule();
    if (module) module.showScreen();
  }

  function showVariantsScreen() {
    const module = getVariantsModule();
    if (module) module.showScreen();
  }

  function showBotsScreen() {
    const module = getBotsModule();
    if (module) module.showScreen();
  }

  function showChess960Screen() {
    const module = getChess960Module();
    if (module) module.showScreen();
  }

  function showTournamentScreen() {
    const module = getTournamentModule();
    if (module) module.showScreen();
  }

  function showVisionScreen() {
    if (!visionExperimentalEnabled) {
      showAppMessage("Chess Vision is experimental and hidden by default.");
      return;
    }
    const module = getVisionModule();
    if (module) module.showScreen();
  }

  function showGameScreen() {
    closeHomeProfileMenu();
    if (elements.homeProfileEl) elements.homeProfileEl.classList.remove("hidden");
    closeHomeOnlinePanels();
    elements.homeScreenEl.classList.add("hidden");
    if (elements.toolsScreenEl) elements.toolsScreenEl.classList.add("hidden");
    if (elements.puzzleScreenEl) elements.puzzleScreenEl.classList.add("hidden");
    if (elements.computerAnalysisScreenEl) elements.computerAnalysisScreenEl.classList.add("hidden");
    if (elements.botsScreenEl) elements.botsScreenEl.classList.add("hidden");
    if (elements.botTournamentScreenEl) elements.botTournamentScreenEl.classList.add("hidden");
    if (elements.variantsScreenEl) elements.variantsScreenEl.classList.add("hidden");
    if (elements.chess960ScreenEl) elements.chess960ScreenEl.classList.add("hidden");
    if (elements.tournamentScreenEl) elements.tournamentScreenEl.classList.add("hidden");
    if (elements.visionScreenEl) elements.visionScreenEl.classList.add("hidden");
    elements.gameScreenEl.classList.remove("hidden");
    updateHomeOnlineToolbarVisibility();
    const currentWidth = getBoardWidth();
    if (currentWidth <= getMinBoardSize() + 1) {
      const preferred = Math.min(900, Math.floor(window.innerWidth * 0.72));
      applyBoardSize(preferred);
    }
  }

  return {
    setAppMode,
    showHomeScreen,
    showToolsScreen,
    showPuzzleScreen,
    showComputerAnalysisScreen,
    showBotsScreen,
    showVariantsScreen,
    showChess960Screen,
    showTournamentScreen,
    showVisionScreen,
    showGameScreen
  };
}

module.exports = { createNavigationHelpers };
