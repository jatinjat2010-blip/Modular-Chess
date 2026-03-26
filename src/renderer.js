const { Chess } = require("chess.js");
const { ipcRenderer } = require("electron");
const crypto = require("crypto");
const { createChess960Module, generateRandomFen, generateFenFromPositionNumber } = require("./modules/chess960");
const { createTournamentModule } = require("./modules/tournament");
const { createBotTournamentModule } = require("./modules/bot-tournament");
const { createChessVisionModule } = require("./modules/vision");
const { createBoardEditorModule } = require("./modules/editor");
const { createTablebaseModule } = require("./modules/tablebase");
const { createComputerAnalysisModule } = require("./modules/computer-analysis");
const { createBotsModule } = require("./modules/bots");
const { createPuzzleModule } = require("./modules/puzzles");
const { createVariantsModule } = require("./modules/variants");
const { loadFairyApi, createFairyVariantGame, createChess960Game } = require("./modules/variants/chess960Game");
const { createNavigationHelpers } = require("./ui/navigation");
const { createModalHelpers } = require("./ui/modals");

const VISION_EXPERIMENTAL_ENABLED = String(process.env.VISION_EXPERIMENTAL || "").trim() === "1";

const boardEl = document.getElementById("board");
const appMessageEl = document.getElementById("app-message");
const homeScreenEl = document.getElementById("home-screen");
const toolsScreenEl = document.getElementById("tools-screen");
const puzzleScreenEl = document.getElementById("puzzle-screen");
const puzzleRootEl = document.getElementById("puzzle-root");
const computerAnalysisScreenEl = document.getElementById("computer-analysis-screen");
const computerAnalysisRootEl = document.getElementById("computer-analysis-root");
const botsScreenEl = document.getElementById("bots-screen");
const botsRootEl = document.getElementById("bots-root");
const botTournamentScreenEl = document.getElementById("bot-tournament-screen");
const variantsScreenEl = document.getElementById("variants-screen");
const variantsRootEl = document.getElementById("variants-root");
const chess960ScreenEl = document.getElementById("chess960-screen");
const tournamentScreenEl = document.getElementById("tournament-screen");
const visionScreenEl = document.getElementById("vision-screen");
const gameScreenEl = document.getElementById("game-screen");
const sidePanelEl = document.querySelector(".side-panel");
const timeCardEls = Array.from(document.querySelectorAll(".time-card"));
const btnLoadEngineEl = document.getElementById("btn-load-engine");
const btnGameSetupEl = document.getElementById("btn-game-setup");
const btnBoardAnalysisEl = document.getElementById("btn-board-analysis");
const btnBoardEditorEl = document.getElementById("btn-board-editor");
const btnGameArchiveEl = document.getElementById("btn-game-archive");
const btnOnlineModeEl = document.getElementById("btn-online-mode");
const btnToolsBackEl = document.getElementById("btn-tools-back");
const btnToolPuzzleEl = document.getElementById("btn-tool-puzzle");
const btnToolComputerAnalysisEl = document.getElementById("btn-tool-computer-analysis");
const btnToolBotsEl = document.getElementById("btn-tool-bots");
const btnToolVariantsEl = document.getElementById("btn-tool-variants");
const btnToolChess960El = document.getElementById("btn-tool-chess960");
const btnToolTablebaseEl = document.getElementById("btn-tool-tablebase");
const btnToolTournamentEl = document.getElementById("btn-tool-tournament");
const btnToolVisionEl = document.getElementById("btn-tool-vision");
const btnPuzzleBackEl = document.getElementById("btn-puzzle-back");
const btnComputerAnalysisBackEl = document.getElementById("btn-computer-analysis-back");
const btnBotsBackEl = document.getElementById("btn-bots-back");
const btnVariantsBackEl = document.getElementById("btn-variants-back");
const btnChess960BackEl = document.getElementById("btn-chess960-back");
const btnChess960RandomEl = document.getElementById("btn-chess960-random");
const btnChess960GenerateNumberEl = document.getElementById("btn-chess960-generate-number");
const btnTournamentBackEl = document.getElementById("btn-tournament-back");
const btnVisionBackEl = document.getElementById("btn-vision-back");
const chess960BoardWrapEl = document.getElementById("chess960-board-wrap");
const chess960BoardEl = document.getElementById("chess960-board");
const chess960ResizeHandleEl = document.getElementById("chess960-resize-handle");
const chess960FenOutputEl = document.getElementById("chess960-fen-output");
const chess960PositionNumberEl = document.getElementById("chess960-position-number");
const homePlayModeBarEl = document.getElementById("home-play-mode-bar");
const homeOnlineToolbarEl = document.getElementById("home-online-toolbar");
const btnHomeActiveGamesEl = document.getElementById("btn-home-active-games");
const btnHomeChallengeEl = document.getElementById("btn-home-challenge");
const homeActiveGamesBadgeEl = document.getElementById("home-active-games-badge");
const homeChallengeBadgeEl = document.getElementById("home-challenge-badge");
const homeActiveGamesPanelEl = document.getElementById("home-active-games-panel");
const homeChallengePanelEl = document.getElementById("home-challenge-panel");
const homeProfileEl = document.getElementById("home-profile");
const homeProfileBtnEl = document.getElementById("btn-home-profile");
const homeProfileNameEl = document.getElementById("home-profile-name");
const homeProfileAvatarEl = document.getElementById("home-profile-avatar");
const homeProfileMenuEl = document.getElementById("home-profile-menu");
const homeProfileOnlineToggleEl = document.getElementById("home-profile-online-toggle");
const accountModalEl = document.getElementById("account-modal");
const btnAccountCloseEl = document.getElementById("btn-account-close");
const btnAccountSaveEl = document.getElementById("btn-account-save");
const btnAccountCancelEl = document.getElementById("btn-account-cancel");
const accountNameInputEl = document.getElementById("account-name-input");
const accountSyncOnlineEl = document.getElementById("account-sync-online");
const accountAvatarInputEl = document.getElementById("account-avatar-input");
const accountAvatarPreviewEl = document.getElementById("account-avatar-preview");
const accountMsgEl = document.getElementById("account-msg");
const themeModalEl = document.getElementById("theme-modal");
const themeModalTitleEl = document.getElementById("theme-modal-title");
const btnThemeCloseEl = document.getElementById("btn-theme-close");
const themeStatusEl = document.getElementById("theme-status");
const themeGridEl = document.getElementById("theme-grid");
const themeImportActionsEl = document.getElementById("theme-import-actions");
const btnThemeImportBoardEl = document.getElementById("btn-theme-import-board");
const btnThemeImportPiecesEl = document.getElementById("btn-theme-import-pieces");
const backgroundModalEl = document.getElementById("background-modal");
const btnBackgroundCloseEl = document.getElementById("btn-background-close");
const btnBackgroundDefaultEl = document.getElementById("btn-background-default");
const btnBackgroundColorModeEl = document.getElementById("btn-background-color-mode");
const btnBackgroundImageModeEl = document.getElementById("btn-background-image-mode");
const backgroundColorWrapEl = document.getElementById("background-color-wrap");
const backgroundImageWrapEl = document.getElementById("background-image-wrap");
const backgroundColorInputEl = document.getElementById("background-color-input");
const backgroundImageInputEl = document.getElementById("background-image-input");
const backgroundPreviewEl = document.getElementById("background-preview");
const backgroundMsgEl = document.getElementById("background-msg");
const btnBackgroundFullscreenToggleEl = document.getElementById("btn-background-fullscreen-toggle");
const btnBackgroundApplyEl = document.getElementById("btn-background-apply");
const btnBackgroundCancelEl = document.getElementById("btn-background-cancel");
const setupModalEl = document.getElementById("setup-modal");
const btnSetupCloseEl = document.getElementById("btn-setup-close");
const archiveModalEl = document.getElementById("archive-modal");
const btnArchiveCloseEl = document.getElementById("btn-archive-close");
const archiveTabOfflineEl = document.getElementById("archive-tab-offline");
const archiveTabBotvbotEl = document.getElementById("archive-tab-botvbot");
const archiveTabVariantsEl = document.getElementById("archive-tab-variants");
const archiveTabOnlineEl = document.getElementById("archive-tab-online");
const archiveOnlineActionsEl = document.getElementById("archive-online-actions");
const btnArchiveSyncOnlineEl = document.getElementById("btn-archive-sync-online");
const btnArchiveBulkAnalysisEl = document.getElementById("btn-archive-bulk-analysis");
const btnArchiveDeleteAllEl = document.getElementById("btn-archive-delete-all");
const archiveStatusEl = document.getElementById("archive-status");
const archiveListEl = document.getElementById("archive-list");
const archiveDeleteConfirmModalEl = document.getElementById("archive-delete-confirm-modal");
const archiveDeleteConfirmTextEl = document.getElementById("archive-delete-confirm-text");
const archiveDeleteConfirmCloseEl = document.getElementById("btn-archive-delete-confirm-close");
const archiveDeleteConfirmCancelEl = document.getElementById("btn-archive-delete-confirm-cancel");
const archiveDeleteConfirmAcceptEl = document.getElementById("btn-archive-delete-confirm-accept");
const archiveDeleteProgressModalEl = document.getElementById("archive-delete-progress-modal");
const archiveDeleteProgressTextEl = document.getElementById("archive-delete-progress-text");
const archiveDeleteProgressFillEl = document.getElementById("archive-delete-progress-fill");
const archiveBulkAnalysisModalEl = document.getElementById("archive-bulk-analysis-modal");
const archiveBulkAnalysisCloseEl = document.getElementById("btn-archive-bulk-analysis-close");
const archiveBulkAnalysisCancelEl = document.getElementById("btn-archive-bulk-analysis-cancel");
const archiveBulkAnalysisRunEl = document.getElementById("btn-archive-bulk-analysis-run");
const archiveBulkCountEl = document.getElementById("archive-bulk-count");
const archiveBulkDepthEl = document.getElementById("archive-bulk-depth");
const archiveBulkWarningEl = document.getElementById("archive-bulk-warning");
const archiveBulkSummaryEl = document.getElementById("archive-bulk-summary");
const archiveBulkProgressModalEl = document.getElementById("archive-bulk-progress-modal");
const archiveBulkProgressTextEl = document.getElementById("archive-bulk-progress-text");
const archiveBulkProgressCurrentEl = document.getElementById("archive-bulk-progress-current");
const archiveBulkProgressFillEl = document.getElementById("archive-bulk-progress-fill");
const archiveBulkProgressEtaEl = document.getElementById("archive-bulk-progress-eta");
const archiveBulkProgressCancelEl = document.getElementById("btn-archive-bulk-progress-cancel");
const onlineModalEl = document.getElementById("online-modal");
const btnOnlineCloseEl = document.getElementById("btn-online-close");
const onlineBackendUrlEl = document.getElementById("online-backend-url");
const onlineConnectStatusEl = document.getElementById("online-connect-status");
const btnOnlineStartLoginEl = document.getElementById("btn-online-start-login");
const btnOnlineLogoutEl = document.getElementById("btn-online-logout");
const onlineAccountStatusEl = document.getElementById("online-account-status");
const onlineChallengeUserEl = document.getElementById("online-challenge-user");
const onlineChallengeLimitEl = document.getElementById("online-challenge-limit");
const onlineChallengeLimitValueEl = document.getElementById("online-challenge-limit-value");
const onlineChallengeIncEl = document.getElementById("online-challenge-inc");
const onlineChallengeIncValueEl = document.getElementById("online-challenge-inc-value");
const onlineChallengeColorEl = document.getElementById("online-challenge-color");
const onlineChallengeRatedEl = document.getElementById("online-challenge-rated");
const onlineBlockChallengesEl = document.getElementById("online-block-challenges");
const btnOnlineCreateChallengeEl = document.getElementById("btn-online-create-challenge");
const onlineChallengeStatusEl = document.getElementById("online-challenge-status");
const challengeWaitModalEl = document.getElementById("challenge-wait-modal");
const challengeWaitDetailsEl = document.getElementById("challenge-wait-details");
const btnChallengeWaitCancelEl = document.getElementById("btn-challenge-wait-cancel");
const onlineIncomingListEl = document.getElementById("online-incoming-list");
const onlineActiveGamesListEl = document.getElementById("online-active-games-list");
const setupEngineDisplayEl = document.getElementById("setup-engine-display");
const engineControlsModalEl = document.getElementById("engine-controls-modal");
const btnEngineControlsCloseEl = document.getElementById("btn-engine-controls-close");
const engineSelectEl = document.getElementById("engine-select");
const btnAddEngineEl = document.getElementById("btn-add-engine");
const btnSetDefaultEngineEl = document.getElementById("btn-set-default-engine");
const btnRenameEngineEl = document.getElementById("btn-rename-engine");
const btnRemoveEngineEl = document.getElementById("btn-remove-engine");
const enginePathEl = document.getElementById("engine-path");
const btnEngineConnectEl = document.getElementById("btn-engine-connect");
const btnEngineDisconnectEl = document.getElementById("btn-engine-disconnect");
const btnEngineApplyEl = document.getElementById("btn-engine-apply");
const engineStatusEl = document.getElementById("engine-status");
const analysisTopPanelEl = document.getElementById("analysis-top-panel");
const analysisEnabledToggleEl = document.getElementById("analysis-enabled-toggle");
const analysisTopEvalEl = document.getElementById("analysis-top-eval");
const analysisEngineNameEl = document.getElementById("analysis-engine-name");
const analysisEngineStatsEl = document.getElementById("analysis-engine-stats");
const analysisOptionsBtnEl = document.getElementById("analysis-options-btn");
const analysisOptionsPanelEl = document.getElementById("analysis-options-panel");
const analysisOptionsEngineEl = document.getElementById("analysis-options-engine");
const analysisDepthEl = document.getElementById("analysis-depth");
const analysisDepthValueEl = document.getElementById("analysis-depth-value");
const analysisMultiPvEl = document.getElementById("analysis-multipv");
const analysisMultiPvValueEl = document.getElementById("analysis-multipv-value");
const analysisThreadsEl = document.getElementById("analysis-threads");
const analysisThreadsValueEl = document.getElementById("analysis-threads-value");
const analysisHashEl = document.getElementById("analysis-hash");
const analysisHashValueEl = document.getElementById("analysis-hash-value");
const analysisLinesPanelEl = document.getElementById("analysis-lines-panel");
const analysisFunctionBarEl = document.getElementById("analysis-function-bar");
const analysisLeftColumnEl = document.getElementById("analysis-left-column");
const crazyhousePocketPanelEl = document.getElementById("crazyhouse-pocket-panel");
const crazyhousePocketGridWhiteEl = document.getElementById("crazyhouse-pocket-grid-white");
const crazyhousePocketGridBlackEl = document.getElementById("crazyhouse-pocket-grid-black");
const analysisFenPanelEl = document.getElementById("analysis-fen-panel");
const analysisFenTextEl = document.getElementById("analysis-fen-text");
const analysisLoadFenBtnEl = document.getElementById("btn-analysis-load-fen");
const analysisPgnPanelEl = document.getElementById("analysis-pgn-panel");
const analysisPgnTextEl = document.getElementById("analysis-pgn-text");
const analysisInfoPanelEl = document.getElementById("analysis-info-panel");
const analysisInfoTextEl = document.getElementById("analysis-info-text");
const analysisComputerSummaryPanelEl = document.getElementById("analysis-computer-summary-panel");
const onlineChatPanelEl = document.getElementById("online-chat-panel");
const onlineChatStatusEl = document.getElementById("online-chat-status");
const onlineChatListEl = document.getElementById("online-chat-list");
const onlineChatInputEl = document.getElementById("online-chat-input");
const onlineChatSendBtnEl = document.getElementById("btn-online-chat-send");
const editorPanelEl = document.getElementById("editor-panel");
const editorPieceGridEl = document.getElementById("editor-piece-grid");
const editorEraseBtnEl = document.getElementById("btn-editor-erase");
const editorFlipBtnEl = document.getElementById("btn-editor-flip");
const editorClearBtnEl = document.getElementById("btn-editor-clear");
const editorStartposBtnEl = document.getElementById("btn-editor-startpos");
const editorHomeBtnEl = document.getElementById("btn-editor-home");
const editorTurnWBtnEl = document.getElementById("btn-editor-turn-w");
const editorTurnBBtnEl = document.getElementById("btn-editor-turn-b");
const editorCastleKEl = document.getElementById("editor-castle-k");
const editorCastleQEl = document.getElementById("editor-castle-q");
const editorCastlekEl = document.getElementById("editor-castle-kb");
const editorCastleqEl = document.getElementById("editor-castle-qb");
const editorEpEl = document.getElementById("editor-ep");
const editorHalfmoveEl = document.getElementById("editor-halfmove");
const editorFullmoveEl = document.getElementById("editor-fullmove");
const editorFenOutputEl = document.getElementById("editor-fen-output");
const editorValidateBtnEl = document.getElementById("btn-editor-validate");
const editorUseAnalysisBtnEl = document.getElementById("btn-editor-use-analysis");
const editorPlayEngineBtnEl = document.getElementById("btn-editor-play-engine");
const editorValidationMsgEl = document.getElementById("editor-validation-msg");
const editorControlsTitleEl = document.getElementById("editor-controls-title");
const editorToolNoteEl = document.getElementById("editor-tool-note");
const tablebasePanelEl = document.getElementById("tablebase-panel");
const tablebaseStatusPillEl = document.getElementById("tablebase-status-pill");
const btnTablebaseTrainingEl = document.getElementById("btn-tablebase-training");
const tablebaseTrainingModalEl = document.getElementById("tablebase-training-modal");
const btnTablebaseTrainingCloseEl = document.getElementById("btn-tablebase-training-close");
const btnTablebaseTrainWhiteEl = document.getElementById("btn-tablebase-train-white");
const btnTablebaseTrainBlackEl = document.getElementById("btn-tablebase-train-black");
const tablebaseTrainingReviewEl = document.getElementById("tablebase-training-review");
const tablebaseTrainingHintEnabledEl = document.getElementById("tablebase-training-hint-enabled");
const btnTablebaseTrainingStartEl = document.getElementById("btn-tablebase-training-start");
const btnTablebaseTrainingCancelEl = document.getElementById("btn-tablebase-training-cancel");
const tablebaseTrainingMsgEl = document.getElementById("tablebase-training-msg");
const tablebaseSummaryEl = document.getElementById("tablebase-summary");
const tablebaseMetricsEl = document.getElementById("tablebase-metrics");
const tablebaseErrorEl = document.getElementById("tablebase-error");
const tablebaseMovesEl = document.getElementById("tablebase-moves");
const analysisGeneratePgnBtnEl = document.getElementById("btn-analysis-generate-pgn");
const analysisLoadPgnBtnEl = document.getElementById("btn-analysis-load-pgn");
const analysisSavePgnBtnEl = document.getElementById("btn-analysis-save-pgn");
const renameEngineModalEl = document.getElementById("rename-engine-modal");
const renameEngineInputEl = document.getElementById("rename-engine-input");
const btnRenameEngineSaveEl = document.getElementById("btn-rename-engine-save");
const btnRenameEngineCancelEl = document.getElementById("btn-rename-engine-cancel");
const btnRenameEngineCloseEl = document.getElementById("btn-rename-engine-close");
const optThreadsEl = document.getElementById("opt-threads");
const optThreadsValueEl = document.getElementById("opt-threads-value");
const optHashEl = document.getElementById("opt-hash");
const optHashValueEl = document.getElementById("opt-hash-value");
const optMultiPvEl = document.getElementById("opt-multipv");
const optMultiPvValueEl = document.getElementById("opt-multipv-value");
const optSkillEl = document.getElementById("opt-skill");
const optSkillValueEl = document.getElementById("opt-skill-value");
const optEloEl = document.getElementById("opt-elo");
const optEloValueEl = document.getElementById("opt-elo-value");
const optLimitStrengthEl = document.getElementById("opt-limit-strength");
const mainTimeSliderEl = document.getElementById("main-time-slider");
const mainTimeValueEl = document.getElementById("main-time-value");
const incrementSliderEl = document.getElementById("increment-slider");
const incrementValueEl = document.getElementById("increment-value");
const sideWhiteEl = document.getElementById("side-white");
const sideBlackEl = document.getElementById("side-black");
const sideRandomEl = document.getElementById("side-random");
const btnSetupPlayEl = document.getElementById("btn-setup-play");
const boardShellEl = document.getElementById("board-shell");
const analysisEvalBarEl = document.getElementById("analysis-eval-bar");
const analysisEvalTextEl = document.getElementById("analysis-eval-text");
const boardAnnotationsEl = document.getElementById("board-annotations");
const resizeHandleEl = document.getElementById("board-resize-handle");
const promotionMenuEl = document.getElementById("promotion-menu");
const mainMenuBtnEl = document.getElementById("btn-main-menu");
const moveListEl = document.getElementById("move-list");
const moveContextMenuEl = document.getElementById("move-context-menu");
const deleteFromHereBtnEl = document.getElementById("btn-delete-from-here");
const archiveContextMenuEl = document.getElementById("archive-context-menu");
const archiveDeleteBtnEl = document.getElementById("btn-archive-delete");
const variationPickerMenuEl = document.getElementById("variation-picker-menu");
const infoBannerEl = document.getElementById("info-banner");
const infoTextEl = document.getElementById("info-text");
const clockTopEl = document.getElementById("clock-top");
const clockTopTimeEl = document.getElementById("clock-top-time");
const clockTopProgressEl = document.getElementById("clock-top-progress");
const materialTopEl = document.getElementById("material-top");
const clockBottomEl = document.getElementById("clock-bottom");
const clockBottomTimeEl = document.getElementById("clock-bottom-time");
const clockBottomProgressEl = document.getElementById("clock-bottom-progress");
const materialBottomEl = document.getElementById("material-bottom");
const playerTopBarEl = document.getElementById("player-top-bar");
const playerTopNameEl = document.getElementById("player-top-name");
const rematchBtnEl = document.getElementById("btn-rematch");
const playerBottomBarEl = document.getElementById("player-bottom-bar");
const playerControlsBarEl = document.getElementById("player-controls-bar");
const postGameAnalysisBtnEl = document.getElementById("btn-postgame-analysis");
const analysisFlipBoardBtnEl = document.getElementById("btn-analysis-flip-board");
const analysisToggleJudgmentsBtnEl = document.getElementById("btn-analysis-toggle-judgments");
const analysisMainMenuBtnEl = document.getElementById("btn-analysis-main-menu");
const playerBottomNameEl = document.getElementById("player-bottom-name");
const flipBoardBtnEl = document.getElementById("btn-flip-board");
const botTournamentSpectatorBackBtnEl = document.getElementById("btn-bot-tournament-spectator-back");
const undoPairBtnEl = document.getElementById("btn-undo-pair");
const btnTablebaseBackSetupEl = document.getElementById("btn-tablebase-back-setup");
const btnTablebaseTrainingHintEl = document.getElementById("btn-tablebase-training-hint");
const btnTablebaseExitTrainingEl = document.getElementById("btn-tablebase-exit-training");
const btnPuzzleHintEl = document.getElementById("btn-puzzle-hint");
const btnPuzzleExitEl = document.getElementById("btn-puzzle-exit");
const btnPuzzleNextEl = document.getElementById("btn-puzzle-next");
const btnPuzzleAnalyzeEl = document.getElementById("btn-puzzle-analyze");
const btnAnalysisComputerEl = document.getElementById("btn-analysis-computer");
const onlineDrawBtnEl = document.getElementById("btn-online-draw");
const onlineDrawAcceptBtnEl = document.getElementById("btn-online-draw-accept");
const onlineDrawRejectBtnEl = document.getElementById("btn-online-draw-reject");
const onlineTakebackBtnEl = document.getElementById("btn-online-takeback");
const onlineTakebackAcceptBtnEl = document.getElementById("btn-online-takeback-accept");
const onlineTakebackRejectBtnEl = document.getElementById("btn-online-takeback-reject");
const resignBtnEl = document.getElementById("btn-resign");

const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
const ranks = ["8", "7", "6", "5", "4", "3", "2", "1"];
const KING_OF_THE_HILL_SQUARES = new Set(["d4", "d5", "e4", "e5"]);
const RACING_KINGS_TARGET_SQUARES = new Set(["a8", "b8", "c8", "d8", "e8", "f8", "g8", "h8"]);

const PIECE_CODE = {
  wp: "wP",
  wn: "wN",
  wb: "wB",
  wr: "wR",
  wq: "wQ",
  wk: "wK",
  bp: "bP",
  bn: "bN",
  bb: "bB",
  br: "bR",
  bq: "bQ",
  bk: "bK"
};
const COMPUTER_ANALYSIS_MOVE_TIME_MS = 2000;
const COMPUTER_ANALYSIS_MAX_PER_MOVE_MS = 2200;

const state = {
  game: new Chess(),
  playStartFen: new Chess().fen(),
  currentGameStartFen: new Chess().fen(),
  currentVariant: "standard",
  appMode: "play",
  viewPly: 0,
  selectedSquare: null,
  premoveSelectFrom: null,
  premove: null,
  legalTargets: new Set(),
  captureTargets: new Set(),
  moveOptionsByTarget: new Map(),
  selectedDropPiece: null,
  selectedDropColor: null,
  promotion: null,
  drag: null,
  suppressNextClick: false,
  annotations: {
    highlightedSquares: new Set(),
    arrows: [],
    rightDrag: null
  },
  clocks: {
    whiteMs: 60 * 1000,
    blackMs: 60 * 1000,
    lastTickTs: null,
    rafId: null
  },
  timeoutLoser: null,
  resignedColor: null,
  resignConfirmUntil: 0,
  resignConfirmTimerId: null,
  isUnlimitedTime: false,
  boardFlipped: false,
  player2Color: "w",
  player2ColorPref: "random",
  premoveEnabled: true,
  editor: {
    board: {},
    selectedTool: "wp",
    turn: "w",
    castling: { K: true, Q: true, k: true, q: true },
    ep: "-",
    halfmove: 0,
    fullmove: 1
  },
  tablebase: {
    setup: {
      board: {},
      selectedTool: "wk",
      turn: "w",
      castling: { K: false, Q: false, k: false, q: false },
      ep: "-",
      halfmove: 0,
      fullmove: 1
    },
    session: {
      startFen: "",
      currentFen: "",
      fetchStatus: "idle",
      requestSeq: 0,
      position: null,
      moves: [],
      error: ""
    },
    training: {
      panelOpen: false,
      selectedColor: "w",
      reviewEnabled: false,
      hintEnabled: false,
      active: false,
      finished: false,
      config: { userColor: "w", reviewEnabled: false, hintEnabled: false },
      snapshot: null,
      startFen: "",
      pendingAutoReply: false,
      lastResult: "",
      shownHintUci: ""
    }
  },
  analysis: {
    enabled: true,
    optionsOpen: false,
    showJudgmentMarkers: true,
    judgmentCycleState: {},
    depthPresetIndex: 1,
    requestSeq: 0,
    activeSeq: 0,
    timerId: null,
    lastFenRequested: "",
    requestTurnColor: "w",
    searching: false,
    eval: null,
    lines: new Map(),
    depth: null,
    hashPermill: null,
    computer: {
      running: false,
      queue: [],
      results: [],
      currentIndex: -1,
      currentEval: null,
      moveTimeMs:COMPUTER_ANALYSIS_MOVE_TIME_MS,
      stopTimerId: null,
      timeoutId: null
    }
  },
  analysisPgnMeta: {
    tags: {},
    rootComments: []
  },
  analysisPgnDirty: true,
  analysisTree: null,
  selectedEngine: "",
  defaultEngine: "",
  engines: [],
  engineRuntime: {
    connected: false,
    connectedEngineId: "",
    ready: false,
    idName: "",
    displayName: "",
    stdoutBuffer: "",
    options: new Map(),
    thinking: false,
    searchKind: null,
    playStopTimerId: null
  },
  lastRenderedGamePly: -1,
  autoSave: {
    inFlight: false,
    lastSavedKey: ""
  },
  profile: {
    name: "Player 2",
    avatarDataUrl: "",
    syncOnlineName: false
  },
  theme: {
    boardImage: "../assets/board/wood4.jpg",
    pieceSet: "cburnett",
    soundSet: "standard",
    appBackgroundMode: "default",
    appBackgroundValue: ""
  },
  sound: {
    lowTimePlayed: { w: false, b: false },
    gameEndKey: ""
  },
  online: {
    connected: false,
    backendUrl: "",
    account: null,
    ratings: null,
    incomingChallenges: new Map(),
    blockChallenges: false,
    activeGames: new Map(),
    currentGameId: "",
    currentColor: "w",
    currentInitialFen: new Chess().fen(),
    currentMovesUci: "",
    finished: false,
    finishStatus: "",
    finishWinner: "",
    userFlipped: false,
    pendingMatchRequest: null,
    pendingAcceptedChallengeId: "",
    chatByGame: new Map()
  },
  archive: {
    tab: "offline",
    cachedItems: [],
    currentAnalysisSource: null,
    currentAnalysisReport: null,
    bulk: {
      running: false,
      cancelRequested: false,
      queue: [],
      depth: 10,
      selectedCount: "all",
      currentIndex: -1,
      currentItemName: "",
      completed: 0,
      skippedExisting: 0,
      skippedUnsupported: 0,
      failed: 0,
      durationsMs: [],
      currentStartedAt: 0,
      etaTimerId: null
    }
  },
  bots: {
    active: false,
    currentBotId: "",
    currentBotDisplayName: "",
    currentBotSearchMode: "movetime",
    currentBotNodes: 1
  },
  botTournamentSpectator: {
    active: false,
    tournamentId: "",
    pairingKey: "",
    whiteName: "",
    blackName: "",
    whiteStartMs: 0,
    blackStartMs: 0,
    whiteMs: 0,
    blackMs: 0,
    incrementMs: 0,
    activeColor: "w"
  },
  botTournamentHumanGame: {
    active: false,
    tournamentId: "",
    pairingKey: "",
    humanColor: "w",
    humanName: "",
    resultReported: false
  },
  isFullscreen: false,
  homePlayModeAnimating: false,
  homePlayMode: "offline",
  customAssets: {
    pieceSets: new Map()
  }
};

const MIN_BOARD_SIZE = 420;
const MAX_BOARD_SIZE = 1100;
const BOARD_SIZE_STORAGE_KEY = "offline_chess_board_size";
const INITIAL_CLOCK_MS = 60 * 1000;
const LOW_TIME_THRESHOLD_MS = 10 * 1000;
let selectedInitialClockMs = INITIAL_CLOCK_MS;
let selectedIncrementMs = 0;
const ENGINES_STORAGE_KEY = "offline_chess_engines_v1";
const SELECTED_ENGINE_STORAGE_KEY = "offline_chess_selected_engine_v1";
const DEFAULT_ENGINE_STORAGE_KEY = "offline_chess_default_engine_v1";
const CUSTOM_BOTS_STORAGE_KEY = "offline_chess_custom_bots_v1";
const BUILTIN_BOT_OVERRIDES_STORAGE_KEY = "offline_chess_builtin_bot_overrides_v1";
const PROFILE_STORAGE_KEY = "offline_chess_profile_v1";
const THEME_STORAGE_KEY = "offline_chess_theme_v1";
const DEFAULT_PIECE_SET = "cburnett";
const BUILTIN_PIECE_SETS = new Set([
  "cburnett",
  "celtic",
  "chessnut",
  "fantasy",
  "firi",
  "governor",
  "kiwen-suwi",
  "kosal",
  "letter",
  "merida",
  "mpchess",
  "pirouetti",
  "pixel",
  "rhosgfx",
  "shahi-ivory-brown",
  "shapes",
  "spatial"
]);
const UCI_THREADS_SAFE_MAX = 32;
const DEVICE_THREADS_CAP =
  Number.isFinite(Number(navigator.hardwareConcurrency)) && Number(navigator.hardwareConcurrency) > 0
    ? Number(navigator.hardwareConcurrency)
    : UCI_THREADS_SAFE_MAX;
const UCI_HASH_SAFE_MAX_MB = 4096;
const UCI_MULTIPV_SAFE_MAX = 5;
const ENGINE_MOVE_TIME_MS = 700;
const BOT_NODE_SEARCH_MAX_MS = 8000;
const ANALYSIS_DEPTH_PRESETS = [15, 20, 25, 30, 35, null];
const ANALYSIS_PGN_DISPLAY_MODE = "safe-nested"; // "mainline" for instant rollback
let suppressAnalysisInfoInput = false;
const ANNOTATION_ARROW_COLOR = "rgba(69, 160, 70, 0.70)";
const TABLEBASE_HINT_ARROW_COLOR = "rgba(72, 141, 245, 0.78)";
const ANALYSIS_ARROW_STYLES = [
  { color: "rgba(72, 141, 245, 0.70)", thicknessScale: 1.25, opacity: 1 },
  { color: "rgba(150, 156, 168, 0.60)", thicknessScale: 1.0, opacity: 1 },
  { color: "rgba(150, 156, 168, 0.50)", thicknessScale: 0.8, opacity: 1 }
];
const DEFAULT_SOUND_SET = "standard";
const DEFAULT_PROFILE_AVATAR = "../assets/extras/user.png";
const THEME_SOUND_ICON = "../assets/extras/sound.png";
const DEFAULT_APP_BACKGROUND = "#2c2c2ce0";
const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9 };
const CHALLENGE_LIMIT_SECONDS = (() => {
  const base = [0, 15, 30, 45, 60, 90];
  for (let s = 120; s <= 10800; s += 60) {
    base.push(s);
  }
  return base;
})();
let appMessageTimerId = null;
let moveContextTargetPly = null;
let archiveContextTargetPath = "";
let pendingArchiveBulkDelete = null;
let suppressNextMoveListClick = false;
let pendingEditorPlayFen = null;
let accountDraftAvatarDataUrl = "";
let backgroundDraftMode = "default";
let backgroundDraftValue = "";
let chess960Module = null;
let puzzleModule = null;
let computerAnalysisModule = null;
let botsModule = null;
let botTournamentModule = null;
let variantsModule = null;
let tournamentModule = null;
let visionModule = null;
let boardEditorModule = null;
let tablebaseModule = null;

const CURATED_BOT_DEFINITIONS = [
  {
    id: "curated-bot-foxsee",
    name: "FoxSEE",
    rating: 2500,
    description: "A curated offline bot that launches instantly with standard chess settings.",
    enabled: true
  }
];

let curatedBotRecords = [];
let customBotRecords = [];
let builtinBotOverrides = {};
let activeThemeModalKind = "";
let computerAnalysisRunId = 0;

function hashArchivePgnText(text) {
  return crypto.createHash("sha256").update(String(text || "").trim(), "utf8").digest("hex");
}

function getBoardAnalysisJudgmentMarker(judgment) {
  switch (String(judgment || "").trim().toLowerCase()) {
    case "brilliant":
      return { text: "!!", className: "is-brilliant" };
    case "great":
      return { text: "!", className: "is-great" };
    case "inaccuracy":
      return { text: "?!", className: "is-inaccuracy" };
    case "mistake":
      return { text: "?", className: "is-mistake" };
    case "blunder":
      return { text: "??", className: "is-blunder" };
    default:
      return null;
  }
}

function formatBoardAnalysisAccuracyLabel(value) {
  return Number.isFinite(Number(value)) ? `${Math.round(Number(value))}%` : "--";
}

function formatBoardAnalysisJudgmentCount(value) {
  return Number.isFinite(Number(value)) ? String(Math.max(0, Math.trunc(Number(value)))) : "0";
}

function getComputerAnalysisResultMoveKey(item) {
  if (!item || typeof item !== "object") return "";
  const uci = String(item.uci || "").trim().toLowerCase();
  if (uci) return uci;
  const drop = String(item.drop || "").trim().toLowerCase();
  const to = String(item.to || "").trim().toLowerCase();
  if (drop && to) return `${drop}@${to}`;
  const from = String(item.from || "").trim().toLowerCase();
  const promotion = String(item.promotion || "").trim().toLowerCase();
  if (!from || !to) return "";
  return `${from}${to}${promotion}`;
}

function getHistoryMoveKey(move) {
  if (!move || typeof move !== "object") return "";
  const from = String(move.from || "").trim().toLowerCase();
  const to = String(move.to || "").trim().toLowerCase();
  const promotion = String(move.promotion || "").trim().toLowerCase();
  if (!from || !to) return "";
  return `${from}${to}${promotion}`;
}

function getSavedJudgmentDisplayState(history) {
  const savedResults =
    state.analysis.showJudgmentMarkers && Array.isArray(state.archive.currentAnalysisReport?.results)
      ? state.archive.currentAnalysisReport.results
      : [];
  const historyMoves = Array.isArray(history) ? history : [];
  const judgmentByPly = new Map();
  let prefixMatches = true;
  for (let index = 0; index < historyMoves.length; index += 1) {
    const ply = index + 1;
    const savedItem = savedResults[index];
    const historyMove = historyMoves[index];
    if (!savedItem || Number(savedItem?.ply) !== ply) {
      prefixMatches = false;
    } else if (prefixMatches) {
      prefixMatches = getHistoryMoveKey(historyMove) === getComputerAnalysisResultMoveKey(savedItem);
    }
    if (prefixMatches) {
      const marker = getBoardAnalysisJudgmentMarker(savedItem?.judgment);
      if (marker) judgmentByPly.set(ply, marker);
    }
  }
  return { savedResults, judgmentByPly };
}

function renderAnalysisComputerSummaryPanel() {
  if (!analysisComputerSummaryPanelEl) return;
  const report = state.archive.currentAnalysisReport;
  const results = Array.isArray(report?.results) ? report.results : [];
  if (!results.length) {
    analysisComputerSummaryPanelEl.classList.add("hidden");
    analysisComputerSummaryPanelEl.innerHTML = "";
    return;
  }
  const whiteName = String(report?.tags?.White || "White").trim() || "White";
  const blackName = String(report?.tags?.Black || "Black").trim() || "Black";
  const whiteJudgments = report?.judgmentCountsByColor?.white || {};
  const blackJudgments = report?.judgmentCountsByColor?.black || {};
  analysisComputerSummaryPanelEl.classList.remove("hidden");
  analysisComputerSummaryPanelEl.innerHTML = `
    <div class="analysis-info-header">Computer Analysis</div>
    <div class="analysis-computer-summary-body">
      <div class="analysis-computer-summary-card is-white">
        <div class="analysis-computer-summary-label">${whiteName} Accuracy</div>
        <div class="analysis-computer-summary-value">${formatBoardAnalysisAccuracyLabel(report?.whiteAccuracy)}</div>
        <div class="analysis-computer-summary-stats">
          <span class="analysis-computer-summary-stat is-brilliant" data-board-judgment-side="w" data-board-judgment-type="brilliant" tabindex="0" role="button">!! ${formatBoardAnalysisJudgmentCount(whiteJudgments.brilliant)}</span>
          <span class="analysis-computer-summary-stat is-great" data-board-judgment-side="w" data-board-judgment-type="great" tabindex="0" role="button">! ${formatBoardAnalysisJudgmentCount(whiteJudgments.great)}</span>
          <span class="analysis-computer-summary-stat is-inaccuracy" data-board-judgment-side="w" data-board-judgment-type="inaccuracy" tabindex="0" role="button">?! ${formatBoardAnalysisJudgmentCount(whiteJudgments.inaccuracy)}</span>
          <span class="analysis-computer-summary-stat is-mistake" data-board-judgment-side="w" data-board-judgment-type="mistake" tabindex="0" role="button">? ${formatBoardAnalysisJudgmentCount(whiteJudgments.mistake)}</span>
          <span class="analysis-computer-summary-stat is-blunder" data-board-judgment-side="w" data-board-judgment-type="blunder" tabindex="0" role="button">?? ${formatBoardAnalysisJudgmentCount(whiteJudgments.blunder)}</span>
        </div>
      </div>
      <div class="analysis-computer-summary-card is-black">
        <div class="analysis-computer-summary-label">${blackName} Accuracy</div>
        <div class="analysis-computer-summary-value">${formatBoardAnalysisAccuracyLabel(report?.blackAccuracy)}</div>
        <div class="analysis-computer-summary-stats">
          <span class="analysis-computer-summary-stat is-brilliant" data-board-judgment-side="b" data-board-judgment-type="brilliant" tabindex="0" role="button">!! ${formatBoardAnalysisJudgmentCount(blackJudgments.brilliant)}</span>
          <span class="analysis-computer-summary-stat is-great" data-board-judgment-side="b" data-board-judgment-type="great" tabindex="0" role="button">! ${formatBoardAnalysisJudgmentCount(blackJudgments.great)}</span>
          <span class="analysis-computer-summary-stat is-inaccuracy" data-board-judgment-side="b" data-board-judgment-type="inaccuracy" tabindex="0" role="button">?! ${formatBoardAnalysisJudgmentCount(blackJudgments.inaccuracy)}</span>
          <span class="analysis-computer-summary-stat is-mistake" data-board-judgment-side="b" data-board-judgment-type="mistake" tabindex="0" role="button">? ${formatBoardAnalysisJudgmentCount(blackJudgments.mistake)}</span>
          <span class="analysis-computer-summary-stat is-blunder" data-board-judgment-side="b" data-board-judgment-type="blunder" tabindex="0" role="button">?? ${formatBoardAnalysisJudgmentCount(blackJudgments.blunder)}</span>
        </div>
      </div>
    </div>
  `;
}

function makeEmptyComputerAnalysisBridgeState() {
  return {
    running: false,
    runId: 0,
    variantKey: "standard",
    tags: {},
    startFen: "",
    startTurn: "w",
    queue: [],
    results: [],
    currentIndex: -1,
    currentEval: null,
    currentDepth: 10,
    baselineEval: null,
    baselineBestMoveUci: "",
    analyzingBaseline: false,
    sourceArchivePath: "",
    sourcePgnHash: "",
    sourcePgnText: "",
    silent: false,
    callbacks: null,
    stopTimerId: null,
    timeoutId: null
  };
}

let computerAnalysisBridge = makeEmptyComputerAnalysisBridgeState();

function ensureChess960Module() {
  if (chess960Module) return chess960Module;
  chess960Module = createChess960Module({
    Chess,
    homeProfileEl,
    homeScreenEl,
    toolsScreenEl,
    chess960ScreenEl,
    gameScreenEl,
    chess960BoardWrapEl,
    chess960BoardEl,
    chess960ResizeHandleEl,
    chess960FenOutputEl,
    closeHomeProfileMenu,
    closeHomeOnlinePanels,
    updateHomeOnlineToolbarVisibility,
    pieceAssetPath,
    getBoardImage: () => state.theme.boardImage || "../assets/board/wood4.jpg"
  });
  return chess960Module;
}

function ensurePuzzleModule() {
  if (puzzleModule) return puzzleModule;
  puzzleModule = createPuzzleModule({
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
    closeHomeProfileMenu: () => modalHelpers.closeHomeProfileMenu(),
    closeHomeOnlinePanels,
    updateHomeOnlineToolbarVisibility,
    setAppMode,
    showAppMessage,
    showGameScreen,
    render,
    resetStandaloneGame,
    openAnalysisForFen,
    applySystemMove: (moveInput) => {
      attemptMove(moveInput, { skipPuzzleValidation: true, puzzleSystemMove: true });
      render();
    },
    setBoardHintArrow: (uci) => setSingleBoardArrow(uci),
    clearBoardHintArrow: () => {
      clearBoardAnnotations();
    }
  });
  return puzzleModule;
}

function ensureComputerAnalysisModule() {
  if (computerAnalysisModule) return computerAnalysisModule;
  computerAnalysisModule = createComputerAnalysisModule({
    computerAnalysisScreenEl,
    computerAnalysisRootEl,
    homeProfileEl,
    homeScreenEl,
    toolsScreenEl,
    puzzleScreenEl,
    variantsScreenEl,
    chess960ScreenEl,
    tournamentScreenEl,
    visionScreenEl,
    gameScreenEl,
    closeHomeProfileMenu: () => modalHelpers.closeHomeProfileMenu(),
    closeHomeOnlinePanels,
    updateHomeOnlineToolbarVisibility,
    setAppMode,
    showHomeScreen,
    openAnalysisFromPgn: openAnalysisFromComputerAnalysis,
    showAppMessage,
    pieceAssetPath,
    getBoardImage: () => state.theme.boardImage || "../assets/board/wood4.jpg",
    startRun: startComputerAnalysisModuleRun,
    stopRun: stopComputerAnalysisBridgeRun
  });
  return computerAnalysisModule;
}

async function refreshCuratedBotRecords() {
  try {
    const res = await ipcRenderer.invoke("bots:listBuiltin");
    curatedBotRecords = res?.ok && Array.isArray(res.items) ? res.items : [];
  } catch (_) {
    curatedBotRecords = [];
  }
  return curatedBotRecords;
}

function saveCustomBotRegistry() {
  try {
    localStorage.setItem(CUSTOM_BOTS_STORAGE_KEY, JSON.stringify(customBotRecords));
  } catch (_) {
    // ignore storage errors
  }
}

function saveBuiltinBotOverrides() {
  try {
    localStorage.setItem(BUILTIN_BOT_OVERRIDES_STORAGE_KEY, JSON.stringify(builtinBotOverrides));
  } catch (_) {
    // ignore storage errors
  }
}

function loadCustomBotRegistry() {
  try {
    const raw = localStorage.getItem(CUSTOM_BOTS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    customBotRecords = Array.isArray(parsed)
      ? parsed
          .filter((item) => String(item?.kind || "uci").trim().toLowerCase() !== "odds")
          .filter((item) => item && typeof item.id === "string" && typeof item.name === "string" && typeof item.enginePath === "string")
          .map((item) => ({
            id: item.id,
            name: item.name,
            rating: Number.isFinite(Number(item.rating)) ? Math.max(100, Math.round(Number(item.rating))) : 2500,
            enginePath: item.enginePath,
            kind: String(item.kind || "uci").trim().toLowerCase() === "lc0" ? "lc0" : "uci",
            weightsPath: typeof item.weightsPath === "string" ? item.weightsPath : "",
            searchMode: String(item.searchMode || "movetime").trim().toLowerCase() === "nodes" ? "nodes" : "movetime",
            nodes: Number.isFinite(Number(item.nodes)) ? Math.max(1, Math.round(Number(item.nodes))) : 1,
            description: typeof item.description === "string" ? item.description : "",
            enabled: item.enabled !== false
          }))
      : [];
  } catch (_) {
    customBotRecords = [];
  }
}

function loadBuiltinBotOverrides() {
  try {
    const raw = localStorage.getItem(BUILTIN_BOT_OVERRIDES_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    builtinBotOverrides = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (_) {
    builtinBotOverrides = {};
  }
}

function makeBotNameFromPath(filePath) {
  const normalized = String(filePath || "");
  const slashIdx = Math.max(normalized.lastIndexOf("\\"), normalized.lastIndexOf("/"));
  const base = slashIdx >= 0 ? normalized.slice(slashIdx + 1) : normalized;
  const dotIdx = base.lastIndexOf(".");
  return (dotIdx > 0 ? base.slice(0, dotIdx) : base).trim() || "Custom Bot";
}

function makeCustomBotId(filePath) {
  const normalized = String(filePath || "").trim().toLowerCase();
  const safe = normalized.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `custom-bot-${safe || Date.now()}`;
}

function formatBotDisplayName(name, rating) {
  const cleanName = String(name || "Bot").trim() || "Bot";
  const numericRating = Number(rating);
  return Number.isFinite(numericRating) ? `${cleanName} (${Math.max(100, Math.round(numericRating))})` : cleanName;
}

function inferLc0BotNameFromWeightsPath(filePath) {
  const normalized = String(filePath || "");
  const slashIdx = Math.max(normalized.lastIndexOf("\\"), normalized.lastIndexOf("/"));
  const base = slashIdx >= 0 ? normalized.slice(slashIdx + 1) : normalized;
  return base.replace(/\.pb(\.gz)?$/i, "").trim();
}

function inferLc0BotRating(name, fallback = 1800) {
  const match = String(name || "").match(/(\d{3,4})/);
  return match ? Math.max(100, Math.round(Number(match[1]))) : fallback;
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

function getBuiltinBotRuntimeById(botId) {
  return curatedBotRecords.find((item) => item.id === botId) || null;
}

function getCuratedBots() {
  const builtinBots = CURATED_BOT_DEFINITIONS.map((bot) => {
    const runtime = getBuiltinBotRuntimeById(bot.id);
    const override = builtinBotOverrides[bot.id] || {};
    const name = String(override.name || bot.name || "").trim() || bot.name;
    const rating = Number.isFinite(Number(override.rating)) ? Number(override.rating) : Number(bot.rating);
    const deleted = override.deleted === true;
    return {
      ...bot,
      name,
      rating,
      displayName: formatBotDisplayName(name, rating),
      enginePath: runtime?.path || "",
      enabled: !deleted && bot.enabled !== false && !!runtime?.path,
      isBuiltin: true,
      deleted
    };
  }).filter((bot) => !bot.deleted);
  return builtinBots.concat(
    customBotRecords.map((bot) => ({
      ...bot,
      displayName: formatBotDisplayName(bot.name, bot.rating),
      description: bot.description || "",
      enabled: bot.enabled !== false && !!bot.enginePath && (bot.kind === "uci" || !!bot.weightsPath),
      isBuiltin: false
    }))
  );
}

async function addBotFromFilePicker() {
  try {
    const picked = await ipcRenderer.invoke("file:pickFile", {
      filters: [
        { name: "Executables", extensions: ["exe"] },
        { name: "All Files", extensions: ["*"] }
      ]
    });
    if (!picked?.filePath) {
      return { ok: false, cancelled: true };
    }
    const enginePath = String(picked.filePath || "").trim();
    if (!enginePath) {
      return { ok: false, error: "Bot executable was not selected." };
    }
    const builtinMatch = curatedBotRecords.find((item) => String(item.path || "").trim().toLowerCase() === enginePath.toLowerCase()) || null;
    if (builtinMatch) {
      const next = { ...(builtinBotOverrides[builtinMatch.id] || {}), deleted: false };
      builtinBotOverrides = { ...builtinBotOverrides, [builtinMatch.id]: next };
      saveBuiltinBotOverrides();
      botsModule?.renderScreen?.();
      return { ok: true, restored: true, botId: builtinMatch.id };
    }
    const existing = customBotRecords.find((item) => String(item.enginePath || "").trim().toLowerCase() === enginePath.toLowerCase()) || null;
    const entry = {
      id: existing?.id || makeCustomBotId(enginePath),
      name: makeBotNameFromPath(enginePath),
      rating: existing?.rating || 2500,
      enginePath,
      description: "",
      enabled: true
    };
    if (existing) {
      customBotRecords = customBotRecords.map((item) => (item.id === existing.id ? entry : item));
    } else {
      customBotRecords = customBotRecords.concat(entry);
    }
    saveCustomBotRegistry();
    botsModule?.renderScreen?.();
    return { ok: true, bot: entry };
  } catch (err) {
    return { ok: false, error: String(err?.message || err || "Unable to add bot.") };
  }
}

async function pickBotExecutablePath() {
  try {
    const picked = await ipcRenderer.invoke("file:pickFile", {
      filters: [
        { name: "Executables", extensions: ["exe"] },
        { name: "All Files", extensions: ["*"] }
      ]
    });
    return String(picked?.filePath || "").trim();
  } catch (_) {
    return "";
  }
}

async function pickLc0WeightsPath() {
  try {
    const picked = await ipcRenderer.invoke("file:pickFile", {
      filters: [
        { name: "Lc0 Weights", extensions: ["pb.gz", "pb", "txt"] },
        { name: "All Files", extensions: ["*"] }
      ]
    });
    return String(picked?.filePath || "").trim();
  } catch (_) {
    return "";
  }
}

function addLc0BotProfile({ name, rating, enginePath, weightsPath, searchMode = "nodes", nodes = 1 } = {}) {
  const cleanEnginePath = String(enginePath || "").trim();
  const cleanWeightsPath = String(weightsPath || "").trim();
  if (!cleanEnginePath) {
    return { ok: false, error: "Lc0 engine executable is required." };
  }
  if (!cleanWeightsPath) {
    return { ok: false, error: "Weights file is required." };
  }
  const cleanName = String(name || "").trim() || inferLc0BotNameFromWeightsPath(cleanWeightsPath) || "Lc0 Bot";
  const normalizedRating = Number.isFinite(Number(rating)) ? Math.max(100, Math.round(Number(rating))) : inferLc0BotRating(cleanName, 1800);
  const existing = customBotRecords.find((item) =>
    item.kind === "lc0"
    && String(item.enginePath || "").trim().toLowerCase() === cleanEnginePath.toLowerCase()
    && String(item.weightsPath || "").trim().toLowerCase() === cleanWeightsPath.toLowerCase()
  ) || null;
  const entry = {
    id: existing?.id || makeCustomBotId(`${cleanEnginePath}::${cleanWeightsPath}`),
    kind: "lc0",
    name: cleanName,
    rating: normalizedRating,
    enginePath: cleanEnginePath,
    weightsPath: cleanWeightsPath,
    searchMode: searchMode === "nodes" ? "nodes" : "movetime",
    nodes: Number.isFinite(Number(nodes)) ? Math.max(1, Math.round(Number(nodes))) : 1,
    description: "",
    enabled: true
  };
  if (existing) {
    customBotRecords = customBotRecords.map((item) => (item.id === existing.id ? entry : item));
  } else {
    customBotRecords = customBotRecords.concat(entry);
  }
  saveCustomBotRegistry();
  botsModule?.renderScreen?.();
  return { ok: true, bot: entry };
}

function updateBotConfiguration(botId, { name, rating } = {}) {
  const normalizedName = String(name || "").trim() || "Bot";
  const normalizedRating = Number.isFinite(Number(rating)) ? Math.max(100, Math.round(Number(rating))) : 2500;
  const builtin = CURATED_BOT_DEFINITIONS.find((item) => item.id === botId) || null;
  if (builtin) {
    builtinBotOverrides = {
      ...builtinBotOverrides,
      [botId]: {
        ...(builtinBotOverrides[botId] || {}),
        name: normalizedName,
        rating: normalizedRating,
        deleted: false
      }
    };
    saveBuiltinBotOverrides();
    botsModule?.renderScreen?.();
    return { ok: true };
  }
  const existing = customBotRecords.find((item) => item.id === botId) || null;
  if (!existing) {
    return { ok: false, error: "Bot was not found." };
  }
  customBotRecords = customBotRecords.map((item) =>
    item.id === botId
      ? {
          ...item,
          name: normalizedName,
          rating: normalizedRating
        }
      : item
  );
  saveCustomBotRegistry();
  botsModule?.renderScreen?.();
  return { ok: true };
}

function deleteBotConfiguration(botId) {
  const builtin = CURATED_BOT_DEFINITIONS.find((item) => item.id === botId) || null;
  if (builtin) {
    builtinBotOverrides = {
      ...builtinBotOverrides,
      [botId]: {
        ...(builtinBotOverrides[botId] || {}),
        deleted: true
      }
    };
    saveBuiltinBotOverrides();
    botsModule?.renderScreen?.();
    return { ok: true };
  }
  const nextBots = customBotRecords.filter((item) => item.id !== botId);
  if (nextBots.length === customBotRecords.length) {
    return { ok: false, error: "Bot was not found." };
  }
  customBotRecords = nextBots;
  saveCustomBotRegistry();
  botsModule?.renderScreen?.();
  return { ok: true };
}

function ensureBotsModule() {
  if (botsModule) return botsModule;
  botsModule = createBotsModule({
    botsScreenEl,
    botsRootEl,
    homeProfileEl,
    homeScreenEl,
    toolsScreenEl,
    puzzleScreenEl,
    computerAnalysisScreenEl,
    botTournamentScreenEl,
    variantsScreenEl,
    chess960ScreenEl,
    tournamentScreenEl,
    visionScreenEl,
    gameScreenEl,
    closeHomeProfileMenu,
    closeHomeOnlinePanels,
    updateHomeOnlineToolbarVisibility,
    getCuratedBots,
    startCuratedBotGame,
    addBotFromFilePicker,
    addLc0BotProfile,
    pickBotExecutablePath,
    pickLc0WeightsPath,
    inferLc0BotNameFromWeightsPath,
    inferLc0BotRating,
    updateBotConfiguration,
    deleteBotConfiguration,
    openBotsTournament: () => ensureBotTournamentModule().showScreen()
  });
  return botsModule;
}

function ensureBotTournamentModule() {
  if (botTournamentModule) return botTournamentModule;
  botTournamentModule = createBotTournamentModule({
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
    getProfileName: () => String(state.profile.name || "Player"),
    openHumanMatch: startBotTournamentHumanMatch,
    openSpectatorGame: openBotTournamentSpectatorGame,
    updateSpectatorGame: updateBotTournamentSpectatorGame,
    closeSpectatorGame: clearBotTournamentSpectatorState
  });
  return botTournamentModule;
}

function ensureVariantsModule() {
  if (variantsModule) return variantsModule;
  variantsModule = createVariantsModule({
    variantsScreenEl,
    variantsRootEl,
    homeProfileEl,
    homeScreenEl,
    toolsScreenEl,
    puzzleScreenEl,
    chess960ScreenEl,
    tournamentScreenEl,
    visionScreenEl,
    gameScreenEl,
    closeHomeProfileMenu: () => modalHelpers.closeHomeProfileMenu(),
    closeHomeOnlinePanels,
    updateHomeOnlineToolbarVisibility,
    startChess960VariantGame,
    startThreeCheckVariantGame,
    startKingOfTheHillVariantGame,
    startAntichessVariantGame,
    startAtomicVariantGame,
    startHordeVariantGame,
    startRacingKingsVariantGame,
    startCrazyhouseVariantGame
  });
  return variantsModule;
}

function ensureTournamentModule() {
  if (tournamentModule) return tournamentModule;
  tournamentModule = createTournamentModule({
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
  });
  return tournamentModule;
}

function ensureVisionModule() {
  if (visionModule) return visionModule;
  visionModule = createChessVisionModule({
    ipcRenderer,
    homeProfileEl,
    homeScreenEl,
    toolsScreenEl,
    chess960ScreenEl,
    tournamentScreenEl,
    visionScreenEl,
    gameScreenEl,
    closeHomeProfileMenu,
    closeHomeOnlinePanels,
    updateHomeOnlineToolbarVisibility,
    loadFenIntoAnalysis,
    showAppMessage
  });
  return visionModule;
}

function ensureBoardEditorModule() {
  if (boardEditorModule) return boardEditorModule;
  boardEditorModule = createBoardEditorModule({
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
    startEditorPaletteDrag,
    setPendingEditorPlayFen: (fen) => {
      pendingEditorPlayFen = fen;
    },
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
  });
  return boardEditorModule;
}

function ensureTablebaseModule() {
  if (tablebaseModule) return tablebaseModule;
  tablebaseModule = createTablebaseModule({
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
  });
  return tablebaseModule;
}

const navigationHelpers = createNavigationHelpers({
  state,
  elements: {
    gameScreenEl,
    homeProfileEl,
    homeScreenEl,
    toolsScreenEl,
    puzzleScreenEl,
    computerAnalysisScreenEl,
    botTournamentScreenEl,
    variantsScreenEl,
    chess960ScreenEl,
    tournamentScreenEl,
    visionScreenEl,
    onlineChatInputEl,
    analysisEvalBarEl,
    analysisEnabledToggleEl,
    analysisTopPanelEl,
    analysisLinesPanelEl,
    analysisFunctionBarEl,
    analysisLeftColumnEl,
    analysisFenPanelEl,
    analysisPgnPanelEl,
    analysisInfoPanelEl,
    analysisOptionsPanelEl,
    sidePanelEl
  },
  hideMoveContextMenu,
  hideVariationPickerMenu,
  closeHomeProfileMenu: () => modalHelpers.closeHomeProfileMenu(),
  closeHomeOnlinePanels,
  updateHomeOnlineToolbarVisibility,
  renderHomePlayModeBar,
  getBotsModule: () => ensureBotsModule(),
  getChess960Module: () => ensureChess960Module(),
  getComputerAnalysisModule: () => ensureComputerAnalysisModule(),
  getPuzzleModule: () => ensurePuzzleModule(),
  getVariantsModule: () => ensureVariantsModule(),
  getTournamentModule: () => ensureTournamentModule(),
  getVisionModule: () => ensureVisionModule(),
  visionExperimentalEnabled: VISION_EXPERIMENTAL_ENABLED,
  showAppMessage,
  applyBoardSize,
  getMinBoardSize: () => MIN_BOARD_SIZE,
  getBoardWidth: () => boardShellEl.getBoundingClientRect().width
});
const modalHelpers = createModalHelpers({
  state,
  elements: {
    setupModalEl,
    engineControlsModalEl,
    homeProfileMenuEl,
    onlineModalEl,
    accountModalEl,
    accountNameInputEl,
    accountSyncOnlineEl,
    accountAvatarPreviewEl,
    accountAvatarInputEl,
    archiveModalEl,
    archiveDeleteConfirmModalEl,
    archiveDeleteProgressTextEl,
    archiveDeleteProgressFillEl,
    archiveDeleteProgressModalEl,
    themeModalEl,
    backgroundMsgEl,
    backgroundColorWrapEl,
    backgroundImageWrapEl,
    backgroundColorInputEl,
    backgroundPreviewEl,
    backgroundImageInputEl,
    backgroundModalEl,
    btnBackgroundFullscreenToggleEl
  },
  constants: {
    defaultProfileAvatar: DEFAULT_PROFILE_AVATAR,
    defaultAppBackground: DEFAULT_APP_BACKGROUND
  },
  callbacks: {
    renderEngineRegistry,
    renderSetupEngineDisplay,
    applySetupSlidersFromSelection,
    setPlayer2ColorPreference,
    hydrateOnlineSessionUi,
    renderOnlineIncomingChallenges,
    renderOnlineActiveGames,
    setAccountMessage,
    hideArchiveContextMenu,
    setPendingArchiveBulkDelete: (value) => {
      pendingArchiveBulkDelete = value;
    }
  },
  drafts: {
    setPendingEditorPlayFen: (value) => {
      pendingEditorPlayFen = value;
    },
    setAccountDraftAvatarDataUrl: (value) => {
      accountDraftAvatarDataUrl = value;
    },
    getBackgroundDraftMode: () => backgroundDraftMode,
    setBackgroundDraftMode: (value) => {
      backgroundDraftMode = value;
    },
    getBackgroundDraftValue: () => backgroundDraftValue,
    setBackgroundDraftValue: (value) => {
      backgroundDraftValue = value;
    },
    setActiveThemeModalKind: (value) => {
      activeThemeModalKind = value;
    }
  }
});

let soundEffects = {};

function formatMainTimeValue(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function isCurrentChess960VariantGame() {
  return state.currentVariant === "chess960";
}

function isCurrentThreeCheckVariantGame() {
  return state.currentVariant === "threecheck";
}

function isCurrentKingOfTheHillVariantGame() {
  return state.currentVariant === "kingofthehill";
}

function isCurrentAntichessVariantGame() {
  return state.currentVariant === "antichess";
}

function isCurrentAtomicVariantGame() {
  return state.currentVariant === "atomic";
}

function isCurrentHordeVariantGame() {
  return state.currentVariant === "horde";
}

function isCurrentRacingKingsVariantGame() {
  return state.currentVariant === "racingkings";
}

function isCurrentCrazyhouseVariantGame() {
  return state.currentVariant === "crazyhouse";
}

function getHumanPlayerColor() {
  return state.player2Color === "b" ? "b" : "w";
}

function isCurrentFairyVariantGame() {
  return (
    isCurrentChess960VariantGame()
    || isCurrentThreeCheckVariantGame()
    || isCurrentKingOfTheHillVariantGame()
    || isCurrentAntichessVariantGame()
    || isCurrentAtomicVariantGame()
    || isCurrentHordeVariantGame()
    || isCurrentRacingKingsVariantGame()
    || isCurrentCrazyhouseVariantGame()
  );
}

function getCurrentFairyVariantName() {
  if (isCurrentChess960VariantGame()) return "fischerandom";
  if (isCurrentThreeCheckVariantGame()) return "3check";
  if (isCurrentKingOfTheHillVariantGame()) return "kingofthehill";
  if (isCurrentAntichessVariantGame()) return "antichess";
  if (isCurrentAtomicVariantGame()) return "atomic";
  if (isCurrentHordeVariantGame()) return "horde";
  if (isCurrentRacingKingsVariantGame()) return "racingkings";
  if (isCurrentCrazyhouseVariantGame()) return "crazyhouse";
  return "chess";
}

function getFairyVariantNameForVariantKey(variantKey) {
  const key = String(variantKey || "").trim().toLowerCase();
  if (key === "chess960") return "fischerandom";
  if (key === "threecheck") return "3check";
  if (key === "kingofthehill") return "kingofthehill";
  if (key === "antichess") return "antichess";
  if (key === "atomic") return "atomic";
  if (key === "horde") return "horde";
  if (key === "racingkings") return "racingkings";
  if (key === "crazyhouse") return "crazyhouse";
  return "chess";
}

function getDefaultStartFenForVariant(variantKey) {
  if (variantKey === "threecheck") {
    return "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 3+3 0 1";
  }
  if (variantKey === "antichess") {
    return "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1";
  }
  if (variantKey === "horde") {
    return "rnbqkbnr/pppppppp/8/1PP2PP1/PPPPPPPP/PPPPPPPP/PPPPPPPP/PPPPPPPP w kq - 0 1";
  }
  if (variantKey === "racingkings") {
    return "8/8/8/8/8/8/krbnNBRK/qrbnNBRQ w - - 0 1";
  }
  if (variantKey === "crazyhouse") {
    return "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR[] w KQkq - 0 1";
  }
  return new Chess().fen();
}

function getCurrentVariantDisplayName() {
  if (isCurrentChess960VariantGame()) return "Chess960";
  if (isCurrentThreeCheckVariantGame()) return "Three-check";
  if (isCurrentKingOfTheHillVariantGame()) return "King of the Hill";
  if (isCurrentAntichessVariantGame()) return "Antichess";
  if (isCurrentAtomicVariantGame()) return "Atomic";
  if (isCurrentHordeVariantGame()) return "Horde";
  if (isCurrentRacingKingsVariantGame()) return "Racing Kings";
  if (isCurrentCrazyhouseVariantGame()) return "Crazyhouse";
  return "Standard";
}

function getVariantDisplayNameForKey(variantKey) {
  const key = String(variantKey || "").trim().toLowerCase();
  if (key === "chess960") return "Chess960";
  if (key === "threecheck") return "Three-check";
  if (key === "kingofthehill") return "King of the Hill";
  if (key === "antichess") return "Antichess";
  if (key === "atomic") return "Atomic";
  if (key === "horde") return "Horde";
  if (key === "racingkings") return "Racing Kings";
  if (key === "crazyhouse") return "Crazyhouse";
  return "Standard";
}

function parseThreeCheckReceivedCountsFromFen(fen) {
  const parts = String(fen || "").trim().split(/\s+/);
  const checkPart = parts[4] || "";
  const match = checkPart.match(/^(\d+)\+(\d+)$/);
  if (!match) {
    return { w: 0, b: 0 };
  }
  const blackRemaining = Number(match[1]);
  const whiteRemaining = Number(match[2]);
  return {
    w: Math.max(0, 3 - whiteRemaining),
    b: Math.max(0, 3 - blackRemaining)
  };
}

function getFairyVariantResultInfo() {
  if (!isCurrentFairyVariantGame() || typeof state.game?.result !== "function" || !state.game.isGameOver()) {
    return null;
  }
  const result = String(state.game.result() || "*").trim();
  if (result === "1-0") {
    return {
      result: "1-0",
      termination: `${getCurrentVariantDisplayName()} win`,
      token: `${state.currentVariant}-white-win`,
      message: `White wins by ${getCurrentVariantDisplayName()}.`
    };
  }
  if (result === "0-1") {
    return {
      result: "0-1",
      termination: `${getCurrentVariantDisplayName()} win`,
      token: `${state.currentVariant}-black-win`,
      message: `Black wins by ${getCurrentVariantDisplayName()}.`
    };
  }
  if (result === "1/2-1/2") {
    return {
      result: "1/2-1/2",
      termination: `${getCurrentVariantDisplayName()} draw`,
      token: `${state.currentVariant}-draw`,
      message: `Draw in ${getCurrentVariantDisplayName()}.`
    };
  }
  return null;
}

function createPlayModeGame(startFen) {
  if (isCurrentFairyVariantGame()) {
    const safeStartFen = typeof startFen === "string" && startFen.trim()
      ? startFen.trim()
      : getDefaultStartFenForVariant(state.currentVariant);
    return createFairyVariantGame(getCurrentFairyVariantName(), safeStartFen);
  }
  const game = new Chess();
  if (typeof startFen === "string" && startFen.trim()) {
    game.load(startFen.trim());
  }
  return game;
}

function showAppMessage(text, durationMs = 1800) {
  if (!appMessageEl) return;
  appMessageEl.textContent = text;
  appMessageEl.classList.remove("hidden");
  if (appMessageTimerId !== null) {
    window.clearTimeout(appMessageTimerId);
  }
  appMessageTimerId = window.setTimeout(() => {
    appMessageEl.classList.add("hidden");
    appMessageTimerId = null;
  }, durationMs);
}

function sanitizeProfileName(raw, maxLen = 25) {
  const text = String(raw || "").trim().replace(/\s+/g, " ");
  if (!text) return "Player 2";
  if (Number.isFinite(maxLen) && maxLen > 0) {
    return text.slice(0, maxLen);
  }
  return text;
}

function saveProfileSettings() {
  try {
    localStorage.setItem(
      PROFILE_STORAGE_KEY,
      JSON.stringify({
        name: state.profile.name,
        avatarDataUrl: state.profile.avatarDataUrl || "",
        syncOnlineName: !!state.profile.syncOnlineName
      })
    );
  } catch (_) {
    // ignore storage errors
  }
}

function loadProfileSettings() {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      state.profile.name = sanitizeProfileName(parsed.name);
      state.profile.avatarDataUrl = typeof parsed.avatarDataUrl === "string" ? parsed.avatarDataUrl : "";
      state.profile.syncOnlineName = !!parsed.syncOnlineName;
    }
  } catch (_) {
    // ignore parse/storage errors
  }
}

function renderProfileUi() {
  const name = state.profile.syncOnlineName
    ? sanitizeProfileName(state.profile.name, Number.POSITIVE_INFINITY)
    : sanitizeProfileName(state.profile.name, 25);
  state.profile.name = name;
  const avatarSrc = state.profile.avatarDataUrl || DEFAULT_PROFILE_AVATAR;
  if (homeProfileNameEl) {
    homeProfileNameEl.textContent = name;
  }
  if (homeProfileAvatarEl) {
    homeProfileAvatarEl.src = avatarSrc;
  }
}

function maybeSyncProfileNameFromOnline() {
  if (!state.profile.syncOnlineName) return;
  const onlineName = String(state.online.account?.username || "").trim();
  if (!onlineName) return;
  state.profile.name = sanitizeProfileName(onlineName, Number.POSITIVE_INFINITY);
  saveProfileSettings();
  renderProfileUi();
  renderPlayerBars();
}

function saveThemeSettings() {
  try {
    localStorage.setItem(
      THEME_STORAGE_KEY,
      JSON.stringify({
        boardImage: state.theme.boardImage,
        pieceSet: state.theme.pieceSet,
        soundSet: state.theme.soundSet || DEFAULT_SOUND_SET,
        appBackgroundMode: state.theme.appBackgroundMode || "default",
        appBackgroundValue: state.theme.appBackgroundValue || ""
      })
    );
  } catch (_) {
    // ignore storage errors
  }
}

function loadThemeSettings() {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      if (typeof parsed.boardImage === "string" && parsed.boardImage.trim()) {
        state.theme.boardImage = parsed.boardImage;
      }
      if (typeof parsed.pieceSet === "string" && parsed.pieceSet.trim()) {
        const nextPieceSet = parsed.pieceSet.trim();
        if (nextPieceSet.startsWith("custom:") || BUILTIN_PIECE_SETS.has(nextPieceSet)) {
          state.theme.pieceSet = nextPieceSet;
        } else {
          state.theme.pieceSet = DEFAULT_PIECE_SET;
        }
      }
      if (typeof parsed.soundSet === "string" && parsed.soundSet.trim()) {
        state.theme.soundSet = parsed.soundSet;
      }
      if (typeof parsed.appBackgroundMode === "string" && parsed.appBackgroundMode.trim()) {
        state.theme.appBackgroundMode = parsed.appBackgroundMode;
      }
      if (typeof parsed.appBackgroundValue === "string") {
        state.theme.appBackgroundValue = parsed.appBackgroundValue;
      }
    }
  } catch (_) {
    // ignore parse/storage errors
  }
}

function applyAppBackgroundTheme() {
  const body = document.body;
  if (!body) return;
  const mode = String(state.theme.appBackgroundMode || "default").trim().toLowerCase();
  const value = String(state.theme.appBackgroundValue || "");
  body.style.backgroundImage = "";
  body.style.backgroundColor = "";
  if (mode === "color" && value) {
    body.style.backgroundColor = value;
    return;
  }
  if (mode === "image" && value) {
    body.style.backgroundImage = `url("${value}")`;
    body.style.backgroundColor = "#1f1f1f";
    return;
  }
  body.style.background = DEFAULT_APP_BACKGROUND;
  body.style.backgroundImage = "";
}

function applyBoardTheme() {
  if (!boardEl) return;
  const bg = state.theme.boardImage || "../assets/board/wood4.jpg";
  boardEl.style.backgroundImage = `url("${bg}")`;
  if (chess960BoardEl) {
    chess960BoardEl.style.backgroundImage = `url("${bg}")`;
  }
}

function createAudioWithFallback(setName, fileBaseName) {
  const normalizedSet = String(setName || "").trim().toLowerCase();
  const base =
    normalizedSet === "silence"
      ? "../assets/sound/Silence"
      : `../assets/sound/${setName}/${fileBaseName}`;
  const primary = `${base}.ogg`;
  const fallback = `${base}.mp3`;
  const audio = new Audio(primary);
  audio.preload = "auto";
  audio.addEventListener(
    "error",
    () => {
      if (audio.src.endsWith(".ogg")) {
        audio.src = fallback;
        try {
          audio.load();
        } catch (_) {
          // ignore
        }
      }
    },
    { once: true }
  );
  return audio;
}

function rebuildSoundEffects() {
  const setName = (state.theme.soundSet || DEFAULT_SOUND_SET).trim() || DEFAULT_SOUND_SET;
  soundEffects = {
    move: createAudioWithFallback(setName, "Move"),
    capture: createAudioWithFallback(setName, "Capture"),
    lowTime: createAudioWithFallback(setName, "LowTime"),
    notify: createAudioWithFallback(setName, "GenericNotify")
  };
}

function playSound(name) {
  const audio = soundEffects[name];
  if (!audio) return;
  try {
    audio.currentTime = 0;
    const p = audio.play();
    if (p && typeof p.catch === "function") {
      p.catch(() => {});
    }
  } catch (_) {
    // ignore sound playback errors
  }
}

function maybePlayLowTimeSoundForColor(color, prevMs, nextMs) {
  if (state.isUnlimitedTime) return;
  if (!["w", "b"].includes(color)) return;
  if (state.sound.lowTimePlayed[color]) return;
  if (!(prevMs >= LOW_TIME_THRESHOLD_MS && nextMs < LOW_TIME_THRESHOLD_MS)) return;
  state.sound.lowTimePlayed[color] = true;
  playSound("lowTime");
}

function playGameStartNotify() {
  playSound("notify");
}

function getCurrentGameEndSoundKey() {
  if (isOnlineGameActive() && state.online.finished) {
    return `online|${state.online.currentGameId}|${state.online.finishStatus}|${state.online.finishWinner}`;
  }
  if ((state.appMode !== "play" && state.appMode !== "tablebase") || !isGameInteractionLocked()) return "";
  return `offline|${state.currentGameStartFen || ""}|${getLatestPly()}|${state.timeoutLoser || ""}|${
    state.resignedColor || ""
  }|${state.game.fen()}`;
}

function maybePlayGameEndNotify() {
  const key = getCurrentGameEndSoundKey();
  if (!key) return;
  if (state.sound.gameEndKey === key) return;
  state.sound.gameEndKey = key;
  playSound("notify");
}

function markAnalysisPgnDirty() {
  state.analysisPgnDirty = true;
}

function setAppMode(mode) {
  return navigationHelpers.setAppMode(mode);
}

function isEditorLikeMode() {
  return state.appMode === "editor" || state.appMode === "tablebase-setup";
}

function isTablebaseMode() {
  return state.appMode === "tablebase" || state.appMode === "tablebase-setup";
}

function hasMoveTreeMode() {
  return state.appMode === "analysis" || state.appMode === "tablebase";
}

function isPuzzleMode() {
  return state.appMode === "puzzle" || state.appMode === "puzzle-setup";
}

function isTablebaseTrainingActive() {
  return state.appMode === "tablebase" && !!state.tablebase.training.active;
}

function isTablebaseTrainingFinished() {
  return isTablebaseTrainingActive() && !!state.tablebase.training.finished;
}

function isTablebaseTrainingUsersTurn() {
  if (!isTablebaseTrainingActive()) return false;
  if (state.tablebase.training.pendingAutoReply) return false;
  return state.game.turn() === (state.tablebase.training.config.userColor === "b" ? "b" : "w");
}

function isOnlineGameActive() {
  return state.appMode === "play" && !!state.online.currentGameId;
}

function isOnlineSessionConnected() {
  return !!state.online.connected;
}

const HOME_PLAY_MODES = ["online-rated", "online-casual", "offline"];
const HOME_PLAY_MODE_COLOR_CLASS = {
  "online-rated": "mode-online-rated",
  "online-casual": "mode-online-casual",
  offline: "mode-offline"
};

function getHomePlayModeLabel(mode) {
  if (mode === "online-rated") return "Online Rated";
  if (mode === "online-casual") return "Online Casual";
  return "Offline";
}

function getAvailableHomePlayModes() {
  return isOnlineSessionConnected() ? HOME_PLAY_MODES : ["offline"];
}

function normalizeHomePlayMode(mode) {
  const available = getAvailableHomePlayModes();
  const target = String(mode || "").trim().toLowerCase();
  if (available.includes(target)) return target;
  return available[0] || "offline";
}

function renderHomePlayModeBar() {
  if (!homePlayModeBarEl) return;
  state.homePlayMode = normalizeHomePlayMode(state.homePlayMode);
  const label = getHomePlayModeLabel(state.homePlayMode);
  homePlayModeBarEl.textContent = `Mode: ${label}`;
  homePlayModeBarEl.title = "Click to cycle play mode";
  homePlayModeBarEl.classList.remove("mode-online-rated", "mode-online-casual", "mode-offline");
  homePlayModeBarEl.classList.add(HOME_PLAY_MODE_COLOR_CLASS[state.homePlayMode] || "mode-offline");
}

function updateHomeTimeCardAvailability() {
  const onlineQuickPair = state.homePlayMode === "online-rated" || state.homePlayMode === "online-casual";
  let selectedCard = timeCardEls.find((card) => card.classList.contains("selected")) || null;
  let selectedSupported = false;
  for (const card of timeCardEls) {
    const tc = getTimeControlFromCard(card);
    const supported = !onlineQuickPair || isBoardApiQuickPairTimeSupported(tc);
    card.classList.toggle("time-card-disabled", !supported);
    card.disabled = !supported;
    if (!supported) {
      card.title = "Unavailable for online quick pair.";
    } else {
      card.title = "";
    }
    if (card === selectedCard && supported) {
      selectedSupported = true;
    }
  }
  if (onlineQuickPair && selectedCard && !selectedSupported) {
    const fallback = timeCardEls.find((card) => !card.disabled);
    if (fallback) {
      setSelectedTimeCard(fallback);
    }
  }
}

function setHomePlayMode(mode, announce = false) {
  const next = normalizeHomePlayMode(mode);
  const changed = next !== state.homePlayMode;
  state.homePlayMode = next;
  renderHomePlayModeBar();
  updateHomeTimeCardAvailability();
  if (announce && changed) {
    showAppMessage(`Play mode: ${getHomePlayModeLabel(next)}`);
  }
}

function cycleHomePlayMode() {
  const modes = getAvailableHomePlayModes();
  if (!modes.length) return;
  const current = normalizeHomePlayMode(state.homePlayMode);
  const idx = modes.indexOf(current);
  const next = modes[(idx + 1) % modes.length] || modes[0];
  if (homePlayModeBarEl) {
    homePlayModeBarEl.classList.remove("mode-switching");
    void homePlayModeBarEl.offsetWidth;
    homePlayModeBarEl.classList.add("mode-switching");
    window.setTimeout(() => {
      homePlayModeBarEl.classList.remove("mode-switching");
    }, 520);
  }
  setHomePlayMode(next, true);
}

function setOnlineAccountStatus(text, isError = false) {
  if (!onlineAccountStatusEl) return;
  onlineAccountStatusEl.textContent = text || "";
  onlineAccountStatusEl.style.color = isError ? "#e08f8f" : "#b9b9b9";
}

function setOnlineChallengeStatus(text, isError = false) {
  if (!onlineChallengeStatusEl) return;
  onlineChallengeStatusEl.textContent = text || "";
  onlineChallengeStatusEl.style.color = isError ? "#e08f8f" : "#b9b9b9";
}

function setOnlineConnectStatus(text, tone = "neutral") {
  if (!onlineConnectStatusEl) return;
  onlineConnectStatusEl.textContent = text || "";
  if (tone === "error") {
    onlineConnectStatusEl.style.color = "#e08f8f";
  } else if (tone === "ok") {
    onlineConnectStatusEl.style.color = "#99d48b";
  } else {
    onlineConnectStatusEl.style.color = "#b9b9b9";
  }
}

function formatChallengeSummary(details) {
  const kind = String(details?.kind || "challenge");
  const color = String(details?.color || "random");
  const rated = !!details?.rated;
  const ratedLabel = rated ? "Rated" : "Casual";
  const colorLabel = color === "white" ? "White" : color === "black" ? "Black" : "Random";
  if (kind === "seek") {
    const minutes = Number(details?.timeMinutes || 0);
    const incSec = Number(details?.incrementSeconds || 0);
    const timeLabel = `${minutes}+${incSec}`;
    return `Mode: Quick Pair\nTime: ${timeLabel}\nType: ${ratedLabel}\nColor: ${colorLabel}`;
  }
  const username = String(details?.username || "Unknown");
  const limitSec = Number(details?.clockLimitSec || 0);
  const incSec = Number(details?.clockIncrementSec || 0);
  const timeLabel = `${formatChallengeLimitLabel(limitSec)} + ${incSec}s`;
  return `Opponent: ${username}\nTime: ${timeLabel}\nMode: ${ratedLabel}\nColor: ${colorLabel}`;
}

function closeChallengeWaitModal() {
  if (challengeWaitModalEl) {
    challengeWaitModalEl.classList.add("hidden");
  }
  if (btnOnlineCreateChallengeEl) {
    btnOnlineCreateChallengeEl.disabled = false;
  }
  state.online.pendingMatchRequest = null;
}

function consumePendingOnlineAutoJoin(gameId, challengeIds = []) {
  const pending = state.online.pendingMatchRequest;
  const startedId = String(gameId || "");
  const normalizedChallengeIds = challengeIds.map((id) => String(id || "")).filter(Boolean);
  const pendingChallengeId = pending && pending.kind === "challenge" ? String(pending.challengeId || "") : "";
  const pendingAcceptedChallengeId = String(state.online.pendingAcceptedChallengeId || "");
  const matchesPendingChallenge =
    !!pendingChallengeId &&
    (normalizedChallengeIds.includes(pendingChallengeId) || (startedId && pendingChallengeId === startedId));
  const matchesAcceptedChallenge =
    !!pendingAcceptedChallengeId &&
    (normalizedChallengeIds.includes(pendingAcceptedChallengeId) ||
      (startedId && pendingAcceptedChallengeId === startedId));
  const shouldAutoJoin = (pending && pending.kind === "seek") || matchesPendingChallenge || matchesAcceptedChallenge;

  if (!shouldAutoJoin) {
    return false;
  }

  if ((pending && pending.kind === "seek") || matchesPendingChallenge) {
    closeChallengeWaitModal();
    if (pending?.kind === "seek") {
      setOnlineChallengeStatus("Opponent found.");
      showAppMessage("Opponent found. Game started.");
    } else if (matchesPendingChallenge) {
      setOnlineChallengeStatus("Challenge accepted.");
      showAppMessage("Challenge accepted. Game started.");
    }
  }

  if (matchesAcceptedChallenge) {
    state.online.pendingAcceptedChallengeId = "";
    setOnlineChallengeStatus("Challenge accepted.");
    showAppMessage("Challenge accepted. Game started.");
  }

  return true;
}

function openChallengeWaitModal(outgoingChallenge) {
  state.online.pendingMatchRequest = outgoingChallenge;
  if (challengeWaitDetailsEl) {
    challengeWaitDetailsEl.textContent = formatChallengeSummary(outgoingChallenge);
  }
  if (challengeWaitModalEl) {
    challengeWaitModalEl.classList.remove("hidden");
  }
  if (btnOnlineCreateChallengeEl) {
    btnOnlineCreateChallengeEl.disabled = true;
  }
}

function parseOnlineErrorLabel(err) {
  const msg = String(err?.message || err || "").toLowerCase();
  if (!msg) return "Unknown error";
  if (msg.includes("fetch failed") || msg.includes("network") || msg.includes("timeout")) {
    return "No internet connection";
  }
  if (msg.includes("401") || msg.includes("403") || msg.includes("not authenticated")) {
    return "Authorization expired";
  }
  if (msg.includes("429")) {
    return "Rate limited (retry soon)";
  }
  return String(err?.message || err);
}

function normalizeColorToken(token) {
  const raw = String(token || "").trim().toLowerCase();
  if (raw === "white" || raw === "w") return "w";
  if (raw === "black" || raw === "b") return "b";
  return "";
}

function oppositeColor(color) {
  return color === "w" ? "b" : "w";
}

function getBottomVisibleColor() {
  return state.boardFlipped ? "b" : "w";
}

const ONLINE_COLOR_DEBUG = false;

function logOnlineColorDebug(tag, data = {}) {
  if (!ONLINE_COLOR_DEBUG) return;
  const ts = new Date().toLocaleTimeString();
  const line = `[online-color ${ts}] ${tag}`;
  try {
    console.log(line, data);
  } catch (_) {
    // no-op
  }
  try {
    window.__onlineColorDebug = window.__onlineColorDebug || [];
    window.__onlineColorDebug.push({ ts: Date.now(), tag, data });
    if (window.__onlineColorDebug.length > 300) {
      window.__onlineColorDebug.shift();
    }
  } catch (_) {
    // no-op
  }
}

function resolveOnlineUserColor({ eventColor, activeColor, whiteName, blackName }) {
  const me = String(state.online.account?.username || "").trim().toLowerCase();
  if (me) {
    const w = String(whiteName || "").trim().toLowerCase();
    const b = String(blackName || "").trim().toLowerCase();
    if (w && w === me) return "w";
    if (b && b === me) return "b";
  }
  const byActive = normalizeColorToken(activeColor);
  if (byActive) return byActive;
  const byEvent = normalizeColorToken(eventColor);
  if (byEvent) return byEvent;
  return state.online.currentColor === "b" ? "b" : "w";
}

function getTimeControlFromCard(card) {
  if (!card) return null;
  if (card.dataset.mode === "unlimited") return null;
  const baseMin = Number(card.dataset.baseMin);
  const incSec = Number(card.dataset.incSec);
  if (!Number.isFinite(baseMin) || baseMin < 0) return null;
  if (!Number.isFinite(incSec) || incSec < 0) return null;
  return { baseMin, incSec };
}

function isBoardApiQuickPairTimeSupported(tc) {
  if (!tc) return false;
  // Lichess Board API quick seeks support lobby speeds that are rapid/classical/correspondence.
  // Use the same practical speed estimate used by many clients: initial + 40 * increment.
  const estimatedSeconds = tc.baseMin * 60 + tc.incSec * 40;
  return estimatedSeconds >= 8 * 60;
}

function isOnlineQuickPairEnabled() {
  return !!state.online.connected;
}

async function startOnlineQuickPairFromCard(card, options = {}) {
  if (!isOnlineQuickPairEnabled()) return false;
  const rated = options.rated !== false;
  const tc = getTimeControlFromCard(card);
  if (!tc) {
    showAppMessage("Unlimited is not available for online quick pair.");
    return true;
  }
  if (!isBoardApiQuickPairTimeSupported(tc)) {
    showAppMessage("Quick pair supports Rapid/Classical only. Use Challenge for Bullet/Blitz.");
    setOnlineChallengeStatus("Unsupported quick-pair time control.", true);
    return true;
  }
  try {
    const payload = {
      timeMinutes: tc.baseMin,
      incrementSeconds: tc.incSec,
      rated,
      color: "random",
      variant: "standard"
    };
    const res = await ipcRenderer.invoke("online:seek:start", payload);
    if (!res?.ok) {
      setOnlineChallengeStatus(`Quick pair failed: ${res?.error || "unknown error"}`, true);
      showAppMessage(`Quick pair failed: ${res?.error || "unknown error"}`);
      return true;
    }
    setOnlineChallengeStatus("Finding opponent...");
    openChallengeWaitModal({
      kind: "seek",
      timeMinutes: tc.baseMin,
      incrementSeconds: tc.incSec,
      rated,
      color: "random"
    });
    return true;
  } catch (err) {
    setOnlineChallengeStatus(`Quick pair failed: ${String(err?.message || err)}`, true);
    showAppMessage(`Quick pair failed: ${String(err?.message || err)}`);
    return true;
  }
}

function formatChallengeLimitLabel(limitSec) {
  const sec = Number(limitSec || 0);
  if (sec <= 0) return "0";
  if (sec < 60) return `0:${String(sec).padStart(2, "0")}`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function getOnlineChallengeLimitSeconds() {
  if (!onlineChallengeLimitEl) return 180;
  const idx = Math.max(
    0,
    Math.min(CHALLENGE_LIMIT_SECONDS.length - 1, Number(onlineChallengeLimitEl.value) || 0)
  );
  return CHALLENGE_LIMIT_SECONDS[idx];
}

function getOnlineChallengeIncrementSeconds() {
  if (!onlineChallengeIncEl) return 2;
  const n = Number(onlineChallengeIncEl.value) || 1;
  return Math.max(1, Math.min(60, n));
}

function updateOnlineChallengeControlLabels() {
  if (onlineChallengeLimitValueEl) {
    onlineChallengeLimitValueEl.textContent = formatChallengeLimitLabel(getOnlineChallengeLimitSeconds());
  }
  if (onlineChallengeIncValueEl) {
    onlineChallengeIncValueEl.textContent = `${getOnlineChallengeIncrementSeconds()}s`;
  }
}

function initOnlineChallengeControls() {
  if (onlineChallengeLimitEl) {
    onlineChallengeLimitEl.min = "0";
    onlineChallengeLimitEl.max = String(CHALLENGE_LIMIT_SECONDS.length - 1);
    onlineChallengeLimitEl.step = "1";
    const defaultIndex = Math.max(0, CHALLENGE_LIMIT_SECONDS.indexOf(180));
    onlineChallengeLimitEl.value = String(defaultIndex);
    onlineChallengeLimitEl.addEventListener("input", updateOnlineChallengeControlLabels);
  }
  if (onlineChallengeIncEl) {
    onlineChallengeIncEl.min = "1";
    onlineChallengeIncEl.max = "60";
    onlineChallengeIncEl.step = "1";
    if (!onlineChallengeIncEl.value) onlineChallengeIncEl.value = "2";
    onlineChallengeIncEl.addEventListener("input", updateOnlineChallengeControlLabels);
  }
  updateOnlineChallengeControlLabels();
}

async function autoFetchOnlineIdentity() {
  try {
    const accountRes = await ipcRenderer.invoke("online:account:get");
    if (!accountRes?.ok) {
      const label = parseOnlineErrorLabel(accountRes?.error || "Account fetch failed");
      setOnlineConnectStatus(label, "error");
      return;
    }
    state.online.account = accountRes.account || null;
    maybeSyncProfileNameFromOnline();
    const username = state.online.account?.username || "unknown";
    const perf = state.online.account?.perfs || {};
    const blitz = perf.blitz?.rating || "-";
    const rapid = perf.rapid?.rating || "-";
    setOnlineConnectStatus(`Connected as ${username}`, "ok");
    setOnlineAccountStatus(`Account loaded | blitz ${blitz} | rapid ${rapid}`);

    const ratingsRes = await ipcRenderer.invoke("online:ratings:get", { username });
    if (ratingsRes?.ok) {
      state.online.ratings = ratingsRes.history || [];
    }
  } catch (err) {
    const label = parseOnlineErrorLabel(err);
    setOnlineConnectStatus(label, "error");
  }
}

function closeOnlineModal() {
  if (!onlineModalEl) return;
  onlineModalEl.classList.add("hidden");
}

function closeHomeOnlinePanels() {
  if (homeActiveGamesPanelEl) homeActiveGamesPanelEl.classList.add("hidden");
  if (homeChallengePanelEl) homeChallengePanelEl.classList.add("hidden");
}

function updateHomeOnlineToolbarVisibility() {
  if (!homeOnlineToolbarEl || !homeScreenEl) return;
  const homeVisible = !homeScreenEl.classList.contains("hidden");
  const shouldShow = homeVisible && !!state.online.connected;
  homeOnlineToolbarEl.classList.toggle("hidden", !shouldShow);
  if (!shouldShow) closeHomeOnlinePanels();
  updateHomeOnlineToolbarBadges();
}

function updateHomeOnlineToolbarBadges() {
  if (homeChallengeBadgeEl) {
    const count = state.online.blockChallenges ? 0 : state.online.incomingChallenges.size;
    homeChallengeBadgeEl.textContent = count > 0 ? `+${count}` : "0";
    homeChallengeBadgeEl.classList.toggle("hidden", count <= 0);
  }
  if (homeActiveGamesBadgeEl) {
    const count = Array.from(state.online.activeGames.values()).filter(
      (game) => !isTerminalOnlineGameStatus(game?.status || "started")
    ).length;
    homeActiveGamesBadgeEl.textContent = count > 0 ? `+${count}` : "0";
    homeActiveGamesBadgeEl.classList.toggle("hidden", count <= 0);
  }
}

function normalizeOnlineGameStatus(status) {
  if (typeof status === "string") return status;
  if (status == null) return "started";
  if (typeof status === "object") {
    return String(status.name || status.status || status.id || status.key || "started");
  }
  return String(status);
}

function isTerminalOnlineGameStatus(status) {
  const token = normalizeOnlineGameStatus(status).toLowerCase();
  return [
    "mate",
    "resign",
    "outoftime",
    "timeout",
    "stalemate",
    "draw",
    "repetition",
    "50moves",
    "insufficient",
    "variantend",
    "aborted",
    "finished"
  ].includes(token);
}

function getChallengeChallengerName(item) {
  const challenge = item?.challenge || item || {};
  return String(
    challenge?.challenger?.name ||
      challenge?.challenger?.username ||
      challenge?.challenger?.id ||
      ""
  ).trim();
}

async function hydrateOnlineSessionUi() {
  try {
    const res = await ipcRenderer.invoke("online:session:get");
    if (!res?.ok) return;
    state.online.connected = !!res.connected;
    state.online.backendUrl = String(res.backendUrl || "");
    if (onlineBackendUrlEl) onlineBackendUrlEl.value = state.online.backendUrl || "offline-lichess-desktop-v1";
    if (state.online.connected) {
      updateHomeProfileMenuItems();
      setHomePlayMode(state.homePlayMode || "online-rated");
      setOnlineConnectStatus(`Connected${res.username ? ` as ${res.username}` : ""}`, "ok");
      await autoFetchOnlineIdentity();
    } else {
      updateHomeProfileMenuItems();
      setHomePlayMode("offline");
      setOnlineConnectStatus("Logged out", "neutral");
      setOnlineAccountStatus("Disconnected");
    }
  } catch (err) {
    setHomePlayMode("offline");
    setOnlineConnectStatus("Unable to check session", "error");
    setOnlineAccountStatus(`Session load failed: ${String(err?.message || err)}`, true);
  }
}

function renderOnlineIncomingChallenges() {
  if (!onlineIncomingListEl) return;
  onlineIncomingListEl.innerHTML = "";
  if (onlineBlockChallengesEl) {
    onlineBlockChallengesEl.checked = !!state.online.blockChallenges;
  }
  const entries = Array.from(state.online.incomingChallenges.values());
  updateHomeOnlineToolbarBadges();
  if (state.online.blockChallenges) {
    const blocked = document.createElement("div");
    blocked.className = "online-list-item";
    blocked.textContent = "Challenges blocked.";
    onlineIncomingListEl.appendChild(blocked);
    return;
  }
  if (!entries.length) {
    const empty = document.createElement("div");
    empty.className = "online-list-item";
    empty.textContent = "No incoming challenges.";
    onlineIncomingListEl.appendChild(empty);
    return;
  }
  for (const item of entries) {
    const row = document.createElement("div");
    row.className = "online-list-item";
    const user = item?.challenge?.challenger?.name || "Unknown";
    const tc = item?.challenge?.timeControl?.show || "Unknown";
    row.innerHTML = `<div class="online-list-row"><span>${user}</span><span>${tc}</span></div>`;
    const actions = document.createElement("div");
    actions.className = "engine-btn-row";
    const acceptBtn = document.createElement("button");
    acceptBtn.type = "button";
    acceptBtn.className = "engine-btn";
    acceptBtn.textContent = "Accept";
    acceptBtn.addEventListener("click", async () => {
      try {
        const res = await ipcRenderer.invoke("online:challenge:accept", { challengeId: item.challenge.id });
        if (!res?.ok) {
          showAppMessage(`Accept failed: ${res?.error || "unknown error"}`);
          return;
        }
        state.online.pendingAcceptedChallengeId = String(item?.challenge?.id || "");
        state.online.incomingChallenges.delete(item.challenge.id);
        renderOnlineIncomingChallenges();
      } catch (err) {
        showAppMessage(`Accept failed: ${String(err?.message || err)}`);
      }
    });
    const declineBtn = document.createElement("button");
    declineBtn.type = "button";
    declineBtn.className = "engine-btn";
    declineBtn.textContent = "Decline";
    declineBtn.addEventListener("click", async () => {
      try {
        await ipcRenderer.invoke("online:challenge:decline", { challengeId: item.challenge.id });
      } catch (_) {
        // ignore
      }
      state.online.incomingChallenges.delete(item.challenge.id);
      renderOnlineIncomingChallenges();
    });
    actions.appendChild(acceptBtn);
    actions.appendChild(declineBtn);
    row.appendChild(actions);
    onlineIncomingListEl.appendChild(row);
  }
}

function renderOnlineActiveGames() {
  if (!onlineActiveGamesListEl) return;
  onlineActiveGamesListEl.innerHTML = "";
  const entries = Array.from(state.online.activeGames.values()).filter(
    (game) => !isTerminalOnlineGameStatus(game?.status || "started")
  );
  updateHomeOnlineToolbarBadges();
  if (!entries.length) {
    const empty = document.createElement("div");
    empty.className = "online-list-item";
    empty.textContent = "No active games.";
    onlineActiveGamesListEl.appendChild(empty);
    return;
  }
  for (const game of entries) {
    const row = document.createElement("div");
    row.className = "online-list-item";
    const title = game?.opponentName ? `${game.opponentName} (${game.color || "?"})` : game?.gameId || "Game";
    row.innerHTML = `<div class="online-list-row"><span>${title}</span><span>${normalizeOnlineGameStatus(game?.status || "started")}</span></div>`;
    const actions = document.createElement("div");
    actions.className = "engine-btn-row";
    const joinBtn = document.createElement("button");
    joinBtn.type = "button";
    joinBtn.className = "engine-btn";
    joinBtn.textContent = "Join";
    joinBtn.addEventListener("click", async () => {
      try {
        const res = await ipcRenderer.invoke("online:game:join", { gameId: game.gameId });
        if (!res?.ok) {
          showAppMessage(`Join failed: ${res?.error || "unknown error"}`);
          return;
        }
        showAppMessage("Joined online game stream.");
      } catch (err) {
        showAppMessage(`Join failed: ${String(err?.message || err)}`);
      }
    });
    actions.appendChild(joinBtn);
    row.appendChild(actions);
    onlineActiveGamesListEl.appendChild(row);
  }
}

function openOnlineModal() {
  return modalHelpers.openOnlineModal();
}

function rebuildGameFromFenAndUciMoves(startFen, movesUci) {
  const game = new Chess();
  const fen = String(startFen || "").trim();
  if (fen && fen !== "startpos") {
    try {
      game.load(fen);
    } catch (_) {
      // fallback to startpos
    }
  }
  const parts = String(movesUci || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  for (const uci of parts) {
    const from = uci.slice(0, 2);
    const to = uci.slice(2, 4);
    const promotion = uci.length >= 5 ? uci[4] : undefined;
    const ok = game.move({ from, to, promotion });
    if (!ok) break;
  }
  return game;
}

function applyOnlineSnapshot({
  gameId,
  initialFen,
  moves,
  color,
  activeColor,
  status,
  winner,
  wtime,
  btime,
  wname,
  bname,
  incrementMs,
  wrating,
  brating,
  wdraw,
  bdraw,
  wtakeback,
  btakeback
}) {
  if (!gameId) return;
  logOnlineColorDebug("snapshot:incoming", {
    gameId,
    initialFen: String(initialFen || "").slice(0, 60),
    movesCount: String(moves || "").trim() ? String(moves || "").trim().split(/\s+/).length : 0,
    eventColor: color,
    activeColor,
    whiteName: wname,
    blackName: bname,
    status,
    winner
  });
  const previousGameId = state.online.currentGameId;
  const sameGame = previousGameId === gameId;
  const previousMovesUci = state.online.currentMovesUci;
  const prevHistory = state.game.history({ verbose: true });
  const prevLen = prevHistory.length;
  state.online.currentGameId = gameId;
  if (!sameGame) {
    state.online.userFlipped = false;
  }
  state.online.currentInitialFen = initialFen || new Chess().fen();
  state.online.currentMovesUci = String(moves || "");
  const movesChanged = sameGame && previousMovesUci !== state.online.currentMovesUci;
  state.online.currentColor = resolveOnlineUserColor({
    eventColor: color,
    activeColor,
    whiteName: wname,
    blackName: bname
  });
  state.player2Color = state.online.currentColor;
  if (!state.online.userFlipped) {
    state.boardFlipped = state.player2Color === "b";
  }
  logOnlineColorDebug("snapshot:resolved", {
    gameId,
    previousGameId,
    sameGame,
    resolvedUserColor: state.online.currentColor,
    player2Color: state.player2Color,
    boardFlipped: state.boardFlipped,
    userFlipped: state.online.userFlipped
  });
  state.playStartFen = state.online.currentInitialFen;
  const rebuilt = rebuildGameFromFenAndUciMoves(state.online.currentInitialFen, state.online.currentMovesUci);
  const nextHistory = rebuilt.history({ verbose: true });
  const nextLen = nextHistory.length;
  state.game = rebuilt;
  state.viewPly = getLatestPly();
  state.timeoutLoser = null;
  state.resignedColor = null;
  state.isUnlimitedTime = false;
  selectedIncrementMs = Number.isFinite(Number(incrementMs)) ? Number(incrementMs) : selectedIncrementMs;
  if (Number.isFinite(Number(wtime))) state.clocks.whiteMs = Number(wtime);
  if (Number.isFinite(Number(btime))) state.clocks.blackMs = Number(btime);
  state.online.finished = !!status && !["started", "created", "unknown"].includes(String(status));
  state.online.finishStatus = String(status || "");
  state.online.finishWinner = normalizeColorToken(winner);
  if (state.online.finished) {
    state.resignedColor = null;
    state.timeoutLoser = null;
    state.online.activeGames.delete(gameId);
    maybePlayGameEndNotify();
  }
  if (wname || bname) {
    const existing = state.online.activeGames.get(gameId) || {};
    state.online.activeGames.set(gameId, {
      ...existing,
      gameId,
      whiteName: wname,
      blackName: bname,
      whiteRating: Number.isFinite(Number(wrating)) ? Number(wrating) : existing.whiteRating ?? null,
      blackRating: Number.isFinite(Number(brating)) ? Number(brating) : existing.blackRating ?? null,
      opponentName: state.player2Color === "w" ? bname : wname,
      color: state.player2Color === "w" ? "white" : "black",
      status: normalizeOnlineGameStatus(status || "started"),
      wdraw: !!wdraw,
      bdraw: !!bdraw,
      wtakeback: !!wtakeback,
      btakeback: !!btakeback
    });
    if (movesChanged) {
      clearOnlineOfferFlags();
    }
  }
  if (sameGame && nextLen > prevLen) {
    const latestMove = nextHistory[nextLen - 1];
    if (latestMove && latestMove.color !== state.player2Color) {
      const isCapture =
        typeof latestMove.flags === "string" &&
        (latestMove.flags.includes("c") || latestMove.flags.includes("e"));
      playSound(isCapture ? "capture" : "move");
      tryPlayQueuedPremove();
    }
  }
  showGameScreen();
  render();
}

function handleOnlineEventStream(evt) {
  const type = String(evt?.type || "");
  if (type === "challenge") {
    const challenge = evt?.challenge;
    if (challenge?.id) {
      if (!state.online.blockChallenges) {
        state.online.incomingChallenges.set(challenge.id, evt);
      }
      renderOnlineIncomingChallenges();
    }
    return;
  }
  if (type === "challengeCanceled" || type === "challengeDeclined") {
    const id = evt?.challenge?.id;
    const pending = state.online.pendingMatchRequest;
    const outgoingId = pending && pending.kind === "challenge" ? String(pending.challengeId || "") : "";
    const acceptedId = String(state.online.pendingAcceptedChallengeId || "");
    if (id && outgoingId && id === outgoingId) {
      closeChallengeWaitModal();
      if (type === "challengeDeclined") {
        setOnlineChallengeStatus("Challenge declined.");
        showAppMessage("Challenge declined by opponent.");
      } else {
        setOnlineChallengeStatus("Challenge canceled.");
      }
    }
    if (id && acceptedId && id === acceptedId) {
      state.online.pendingAcceptedChallengeId = "";
    }
    if (id) {
      state.online.incomingChallenges.delete(id);
      renderOnlineIncomingChallenges();
    }
    return;
  }
  if (type === "gameStart") {
    const game = evt?.game || {};
    const gameId = String(game?.id || "");
    if (!gameId) return;
    const opponentName = String(game?.opponent?.username || game?.opponent?.name || "").trim();
    const challengeIds = [String(game?.challengeId || ""), String(game?.fullId || ""), String(game?.id || "")].filter(Boolean);
    for (const challengeId of challengeIds) {
      state.online.incomingChallenges.delete(challengeId);
    }
    if (opponentName) {
      for (const [challengeId, item] of state.online.incomingChallenges.entries()) {
        if (getChallengeChallengerName(item).toLowerCase() === opponentName.toLowerCase()) {
          state.online.incomingChallenges.delete(challengeId);
        }
      }
    }
    logOnlineColorDebug("event:gameStart", {
      gameId,
      gameColor: game?.color,
      opponent: opponentName,
      me: state.online.account?.username || ""
    });
    state.online.activeGames.set(gameId, {
      gameId,
      color: game?.color || "white",
      opponentName: game?.opponent?.username || game?.opponent?.name || "Opponent",
      status: normalizeOnlineGameStatus(game?.status || "started"),
      winner: normalizeColorToken(game?.winner)
    });
    renderOnlineIncomingChallenges();
    renderOnlineActiveGames();
    const shouldAutoJoin = consumePendingOnlineAutoJoin(gameId, challengeIds);
    if (!shouldAutoJoin) {
      return;
    }
    playGameStartNotify();
    ipcRenderer.invoke("online:game:join", { gameId }).catch((err) => {
      showAppMessage(`Join game stream failed: ${String(err?.message || err)}`);
    });
    return;
  }
  if (type === "gameFinish") {
    const game = evt?.game || {};
    const gameId = String(game?.id || "");
    if (gameId && state.online.activeGames.has(gameId)) {
      state.online.activeGames.delete(gameId);
      renderOnlineActiveGames();
      if (state.online.currentGameId === gameId) {
        state.online.finished = true;
        state.online.finishStatus = normalizeOnlineGameStatus(game?.status || "finished");
        state.online.finishWinner = normalizeColorToken(game?.winner);
        maybePlayGameEndNotify();
        render();
      }
      ipcRenderer.invoke("online:game:save", { gameId }).catch(() => {});
    }
  }
}

function handleOnlineGameStream(payload) {
  const gameId = String(payload?.gameId || "");
  const evt = payload?.event || {};
  if (!gameId || !evt) return;
  if (evt?.type === "chatLine") {
    addOnlineChatLine(gameId, evt);
    if (state.online.currentGameId === gameId) {
      render();
    }
    return;
  }
  if (evt?.type === "gameFull") {
    const initialFen = evt?.initialFen && evt.initialFen !== "startpos" ? evt.initialFen : new Chess().fen();
    const moves = String(evt?.state?.moves || "");
    const active = state.online.activeGames.get(gameId) || {};
    const color = evt?.color || active.color || "white";
    const status = evt?.state?.status || "started";
    const winner = evt?.state?.winner || evt?.winner || active.winner || "";
    const wtime = evt?.state?.wtime;
    const btime = evt?.state?.btime;
    const wname = evt?.white?.name || evt?.white?.id || "White";
    const bname = evt?.black?.name || evt?.black?.id || "Black";
    const wrating = evt?.white?.rating;
    const brating = evt?.black?.rating;
    const incrementMs = Number(evt?.clock?.increment || 0) * 1000;
    logOnlineColorDebug("stream:gameFull", {
      gameId,
      eventColor: evt?.color,
      activeColor: active.color || "",
      whiteName: wname,
      blackName: bname,
      me: state.online.account?.username || "",
      status,
      winner
    });
    applyOnlineSnapshot({
      gameId,
      initialFen,
      moves,
      color,
      activeColor: active.color || "",
      status,
      winner,
      wtime,
      btime,
      wname,
      bname,
      incrementMs,
      wrating,
      brating,
      wdraw: evt?.state?.wdraw,
      bdraw: evt?.state?.bdraw,
      wtakeback: evt?.state?.wtakeback,
      btakeback: evt?.state?.btakeback
    });
    return;
  }
  if (evt?.type === "gameState") {
    const active = state.online.activeGames.get(gameId) || {};
    logOnlineColorDebug("stream:gameState", {
      gameId,
      activeColor: active.color || "",
      whiteName: active.whiteName || "",
      blackName: active.blackName || "",
      me: state.online.account?.username || "",
      movesCount: String(evt?.moves || "").trim() ? String(evt?.moves || "").trim().split(/\s+/).length : 0,
      status: evt?.status || "started",
      winner: evt?.winner || active.winner || ""
    });
    applyOnlineSnapshot({
      gameId,
      initialFen: state.online.currentInitialFen || new Chess().fen(),
      moves: evt?.moves || "",
      color: state.online.currentColor === "b" ? "black" : "white",
      activeColor: active.color || "",
      status: evt?.status || "started",
      winner: evt?.winner || active.winner || "",
      wtime: evt?.wtime,
      btime: evt?.btime,
      wname: active.whiteName || "White",
      bname: active.blackName || "Black",
      incrementMs: selectedIncrementMs,
      wrating: active.whiteRating,
      brating: active.blackRating,
      wdraw: evt?.wdraw,
      bdraw: evt?.bdraw,
      wtakeback: evt?.wtakeback,
      btakeback: evt?.btakeback
    });
  }
}

function formatOnlinePlayerLabel(name, rating) {
  const safeName = String(name || "").trim() || "Player";
  const numericRating = Number(rating);
  if (!Number.isFinite(numericRating) || numericRating <= 0) return safeName;
  return `${safeName} (${numericRating})`;
}

function getOnlineCurrentGameMeta() {
  return state.online.activeGames.get(state.online.currentGameId) || {};
}

function getOnlineOfferState(kind) {
  const active = getOnlineCurrentGameMeta();
  const myColor = state.online.currentColor === "b" ? "b" : "w";
  const opponentColor = myColor === "w" ? "b" : "w";
  if (kind === "draw") {
    return {
      ownPending: !!active[`${myColor}draw`],
      opponentPending: !!active[`${opponentColor}draw`]
    };
  }
  return {
    ownPending: !!active[`${myColor}takeback`],
    opponentPending: !!active[`${opponentColor}takeback`]
  };
}

function setOnlineOfferFlags(kind, { ownPending = false, opponentPending = false } = {}) {
  const gameId = state.online.currentGameId;
  if (!gameId) return;
  const active = state.online.activeGames.get(gameId);
  if (!active) return;
  const myColor = state.online.currentColor === "b" ? "b" : "w";
  const opponentColor = myColor === "w" ? "b" : "w";
  const next = { ...active };
  if (kind === "draw") {
    next[`${myColor}draw`] = !!ownPending;
    next[`${opponentColor}draw`] = !!opponentPending;
  } else {
    next[`${myColor}takeback`] = !!ownPending;
    next[`${opponentColor}takeback`] = !!opponentPending;
  }
  state.online.activeGames.set(gameId, next);
}

function clearOnlineOfferFlags() {
  setOnlineOfferFlags("draw", { ownPending: false, opponentPending: false });
  setOnlineOfferFlags("takeback", { ownPending: false, opponentPending: false });
}

function canOfferOnlineDraw() {
  if (!isOnlineGameActive() || isGameInteractionLocked()) return false;
  if (getLatestPly() < 2) return false;
  const offerState = getOnlineOfferState("draw");
  if (offerState.ownPending || offerState.opponentPending) return false;
  const active = getOnlineCurrentGameMeta();
  const lastOwnDrawOfferPly = Number(active.lastOwnDrawOfferPly);
  return !Number.isFinite(lastOwnDrawOfferPly) || lastOwnDrawOfferPly < getLatestPly() - 20;
}

function canOfferOnlineTakeback() {
  if (!isOnlineGameActive() || isGameInteractionLocked()) return false;
  if (getLatestPly() < 2) return false;
  const offerState = getOnlineOfferState("takeback");
  return !offerState.ownPending && !offerState.opponentPending;
}

function addOnlineChatLine(gameId, line) {
  const id = String(gameId || "").trim();
  if (!id || !line) return;
  const nextLine = {
    username: String(line.username || line.user || line.name || "Player").trim() || "Player",
    text: String(line.text || "").trim(),
    room: String(line.room || "player"),
    time: Date.now()
  };
  if (!nextLine.text) return;
  const existing = state.online.chatByGame.get(id) || [];
  const updated = [...existing, nextLine].slice(-100);
  state.online.chatByGame.set(id, updated);
}

function renderOnlineChatPanel() {
  if (!onlineChatPanelEl || !onlineChatListEl || !onlineChatStatusEl) return;
  const visible = isOnlineGameActive() && state.appMode === "play";
  onlineChatPanelEl.classList.toggle("hidden", !visible);
  if (!visible) return;
  const lines = state.online.chatByGame.get(state.online.currentGameId) || [];
  onlineChatStatusEl.textContent = "Player chat";
  onlineChatListEl.innerHTML = "";
  if (!lines.length) {
    const empty = document.createElement("div");
    empty.className = "online-chat-meta";
    empty.textContent = "No chat messages yet.";
    onlineChatListEl.appendChild(empty);
  } else {
    for (const line of lines) {
      const row = document.createElement("div");
      row.className = "online-chat-entry";
      const meta = document.createElement("div");
      meta.className = "online-chat-meta";
      meta.textContent = `${line.username}${line.room === "spectator" ? " [spectator]" : ""}`;
      const body = document.createElement("div");
      body.className = "online-chat-body";
      body.textContent = line.text;
      row.appendChild(meta);
      row.appendChild(body);
      onlineChatListEl.appendChild(row);
    }
  }
  onlineChatListEl.scrollTop = onlineChatListEl.scrollHeight;
  if (onlineChatInputEl) {
    onlineChatInputEl.disabled = !visible || isGameInteractionLocked();
  }
  if (onlineChatSendBtnEl) {
    onlineChatSendBtnEl.disabled = !visible || isGameInteractionLocked();
  }
}

function makeEditorStartBoard() {
  return ensureBoardEditorModule().makeEditorStartBoard();
}

function getActiveEditorController() {
  if (state.appMode === "tablebase-setup") return ensureTablebaseModule();
  return ensureBoardEditorModule();
}

function setEditorBoard(board) {
  return getActiveEditorController()?.setEditorBoard(board);
}

function getEditorPiece(square) {
  return getActiveEditorController()?.getEditorPiece(square);
}

function setEditorPiece(square, piece) {
  return getActiveEditorController()?.setEditorPiece(square, piece);
}

function normalizeEditorEpSquare(value) {
  return getActiveEditorController()?.normalizeEditorEpSquare(value);
}

function getEditorFen() {
  return getActiveEditorController()?.getEditorFen();
}

function loadEditorFenFromText() {
  return getActiveEditorController()?.loadEditorFenFromText();
}

function setEditorValidationMessage(message, type = "") {
  return getActiveEditorController()?.setEditorValidationMessage(message, type);
}

function validateEditorPosition() {
  return getActiveEditorController()?.validateEditorPosition();
}

function useEditorPositionInAnalysis() {
  return ensureBoardEditorModule().useEditorPositionInAnalysis();
}

function setupPlayFromEditorPosition() {
  return ensureBoardEditorModule().setupPlayFromEditorPosition();
}

function toolToPiece(tool) {
  return getActiveEditorController()?.toolToPiece(tool);
}

function updateEditorToolSelectionUi() {
  return getActiveEditorController()?.updateEditorToolSelectionUi();
}

function initEditorPalette() {
  return getActiveEditorController()?.initEditorPalette();
}

function openBoardEditor() {
  return ensureBoardEditorModule().openBoardEditor();
}

function resetTablebaseSessionState() {
  state.tablebase.session.startFen = "";
  state.tablebase.session.currentFen = "";
  state.tablebase.session.fetchStatus = "idle";
  state.tablebase.session.requestSeq = 0;
  state.tablebase.session.position = null;
  state.tablebase.session.moves = [];
  state.tablebase.session.error = "";
  state.tablebase.training.panelOpen = false;
  state.tablebase.training.selectedColor = "w";
  state.tablebase.training.reviewEnabled = false;
  state.tablebase.training.hintEnabled = false;
  state.tablebase.training.active = false;
  state.tablebase.training.finished = false;
  state.tablebase.training.config = { userColor: "w", reviewEnabled: false, hintEnabled: false };
  state.tablebase.training.snapshot = null;
  state.tablebase.training.startFen = "";
  state.tablebase.training.pendingAutoReply = false;
  state.tablebase.training.lastResult = "";
  state.tablebase.training.shownHintUci = "";
}

function normalizeTablebaseCategory(category) {
  const raw = String(category || "").trim().toLowerCase();
  if (["win", "draw", "loss"].includes(raw)) return raw;
  return "unknown";
}

function invertTablebaseCategory(category) {
  if (category === "loss") return "win";
  if (category === "win") return "loss";
  if (category === "draw") return "draw";
  return "unknown";
}

function normalizeTablebaseDistanceMetric(value, options = {}) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  if (number === 0 && !options.allowZero) return null;
  return number;
}

function getTablebaseDistanceValue(move) {
  const dtm = Number(move?.dtm);
  if (Number.isFinite(dtm) && dtm !== 0) return Math.abs(dtm);
  const dtz = Number(move?.dtz);
  if (Number.isFinite(dtz) && dtz !== 0) return Math.abs(dtz);
  return Number.POSITIVE_INFINITY;
}

function getTablebaseDistanceEntriesForReview(moves) {
  const legalMoves = Array.isArray(moves) ? moves.filter((move) => !!move?.uci) : [];
  const dtmEntries = legalMoves
    .map((move) => ({ move, distance: normalizeTablebaseDistanceMetric(move?.dtm, { allowZero: false }) }))
    .filter((entry) => Number.isFinite(entry.distance));
  if (dtmEntries.length) {
    return dtmEntries.map((entry) => ({ move: entry.move, distance: Math.abs(entry.distance), metric: "dtm" }));
  }
  const dtzEntries = legalMoves
    .map((move) => ({ move, distance: normalizeTablebaseDistanceMetric(move?.dtz, { allowZero: false }) }))
    .filter((entry) => Number.isFinite(entry.distance));
  if (dtzEntries.length) {
    return dtzEntries.map((entry) => ({ move: entry.move, distance: Math.abs(entry.distance), metric: "dtz" }));
  }
  return [];
}

function compareTablebaseMoves(a, b) {
  const rank = { win: 0, draw: 1, loss: 2, unknown: 3 };
  const aOutcome = invertTablebaseCategory(a.category);
  const bOutcome = invertTablebaseCategory(b.category);
  const categoryDiff = (rank[aOutcome] ?? 3) - (rank[bOutcome] ?? 3);
  if (categoryDiff !== 0) return categoryDiff;
  const aDistance = getTablebaseDistanceValue(a);
  const bDistance = getTablebaseDistanceValue(b);
  if (aOutcome === "win" && aDistance !== bDistance) {
    return aDistance - bDistance;
  }
  if (aOutcome === "loss" && aDistance !== bDistance) {
    return bDistance - aDistance;
  }
  return String(a.san || a.uci || "").localeCompare(String(b.san || b.uci || ""));
}

function normalizeTablebasePayload(payload) {
  const moves = Array.isArray(payload?.moves)
    ? payload.moves.map((move) => ({
        uci: String(move?.uci || "").trim(),
        san: String(move?.san || "").trim(),
        category: normalizeTablebaseCategory(move?.category),
        dtz: normalizeTablebaseDistanceMetric(move?.dtz, { allowZero: false }),
        dtm: normalizeTablebaseDistanceMetric(move?.dtm, { allowZero: false }),
        zeroing: !!move?.zeroing,
        conversion: !!move?.conversion
      }))
    : [];

  return {
    category: normalizeTablebaseCategory(payload?.category),
    checkmate: !!payload?.checkmate,
    stalemate: !!payload?.stalemate,
    insufficientMaterial: !!payload?.insufficient_material,
    dtz: normalizeTablebaseDistanceMetric(payload?.dtz, { allowZero: false }),
    dtm: normalizeTablebaseDistanceMetric(payload?.dtm, { allowZero: !!payload?.checkmate }),
    moves: moves.sort(compareTablebaseMoves)
  };
}

function getTablebaseUnavailableMessage(rawMessage) {
  const text = String(rawMessage || "").trim();
  if (!text) return "Position not available in tablebase.";
  if (/illegal position/i.test(text) || /not found/i.test(text)) {
    return "Position not available in tablebase.";
  }
  return text;
}

async function requestTablebaseForFen(fen) {
  if (!fen) return;
  const seq = state.tablebase.session.requestSeq + 1;
  state.tablebase.session.requestSeq = seq;
  state.tablebase.session.currentFen = fen;
  state.tablebase.session.fetchStatus = "loading";
  state.tablebase.session.error = "";
  state.tablebase.session.position = null;
  state.tablebase.session.moves = [];
  if (state.appMode === "tablebase") {
    render();
  }
  updateTablebaseTrainingUi();

  try {
    const response = await fetch(`https://tablebase.lichess.ovh/standard?fen=${encodeURIComponent(fen)}`);
    const text = await response.text();
    if (seq !== state.tablebase.session.requestSeq) return;
    if (!response.ok) {
      state.tablebase.session.fetchStatus = "error";
      state.tablebase.session.error = getTablebaseUnavailableMessage(text);
      state.tablebase.session.position = null;
      state.tablebase.session.moves = [];
      if (state.appMode === "tablebase") render();
      return;
    }
    const payload = normalizeTablebasePayload(JSON.parse(text));
    state.tablebase.session.fetchStatus = "success";
    state.tablebase.session.position = payload;
    state.tablebase.session.moves = payload.moves;
    state.tablebase.session.error = "";
  } catch (err) {
    if (seq !== state.tablebase.session.requestSeq) return;
    state.tablebase.session.fetchStatus = "error";
    state.tablebase.session.error = String(err?.message || err) || "Failed to reach tablebase service.";
    state.tablebase.session.position = null;
    state.tablebase.session.moves = [];
  }
  if (state.appMode === "tablebase") {
    render();
  }
  if (state.tablebase.session.fetchStatus === "success") {
    maybeRequestTablebaseTrainingReply();
  }
}

function getTablebaseSummaryText(position) {
  if (!position) return "Set up a position to begin.";
  if (position.checkmate) return "Checkmate on the board.";
  if (position.stalemate) return "Stalemate on the board.";
  if (position.insufficientMaterial) return "Draw by insufficient material.";
  if (position.category === "win") return "Side to move is winning with perfect play.";
  if (position.category === "draw") return "Position is drawn with perfect play.";
  if (position.category === "loss") return "Side to move is losing with perfect play.";
  return "Tablebase result loaded.";
}

function formatTablebaseMetric(label, value) {
  if (!Number.isFinite(value)) return null;
  return `${label}: ${value}`;
}

function formatTablebaseMoverOutcome(move) {
  const outcome = invertTablebaseCategory(move.category);
  if (outcome === "win") return "Winning";
  if (outcome === "draw") return "Drawing";
  if (outcome === "loss") return "Losing";
  return "Unknown";
}

function setTablebaseTrainingMessage(message, type = "") {
  if (!tablebaseTrainingMsgEl) return;
  tablebaseTrainingMsgEl.textContent = message || "";
  tablebaseTrainingMsgEl.classList.remove("error", "ok");
  if (type === "error") tablebaseTrainingMsgEl.classList.add("error");
  if (type === "ok") tablebaseTrainingMsgEl.classList.add("ok");
}

function getTablebaseMoveInputUci(moveInput) {
  if (!moveInput?.from || !moveInput?.to) return "";
  return `${String(moveInput.from)}${String(moveInput.to)}${String(moveInput.promotion || "").toLowerCase()}`;
}

function getTablebaseUciMoveShape(uci) {
  const text = String(uci || "").trim().toLowerCase();
  if (!/^[a-h][1-8][a-h][1-8][nbrq]?$/.test(text)) return null;
  return {
    from: text.slice(0, 2),
    to: text.slice(2, 4),
    promotion: text.slice(4) || undefined
  };
}

function getTablebaseReviewTargetMoves(positionCategory, moves) {
  const legalMoves = Array.isArray(moves) ? moves.filter((move) => !!move?.uci) : [];
  if (!legalMoves.length) return [];

  if (positionCategory === "draw") {
    return legalMoves.filter((move) => invertTablebaseCategory(move.category) === "draw");
  }

  const matchingOutcomeMoves = legalMoves.filter(
    (move) => invertTablebaseCategory(move.category) === positionCategory
  );
  if (!matchingOutcomeMoves.length) return [];

  const moveDistances = getTablebaseDistanceEntriesForReview(matchingOutcomeMoves);

  if (!moveDistances.length) return matchingOutcomeMoves;

  if (positionCategory === "win") {
    const bestDistance = Math.min(...moveDistances.map((entry) => entry.distance));
    return moveDistances.filter((entry) => entry.distance === bestDistance).map((entry) => entry.move);
  }

  if (positionCategory === "loss") {
    const bestDistance = Math.max(...moveDistances.map((entry) => entry.distance));
    return moveDistances.filter((entry) => entry.distance === bestDistance).map((entry) => entry.move);
  }

  return [];
}

function getTablebaseTrainingReviewFailure(moveInput) {
  if (!isTablebaseTrainingActive()) return "";
  if (!state.tablebase.training.config?.reviewEnabled) return "";
  if (!isTablebaseTrainingUsersTurn()) return "";
  if (state.tablebase.session.fetchStatus !== "success") return "";

  const positionCategory = state.tablebase.session.position?.category;
  if (positionCategory !== "win" && positionCategory !== "loss" && positionCategory !== "draw") return "";

  const moveUci = getTablebaseMoveInputUci(moveInput);
  if (!moveUci) return "";

  const allowedMoves = getTablebaseReviewTargetMoves(positionCategory, state.tablebase.session.moves);
  if (!allowedMoves.length) return "";

  const matchedMove = state.tablebase.session.moves.find((move) => move?.uci === moveUci);
  if (!matchedMove) return "";
  if (allowedMoves.some((move) => move.uci === moveUci)) return "";

  if (positionCategory === "win") {
    return "Retry, bad move. Find the quickest mate.";
  }
  if (positionCategory === "draw") {
    return "Retry, bad move. Keep the draw.";
  }
  return "Retry, bad move. Choose the move that delays mate the longest.";
}

function clearTablebaseTrainingHint() {
  if (!state.tablebase.training.shownHintUci) return false;
  state.tablebase.training.shownHintUci = "";
  renderBoardAnnotations();
  return true;
}

function getTablebaseTrainingHintMove() {
  if (!isTablebaseTrainingActive()) return null;
  if (!state.tablebase.training.config?.hintEnabled) return null;
  if (!isTablebaseTrainingUsersTurn()) return null;
  if (state.tablebase.session.fetchStatus !== "success") return null;
  const positionCategory = state.tablebase.session.position?.category;
  let allowedMoves = [];
  if (state.tablebase.training.config?.reviewEnabled) {
    allowedMoves = getTablebaseReviewTargetMoves(positionCategory, state.tablebase.session.moves);
  } else {
    allowedMoves = Array.isArray(state.tablebase.session.moves)
      ? state.tablebase.session.moves.filter((move) => !!move?.uci)
      : [];
  }
  return allowedMoves[0] || null;
}

function showTablebaseTrainingHint() {
  if (!isTablebaseTrainingActive()) return;
  const hintMove = getTablebaseTrainingHintMove();
  if (!hintMove?.uci) {
    setTablebaseTrainingMessage("Hint is not available for this move.", "error");
    return;
  }
  state.tablebase.training.shownHintUci = hintMove.uci;
  setTablebaseTrainingMessage("Hint shown on the board.");
  renderBoardAnnotations();
}

function deepCloneTablebaseSnapshotValue(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function createTablebaseTrainingSnapshot() {
  return {
    currentGameStartFen: state.currentGameStartFen,
    playStartFen: state.playStartFen,
    viewPly: state.viewPly,
    boardFlipped: state.boardFlipped,
    gameMovesUci: state.game.history({ verbose: true }).map((mv) => `${mv.from}${mv.to}${mv.promotion || ""}`),
    analysisTree: deepCloneTablebaseSnapshotValue(state.analysisTree),
    analysisPgnMeta: deepCloneTablebaseSnapshotValue(state.analysisPgnMeta),
    tablebaseSession: deepCloneTablebaseSnapshotValue(state.tablebase.session)
  };
}

function restoreTablebaseTrainingSnapshot(snapshot) {
  if (!snapshot) return;
  state.currentGameStartFen = snapshot.currentGameStartFen || new Chess().fen();
  state.playStartFen = snapshot.playStartFen || state.currentGameStartFen;
  state.boardFlipped = !!snapshot.boardFlipped;
  state.analysisTree = deepCloneTablebaseSnapshotValue(snapshot.analysisTree);
  state.analysisPgnMeta = deepCloneTablebaseSnapshotValue(snapshot.analysisPgnMeta) || { tags: {}, rootComments: [] };
  state.tablebase.session = {
    ...state.tablebase.session,
    ...deepCloneTablebaseSnapshotValue(snapshot.tablebaseSession)
  };
  state.game = rebuildGameFromFenAndUciMoves(
    state.currentGameStartFen,
    Array.isArray(snapshot.gameMovesUci) ? snapshot.gameMovesUci : []
  );
  state.viewPly = Math.max(0, Math.min(getLatestPly(), Number(snapshot.viewPly) || 0));
}

function updateTablebaseTrainingUi() {
  if (tablebaseTrainingModalEl) {
    tablebaseTrainingModalEl.classList.toggle("hidden", !state.tablebase.training.panelOpen || isTablebaseTrainingActive());
  }
  if (btnTablebaseTrainingEl) {
    btnTablebaseTrainingEl.classList.toggle("hidden", state.appMode !== "tablebase" || isTablebaseTrainingActive());
  }
  if (btnTablebaseTrainWhiteEl) {
    btnTablebaseTrainWhiteEl.classList.toggle("selected", state.tablebase.training.selectedColor !== "b");
  }
  if (btnTablebaseTrainBlackEl) {
    btnTablebaseTrainBlackEl.classList.toggle("selected", state.tablebase.training.selectedColor === "b");
  }
  if (tablebaseTrainingReviewEl) {
    tablebaseTrainingReviewEl.checked = !!state.tablebase.training.reviewEnabled;
  }
  if (tablebaseTrainingHintEnabledEl) {
    tablebaseTrainingHintEnabledEl.checked = !!state.tablebase.training.hintEnabled;
  }
  if (btnTablebaseExitTrainingEl) {
    btnTablebaseExitTrainingEl.classList.toggle("hidden", !isTablebaseTrainingActive());
  }
  gameScreenEl.classList.toggle("training-active", isTablebaseTrainingActive());
}

function updateCrazyhouseUi() {
  const shouldShow = state.appMode === "play" && isCurrentCrazyhouseVariantGame();
  if (gameScreenEl) {
    gameScreenEl.classList.toggle("crazyhouse-mode", shouldShow);
  }
  if (analysisLeftColumnEl) {
    analysisLeftColumnEl.classList.toggle("hidden", !shouldShow);
  }
  if (crazyhousePocketPanelEl) {
    crazyhousePocketPanelEl.classList.toggle("hidden", !shouldShow);
  }
  if (!shouldShow || !crazyhousePocketGridWhiteEl || !crazyhousePocketGridBlackEl) {
    return;
  }
  const humanColor = getHumanPlayerColor();
  const topPocketColor = state.boardFlipped ? "w" : "b";
  const canInteract = !isGameInteractionLocked() && isHumanTurn() && isAtLatestPosition() && !state.promotion;
  const order = ["q", "r", "b", "n", "p"];
  const labels = { q: "Queen", r: "Rook", b: "Bishop", n: "Knight", p: "Pawn" };
  const whiteSectionEl = crazyhousePocketGridWhiteEl.closest(".crazyhouse-pocket-section");
  const blackSectionEl = crazyhousePocketGridBlackEl.closest(".crazyhouse-pocket-section");
  const whiteLabelEl = whiteSectionEl?.querySelector(".crazyhouse-pocket-label");
  const blackLabelEl = blackSectionEl?.querySelector(".crazyhouse-pocket-label");

  if (whiteSectionEl && blackSectionEl) {
    whiteSectionEl.style.order = topPocketColor === "w" ? "0" : "1";
    blackSectionEl.style.order = topPocketColor === "b" ? "0" : "1";
  }
  if (whiteLabelEl) {
    whiteLabelEl.textContent = "White";
  }
  if (blackLabelEl) {
    blackLabelEl.textContent = "Black";
  }

  function renderPocketGrid(gridEl, sideColor) {
    const pocketText = typeof state.game?.pocket === "function" ? state.game.pocket(sideColor) : "";
    const counts = { p: 0, n: 0, b: 0, r: 0, q: 0 };
    for (const ch of String(pocketText || "").toLowerCase()) {
      if (counts[ch] !== undefined) counts[ch] += 1;
    }
    const interactive = sideColor === humanColor && canInteract;
    gridEl.innerHTML = "";
    for (const type of order) {
      const count = counts[type] || 0;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `crazyhouse-pocket-btn${
        interactive && state.selectedDropPiece === type && state.selectedDropColor === sideColor ? " selected" : ""
      }`;
      if (count > 0) {
        btn.classList.add("has-count");
      }
      btn.disabled = !count || !interactive;
      btn.title = `${labels[type]} x${count}`;
      btn.dataset.pocketColor = sideColor;
      btn.dataset.pieceType = type;
      const img = document.createElement("img");
      img.draggable = false;
      img.src = pieceAssetPath({ color: sideColor, type });
      img.alt = `${sideColor}${type}`;
      btn.appendChild(img);
      const countEl = document.createElement("span");
      countEl.className = "crazyhouse-pocket-count";
      countEl.textContent = String(count);
      btn.appendChild(countEl);
      if (interactive) {
        btn.addEventListener("click", () => {
          if (!count || !canInteract) return;
          if (state.selectedDropPiece === type && state.selectedDropColor === sideColor) {
            clearSelection();
          } else {
            selectCrazyhouseDropPiece(type, sideColor);
          }
          render();
        });
        btn.addEventListener("pointerdown", (event) => startCrazyhousePocketDrag(event, type, sideColor));
      }
      gridEl.appendChild(btn);
    }
  }

  renderPocketGrid(crazyhousePocketGridWhiteEl, "w");
  renderPocketGrid(crazyhousePocketGridBlackEl, "b");
}

function getTablebaseTrainingResultLabel() {
  if (state.game.isCheckmate()) {
    const winner = state.game.turn() === "w" ? "Black" : "White";
    return `${winner} won by checkmate.`;
  }
  if (state.game.isStalemate()) return "Training ended in stalemate.";
  if (state.game.isInsufficientMaterial()) return "Training ended in a draw.";
  if (state.game.isThreefoldRepetition()) return "Training ended by repetition.";
  if (typeof state.game.isDrawByFiftyMoves === "function" && state.game.isDrawByFiftyMoves()) {
    return "Training ended by 50-move rule.";
  }
  return "Training complete.";
}

function maybeFinishTablebaseTraining() {
  if (!isTablebaseTrainingActive() || !state.game.isGameOver()) return false;
  state.tablebase.training.pendingAutoReply = false;
  state.tablebase.training.finished = true;
  state.tablebase.training.lastResult = getTablebaseTrainingResultLabel();
  return true;
}

function openTablebaseTrainingPanel() {
  if (state.appMode !== "tablebase" || isTablebaseTrainingActive()) return;
  state.tablebase.training.panelOpen = true;
  setTablebaseTrainingMessage("");
  render();
}

function closeTablebaseTrainingPanel() {
  state.tablebase.training.panelOpen = false;
  setTablebaseTrainingMessage("");
}

function maybeRequestTablebaseTrainingReply() {
  if (!isTablebaseTrainingActive() || isTablebaseTrainingFinished()) return;
  if (state.tablebase.session.fetchStatus !== "success") return;
  if (state.tablebase.training.pendingAutoReply) return;
  if (maybeFinishTablebaseTraining()) {
    render();
    return;
  }
  if (isTablebaseTrainingUsersTurn()) return;
  const bestMove = state.tablebase.session.moves[0];
  if (!bestMove?.uci || bestMove.uci.length < 4) return;
  state.tablebase.training.pendingAutoReply = true;
  const moveInput = {
    from: bestMove.uci.slice(0, 2),
    to: bestMove.uci.slice(2, 4),
    promotion: bestMove.uci.slice(4) || undefined
  };
  window.setTimeout(() => {
    if (!isTablebaseTrainingActive()) return;
    attemptMove(moveInput);
    state.tablebase.training.pendingAutoReply = false;
    maybeFinishTablebaseTraining();
    render();
  }, 180);
}

function startTablebaseTraining(config = {}) {
  if (state.appMode !== "tablebase") return;
  const userColor = config.userColor === "b" ? "b" : "w";
  const reviewEnabled = !!config.reviewEnabled;
  const hintEnabled = !!config.hintEnabled;
  const currentFen = getViewGame().fen();
  const test = new Chess();
  try {
    test.load(currentFen);
  } catch (_) {
    setTablebaseTrainingMessage("Current board position is not playable.", "error");
    return;
  }
  state.tablebase.training.snapshot = createTablebaseTrainingSnapshot();
  state.tablebase.training.active = true;
  state.tablebase.training.finished = false;
  state.tablebase.training.pendingAutoReply = false;
  state.tablebase.training.config = { userColor, reviewEnabled, hintEnabled };
  state.tablebase.training.startFen = currentFen;
  state.tablebase.training.lastResult = "";
  state.tablebase.training.shownHintUci = "";
  closeTablebaseTrainingPanel();
  state.currentGameStartFen = currentFen;
  state.playStartFen = currentFen;
  state.game = new Chess(currentFen);
  state.boardFlipped = userColor === "b";
  state.analysisTree = createAnalysisTreeRoot(currentFen);
  state.analysisPgnMeta = { tags: {}, rootComments: [] };
  state.viewPly = 0;
  clearSelection();
  clearPremove();
  closePromotionMenu();
  clearBoardAnnotations();
  requestTablebaseForFen(currentFen);
  render();
}

function exitTablebaseTraining() {
  if (!isTablebaseTrainingActive()) return;
  const snapshot = state.tablebase.training.snapshot;
  state.tablebase.training.active = false;
  state.tablebase.training.finished = false;
  state.tablebase.training.pendingAutoReply = false;
  state.tablebase.training.lastResult = "";
  state.tablebase.training.shownHintUci = "";
  closeTablebaseTrainingPanel();
  restoreTablebaseTrainingSnapshot(snapshot);
  state.tablebase.training.snapshot = null;
  clearSelection();
  clearPremove();
  closePromotionMenu();
  clearBoardAnnotations();
  render();
}

function restartTablebaseTraining() {
  if (!isTablebaseTrainingActive()) return;
  const startFen = state.tablebase.training.startFen;
  const userColor = state.tablebase.training.config.userColor === "b" ? "b" : "w";
  const reviewEnabled = !!state.tablebase.training.config.reviewEnabled;
  const hintEnabled = !!state.tablebase.training.config.hintEnabled;
  state.tablebase.training.finished = false;
  state.tablebase.training.pendingAutoReply = false;
  state.tablebase.training.lastResult = "";
  state.tablebase.training.shownHintUci = "";
  state.currentGameStartFen = startFen;
  state.playStartFen = startFen;
  state.game = new Chess(startFen);
  state.boardFlipped = userColor === "b";
  state.analysisTree = createAnalysisTreeRoot(startFen);
  state.analysisPgnMeta = { tags: {}, rootComments: [] };
  state.viewPly = 0;
  state.tablebase.training.config = { userColor, reviewEnabled, hintEnabled };
  clearSelection();
  clearPremove();
  closePromotionMenu();
  clearBoardAnnotations();
  requestTablebaseForFen(startFen);
  render();
}

function renderTablebaseSidePanel() {
  if (!tablebasePanelEl || !tablebaseStatusPillEl || !tablebaseSummaryEl || !tablebaseMovesEl) return;
  updateTablebaseTrainingUi();
  const visible = state.appMode === "tablebase" && !isTablebaseTrainingActive();
  tablebasePanelEl.classList.toggle("hidden", !visible);
  if (!visible) return;

  const session = state.tablebase.session;
  const position = session.position;
  tablebaseStatusPillEl.textContent = session.fetchStatus === "success" ? position?.category || "ready" : session.fetchStatus;
  tablebaseSummaryEl.textContent =
    session.fetchStatus === "error" ? "Tablebase lookup unavailable." : getTablebaseSummaryText(position);

  if (tablebaseErrorEl) {
    tablebaseErrorEl.textContent = session.fetchStatus === "error" ? session.error : "";
    tablebaseErrorEl.classList.toggle("hidden", session.fetchStatus !== "error");
  }

  if (tablebaseMetricsEl) {
    tablebaseMetricsEl.innerHTML = "";
    const metrics = [
      formatTablebaseMetric("DTZ", position?.dtz),
      formatTablebaseMetric("DTM", position?.dtm)
    ].filter(Boolean);
    tablebaseMetricsEl.classList.toggle("hidden", metrics.length === 0);
    for (const metric of metrics) {
      const chip = document.createElement("div");
      chip.className = "tablebase-metric-chip";
      chip.textContent = metric;
      tablebaseMetricsEl.appendChild(chip);
    }
  }

  tablebaseMovesEl.innerHTML = "";
  if (session.fetchStatus === "loading") {
    const empty = document.createElement("div");
    empty.className = "tablebase-empty";
    empty.textContent = "Loading tablebase moves...";
    tablebaseMovesEl.appendChild(empty);
    return;
  }
  if (!session.moves.length) {
    const empty = document.createElement("div");
    empty.className = "tablebase-empty";
    empty.textContent =
      session.fetchStatus === "error" ? "No move recommendations available." : "No legal moves available.";
    tablebaseMovesEl.appendChild(empty);
    return;
  }

  const bestUci = session.moves[0]?.uci || "";
  for (const move of session.moves) {
    const row = document.createElement("div");
    row.className = "tablebase-move";
    if (move.uci === bestUci) {
      row.classList.add("best");
    }

    const left = document.createElement("div");
    left.className = "tablebase-move-left";
    const san = document.createElement("div");
    san.className = "tablebase-move-san";
    san.textContent = move.san || move.uci || "(unknown)";
    const uci = document.createElement("div");
    uci.className = "tablebase-move-uci";
    uci.textContent = move.uci || "";
    left.appendChild(san);
    left.appendChild(uci);

    const right = document.createElement("div");
    right.className = "tablebase-move-right";
    const result = document.createElement("div");
    result.className = "tablebase-move-result";
    result.textContent = formatTablebaseMoverOutcome(move);
    const detail = document.createElement("div");
    detail.className = "tablebase-move-detail";
    const detailParts = [
      Number.isFinite(move.dtz) ? `DTZ ${move.dtz}` : "",
      Number.isFinite(move.dtm) ? `DTM ${move.dtm}` : ""
    ].filter(Boolean);
    detail.textContent = detailParts.join("  ");
    right.appendChild(result);
    right.appendChild(detail);

    row.appendChild(left);
    row.appendChild(right);
    tablebaseMovesEl.appendChild(row);
  }
}

function startTablebaseSession(fen) {
  const game = new Chess();
  try {
    game.load(fen);
  } catch (err) {
    showAppMessage(`Failed to start tablebase: ${String(err?.message || err)}`);
    return;
  }
  state.game = game;
  state.currentGameStartFen = fen;
  state.playStartFen = fen;
  state.viewPly = 0;
  state.isUnlimitedTime = true;
  state.player2Color = "b";
  state.timeoutLoser = null;
  state.resignedColor = null;
  state.sound.gameEndKey = "";
  clearResignConfirmation();
  clearSelection();
  clearPremove();
  closePromotionMenu();
  clearBoardAnnotations();
  state.tablebase.session.startFen = fen;
  state.analysisTree = createAnalysisTreeRoot(fen);
  state.analysisPgnMeta = { tags: {}, rootComments: [] };
  markAnalysisPgnDirty();
  closeTablebaseTrainingPanel();
  setAppMode("tablebase");
  showGameScreen();
  requestTablebaseForFen(fen);
  render();
}

function exitTablebaseFlow() {
  clearResignConfirmation();
  resetTablebaseSessionState();
  state.analysisTree = null;
  state.game = new Chess();
  state.currentGameStartFen = new Chess().fen();
  state.playStartFen = new Chess().fen();
  state.viewPly = 0;
  setAppMode("play");
  showToolsScreen();
  render();
}

function pieceAssetPath(piece) {
  const key = `${piece.color}${piece.type}`;
  const code = PIECE_CODE[key];
  const requestedSet = state.theme.pieceSet || DEFAULT_PIECE_SET;
  const setName =
    String(requestedSet).startsWith("custom:") || BUILTIN_PIECE_SETS.has(requestedSet)
      ? requestedSet
      : DEFAULT_PIECE_SET;
  if (String(setName).startsWith("custom:")) {
    const custom = state.customAssets.pieceSets.get(setName);
    if (custom?.files?.[code]) {
      return custom.files[code];
    }
  }
  return `../assets/Pieces/${setName}/${code}.svg`;
}

function clampBoardSize(size) {
  const viewportMax = Math.max(MIN_BOARD_SIZE, window.innerWidth - 32);
  const hardMax = Math.min(MAX_BOARD_SIZE, viewportMax);
  return Math.max(MIN_BOARD_SIZE, Math.min(hardMax, size));
}

function applyBoardSize(sizePx) {
  const next = clampBoardSize(sizePx);
  boardShellEl.style.width = `${next}px`;
  try {
    localStorage.setItem(BOARD_SIZE_STORAGE_KEY, String(next));
  } catch (_) {
    // ignore storage errors
  }
}

function loadBoardSize() {
  try {
    const raw = localStorage.getItem(BOARD_SIZE_STORAGE_KEY);
    if (!raw) return;
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) {
      applyBoardSize(parsed);
    }
  } catch (_) {
    // ignore storage errors
  }
}

function setupBoardResize() {
  resizeHandleEl.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    const rect = boardShellEl.getBoundingClientRect();
    const startWidth = rect.width;
    const startX = event.clientX;

    boardShellEl.classList.add("resizing");
    resizeHandleEl.setPointerCapture(event.pointerId);

    function onPointerMove(moveEvent) {
      const delta = moveEvent.clientX - startX;
      applyBoardSize(startWidth + delta);
    }

    function onPointerUp(upEvent) {
      resizeHandleEl.releasePointerCapture(upEvent.pointerId);
      boardShellEl.classList.remove("resizing");
      resizeHandleEl.removeEventListener("pointermove", onPointerMove);
      resizeHandleEl.removeEventListener("pointerup", onPointerUp);
      resizeHandleEl.removeEventListener("pointercancel", onPointerUp);
    }

    resizeHandleEl.addEventListener("pointermove", onPointerMove);
    resizeHandleEl.addEventListener("pointerup", onPointerUp);
    resizeHandleEl.addEventListener("pointercancel", onPointerUp);
  });

  window.addEventListener("resize", () => {
    const currentWidth = boardShellEl.getBoundingClientRect().width;
    if (currentWidth < MIN_BOARD_SIZE - 1) return;
    applyBoardSize(currentWidth);
  });
}

function clearSelection() {
  state.selectedSquare = null;
  state.selectedDropPiece = null;
  state.selectedDropColor = null;
  state.legalTargets.clear();
  state.captureTargets.clear();
  state.moveOptionsByTarget.clear();
}

function clearBoardAnnotations() {
  let changed = false;
  if (state.annotations.highlightedSquares.size > 0) {
    state.annotations.highlightedSquares.clear();
    const markedSquares = boardEl.querySelectorAll(".square.annotated-square");
    markedSquares.forEach((el) => el.classList.remove("annotated-square"));
    changed = true;
  }
  if (state.annotations.arrows.length > 0) {
    state.annotations.arrows = [];
    changed = true;
  }
  state.annotations.rightDrag = null;
  if (changed) {
    renderBoardAnnotations();
  }
  return changed;
}

function setSingleBoardArrow(uci, color = TABLEBASE_HINT_ARROW_COLOR) {
  const text = String(uci || "");
  if (text.length < 4) return false;
  state.annotations.highlightedSquares.clear();
  state.annotations.rightDrag = null;
  state.annotations.arrows = [
    {
      from: text.slice(0, 2),
      to: text.slice(2, 4),
      fill: color,
      opacity: 1,
      thicknessScale: 1.2
    }
  ];
  renderBoardAnnotations();
  return true;
}

function getSquareCenterFromBoardRect(square, boardRect) {
  const cell = boardEl.querySelector(`[data-square="${square}"]`);
  if (!cell) return null;
  const rect = cell.getBoundingClientRect();
  return {
    x: rect.left - boardRect.left + rect.width / 2,
    y: rect.top - boardRect.top + rect.height / 2
  };
}

function getAnnotationEndPoint(drag, boardRect) {
  if (drag.currentSquare) {
    const squareCenter = getSquareCenterFromBoardRect(drag.currentSquare, boardRect);
    if (squareCenter) return squareCenter;
  }
  return {
    x: drag.currentX - boardRect.left,
    y: drag.currentY - boardRect.top
  };
}

function buildArrowPolygonPoints(fromPoint, toPoint, cellSize, thicknessScale = 1) {
  const dx = toPoint.x - fromPoint.x;
  const dy = toPoint.y - fromPoint.y;
  const len = Math.hypot(dx, dy);
  if (len < 2) return "";
  const ux = dx / len;
  const uy = dy / len;
  const px = -uy;
  const py = ux;

  const scale = Math.max(0.45, Number(thicknessScale) || 1);
  const tailHalf = Math.max(4, cellSize * 0.07 * scale);
  const headLength = Math.max(14, cellSize * 0.32 * Math.max(0.8, scale));
  const headHalf = Math.max(10, cellSize * 0.18 * scale);
  const clampedHeadLength = Math.min(headLength, Math.max(8, len * 0.6));

  const headBase = {
    x: toPoint.x - ux * clampedHeadLength,
    y: toPoint.y - uy * clampedHeadLength
  };

  const points = [
    [fromPoint.x + px * tailHalf, fromPoint.y + py * tailHalf],
    [headBase.x + px * tailHalf, headBase.y + py * tailHalf],
    [headBase.x + px * headHalf, headBase.y + py * headHalf],
    [toPoint.x, toPoint.y],
    [headBase.x - px * headHalf, headBase.y - py * headHalf],
    [headBase.x - px * tailHalf, headBase.y - py * tailHalf],
    [fromPoint.x - px * tailHalf, fromPoint.y - py * tailHalf]
  ];
  return points.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(" ");
}

function parsePvFirstMove(pv) {
  if (typeof pv !== "string") return null;
  const first = pv.trim().split(/\s+/)[0];
  if (!first || first.length < 4) return null;
  const from = first.slice(0, 2);
  const to = first.slice(2, 4);
  if (!/^[a-h][1-8]$/.test(from) || !/^[a-h][1-8]$/.test(to)) return null;
  return { from, to };
}

function getAnalysisBestMoveArrows() {
  if (state.appMode !== "analysis") return [];
  if (!state.analysis.enabled) return [];

  const maxArrowCount = Math.min(3, getAnalysisLineCount());
  const arrows = [];
  for (let i = 1; i <= maxArrowCount; i += 1) {
    const line = state.analysis.lines.get(i);
    if (!line) continue;
    const move = parsePvFirstMove(line.pv);
    if (!move) continue;
    const style = ANALYSIS_ARROW_STYLES[i - 1] || ANALYSIS_ARROW_STYLES[ANALYSIS_ARROW_STYLES.length - 1];
    arrows.push({
      from: move.from,
      to: move.to,
      fill: style.color,
      opacity: style.opacity,
      thicknessScale: style.thicknessScale
    });
  }
  return arrows;
}

function renderBoardAnnotations() {
  if (!boardAnnotationsEl) return;
  const boardRect = boardEl.getBoundingClientRect();
  const width = Math.max(1, Math.round(boardRect.width));
  const height = Math.max(1, Math.round(boardRect.height));
  boardAnnotationsEl.setAttribute("viewBox", `0 0 ${width} ${height}`);
  boardAnnotationsEl.setAttribute("width", String(width));
  boardAnnotationsEl.setAttribute("height", String(height));
  boardAnnotationsEl.innerHTML = "";

  const cellSize = width / 8;
  const arrows = [];
  for (const engineArrow of getAnalysisBestMoveArrows()) {
    const fromPoint = getSquareCenterFromBoardRect(engineArrow.from, boardRect);
    const toPoint = getSquareCenterFromBoardRect(engineArrow.to, boardRect);
    if (!fromPoint || !toPoint) continue;
    arrows.push({
      fromPoint,
      toPoint,
      preview: false,
      fill: engineArrow.fill,
      opacity: engineArrow.opacity,
      thicknessScale: engineArrow.thicknessScale
    });
  }

  for (const arrow of state.annotations.arrows) {
    const fromPoint = getSquareCenterFromBoardRect(arrow.from, boardRect);
    const toPoint = getSquareCenterFromBoardRect(arrow.to, boardRect);
    if (!fromPoint || !toPoint) continue;
    arrows.push({
      fromPoint,
      toPoint,
      preview: false,
      fill: arrow.fill || ANNOTATION_ARROW_COLOR,
      opacity: typeof arrow.opacity === "number" ? arrow.opacity : 1,
      thicknessScale: arrow.thicknessScale || 1
    });
  }

  const trainingHintMove = getTablebaseUciMoveShape(state.tablebase.training.shownHintUci);
  if (trainingHintMove) {
    const fromPoint = getSquareCenterFromBoardRect(trainingHintMove.from, boardRect);
    const toPoint = getSquareCenterFromBoardRect(trainingHintMove.to, boardRect);
    if (fromPoint && toPoint) {
      arrows.push({
        fromPoint,
        toPoint,
        preview: false,
        fill: TABLEBASE_HINT_ARROW_COLOR,
        opacity: 1,
        thicknessScale: 1.15
      });
    }
  }

  const drag = state.annotations.rightDrag;
  if (drag && drag.moved) {
    const fromPoint = getSquareCenterFromBoardRect(drag.startSquare, boardRect);
    const toPoint = getAnnotationEndPoint(drag, boardRect);
    if (fromPoint && toPoint) {
      arrows.push({
        fromPoint,
        toPoint,
        preview: true,
        fill: ANNOTATION_ARROW_COLOR,
        opacity: 0.65,
        thicknessScale: 1
      });
    }
  }

  for (const arrow of arrows) {
    const points = buildArrowPolygonPoints(
      arrow.fromPoint,
      arrow.toPoint,
      cellSize,
      arrow.thicknessScale
    );
    if (!points) continue;
    const poly = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    poly.setAttribute("points", points);
    poly.setAttribute("fill", arrow.fill || ANNOTATION_ARROW_COLOR);
    if (arrow.preview || (typeof arrow.opacity === "number" && arrow.opacity < 1)) {
      poly.setAttribute("opacity", String(arrow.opacity ?? 0.65));
    }
    boardAnnotationsEl.appendChild(poly);
  }
}

function getLatestPly() {
  return state.game.history().length;
}

function isAtLatestPosition() {
  return state.viewPly === getLatestPly();
}

function isClockRunning() {
  if (isBotTournamentSpectatorMode()) return false;
  if (state.appMode === "analysis") return false;
  if (isOnlineGameActive()) {
    if (state.isUnlimitedTime) return false;
    return !!state.online.currentGameId && !state.online.finished;
  }
  if (state.isUnlimitedTime) return false;
  return getLatestPly() > 0 && !state.game.isGameOver() && !state.timeoutLoser && !state.resignedColor;
}

function isGameInteractionLocked() {
  if (isBotTournamentSpectatorMode()) return true;
  if (isOnlineGameActive() && state.online.finished) return true;
  if (state.appMode === "puzzle" && puzzleModule?.isInteractionLocked()) return true;
  return state.game.isGameOver() || !!state.timeoutLoser || !!state.resignedColor;
}

function isBotTournamentSpectatorMode() {
  return !!state.botTournamentSpectator?.active;
}

function isBotTournamentHumanMode() {
  return !!state.botTournamentHumanGame?.active;
}

function getLocalHumanPlayerName() {
  if (isBotTournamentHumanMode()) {
    return String(state.botTournamentHumanGame.humanName || state.profile.name || "You");
  }
  return String(state.profile.name || "You");
}

function stopEngineThinkingIfRunning() {
  if (!state.engineRuntime.connected) return;
  if (!state.engineRuntime.thinking) return;
  state.engineRuntime.thinking = false;
  ipcRenderer.invoke("engine:send", "stop");
}

function getEngineColor() {
  return state.player2Color === "w" ? "b" : "w";
}

function isEngineTurn() {
  return state.game.turn() === getEngineColor();
}

function isHumanTurn() {
  if (state.appMode === "tablebase") {
    if (isTablebaseTrainingActive()) return isTablebaseTrainingUsersTurn();
    return true;
  }
  if (state.appMode === "puzzle") {
    return puzzleModule ? puzzleModule.isUsersTurn() : true;
  }
  return state.game.turn() === state.player2Color;
}

function canQueuePremove() {
  return (
    state.premoveEnabled &&
    state.appMode === "play" &&
    isAtLatestPosition() &&
    !state.promotion &&
    !isGameInteractionLocked() &&
    !isHumanTurn()
  );
}

function clearPremove() {
  state.premove = null;
  state.premoveSelectFrom = null;
}

function clearAnalysisState() {
  if (state.analysis.timerId !== null) {
    window.clearTimeout(state.analysis.timerId);
    state.analysis.timerId = null;
  }
  state.analysis.searching = false;
  state.analysis.eval = null;
  state.analysis.lines = new Map();
  state.analysis.depth = null;
  state.analysis.hashPermill = null;
  state.analysis.lastFenRequested = "";
  state.analysis.requestSeq = 0;
  state.analysis.activeSeq = 0;
  state.analysis.computer.running = false;
  state.analysis.computer.queue = [];
  state.analysis.computer.results = [];
  state.analysis.computer.currentIndex = -1;
  state.analysis.computer.currentEval = null;
  if (state.analysis.computer.stopTimerId !== null) {
    window.clearTimeout(state.analysis.computer.stopTimerId);
    state.analysis.computer.stopTimerId = null;
  }
  if (state.analysis.computer.timeoutId !== null) {
    window.clearTimeout(state.analysis.computer.timeoutId);
    state.analysis.computer.timeoutId = null;
  }
}

function makeAnalysisNodeId() {
  return `n_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

function createAnalysisTreeRoot(startFen = null) {
  const rootId = makeAnalysisNodeId();
  const now = Date.now();
  const rootGame = isCurrentFairyVariantGame()
    ? createFairyVariantGame(getCurrentFairyVariantName(), startFen || getDefaultStartFenForVariant(state.currentVariant))
    : new Chess();
  if (startFen && !isCurrentFairyVariantGame()) {
    try {
      rootGame.load(startFen);
    } catch (_) {
      // fallback to start position
    }
  }
  const fen = rootGame.fen();
  const rootNode = {
    id: rootId,
    parentId: null,
    children: [],
    ply: 0,
    fen,
    turn: rootGame.turn(),
    move: null,
    san: null,
    uci: null,
    comment: "",
    nags: [],
    eval: null,
    evalByEngineKey: {},
    ui: { arrows: [], highlights: [] },
    createdAt: now,
    updatedAt: now
  };
  return {
    rootId,
    currentId: rootId,
    nodes: { [rootId]: rootNode }
  };
}

function getAnalysisTree() {
  if (!state.analysisTree) {
    state.analysisTree = createAnalysisTreeRoot();
  }
  return state.analysisTree;
}

function getAnalysisTreeNode(nodeId) {
  const tree = getAnalysisTree();
  return tree.nodes[nodeId] || null;
}

function getAnalysisTreeCurrentNode() {
  const tree = getAnalysisTree();
  return tree.nodes[tree.currentId] || null;
}

function parseMoveUci(text) {
  const raw = String(text || "").trim();
  const dropMatch = raw.match(/^([A-Za-z])@([a-h][1-8])$/);
  if (dropMatch) {
    return {
      drop: dropMatch[1].toLowerCase(),
      to: dropMatch[2],
      uci: `${dropMatch[1].toUpperCase()}@${dropMatch[2]}`
    };
  }
  if (!/^[a-h][1-8][a-h][1-8][a-zA-Z]?$/.test(raw)) return null;
  return {
    from: raw.slice(0, 2),
    to: raw.slice(2, 4),
    promotion: raw.length > 4 ? raw[4].toLowerCase() : undefined,
    uci: raw.length > 4 ? `${raw.slice(0, 4)}${raw[4].toLowerCase()}` : raw
  };
}

function applyMoveToGameInstance(game, move) {
  if (!game || !move) return null;
  if (move.drop) {
    return game.move({
      drop: move.drop,
      to: move.to
    });
  }
  return game.move({
    from: move.from,
    to: move.to,
    promotion: move.promotion || undefined
  });
}

function uciFromMove(move) {
  if (!move) return null;
  if (move.uci) return String(move.uci);
  if (move.drop && move.to) return `${String(move.drop).toUpperCase()}@${move.to}`;
  if (!move.from || !move.to) return null;
  return `${move.from}${move.to}${move.promotion || ""}`;
}

function addAnalysisTreeChildMove(parentId, move, fenAfter, turnAfter, options = {}) {
  const reuseExisting = options.reuseExisting !== false;
  const tree = getAnalysisTree();
  const parent = getAnalysisTreeNode(parentId);
  if (!parent || !move) return null;

  const moveUci = uciFromMove(move);
  if (reuseExisting) {
    for (const childId of parent.children) {
      const child = tree.nodes[childId];
      if (!child) continue;
      if (child.uci === moveUci) {
        tree.currentId = child.id;
        return child;
      }
    }
  }

  const nodeId = makeAnalysisNodeId();
  const now = Date.now();
  const node = {
    id: nodeId,
    parentId: parent.id,
    children: [],
    ply: parent.ply + 1,
    fen: fenAfter,
    turn: turnAfter,
    move: {
      from: move.from || null,
      to: move.to,
      promotion: move.promotion || null,
      drop: move.drop || null,
      uci: moveUci
    },
    san: move.san || null,
    uci: moveUci,
    comment: "",
    nags: [],
    eval: null,
    evalByEngineKey: {},
    ui: { arrows: [], highlights: [] },
    createdAt: now,
    updatedAt: now
  };

  tree.nodes[nodeId] = node;
  parent.children.push(nodeId);
  parent.updatedAt = now;
  tree.currentId = nodeId;
  return node;
}

function buildAnalysisTreeFromGame(startFen = null) {
  const tree = createAnalysisTreeRoot(startFen);
  const game = isCurrentFairyVariantGame()
    ? createFairyVariantGame(getCurrentFairyVariantName(), startFen || getDefaultStartFenForVariant(state.currentVariant))
    : new Chess();
  if (startFen && !isCurrentFairyVariantGame()) {
    try {
      game.load(startFen);
    } catch (_) {
      // fallback to standard start position
    }
  }
  const history = state.game.history({ verbose: true });
  let parentId = tree.rootId;
  for (const mv of history) {
    const applied = applyMoveToGameInstance(game, mv);
    if (!applied) break;
    const parent = tree.nodes[parentId];
    if (!parent) break;
    const now = Date.now();
    const nodeId = makeAnalysisNodeId();
    const node = {
      id: nodeId,
      parentId: parent.id,
      children: [],
      ply: parent.ply + 1,
      fen: game.fen(),
      turn: game.turn(),
      move: {
        from: applied.from || null,
        to: applied.to,
        promotion: applied.promotion || null,
        drop: applied.drop || null,
        uci: uciFromMove(applied)
      },
      san: applied.san || null,
      uci: uciFromMove(applied),
      comment: "",
      nags: [],
      eval: null,
      evalByEngineKey: {},
      ui: { arrows: [], highlights: [] },
      createdAt: now,
      updatedAt: now
    };
    tree.nodes[nodeId] = node;
    parent.children.push(nodeId);
    parent.updatedAt = now;
    parentId = nodeId;
  }
  tree.currentId = parentId;
  state.analysisTree = tree;
}

function setAnalysisTreeCurrentByPly(targetPly) {
  if (!hasMoveTreeMode()) return;
  const tree = getAnalysisTree();
  const activePath = getAnalysisTreePathToRoot(tree.currentId);
  if (activePath.length === 0) {
    tree.currentId = tree.rootId;
    return;
  }

  const target = Math.max(0, Math.floor(targetPly));
  if (target < activePath.length) {
    tree.currentId = activePath[target];
    return;
  }

  let nodeId = activePath[activePath.length - 1];
  let ply = activePath.length - 1;
  while (ply < target) {
    const node = tree.nodes[nodeId];
    if (!node || !Array.isArray(node.children) || node.children.length === 0) break;
    nodeId = node.children[0];
    ply += 1;
  }
  tree.currentId = nodeId;
}

function getAnalysisTreePathToRoot(nodeId) {
  const tree = getAnalysisTree();
  const path = [];
  let cursor = nodeId;
  while (cursor) {
    const node = tree.nodes[cursor];
    if (!node) break;
    path.push(node.id);
    cursor = node.parentId;
  }
  path.reverse();
  return path;
}

function buildGameFromAnalysisNode(nodeId) {
  const tree = getAnalysisTree();
  const root = tree.nodes[tree.rootId];
  const game = isCurrentFairyVariantGame()
    ? createFairyVariantGame(
        getCurrentFairyVariantName(),
        (root && typeof root.fen === "string" && root.fen) || getDefaultStartFenForVariant(state.currentVariant)
      )
    : new Chess();
  if (root && typeof root.fen === "string") {
    const startFen = new Chess().fen();
    if (!isCurrentFairyVariantGame() && root.fen !== startFen) {
      try {
        game.load(root.fen);
      } catch (_) {
        // fallback to start position
      }
    }
  }
  const path = getAnalysisTreePathToRoot(nodeId);
  for (let i = 1; i < path.length; i += 1) {
    const node = tree.nodes[path[i]];
    if (!node || !node.move) break;
    const ok = applyMoveToGameInstance(game, node.move);
    if (!ok) break;
  }
  return game;
}

function getAnalysisMainlineLeafFrom(nodeId) {
  const tree = getAnalysisTree();
  let cursor = nodeId;
  while (true) {
    const node = tree.nodes[cursor];
    if (!node || !node.children || node.children.length === 0) break;
    cursor = node.children[0];
  }
  return cursor;
}

function setAnalysisCurrentNode(nodeId, followMainline = true, keepViewAtSelected = false) {
  if (!hasMoveTreeMode()) return;
  const tree = getAnalysisTree();
  const selectedNode = tree.nodes[nodeId];
  if (!selectedNode) return;
  const targetId = followMainline ? getAnalysisMainlineLeafFrom(nodeId) : nodeId;
  tree.currentId = targetId;
  state.game = buildGameFromAnalysisNode(targetId);
  state.viewPly = keepViewAtSelected ? selectedNode.ply : getLatestPly();
  closePromotionMenu();
  clearPremove();
  clearSelection();
  if (state.appMode === "analysis") {
    clearAnalysisState();
  } else if (state.appMode === "tablebase") {
    requestTablebaseForFen(getViewGame().fen());
  }
  render();
}

function checkoutAnalysisAtViewPly() {
  if (!hasMoveTreeMode()) return;
  setAnalysisTreeCurrentByPly(state.viewPly);
  const current = getAnalysisTreeCurrentNode();
  if (!current) return;
  state.game = buildGameFromAnalysisNode(current.id);
  state.viewPly = getLatestPly();
}

function getActiveAnalysisLineNodeIds() {
  if (!hasMoveTreeMode()) return [];
  const current = getAnalysisTreeCurrentNode();
  if (!current) return [];
  return getAnalysisTreePathToRoot(current.id);
}

function getAnalysisDisplayedLineNodeIds() {
  if (!hasMoveTreeMode()) return [];
  const tree = getAnalysisTree();
  const history = state.game.history({ verbose: true });
  const ids = [tree.rootId];
  let cursor = tree.rootId;
  for (const mv of history) {
    const parent = tree.nodes[cursor];
    if (!parent || !Array.isArray(parent.children) || parent.children.length === 0) break;
    const uci = uciFromMove(mv);
    const nextId = parent.children.find((childId) => {
      const child = tree.nodes[childId];
      return child && child.uci === uci;
    });
    if (!nextId) break;
    ids.push(nextId);
    cursor = nextId;
  }
  return ids;
}

function deleteAnalysisSubtreeFromNode(nodeId) {
  const tree = getAnalysisTree();
  const root = tree.nodes[nodeId];
  if (!root) return;

  function drop(nodeIdToDrop) {
    const node = tree.nodes[nodeIdToDrop];
    if (!node) return;
    for (const childId of node.children) {
      drop(childId);
    }
    delete tree.nodes[nodeIdToDrop];
  }

  for (const childId of root.children) {
    drop(childId);
  }
  root.children = [];
  root.updatedAt = Date.now();
  markAnalysisPgnDirty();
}

function getAnalysisDepthLimit() {
  const idx = Number(state.analysis.depthPresetIndex);
  if (!Number.isFinite(idx)) return 20;
  const safeIdx = Math.max(0, Math.min(ANALYSIS_DEPTH_PRESETS.length - 1, Math.round(idx)));
  return ANALYSIS_DEPTH_PRESETS[safeIdx];
}

function formatDepthPreset(depth) {
  return depth == null ? "Infinite" : String(depth);
}

function formatPvUciToSan(pv) {
  if (typeof pv !== "string" || !pv.trim()) return "...";
  let sandbox;
  try {
    sandbox = isCurrentFairyVariantGame()
      ? createFairyVariantGame(getCurrentFairyVariantName(), getViewGame().fen())
      : new Chess(getViewGame().fen());
  } catch (_) {
    return pv;
  }
  const uciMoves = pv.trim().split(/\s+/);
  const sanMoves = [];
  for (const uci of uciMoves) {
    const moveInput = parseMoveUci(uci);
    if (!moveInput) break;
    const move = applyMoveToGameInstance(sandbox, moveInput);
    if (!move) break;
    sanMoves.push(move.san);
  }
  return sanMoves.length > 0 ? sanMoves.join(" ") : pv;
}

function formatPvUciToSanFromFen(fen, pv, variantKey = "standard") {
  if (typeof pv !== "string" || !pv.trim()) return "...";
  let sandbox;
  try {
    sandbox = variantKey === "chess960"
      ? createChess960Game(typeof fen === "string" && fen.trim() ? fen.trim() : undefined)
      : new Chess(typeof fen === "string" && fen.trim() ? fen.trim() : undefined);
  } catch (_) {
    return pv;
  }
  const uciMoves = pv.trim().split(/\s+/);
  const sanMoves = [];
  for (const uci of uciMoves) {
    const moveInput = parseMoveUci(uci);
    if (!moveInput) break;
    const move = applyMoveToGameInstance(sandbox, moveInput);
    if (!move) break;
    sanMoves.push(move.san);
  }
  return sanMoves.length > 0 ? sanMoves.join(" ") : pv;
}

function stopCurrentEngineSearch() {
  if (!state.engineRuntime.connected) return;
  if (!state.engineRuntime.searchKind && !state.engineRuntime.thinking) return;
  state.engineRuntime.thinking = false;
  state.engineRuntime.searchKind = null;
  ipcRenderer.invoke("engine:send", "stop");
}

function parseAnalysisInfoLine(line, perspectiveTurnColor = state.analysis.requestTurnColor) {
  const multiPvMatch = line.match(/\bmultipv\s+(\d+)/);
  const multipv = multiPvMatch ? Number(multiPvMatch[1]) : 1;
  const depthMatch = line.match(/\bdepth\s+(\d+)/);
  const hashMatch = line.match(/\bhashfull\s+(\d+)/);
  const scoreMatch = line.match(/\bscore\s+(cp|mate)\s+(-?\d+)/);
  if (!scoreMatch) return null;
  const pvMatch = line.match(/\bpv\s+(.+)$/);
  const scoreKind = scoreMatch[1];
  const scoreRaw = Number(scoreMatch[2]);
  const depth = depthMatch ? Number(depthMatch[1]) : null;
  const hashPermill = hashMatch ? Number(hashMatch[1]) : null;
  const pv = pvMatch ? pvMatch[1] : "";
  const sign = perspectiveTurnColor === "w" ? 1 : -1;
  if (scoreKind === "mate") {
    const normalizedMateValue =
      scoreRaw === 0
        ? perspectiveTurnColor === "w"
          ? -1
          : 1
        : scoreRaw * sign;
    return { multipv, kind: "mate", value: normalizedMateValue, depth, hashPermill, pv };
  }
  return { multipv, kind: "cp", value: scoreRaw * sign, depth, hashPermill, pv };
}

function formatAnalysisEvalText(evalObj) {
  if (!evalObj) return "--";
  if (evalObj.kind === "mate") {
    const mateValue = Number(evalObj.value);
    const prefix = mateValue > 0 ? "+" : "-";
    return `M${prefix}${Math.abs(mateValue)}`;
  }
  const pawns = Number(evalObj.value) / 100;
  const quantized = Math.trunc(pawns * 10) / 10;
  const text = quantized.toFixed(1);
  return quantized > 0 ? `+${text}` : text;
}

function evalToWhiteRatio(evalObj) {
  if (!evalObj) return 0.5;
  if (evalObj.kind === "mate") {
    return Number(evalObj.value) > 0 ? 1 : 0;
  }
  const pawns = Number(evalObj.value) / 100;
  const quantized = Math.trunc(pawns * 10) / 10;
  const clamped = Math.max(-7, Math.min(7, quantized));
  return (clamped + 7) / 14;
}

function renderAnalysisEvalBar() {
  if (!analysisEvalBarEl || !analysisEvalTextEl) return;
  if (state.appMode !== "analysis") {
    analysisEvalBarEl.classList.add("hidden");
    return;
  }
  analysisEvalBarEl.classList.remove("hidden");
  const ratio = evalToWhiteRatio(state.analysis.eval);
  const ratioPercent = `${(ratio * 100).toFixed(2)}%`;
  const whiteOnBottom = !state.boardFlipped;
  analysisEvalBarEl.style.setProperty("--white-ratio", ratioPercent);
  analysisEvalBarEl.classList.toggle("white-bottom", whiteOnBottom);
  analysisEvalBarEl.classList.toggle("white-top", !whiteOnBottom);
  analysisEvalTextEl.textContent = formatAnalysisEvalText(state.analysis.eval);
}

function requestAnalysisForCurrentPosition(force = false) {
  if (state.appMode !== "analysis") return;
  if (!state.analysis.enabled) return;
  if (state.analysis.computer.running) return;
  if (!state.engineRuntime.connected || !state.engineRuntime.ready) return;

  const viewGame = getViewGame();
  // Always analyze exactly what is visible on board.
  // Tree nodes are kept for future variation UI, but engine input should be driven by view state.
  const fen = viewGame.fen();
  if (!force && fen === state.analysis.lastFenRequested) {
    return;
  }

  stopCurrentEngineSearch();
  state.analysis.searching = false;
  state.analysis.eval = null;
  state.analysis.lines = new Map();
  state.analysis.depth = null;
  state.analysis.hashPermill = null;
  state.analysis.lastFenRequested = fen;
  state.analysis.requestTurnColor = viewGame.turn();

  if (state.analysis.timerId !== null) {
    window.clearTimeout(state.analysis.timerId);
  }
  const seq = ++state.analysis.requestSeq;
  state.analysis.activeSeq = seq;
  const requestDelayMs = force ? 0 : 140;
  state.analysis.timerId = window.setTimeout(() => {
    state.analysis.timerId = null;
    if (state.appMode !== "analysis") return;
    if (seq !== state.analysis.activeSeq) return;
    if (fen !== state.analysis.lastFenRequested) return;
    state.engineRuntime.searchKind = "analysis";
    state.engineRuntime.thinking = true;
    state.analysis.searching = true;
    const depthLimit = getAnalysisDepthLimit();
    const goCmd = depthLimit == null ? "go infinite" : `go depth ${depthLimit}`;
    ipcRenderer.invoke("engine:send", `position fen ${fen}`);
    ipcRenderer.invoke("engine:send", goCmd);
  }, requestDelayMs);
}

function getAnalysisLineCount() {
  const raw = Number(getSliderNumericValue(analysisMultiPvEl || optMultiPvEl));
  if (!Number.isFinite(raw)) return 1;
  return Math.max(1, Math.min(5, Math.round(raw)));
}

function cpEvalToPawnValue(evalObj) {
  if (!evalObj) return null;
  if (evalObj.kind === "mate") {
    return Number(evalObj.value) > 0 ? 7 : -7;
  }
  if (evalObj.kind === "cp") {
    return Math.max(-7, Math.min(7, Number(evalObj.value) / 100));
  }
  return null;
}

function fallbackEvalFromFen(fen) {
  if (typeof fen !== "string" || !fen.trim()) return 0;
  const boardPart = fen.split(/\s+/)[0] || "";
  const weights = {
    p: 1,
    n: 3,
    b: 3,
    r: 5,
    q: 9,
    k: 0
  };
  let score = 0;
  for (const ch of boardPart) {
    const lower = ch.toLowerCase();
    if (!weights.hasOwnProperty(lower)) continue;
    const value = weights[lower];
    score += ch === lower ? -value : value;
  }
  return Math.max(-7, Math.min(7, score));
}

function cloneEvalObject(evalObj) {
  if (!evalObj) return null;
  return {
    multipv: evalObj.multipv == null ? 1 : Number(evalObj.multipv),
    kind: evalObj.kind,
    value: Number(evalObj.value || 0),
    depth: evalObj.depth == null ? null : Number(evalObj.depth),
    hashPermill: evalObj.hashPermill == null ? null : Number(evalObj.hashPermill),
    pv: typeof evalObj.pv === "string" ? evalObj.pv : ""
  };
}

const COMPUTER_ANALYSIS_PIECE_VALUES = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 99
};

function makeFallbackComputerAnalysisEval(fen) {
  return {
    multipv: 1,
    kind: "cp",
    value: Math.round(fallbackEvalFromFen(fen) * 100),
    depth: null,
    hashPermill: null,
    pv: ""
  };
}

function evalToWinningChances(evalObj) {
  if (!evalObj) return 0;
  if (evalObj.kind === "mate") {
    return Number(evalObj.value || 0) > 0 ? 1 : -1;
  }
  const cp = Number(evalObj.value || 0);
  return 2 / (1 + Math.exp(-0.00368208 * cp)) - 1;
}

function evalToWinPercent(evalObj) {
  return 50 + 50 * evalToWinningChances(evalObj);
}

function subjectiveWinningChances(evalObj, side) {
  const value = evalToWinningChances(evalObj);
  return side === "b" ? -value : value;
}

function subjectiveWinPercent(evalObj, side) {
  const value = evalToWinPercent(evalObj);
  return side === "b" ? 100 - value : value;
}

function invertEvalForSide(evalObj, side) {
  if (!evalObj) return null;
  const copy = cloneEvalObject(evalObj);
  if (side === "w") return copy;
  copy.value *= -1;
  return copy;
}

function classifyMateAdvice(beforeEval, afterEval, side) {
  const prev = invertEvalForSide(beforeEval, side);
  const next = invertEvalForSide(afterEval, side);
  if (!prev || !next) return null;
  const prevValue = Number(prev.value || 0);
  const nextValue = Number(next.value || 0);
  const prevCpOrZero = prev.kind === "cp" ? prevValue : 0;
  const nextCpOrZero = next.kind === "cp" ? nextValue : 0;

  if (prev.kind === "cp" && next.kind === "mate" && nextValue < 0) {
    if (prevCpOrZero < -999) return "inaccuracy";
    if (prevCpOrZero < -700) return "mistake";
    return "blunder";
  }

  const mateLost =
    (prev.kind === "mate" && prevValue > 0 && next.kind === "cp") ||
    (prev.kind === "mate" && prevValue > 0 && next.kind === "mate" && nextValue < 0);
  if (mateLost) {
    if (nextCpOrZero > 999) return "inaccuracy";
    if (nextCpOrZero > 700) return "mistake";
    return "blunder";
  }

  return null;
}

function withFenTurn(fen, turn) {
  const parts = String(fen || "").trim().split(/\s+/);
  if (parts.length < 2) return String(fen || "").trim();
  parts[1] = turn === "b" ? "b" : "w";
  return parts.join(" ");
}

function getComputerAnalysisLandedPieceType(move) {
  const promoted = String(move?.promotion || "").toLowerCase();
  if (promoted && COMPUTER_ANALYSIS_PIECE_VALUES[promoted] != null) return promoted;
  const piece = String(move?.piece || "").toLowerCase();
  return COMPUTER_ANALYSIS_PIECE_VALUES[piece] != null ? piece : "";
}

function isComputerAnalysisLandingSquareProtectedByLowerValuePiece(currentFen, move) {
  if (!currentFen || !move?.to || !move?.side) return false;
  const landedPieceType = getComputerAnalysisLandedPieceType(move);
  const landedPieceValue = COMPUTER_ANALYSIS_PIECE_VALUES[landedPieceType] || 0;
  if (!landedPieceValue) return false;
  const opponentTurn = move.side === "w" ? "b" : "w";
  try {
    const game = new Chess();
    game.load(withFenTurn(currentFen, opponentTurn));
    const moves = game.moves({ verbose: true }) || [];
    return moves.some((candidate) => {
      if (String(candidate?.to || "") !== String(move.to || "")) return false;
      const attackerType = String(candidate?.piece || "").toLowerCase();
      const attackerValue = COMPUTER_ANALYSIS_PIECE_VALUES[attackerType] || 0;
      return attackerValue > 0 && attackerValue < landedPieceValue;
    });
  } catch (_) {
    return false;
  }
}

function getCapturedSquareForComputerAnalysisMove(move) {
  if (!move?.to) return null;
  if (!String(move.flags || "").includes("e")) return String(move.to);
  const toFile = String(move.to)[0];
  const toRank = Number(String(move.to)[1]);
  if (!toFile || !Number.isFinite(toRank)) return String(move.to);
  const capturedRank = move.side === "w" ? toRank - 1 : toRank + 1;
  return `${toFile}${capturedRank}`;
}

function isComputerAnalysisCapturedPieceProtected(currentFen, move) {
  if (!currentFen || !move?.captured || !move?.side) return false;
  const capturedSquare = getCapturedSquareForComputerAnalysisMove(move);
  if (!capturedSquare) return false;
  const opponentTurn = move.side === "w" ? "b" : "w";
  try {
    const game = new Chess();
    game.load(withFenTurn(currentFen, opponentTurn));
    const moves = game.moves({ verbose: true }) || [];
    return moves.some((candidate) => String(candidate?.to || "") === capturedSquare);
  } catch (_) {
    return false;
  }
}

function classifyGreatMove(previousSameSideEval, currentEval, side, bestMoveUci = "", playedMoveUci = "") {
  if (!previousSameSideEval || !currentEval) return null;
  if (previousSameSideEval.kind !== "cp" || currentEval.kind !== "cp") return null;
  const best = String(bestMoveUci || "").trim();
  const played = String(playedMoveUci || "").trim();
  if (!best || !played || best !== played) return null;
  const before = Number(previousSameSideEval.value || 0) / 100;
  const after = Number(currentEval.value || 0) / 100;
  const delta = side === "b" ? before - after : after - before;
  if (delta < 1.2) return null;

  if (side === "w") {
    if (before <= 0 && after >= 0) return "great";
    if (before > 0 && after > before) return "great";
    return null;
  }

  if (before >= 0 && after <= 0) return "great";
  if (before < 0 && after < before) return "great";
  return null;
}

function classifyBrilliantMove(previousSameSideEval, currentEval, side, move, currentFen, bestMoveUci = "", playedMoveUci = "") {
  if (!previousSameSideEval || !currentEval) return null;
  if (previousSameSideEval.kind !== "cp" || currentEval.kind !== "cp") return null;
  const best = String(bestMoveUci || "").trim();
  const played = String(playedMoveUci || "").trim();
  if (!best || !played || best !== played) return null;
  if (move?.promotion) return null;
  if (!move?.piece || !move?.to) return null;
  const before = Number(previousSameSideEval.value || 0) / 100;
  const after = Number(currentEval.value || 0) / 100;
  const delta = side === "b" ? before - after : after - before;
  if (delta < -0.2) return null;
  if (move.captured) {
    const capturingValue = COMPUTER_ANALYSIS_PIECE_VALUES[String(move.piece || "").toLowerCase()] || 0;
    const capturedValue = COMPUTER_ANALYSIS_PIECE_VALUES[String(move.captured || "").toLowerCase()] || 0;
    if (!(capturingValue > capturedValue)) return null;
    if (!isComputerAnalysisCapturedPieceProtected(currentFen, move)) return null;
    return "brilliant";
  }
  if (!isComputerAnalysisLandingSquareProtectedByLowerValuePiece(currentFen, move)) return null;
  return "brilliant";
}

function classifyComputerAnalysisJudgment(
  beforeEval,
  afterEval,
  side,
  previousSameSideEval = null,
  bestMoveUci = "",
  playedMoveUci = "",
  move = null,
  currentFen = ""
) {
  const brilliantJudgment = classifyBrilliantMove(previousSameSideEval, afterEval, side, move, currentFen, bestMoveUci, playedMoveUci);
  if (brilliantJudgment) return brilliantJudgment;
  const greatJudgment = classifyGreatMove(previousSameSideEval, afterEval, side, bestMoveUci, playedMoveUci);
  if (greatJudgment) return greatJudgment;
  const mateJudgment = classifyMateAdvice(beforeEval, afterEval, side);
  if (mateJudgment) return mateJudgment;
  const best = String(bestMoveUci || "").trim();
  const played = String(playedMoveUci || "").trim();
  if (best && played && best === played) {
    return null;
  }
  const before = subjectiveWinningChances(beforeEval, side);
  const after = subjectiveWinningChances(afterEval, side);
  const drop = before - after;
  if (drop >= 0.3) return "blunder";
  if (drop >= 0.2) return "mistake";
  if (drop >= 0.1) return "inaccuracy";
  return null;
}

function computeMoveAccuracyPercent(beforeEval, afterEval, side) {
  const before = subjectiveWinPercent(beforeEval, side);
  const after = subjectiveWinPercent(afterEval, side);
  if (after >= before) return 100;
  const winDiff = before - after;
  const raw = 103.1668100711649 * Math.exp(-0.04354415386753951 * winDiff) + -3.166924740191411;
  return Math.max(0, Math.min(100, raw + 1));
}

function standardDeviation(values) {
  const nums = values.map(Number).filter(Number.isFinite);
  if (!nums.length) return null;
  const mean = nums.reduce((sum, value) => sum + value, 0) / nums.length;
  const variance = nums.reduce((sum, value) => sum + (value - mean) ** 2, 0) / nums.length;
  return Math.sqrt(variance);
}

function weightedMean(weighted) {
  const items = weighted.filter(([value, weight]) => Number.isFinite(value) && Number.isFinite(weight) && weight > 0);
  if (!items.length) return null;
  const totalWeight = items.reduce((sum, [, weight]) => sum + weight, 0);
  if (totalWeight <= 0) return null;
  return items.reduce((sum, [value, weight]) => sum + value * weight, 0) / totalWeight;
}

function harmonicMean(values) {
  const nums = values.map(Number).filter(Number.isFinite);
  if (!nums.length) return null;
  if (nums.some((value) => value <= 0)) return 0;
  return nums.length / nums.reduce((sum, value) => sum + 1 / value, 0);
}

function computeComputerAnalysisAccuracySummary(results) {
  const items = Array.isArray(results) ? results : [];
  const empty = {
    whiteAccuracy: null,
    blackAccuracy: null,
    accuracyByColor: { white: null, black: null },
    judgmentCountsByColor: {
      white: { brilliant: 0, great: 0, inaccuracy: 0, mistake: 0, blunder: 0 },
      black: { brilliant: 0, great: 0, inaccuracy: 0, mistake: 0, blunder: 0 }
    }
  };
  if (!items.length) return empty;

  const allWinPercentValues = [];
  const firstBefore = Number(items[0]?.beforeWhiteWinPercent);
  if (Number.isFinite(firstBefore)) allWinPercentValues.push(firstBefore);
  for (const item of items) {
    const after = Number(item?.afterWhiteWinPercent);
    if (Number.isFinite(after)) allWinPercentValues.push(after);
  }
  if (allWinPercentValues.length !== items.length + 1) return empty;

  const windowSize = Math.max(2, Math.min(8, Math.floor(items.length / 10)));
  const effectiveWindowSize = Math.min(windowSize, allWinPercentValues.length);
  const windows = [
    ...Array.from({ length: Math.max(0, effectiveWindowSize - 2) }, () => allWinPercentValues.slice(0, effectiveWindowSize)),
    ...Array.from(
      { length: Math.max(0, allWinPercentValues.length - effectiveWindowSize + 1) },
      (_, index) => allWinPercentValues.slice(index, index + effectiveWindowSize)
    )
  ];
  const weights = windows.map((windowValues) => {
    const value = standardDeviation(windowValues) || 0;
    return Math.max(0.5, Math.min(12, value));
  });

  const weightedByColor = { w: [], b: [] };
  const accuracyByColor = { w: [], b: [] };
  const judgmentCountsByColor = {
    white: { brilliant: 0, great: 0, inaccuracy: 0, mistake: 0, blunder: 0 },
    black: { brilliant: 0, great: 0, inaccuracy: 0, mistake: 0, blunder: 0 }
  };

  items.forEach((item, index) => {
    const side = item?.side === "b" ? "b" : "w";
    const accuracy = Number(item?.accuracyPercent);
    const weight = Number(weights[index]);
    if (Number.isFinite(accuracy)) {
      weightedByColor[side].push([accuracy, Number.isFinite(weight) ? weight : 1]);
      accuracyByColor[side].push(accuracy);
    }
    const key = side === "w" ? "white" : "black";
    if (item?.judgment && judgmentCountsByColor[key][item.judgment] != null) {
      judgmentCountsByColor[key][item.judgment] += 1;
    }
  });

  function colorAccuracy(side) {
    const weighted = weightedMean(weightedByColor[side]);
    const harmonic = harmonicMean(accuracyByColor[side]);
    if (!Number.isFinite(weighted) || !Number.isFinite(harmonic)) return null;
    return (weighted + harmonic) / 2;
  }

  const whiteAccuracy = colorAccuracy("w");
  const blackAccuracy = colorAccuracy("b");
  return {
    whiteAccuracy,
    blackAccuracy,
    accuracyByColor: { white: whiteAccuracy, black: blackAccuracy },
    judgmentCountsByColor
  };
}

function getAnalysisDisplayedFenQueue() {
  const tree = getAnalysisTree();
  const ids = getAnalysisDisplayedLineNodeIds();
  const queue = [];
  for (const id of ids) {
    const node = tree.nodes[id];
    if (!node || typeof node.fen !== "string") continue;
    if ((Number(node.ply) || 0) <= 0) continue;
    queue.push({
      nodeId: id,
      ply: Number(node.ply) || 0,
      fen: node.fen,
      turn: node.turn || (node.fen.split(/\s+/)[1] === "b" ? "b" : "w")
    });
  }
  return queue;
}

function drawComputerAnalysisGraph() {
  // Computer-analysis graph is disabled in v1.
}

function renderComputerAnalysisPanel() {
  // Computer-analysis UI is disabled in v1.
}

function stopComputerAnalysisBridgeTimers() {
  if (computerAnalysisBridge.stopTimerId !== null) {
    window.clearTimeout(computerAnalysisBridge.stopTimerId);
    computerAnalysisBridge.stopTimerId = null;
  }
  if (computerAnalysisBridge.timeoutId !== null) {
    window.clearTimeout(computerAnalysisBridge.timeoutId);
    computerAnalysisBridge.timeoutId = null;
  }
}

function makeComputerAnalysisResultEntry(
  item,
  evalObj,
  beforeEval,
  previousSameSideEval = null,
  preMoveBestMoveUci = "",
  preMoveBestPv = "",
  variantKey = "standard"
) {
  const safeAfterEval = cloneEvalObject(evalObj) || makeFallbackComputerAnalysisEval(item.fen);
  const safeBeforeEval = cloneEvalObject(beforeEval) || makeFallbackComputerAnalysisEval(item.beforeFen || "");
  const safePreviousSameSideEval = cloneEvalObject(previousSameSideEval);
  const normalizedValue = cpEvalToPawnValue(safeAfterEval) ?? fallbackEvalFromFen(item.fen);
  const bestMoveUci =
    typeof safeAfterEval?.pv === "string" && safeAfterEval.pv.trim()
      ? String(safeAfterEval.pv.trim().split(/\s+/)[0] || "")
      : "";
  const bestLinePv = typeof safeAfterEval?.pv === "string" ? String(safeAfterEval.pv || "").trim() : "";
  return {
    ply: item.ply,
    moveNumber: item.moveNumber,
    moveLabel: item.moveLabel,
    side: item.side,
    san: item.san,
    beforeFen: item.beforeFen,
    from: item.from || null,
    to: item.to || null,
    piece: item.piece || null,
    captured: item.captured || null,
    flags: item.flags || "",
    promotion: item.promotion || null,
    drop: item.drop || null,
    uci: item.uci || "",
    preMoveBestMoveUci: String(preMoveBestMoveUci || "").trim(),
    preMoveBestPv: String(preMoveBestPv || "").trim(),
    preMoveBestLineSan: String(preMoveBestPv || "").trim()
      ? formatPvUciToSanFromFen(item.beforeFen || "", String(preMoveBestPv || "").trim(), variantKey)
      : "",
    variantKey,
    fen: item.fen,
    bestMoveUci,
    bestLinePv,
    beforeEval: {
      kind: safeBeforeEval.kind,
      value: Number(safeBeforeEval.value),
      depth: safeBeforeEval.depth == null ? null : Number(safeBeforeEval.depth)
    },
    previousSameSideEval: safePreviousSameSideEval
      ? {
          kind: safePreviousSameSideEval.kind,
          value: Number(safePreviousSameSideEval.value),
          depth: safePreviousSameSideEval.depth == null ? null : Number(safePreviousSameSideEval.depth)
        }
      : null,
    afterEval: {
      kind: safeAfterEval.kind,
      value: Number(safeAfterEval.value),
      depth: safeAfterEval.depth == null ? null : Number(safeAfterEval.depth),
      pv: bestLinePv
    },
    eval: {
      kind: safeAfterEval.kind,
      value: Number(safeAfterEval.value),
      depth: safeAfterEval.depth == null ? null : Number(safeAfterEval.depth),
      pv: bestLinePv
    },
    beforeWinPercent: subjectiveWinPercent(safeBeforeEval, item.side),
    afterWinPercent: subjectiveWinPercent(safeAfterEval, item.side),
    beforeWhiteWinPercent: evalToWinPercent(safeBeforeEval),
    afterWhiteWinPercent: evalToWinPercent(safeAfterEval),
    previousSameSideNormalizedValue:
      safePreviousSameSideEval && safePreviousSameSideEval.kind === "cp"
        ? Number(safePreviousSameSideEval.value || 0) / 100
        : null,
    winningChanceDrop:
      subjectiveWinningChances(safeBeforeEval, item.side) - subjectiveWinningChances(safeAfterEval, item.side),
    accuracyPercent: computeMoveAccuracyPercent(safeBeforeEval, safeAfterEval, item.side),
    judgment: classifyComputerAnalysisJudgment(
      safeBeforeEval,
      safeAfterEval,
      item.side,
      safePreviousSameSideEval,
      preMoveBestMoveUci,
      item.uci || "",
      item,
      item.fen || ""
    ),
    normalizedValue
  };
}

function buildComputerAnalysisReportSnapshot() {
  const summary = computeComputerAnalysisAccuracySummary(computerAnalysisBridge.results);
  return {
    depth: computerAnalysisBridge.currentDepth,
    variantKey: computerAnalysisBridge.variantKey || "standard",
    tags: computerAnalysisBridge.tags || {},
    startFen: computerAnalysisBridge.startFen,
    total: computerAnalysisBridge.queue.length,
    currentIndex: computerAnalysisBridge.currentIndex,
    results: computerAnalysisBridge.results.slice(),
    whiteAccuracy: summary.whiteAccuracy,
    blackAccuracy: summary.blackAccuracy,
    accuracyByColor: summary.accuracyByColor,
    judgmentCountsByColor: summary.judgmentCountsByColor,
    sourceArchivePath: computerAnalysisBridge.sourceArchivePath || "",
    sourcePgnHash: computerAnalysisBridge.sourcePgnHash || ""
  };
}

function extractValidArchiveComputerAnalysis(reportContainer, pgnHash) {
  if (!reportContainer || reportContainer.pgnHash !== pgnHash || !reportContainer.analysis) return null;
  const analysis = reportContainer.analysis;
  const variantKey = String(analysis.variantKey || "").trim().toLowerCase();
  if (!(variantKey === "standard" || variantKey === "chess960")) return null;
  if (!Array.isArray(analysis.results)) return null;
  return analysis;
}

async function loadArchiveComputerAnalysisForItem(item, resolvedContent, tags = null) {
  const effectiveTags = tags || parsePgnTagsAndMovetext(String(resolvedContent || "")).tags;
  const variantKey = getComputerAnalysisVariantKeyFromTags(effectiveTags);
  if (!(variantKey === "standard" || variantKey === "chess960")) return null;
  const pgnHash = String(item?.pgnHash || hashArchivePgnText(resolvedContent)).trim();
  const inlineAnalysis = extractValidArchiveComputerAnalysis(item?.cachedAnalysis, pgnHash);
  if (inlineAnalysis) return inlineAnalysis;
  try {
    const res = await ipcRenderer.invoke("games:readAnalysis", { filePath: item?.filePath });
    if (!res?.ok) return null;
    return extractValidArchiveComputerAnalysis(res.analysis, pgnHash);
  } catch (err) {
    console.error("Failed to load archive computer analysis cache:", err);
    return null;
  }
}

async function maybePersistComputerAnalysisArchiveCache(report) {
  const archivePath = String(report?.sourceArchivePath || computerAnalysisBridge.sourceArchivePath || "").trim();
  const pgnText = String(report?.sourcePgnText || computerAnalysisBridge.sourcePgnText || "").trim();
  if (!archivePath || !pgnText) return;
  const variantKey = String(report?.variantKey || "standard").trim().toLowerCase();
  if (!(variantKey === "standard" || variantKey === "chess960")) return;
  const analysisPayload = {
    depth: Number(report?.depth || computerAnalysisBridge.currentDepth || 10),
    variantKey,
    tags: report?.tags || {},
    startFen: String(report?.startFen || ""),
    whiteAccuracy: report?.whiteAccuracy ?? null,
    blackAccuracy: report?.blackAccuracy ?? null,
    accuracyByColor: report?.accuracyByColor || { white: null, black: null },
    judgmentCountsByColor: report?.judgmentCountsByColor || {
      white: { brilliant: 0, great: 0, inaccuracy: 0, mistake: 0, blunder: 0 },
      black: { brilliant: 0, great: 0, inaccuracy: 0, mistake: 0, blunder: 0 }
    },
    results: Array.isArray(report?.results) ? report.results : [],
    total: Number(report?.total || 0)
  };
  if (
    state.archive.currentAnalysisSource
    && String(state.archive.currentAnalysisSource.filePath || "").trim() === archivePath
  ) {
    state.archive.currentAnalysisReport = analysisPayload;
  }
  try {
    await ipcRenderer.invoke("games:writeAnalysis", {
      filePath: archivePath,
      pgn: pgnText,
      analysis: analysisPayload
    });
  } catch (err) {
    console.error("Failed to write computer analysis cache:", err);
  }
}

function getCachedComputerAnalysisForCurrentArchiveGame(depth) {
  const source = state.archive.currentAnalysisSource;
  const report = state.archive.currentAnalysisReport;
  if (!source || !report) return null;
  const currentDepth = Math.max(1, Math.min(30, Number(depth || 10)));
  if (Math.max(1, Math.min(30, Number(report.depth || 0))) !== currentDepth) return null;
  const variantKey = String(report.variantKey || "").trim().toLowerCase();
  if (!(variantKey === "standard" || variantKey === "chess960")) return null;
  return report;
}

function isComputerAnalysisSupportedForTags(tags) {
  const variantKey = getComputerAnalysisVariantKeyFromTags(tags || {});
  return variantKey === "standard" || variantKey === "chess960";
}

function formatArchiveBulkDuration(ms) {
  const totalSeconds = Math.max(0, Math.round(Number(ms || 0) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  if (minutes > 0) return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
  return `${seconds}s`;
}

function stopArchiveBulkEtaTimer() {
  if (state.archive.bulk.etaTimerId !== null) {
    window.clearInterval(state.archive.bulk.etaTimerId);
    state.archive.bulk.etaTimerId = null;
  }
}

function closeArchiveBulkAnalysisModal() {
  if (archiveBulkAnalysisModalEl) archiveBulkAnalysisModalEl.classList.add("hidden");
}

function updateArchiveBulkDepthWarning() {
  if (!archiveBulkWarningEl || !archiveBulkDepthEl) return;
  const depth = Number(archiveBulkDepthEl.value || 10);
  archiveBulkWarningEl.classList.toggle("hidden", depth !== 15);
}

function getArchiveBulkCountOptions(total) {
  const count = Math.max(0, Math.trunc(Number(total) || 0));
  if (count <= 10) {
    return [{ value: "all", label: "All" }];
  }
  const options = [];
  for (let step = 10; step < count; step += 10) {
    options.push({ value: String(step), label: String(step) });
  }
  if (count % 10 === 0) {
    options.push({ value: String(count), label: String(count) });
  }
  options.push({ value: "all", label: "All" });
  return options;
}

function getArchiveBulkSelectionSummary(total, eligible, skippedExisting, skippedUnsupported) {
  if (!total) return "No online games available.";
  return `${eligible} game${eligible === 1 ? "" : "s"} need analysis at this depth. Skips: ${skippedExisting} already analyzed, ${skippedUnsupported} unsupported.`;
}

function renderArchiveBulkAnalysisOptions() {
  if (!archiveBulkCountEl || !archiveBulkDepthEl || !archiveBulkSummaryEl) return;
  const onlineItems = getArchiveItemsForCurrentTab();
  const total = onlineItems.length;
  const depth = Math.max(10, Math.min(15, Number(archiveBulkDepthEl.value || state.archive.bulk.depth || 10)));
  const options = getArchiveBulkCountOptions(total);
  archiveBulkCountEl.innerHTML = options
    .map((item) => `<option value="${item.value}">${item.label}</option>`)
    .join("");
  const selectedCount = String(state.archive.bulk.selectedCount || "all");
  if (options.some((item) => item.value === selectedCount)) {
    archiveBulkCountEl.value = selectedCount;
  } else {
    archiveBulkCountEl.value = "all";
  }
  state.archive.bulk.depth = depth;
  const eligibleItems = [];
  let skippedExisting = 0;
  let skippedUnsupported = 0;
  for (const item of onlineItems) {
    if (!isComputerAnalysisSupportedForTags(item?.tags || {})) {
      skippedUnsupported += 1;
      continue;
    }
    const savedDepth = Number(item?.analysisMeta?.depth || 0);
    if (item?.analysisMeta?.available && savedDepth >= depth) {
      skippedExisting += 1;
      continue;
    }
    eligibleItems.push(item);
  }
  archiveBulkSummaryEl.textContent = getArchiveBulkSelectionSummary(total, eligibleItems.length, skippedExisting, skippedUnsupported);
  archiveBulkAnalysisRunEl.disabled = eligibleItems.length === 0;
  updateArchiveBulkDepthWarning();
}

function openArchiveBulkAnalysisModal() {
  if (!archiveBulkAnalysisModalEl || state.archive.bulk.running) return;
  if (state.archive.tab !== "online") return;
  state.archive.bulk.selectedCount = "all";
  state.archive.bulk.depth = 10;
  if (archiveBulkDepthEl) archiveBulkDepthEl.value = "10";
  renderArchiveBulkAnalysisOptions();
  archiveBulkAnalysisModalEl.classList.remove("hidden");
}

function closeArchiveBulkProgressModal() {
  if (archiveBulkProgressModalEl) archiveBulkProgressModalEl.classList.add("hidden");
}

function updateArchiveBulkProgressUi() {
  if (!archiveBulkProgressTextEl || !archiveBulkProgressCurrentEl || !archiveBulkProgressFillEl || !archiveBulkProgressEtaEl) return;
  const bulk = state.archive.bulk;
  const total = bulk.queue.length;
  const done = bulk.completed + bulk.failed;
  const percent = total > 0 ? Math.max(0, Math.min(100, (done / total) * 100)) : 0;
  archiveBulkProgressFillEl.style.width = `${percent}%`;
  archiveBulkProgressTextEl.textContent = `${Math.min(done, total)} / ${total} completed`;
  archiveBulkProgressCurrentEl.textContent = bulk.currentItemName
    ? `Current: ${bulk.currentItemName}${bulk.cancelRequested ? " • stopping after this game" : ""}`
    : bulk.cancelRequested
      ? "Stopping after current game..."
      : "Preparing next game...";
  const averageMs = bulk.durationsMs.length
    ? bulk.durationsMs.reduce((sum, value) => sum + value, 0) / bulk.durationsMs.length
    : 0;
  const remaining = Math.max(0, total - done - (bulk.currentStartedAt ? 1 : 0));
  const currentElapsed = bulk.currentStartedAt ? Math.max(0, Date.now() - bulk.currentStartedAt) : 0;
  const etaMs = averageMs > 0 ? Math.max(0, remaining * averageMs + Math.max(0, averageMs - currentElapsed)) : 0;
  archiveBulkProgressEtaEl.textContent = `Estimated time left: ${averageMs > 0 ? formatArchiveBulkDuration(etaMs) : "--"}`;
  if (archiveBulkProgressCancelEl) {
    archiveBulkProgressCancelEl.disabled = bulk.cancelRequested;
    archiveBulkProgressCancelEl.textContent = bulk.cancelRequested ? "Stopping..." : "Cancel After Current Game";
  }
}

function openArchiveBulkProgressModal() {
  if (!archiveBulkProgressModalEl) return;
  archiveBulkProgressModalEl.classList.remove("hidden");
  updateArchiveBulkProgressUi();
}

function resetArchiveBulkAnalysisState() {
  stopArchiveBulkEtaTimer();
  state.archive.bulk.running = false;
  state.archive.bulk.cancelRequested = false;
  state.archive.bulk.queue = [];
  state.archive.bulk.depth = 10;
  state.archive.bulk.selectedCount = "all";
  state.archive.bulk.currentIndex = -1;
  state.archive.bulk.currentItemName = "";
  state.archive.bulk.completed = 0;
  state.archive.bulk.skippedExisting = 0;
  state.archive.bulk.skippedUnsupported = 0;
  state.archive.bulk.failed = 0;
  state.archive.bulk.durationsMs = [];
  state.archive.bulk.currentStartedAt = 0;
}

function updateArchiveItemWithSavedAnalysis(filePath, pgnText, analysisPayload) {
  const targetPath = String(filePath || "").trim();
  if (!targetPath || !analysisPayload || !Array.isArray(state.archive.cachedItems)) return;
  const pgnHash = hashArchivePgnText(pgnText);
  state.archive.cachedItems = state.archive.cachedItems.map((item) => {
    if (String(item?.filePath || "").trim() !== targetPath) return item;
    return {
      ...item,
      pgnHash,
      analysisMeta: {
        available: true,
        depth: Number(analysisPayload.depth || 0),
        updatedAt: Date.now()
      },
      cachedAnalysis: {
        pgnHash,
        updatedAt: Date.now(),
        analysis: analysisPayload
      }
    };
  });
}

function notifyComputerAnalysisBridgeProgress() {
  const callbacks = computerAnalysisBridge.callbacks;
  if (!callbacks?.onProgress) return;
  callbacks.onProgress({
    current: Math.max(0, computerAnalysisBridge.currentIndex + 1),
    total: computerAnalysisBridge.queue.length,
    item:
      computerAnalysisBridge.currentIndex >= 0 && computerAnalysisBridge.currentIndex < computerAnalysisBridge.queue.length
        ? computerAnalysisBridge.queue[computerAnalysisBridge.currentIndex]
        : null,
    report: buildComputerAnalysisReportSnapshot()
  });
}

function finalizeComputerAnalysisBridgeRun() {
  const callbacks = computerAnalysisBridge.callbacks;
  const report = buildComputerAnalysisReportSnapshot();
  const shouldResetChess960 = computerAnalysisBridge.variantKey === "chess960";
  const silent = !!computerAnalysisBridge.silent;
  computerAnalysisBridge.running = false;
  computerAnalysisBridge.currentEval = null;
  computerAnalysisBridge.analyzingBaseline = false;
  stopComputerAnalysisBridgeTimers();
  state.engineRuntime.searchKind = null;
  state.engineRuntime.thinking = false;
  const archivePath = computerAnalysisBridge.sourceArchivePath;
  const archivePgnHash = computerAnalysisBridge.sourcePgnHash;
  const archivePgnText = computerAnalysisBridge.sourcePgnText;
  computerAnalysisBridge.variantKey = "standard";
  computerAnalysisBridge.tags = {};
  computerAnalysisBridge.sourceArchivePath = "";
  computerAnalysisBridge.sourcePgnHash = "";
  computerAnalysisBridge.sourcePgnText = "";
  computerAnalysisBridge.silent = false;
  if (shouldResetChess960 && state.engineRuntime.connected) {
    setEngineChess960Mode(false).catch(() => {});
  }
  const finish = async () => {
    if (archivePath && archivePgnText) {
      await maybePersistComputerAnalysisArchiveCache({
        ...report,
        sourceArchivePath: archivePath,
        sourcePgnHash: archivePgnHash,
        sourcePgnText: archivePgnText
      });
    }
    if (callbacks?.onComplete) {
      callbacks.onComplete(report);
    }
  };
  finish().catch((err) => {
    console.error("Failed to finalize computer analysis cache:", err);
  });
  if (!silent) {
    showAppMessage("Computer analysis complete.");
  }
}

function failComputerAnalysisBridgeRun(message) {
  const callbacks = computerAnalysisBridge.callbacks;
  const report = buildComputerAnalysisReportSnapshot();
  const shouldResetChess960 = computerAnalysisBridge.variantKey === "chess960";
  computerAnalysisBridge.running = false;
  computerAnalysisBridge.currentEval = null;
  computerAnalysisBridge.analyzingBaseline = false;
  stopComputerAnalysisBridgeTimers();
  state.engineRuntime.searchKind = null;
  state.engineRuntime.thinking = false;
  computerAnalysisBridge.variantKey = "standard";
  computerAnalysisBridge.tags = {};
  computerAnalysisBridge.sourceArchivePath = "";
  computerAnalysisBridge.sourcePgnHash = "";
  computerAnalysisBridge.sourcePgnText = "";
  computerAnalysisBridge.silent = false;
  if (shouldResetChess960 && state.engineRuntime.connected) {
    setEngineChess960Mode(false).catch(() => {});
  }
  if (callbacks?.onError) {
    callbacks.onError(message, report);
  }
}

function stopComputerAnalysisBridgeRun() {
  const shouldResetChess960 = computerAnalysisBridge.variantKey === "chess960";
  if (!computerAnalysisBridge.running) {
    stopComputerAnalysisBridgeTimers();
    if (shouldResetChess960 && state.engineRuntime.connected) {
      setEngineChess960Mode(false).catch(() => {});
      computerAnalysisBridge.variantKey = "standard";
    }
    computerAnalysisBridge.tags = {};
    computerAnalysisBridge.sourceArchivePath = "";
    computerAnalysisBridge.sourcePgnHash = "";
    computerAnalysisBridge.sourcePgnText = "";
    computerAnalysisBridge.silent = false;
    return;
  }
  computerAnalysisBridge.running = false;
  computerAnalysisBridge.currentEval = null;
  computerAnalysisBridge.analyzingBaseline = false;
  stopComputerAnalysisBridgeTimers();
  if (state.engineRuntime.searchKind === "computer-analysis") {
    state.engineRuntime.searchKind = null;
    state.engineRuntime.thinking = false;
    ipcRenderer.invoke("engine:send", "stop");
  }
  computerAnalysisBridge.variantKey = "standard";
  computerAnalysisBridge.tags = {};
  computerAnalysisBridge.sourceArchivePath = "";
  computerAnalysisBridge.sourcePgnHash = "";
  computerAnalysisBridge.sourcePgnText = "";
  computerAnalysisBridge.silent = false;
  if (shouldResetChess960 && state.engineRuntime.connected) {
    setEngineChess960Mode(false).catch(() => {});
  }
}

async function runNextComputerAnalysisPosition() {
  const run = computerAnalysisBridge;
  if (!run.running) return;
  stopComputerAnalysisBridgeTimers();
  if (run.analyzingBaseline) {
    state.engineRuntime.searchKind = "computer-analysis";
    state.engineRuntime.thinking = true;
    notifyComputerAnalysisBridgeProgress();
    const posRes = await ipcRenderer.invoke("engine:send", `position fen ${run.startFen}`);
    if (!posRes?.ok) {
      failComputerAnalysisBridgeRun(`Computer analysis failed: ${posRes?.error || "engine write failed"}`);
      return;
    }
    const goRes = await ipcRenderer.invoke("engine:send", `go depth ${run.currentDepth}`);
    if (!goRes?.ok) {
      failComputerAnalysisBridgeRun(`Computer analysis failed: ${goRes?.error || "engine write failed"}`);
      return;
    }
    run.stopTimerId = window.setTimeout(() => {
      if (!run.running || !run.analyzingBaseline) return;
      if (state.engineRuntime.searchKind !== "computer-analysis") return;
      ipcRenderer.invoke("engine:send", "stop");
      run.stopTimerId = null;
    }, 15000);
    run.timeoutId = window.setTimeout(() => {
      if (!run.running || !run.analyzingBaseline) return;
      if (state.engineRuntime.searchKind !== "computer-analysis") return;
      run.baselineEval = makeFallbackComputerAnalysisEval(run.startFen);
      run.baselineBestMoveUci = "";
      run.analyzingBaseline = false;
      run.currentEval = null;
      state.engineRuntime.searchKind = null;
      state.engineRuntime.thinking = false;
      ipcRenderer.invoke("engine:send", "stop");
      run.timeoutId = null;
      stopComputerAnalysisBridgeTimers();
      notifyComputerAnalysisBridgeProgress();
      runNextComputerAnalysisPosition();
    }, 18000);
    return;
  }
  const nextIndex = run.currentIndex + 1;
  if (nextIndex >= run.queue.length) {
    run.currentIndex = run.queue.length;
    finalizeComputerAnalysisBridgeRun();
    return;
  }
  run.currentIndex = nextIndex;
  run.currentEval = null;
  const item = run.queue[nextIndex];
  state.engineRuntime.searchKind = "computer-analysis";
  state.engineRuntime.thinking = true;
  notifyComputerAnalysisBridgeProgress();
  const posRes = await ipcRenderer.invoke("engine:send", `position fen ${item.fen}`);
  if (!posRes?.ok) {
    failComputerAnalysisBridgeRun(`Computer analysis failed: ${posRes?.error || "engine write failed"}`);
    return;
  }
  const goRes = await ipcRenderer.invoke("engine:send", `go depth ${run.currentDepth}`);
  if (!goRes?.ok) {
    failComputerAnalysisBridgeRun(`Computer analysis failed: ${goRes?.error || "engine write failed"}`);
    return;
  }
  run.stopTimerId = window.setTimeout(() => {
    if (!run.running) return;
    if (state.engineRuntime.searchKind !== "computer-analysis") return;
    ipcRenderer.invoke("engine:send", "stop");
    run.stopTimerId = null;
  }, 15000);
  run.timeoutId = window.setTimeout(() => {
    if (!run.running) return;
    if (state.engineRuntime.searchKind !== "computer-analysis") return;
    const beforeEval =
      run.results.length > 0
        ? run.results[run.results.length - 1].afterEval
        : run.baselineEval || makeFallbackComputerAnalysisEval(item.beforeFen || run.startFen);
    const previousSameSideResult = [...run.results].reverse().find((entry) => entry?.side === item.side) || null;
    const preMoveBestMoveUci =
      run.results.length > 0
        ? String(run.results[run.results.length - 1].bestMoveUci || "").trim()
        : String(run.baselineBestMoveUci || "").trim();
    const preMoveBestPv =
      run.results.length > 0
        ? String(run.results[run.results.length - 1].bestLinePv || "").trim()
        : String(run.baselineEval?.pv || "").trim();
    run.results.push(
      makeComputerAnalysisResultEntry(
        item,
        null,
        beforeEval,
        previousSameSideResult?.afterEval || null,
        preMoveBestMoveUci,
        preMoveBestPv,
        run.variantKey
      )
    );
    state.engineRuntime.searchKind = null;
    state.engineRuntime.thinking = false;
    ipcRenderer.invoke("engine:send", "stop");
    run.timeoutId = null;
    stopComputerAnalysisBridgeTimers();
    notifyComputerAnalysisBridgeProgress();
    runNextComputerAnalysisPosition();
  }, 18000);
}

async function startComputerAnalysisModuleRun({ pgn, depth, onStarted, onProgress, onComplete, onError, archiveContext = null, silent = false } = {}) {
  if (!(await ensurePreferredAnalysisEngineConnected())) {
    return { ok: false, error: "Connect an engine first." };
  }
  const run = computerAnalysisBridge;
  if (run.running) return;
  const parsed = await buildComputerAnalysisQueueFromPgn(pgn);
  if (!parsed.ok) {
    return { ok: false, error: parsed.error || "Invalid PGN." };
  }

  stopCurrentEngineSearch();
  const chess960ModeRes = await setEngineChess960Mode(parsed.variantKey === "chess960");
  if (!chess960ModeRes?.ok) {
    return { ok: false, error: chess960ModeRes?.error || "Failed to set engine Chess960 mode." };
  }
  const multiPvRes = await ipcRenderer.invoke("engine:send", "setoption name MultiPV value 1");
  if (!multiPvRes?.ok) {
    if (parsed.variantKey === "chess960") {
      await setEngineChess960Mode(false).catch(() => {});
    }
    return { ok: false, error: multiPvRes?.error || "Failed to configure engine for computer analysis." };
  }
  computerAnalysisRunId += 1;
  run.running = true;
  run.runId = computerAnalysisRunId;
  run.variantKey = parsed.variantKey || "standard";
  run.tags = parsed.tags || {};
  run.startFen = parsed.startFen || new Chess().fen();
  run.startTurn = String(run.startFen.split(/\s+/)[1] || "w") === "b" ? "b" : "w";
  run.queue = parsed.entries;
  run.results = [];
  run.currentIndex = -1;
  run.currentEval = null;
  run.currentDepth = Math.max(1, Math.min(30, Number(depth || 10)));
  run.baselineEval = null;
  run.baselineBestMoveUci = "";
  run.analyzingBaseline = true;
  run.sourceArchivePath = String(archiveContext?.filePath || "").trim();
  run.sourcePgnHash = String(archiveContext?.pgnHash || "").trim();
  run.sourcePgnText = String(archiveContext?.pgn || "").trim();
  run.silent = !!silent;
  run.callbacks = { onStarted, onProgress, onComplete, onError };
  stopComputerAnalysisBridgeTimers();
  if (run.callbacks?.onStarted) {
    run.callbacks.onStarted({ total: run.queue.length, depth: run.currentDepth });
  }
  runNextComputerAnalysisPosition();
  return { ok: true };
}

function renderAnalysisSidePanel() {
  if (state.appMode !== "analysis") return;
  const boardRect = boardEl.getBoundingClientRect();
  const boardHeight = Math.max(0, Math.round(boardRect.height));
  if (boardHeight > 0) {
    sidePanelEl.style.height = `${boardHeight}px`;
    if (analysisLeftColumnEl) {
      analysisLeftColumnEl.style.height = `${boardHeight}px`;
    }
    if (analysisFenPanelEl) {
      analysisFenPanelEl.style.height = `${Math.max(110, Math.round(boardHeight / 6))}px`;
    }
    if (analysisPgnPanelEl) {
      analysisPgnPanelEl.style.height = `${Math.max(140, Math.round(boardHeight / 3.2))}px`;
    }
    if (analysisInfoPanelEl) {
      analysisInfoPanelEl.style.height = `${Math.max(96, Math.round(boardHeight / 5))}px`;
    }
    if (analysisComputerSummaryPanelEl) {
      analysisComputerSummaryPanelEl.style.minHeight = `${Math.max(118, Math.round(boardHeight / 4.8))}px`;
    }
  }
  renderAnalysisComputerSummaryPanel();
  if (analysisEngineNameEl) {
    const selected = getActiveEngineRecord();
    analysisEngineNameEl.textContent = selected?.name || state.engineRuntime.idName || "Engine";
  }
  if (analysisTopEvalEl) {
    analysisTopEvalEl.textContent = formatAnalysisEvalText(state.analysis.eval);
  }
  if (analysisOptionsEngineEl) {
    const selected = getActiveEngineRecord();
    analysisOptionsEngineEl.textContent = selected?.name || state.engineRuntime.idName || "Engine";
  }
  if (analysisEngineStatsEl) {
    const depthText = state.analysis.depth != null ? `d${state.analysis.depth}` : "d--";
    const hashText =
      state.analysis.hashPermill != null
        ? `h${(state.analysis.hashPermill / 10).toFixed(1)}%`
        : "h--";
    analysisEngineStatsEl.textContent = `${depthText} ${hashText}`;
  }
  if (analysisLinesPanelEl) {
    const count = getAnalysisLineCount();
    analysisLinesPanelEl.innerHTML = "";
    for (let i = 1; i <= count; i += 1) {
      const row = document.createElement("div");
      row.className = "analysis-line-row";
      const line = state.analysis.lines.get(i);
      if (!line) {
        row.textContent = `#${i} ...`;
      } else {
        const scoreText = formatAnalysisEvalText(line);
        const pvText = formatPvUciToSan(line.pv || "");
        row.textContent = `#${i} ${scoreText} ${pvText}`;
      }
      analysisLinesPanelEl.appendChild(row);
    }
  }
  if (analysisTopPanelEl) {
    analysisTopPanelEl.classList.remove("hidden");
  }
  if (analysisOptionsPanelEl) {
    analysisOptionsPanelEl.classList.toggle("hidden", !state.analysis.optionsOpen);
  }
  if (analysisFunctionBarEl) {
    analysisFunctionBarEl.classList.remove("hidden");
  }
  if (btnAnalysisComputerEl) {
    const canBridge = canOpenComputerAnalysisFromAnalysisBoard();
    btnAnalysisComputerEl.classList.toggle("hidden", !canBridge);
    btnAnalysisComputerEl.disabled = !canBridge;
  }
  if (analysisToggleJudgmentsBtnEl) {
    const hasSavedJudgments = Array.isArray(state.archive.currentAnalysisReport?.results)
      && state.archive.currentAnalysisReport.results.some((item) => !!getBoardAnalysisJudgmentMarker(item?.judgment));
    analysisToggleJudgmentsBtnEl.classList.toggle("hidden", !hasSavedJudgments);
    analysisToggleJudgmentsBtnEl.title = state.analysis.showJudgmentMarkers ? "Hide judgment markers" : "Show judgment markers";
    analysisToggleJudgmentsBtnEl.setAttribute(
      "aria-label",
      state.analysis.showJudgmentMarkers ? "Hide judgment markers" : "Show judgment markers"
    );
  }
  if (analysisLeftColumnEl) {
    analysisLeftColumnEl.classList.remove("hidden");
  }
  if (analysisFenPanelEl) {
    analysisFenPanelEl.classList.remove("hidden");
  }
  if (analysisPgnPanelEl) {
    analysisPgnPanelEl.classList.remove("hidden");
  }
  if (analysisInfoPanelEl) {
    analysisInfoPanelEl.classList.remove("hidden");
  }
  updateAnalysisFenText();
  if (state.analysisPgnDirty) {
    updateAnalysisPgnText();
  }
  renderAnalysisInfoPanel();
}

function sanitizePgnComment(text) {
  if (typeof text !== "string") return "";
  return text.replace(/[{}]/g, "").replace(/\[pgndiagram\]/gi, "").replace(/\s+/g, " ").trim();
}

function createPgnCommentToken(text) {
  const clean = sanitizePgnComment(text);
  return clean ? `{${clean}}` : "";
}

function normalizeSanToken(raw) {
  if (typeof raw !== "string") return "";
  return raw.replace(/(?:!!|\?\?|!\?|\?!|!|\?)$/, "").trim();
}

function parsePgnTagsAndMovetext(raw) {
  const tags = {};
  const tagRegex = /\[\s*([A-Za-z0-9_]+)\s+"((?:\\.|[^"\\])*)"\s*\]/g;
  const movetext = String(raw || "").replace(tagRegex, (_m, key, value) => {
    tags[key] = String(value || "")
      .replace(/\\"/g, "\"")
      .replace(/\\n/g, "\n");
    return " ";
  });
  return { tags, movetext };
}

function isChess960VariantTagValue(value) {
  const text = String(value || "").trim().toLowerCase();
  return text === "chess960" || text === "fischerandom" || text === "chess 960";
}

function getFairyArchiveVariantKey(tags) {
  const candidates = [tags?.Variant, tags?.VariantName]
    .map((value) => String(value || "").trim().toLowerCase())
    .filter(Boolean);
  for (const value of candidates) {
    if (value === "chess960" || value === "fischerandom" || value === "chess 960") return "chess960";
    if (value === "threecheck" || value === "3check" || value === "three-check") return "threecheck";
    if (value === "kingofthehill" || value === "king of the hill" || value === "king-of-the-hill") return "kingofthehill";
    if (value === "antichess") return "antichess";
    if (value === "atomic") return "atomic";
    if (value === "horde") return "horde";
    if (value === "racingkings" || value === "racing kings" || value === "racing-kings") return "racingkings";
    if (value === "crazyhouse") return "crazyhouse";
  }
  if (String(tags?.VariantMoves || "").trim() && isChess960VariantTagValue(tags?.Variant || tags?.VariantName)) {
    return "chess960";
  }
  return "";
}

function isFairyArchiveGame(tags) {
  return !!getFairyArchiveVariantKey(tags);
}

function buildMainlineSanFromHistory(history) {
  const out = [];
  const items = Array.isArray(history) ? history : [];
  for (let i = 0; i < items.length; i += 1) {
    const mv = items[i];
    if (!mv || !mv.san) continue;
    const ply = i + 1;
    const moveNo = Math.floor((ply + 1) / 2);
    if (mv.color === "w") {
      out.push(`${moveNo}.`);
    } else if (i === 0 || items[i - 1]?.color !== "w") {
      out.push(`${moveNo}...`);
    }
    out.push(mv.san);
  }
  return out.join(" ").trim();
}

function tokenizePgnMovetext(movetext) {
  const tokens = [];
  let i = 0;
  const text = String(movetext || "");

  while (i < text.length) {
    const ch = text[i];
    if (/\s/.test(ch)) {
      i += 1;
      continue;
    }
    if (ch === ";") {
      while (i < text.length && text[i] !== "\n") i += 1;
      continue;
    }
    if (ch === "{") {
      let j = i + 1;
      while (j < text.length && text[j] !== "}") j += 1;
      tokens.push({ type: "comment", value: text.slice(i + 1, j) });
      i = j < text.length ? j + 1 : j;
      continue;
    }
    if (ch === "(") {
      tokens.push({ type: "lparen" });
      i += 1;
      continue;
    }
    if (ch === ")") {
      tokens.push({ type: "rparen" });
      i += 1;
      continue;
    }
    let j = i;
    while (
      j < text.length &&
      !/\s/.test(text[j]) &&
      text[j] !== "{" &&
      text[j] !== "}" &&
      text[j] !== "(" &&
      text[j] !== ")" &&
      text[j] !== ";"
    ) {
      j += 1;
    }
    const value = text.slice(i, j);
    i = j;
    if (!value) continue;
    if (/^\d+\.(\.\.)?$/.test(value) || /^\d+\.\.\.$/.test(value)) continue;
    if (/^\$\d+$/.test(value)) continue;
    if (/^(1-0|0-1|1\/2-1\/2|\*)$/.test(value)) continue;
    tokens.push({ type: "move", value });
  }

  return tokens;
}

function isSupportedComputerAnalysisVariantTag(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return true;
  return normalized === "standard" || normalized === "chess" || normalized === "from position" || isChess960VariantTagValue(normalized);
}

function getComputerAnalysisVariantKeyFromTags(tags) {
  if (isChess960VariantTagValue(tags?.Variant || tags?.VariantName)) {
    return "chess960";
  }
  if (isSupportedComputerAnalysisVariantTag(tags?.Variant)) {
    return "standard";
  }
  return "";
}

function applyComputerAnalysisSanToChess960Game(game, san) {
  const target = normalizeSanToken(san);
  if (!target) return null;
  const legalMoves = game.moves({ verbose: true });
  const exact = legalMoves.find((move) => normalizeSanToken(move?.san || "") === target);
  if (!exact) return null;
  return game.move({
    from: exact.from,
    to: exact.to,
    promotion: exact.promotion || undefined,
    drop: exact.drop || null
  });
}

async function buildComputerAnalysisQueueFromPgn(rawPgn) {
  const raw = String(rawPgn || "").trim();
  if (!raw) {
    return { ok: false, error: "Paste PGN first." };
  }
  const { tags, movetext } = parsePgnTagsAndMovetext(raw);
  const variantKey = getComputerAnalysisVariantKeyFromTags(tags);
  if (!variantKey) {
    return { ok: false, error: "Only standard PGN and Chess960 PGN are supported in Computer Analysis." };
  }
  if (variantKey === "chess960") {
    try {
      await loadFairyApi();
    } catch (_) {
      return { ok: false, error: "Chess960 rules engine failed to load." };
    }
  }
  const tokens = tokenizePgnMovetext(movetext);
  if (!tokens.length) {
    return { ok: false, error: "Invalid PGN." };
  }

  const taggedFen = String(tags.FEN || "").trim();
  const wantsSetup = String(tags.SetUp || "").trim() === "1";
  if (variantKey === "chess960" && !taggedFen) {
    return { ok: false, error: "Chess960 PGN requires a setup FEN." };
  }
  let game;
  try {
    game = variantKey === "chess960" ? createChess960Game(taggedFen) : new Chess();
  } catch (_) {
    return { ok: false, error: "Invalid PGN setup FEN." };
  }
  let startFen = game.fen();
  if (taggedFen && (wantsSetup || taggedFen !== startFen)) {
    try {
      game.load(taggedFen);
      startFen = game.fen();
    } catch (_) {
      return { ok: false, error: "Invalid PGN setup FEN." };
    }
  }

  const entries = [];
  let variationDepth = 0;
  for (const token of tokens) {
    if (!token) continue;
    if (token.type === "lparen") {
      variationDepth += 1;
      continue;
    }
    if (token.type === "rparen") {
      variationDepth = Math.max(0, variationDepth - 1);
      continue;
    }
    if (variationDepth > 0 || token.type !== "move") {
      continue;
    }
    const san = normalizeSanToken(token.value);
    if (!san) continue;
    const beforeFen = game.fen();
    let applied = null;
    if (variantKey === "chess960") {
      applied = applyComputerAnalysisSanToChess960Game(game, san);
    } else {
      try {
        applied = game.move(san, { sloppy: true });
      } catch (_) {
        applied = null;
      }
      if (!applied) {
        try {
          applied = game.move(san);
        } catch (_) {
          applied = null;
        }
      }
    }
    if (!applied) {
      return { ok: false, error: `Unsupported or invalid PGN move: ${san}` };
    }
      const ply = entries.length + 1;
      entries.push({
        ply,
        moveNumber: Math.floor((ply + 1) / 2),
        moveLabel: applied.color === "w" ? `${Math.floor((ply + 1) / 2)}.` : `${Math.floor((ply + 1) / 2)}...`,
        side: applied.color,
        san: applied.san,
        beforeFen,
        from: applied.from || null,
        to: applied.to || null,
        piece: applied.piece || null,
        captured: applied.captured || null,
        flags: applied.flags || "",
        promotion: applied.promotion || null,
        drop: applied.drop || null,
        uci: uciFromMove(applied),
        fen: game.fen(),
        turn: game.turn()
      });
  }

  if (!entries.length) {
    return { ok: false, error: "No mainline moves found in that PGN." };
  }

  return {
    ok: true,
    variantKey,
    startFen,
    tags,
    entries
  };
}

function serializeAnalysisBranchSafe(startNodeId, parentPly, activePath, ctx, depth) {
  if (ctx.aborted) return [];
  if (depth > ctx.maxDepth) {
    ctx.aborted = true;
    return [];
  }
  const tree = getAnalysisTree();
  const tokens = [];
  let previousPly = parentPly;
  let nodeId = startNodeId;

  while (nodeId) {
    ctx.steps += 1;
    if (ctx.steps > ctx.maxSteps) {
      ctx.aborted = true;
      break;
    }
    if (activePath.has(nodeId)) {
      ctx.aborted = true;
      break;
    }
    const node = tree.nodes[nodeId];
    if (!node) {
      ctx.aborted = true;
      break;
    }
    const nodePath = new Set(activePath);
    nodePath.add(nodeId);
    const moveNo = Math.floor((node.ply + 1) / 2);
    if (node.ply % 2 === 1) {
      tokens.push(`${moveNo}.`);
    } else if (previousPly !== node.ply - 1) {
      tokens.push(`${moveNo}...`);
    }
    tokens.push(node.san || node.uci || "??");
    const commentToken = createPgnCommentToken(node.comment || "");
    if (commentToken) {
      tokens.push(commentToken);
    }

    const parent = tree.nodes[node.parentId];
    if (parent && Array.isArray(parent.children) && parent.children.length > 1) {
      const primaryChildId = parent.children[0];
      if (nodeId === primaryChildId) {
        for (const siblingId of parent.children) {
          if (siblingId === nodeId) continue;
          const siblingPath = new Set(nodePath);
          siblingPath.delete(nodeId);
          const variationTokens = serializeAnalysisBranchSafe(
            siblingId,
            parent.ply,
            siblingPath,
            ctx,
            depth + 1
          );
          if (variationTokens.length) {
            tokens.push(`(${variationTokens.join(" ")})`);
          }
          if (ctx.aborted) break;
        }
      }
    }

    previousPly = node.ply;
    const nextId = Array.isArray(node.children) && node.children.length > 0 ? node.children[0] : null;
    if (nextId && nodePath.has(nextId)) {
      ctx.aborted = true;
      break;
    }
    activePath = nodePath;
    nodeId = nextId;
  }

  return tokens;
}

function createAnalysisSimpleMainlinePgn() {
  const tree = getAnalysisTree();
  const root = tree.nodes[tree.rootId];
  if (!root || !Array.isArray(root.children) || root.children.length === 0) return "";
  const out = [];
  const rootNotes = Array.isArray(state.analysisPgnMeta.rootComments) ? state.analysisPgnMeta.rootComments : [];
  for (const note of rootNotes) {
    const token = createPgnCommentToken(note);
    if (token) out.push(token);
  }
  let nodeId = root.children[0];
  while (nodeId) {
    const node = tree.nodes[nodeId];
    if (!node) break;
    const moveNo = Math.floor((node.ply + 1) / 2);
    if (node.ply % 2 === 1) {
      out.push(`${moveNo}.`);
    }
    out.push(node.san || node.uci || "??");
    const commentToken = createPgnCommentToken(node.comment || "");
    if (commentToken) out.push(commentToken);
    nodeId = Array.isArray(node.children) && node.children.length ? node.children[0] : null;
  }
  return out.join(" ").replace(/\s+/g, " ").trim();
}

function createAnalysisNestedPgnSafe() {
  const tree = getAnalysisTree();
  const root = tree.nodes[tree.rootId];
  if (!root || !Array.isArray(root.children) || root.children.length === 0) return "";
  const ctx = {
    steps: 0,
    maxSteps: 12000,
    maxDepth: 96,
    aborted: false
  };
  const tokens = [];
  const rootNotes = Array.isArray(state.analysisPgnMeta.rootComments) ? state.analysisPgnMeta.rootComments : [];
  for (const note of rootNotes) {
    const token = createPgnCommentToken(note);
    if (token) tokens.push(token);
  }
  tokens.push(...serializeAnalysisBranchSafe(root.children[0], root.ply, new Set(), ctx, 0));
  if (ctx.aborted || !tokens.length) return "";
  return tokens.join(" ").replace(/\s+/g, " ").trim();
}

function createAnalysisDisplayPgn() {
  if (ANALYSIS_PGN_DISPLAY_MODE === "mainline") {
    return createAnalysisSimpleMainlinePgn();
  }
  return createAnalysisNestedPgnSafe() || createAnalysisSimpleMainlinePgn();
}

function createAnalysisExportPgn() {
  const movetext = createAnalysisDisplayPgn();
  if (!movetext) return "";
  const tags = state.analysisPgnMeta?.tags || {};
  const tagLines = Object.entries(tags)
    .filter(([, value]) => value != null && String(value).trim() !== "")
    .map(([key, value]) => `[${key} "${String(value).replace(/\\/g, "\\\\").replace(/"/g, "\\\"")}"]`);
  if (!tagLines.length) return movetext;
  return `${tagLines.join("\n")}\n\n${movetext}`;
}

function createComputerAnalysisBridgePgn() {
  const movetext = createAnalysisSimpleMainlinePgn();
  if (!movetext) return "";
  const defaultFen = new Chess().fen();
  const tags = state.analysisPgnMeta?.tags || {};
  const taggedFen = String(tags.FEN || "").trim();
  const wantsSetup = String(tags.SetUp || "").trim() === "1";
  const startFen = taggedFen && (wantsSetup || taggedFen !== defaultFen)
    ? taggedFen
    : String(state.currentGameStartFen || defaultFen).trim() || defaultFen;
  const allowedTagOrder = ["Event", "Site", "Date", "Round", "White", "Black", "Result", "Variant"];
  const tagLines = allowedTagOrder
    .filter((key) => tags[key] != null && String(tags[key]).trim() !== "")
    .map((key) => `[${key} "${String(tags[key]).replace(/\\/g, "\\\\").replace(/"/g, "\\\"")}"]`);
  if (startFen !== defaultFen) {
    tagLines.push(`[SetUp "1"]`);
    tagLines.push(`[FEN "${String(startFen).replace(/\\/g, "\\\\").replace(/"/g, "\\\"")}"]`);
  }
  return tagLines.length ? `${tagLines.join("\n")}\n\n${movetext}` : movetext;
}

function canOpenComputerAnalysisFromAnalysisBoard() {
  if (state.appMode !== "analysis") return false;
  if (isCurrentFairyVariantGame() && state.currentVariant !== "chess960") return false;
  return !!createAnalysisSimpleMainlinePgn().trim();
}

function updateAnalysisPgnText(force = false) {
  if (!analysisPgnTextEl || state.appMode !== "analysis") return;
  if (!force && document.activeElement === analysisPgnTextEl) return;
  const pgn = createAnalysisDisplayPgn();
  analysisPgnTextEl.value = pgn || "";
  state.analysisPgnDirty = false;
}

function updateAnalysisFenText(force = false) {
  if (!analysisFenTextEl || state.appMode !== "analysis") return;
  if (!force && document.activeElement === analysisFenTextEl) return;
  try {
    analysisFenTextEl.value = getViewGame().fen();
  } catch (_) {
    analysisFenTextEl.value = "";
  }
}

function loadAnalysisPgnFromText() {
  if (!analysisPgnTextEl) return;
  const raw = String(analysisPgnTextEl.value || "").trim();
  if (!raw) {
    showAppMessage("Paste PGN first.");
    return;
  }
  const { tags, movetext } = parsePgnTagsAndMovetext(raw);
  const tokens = tokenizePgnMovetext(movetext);
  if (!tokens.length) {
    showAppMessage("Invalid PGN.");
    return;
  }

  const taggedFen = String(tags.FEN || "").trim();
  const wantsSetup = String(tags.SetUp || "").trim() === "1";
  let startFen = null;
  if (taggedFen && (wantsSetup || taggedFen !== new Chess().fen())) {
    const check = new Chess();
    try {
      check.load(taggedFen);
      startFen = check.fen();
    } catch (_) {
      startFen = null;
    }
  }

  const tree = createAnalysisTreeRoot(startFen);
  state.analysisTree = tree;
  state.analysisPgnMeta = { tags, rootComments: [] };
  state.currentVariant = "standard";
  state.currentGameStartFen = startFen || new Chess().fen();
  state.playStartFen = state.currentGameStartFen;
  markAnalysisPgnDirty();
  let index = 0;

  function parseSequence(parentId, game) {
    let currentParentId = parentId;
    let lastNodeId = parentId;

    while (index < tokens.length) {
      const token = tokens[index];

      if (token.type === "rparen") {
        index += 1;
        return;
      }

      if (token.type === "lparen") {
        index += 1;
        const branchBaseParentId =
          lastNodeId === parentId
            ? parentId
            : getAnalysisTreeNode(lastNodeId)?.parentId || parentId;
        const branchGame = buildGameFromAnalysisNode(branchBaseParentId);
        parseSequence(branchBaseParentId, branchGame);
        continue;
      }

      if (token.type === "comment") {
        const clean = sanitizePgnComment(token.value);
        if (clean) {
          if (lastNodeId && lastNodeId !== tree.rootId) {
            const node = getAnalysisTreeNode(lastNodeId);
            if (node) {
              node.comment = node.comment ? `${node.comment} ${clean}` : clean;
            }
          } else {
            state.analysisPgnMeta.rootComments.push(clean);
          }
        }
        index += 1;
        continue;
      }

      if (token.type === "move") {
        const san = normalizeSanToken(token.value);
        let applied = null;
        try {
          applied = game.move(san, { sloppy: true });
        } catch (_) {
          applied = null;
        }
        if (!applied) {
          try {
            applied = game.move(san);
          } catch (_) {
            applied = null;
          }
        }
        index += 1;
        if (!applied) {
          continue;
        }
        const node = addAnalysisTreeChildMove(currentParentId, applied, game.fen(), game.turn(), {
          reuseExisting: false
        });
        if (!node) continue;
        node.san = applied.san || node.san;
        currentParentId = node.id;
        lastNodeId = node.id;
      }
    }
  }

  const parseGame = new Chess();
  if (startFen) {
    try {
      parseGame.load(startFen);
    } catch (_) {
      // fallback to standard start position
    }
  }

  parseSequence(tree.rootId, parseGame);

  stopCurrentEngineSearch();
  clearAnalysisState();
  if (state.appMode !== "analysis") {
    setAppMode("analysis");
  }
  tree.currentId = getAnalysisMainlineLeafFrom(tree.rootId);
  state.game = buildGameFromAnalysisNode(tree.currentId);
  state.viewPly = 0;
  render();
  updateAnalysisPgnText(true);
  renderAnalysisInfoPanel();
  showAppMessage("PGN loaded.");
}

async function openAnalysisFromPgnText(rawPgn) {
  const raw = String(rawPgn || "").trim();
  if (!raw) {
    showAppMessage("Paste PGN first.");
    return;
  }
  state.archive.currentAnalysisSource = null;
  state.archive.currentAnalysisReport = null;
  state.analysis.judgmentCycleState = {};
  state.currentVariant = "standard";
  if (!(await ensurePreferredAnalysisEngineConnected())) return;
  if (!(await ensureStandardEngineMode())) return;
  stopCurrentEngineSearch();
  clearAnalysisState();
  state.analysis.optionsOpen = false;
  setAppMode("analysis");
  showGameScreen();
  if (analysisPgnTextEl) {
    analysisPgnTextEl.value = raw;
  }
  loadAnalysisPgnFromText();
}

async function openAnalysisFromComputerAnalysis(payload = {}) {
  const raw = String(payload?.pgn || "").trim();
  if (!raw) {
    showAppMessage("Paste PGN first.");
    return;
  }
  const archiveContext = payload?.archiveContext || null;
  const report = payload?.report || null;
  state.archive.currentAnalysisSource = archiveContext || null;
  state.archive.currentAnalysisReport = report || null;
  state.currentVariant = "standard";
  if (!(await ensurePreferredAnalysisEngineConnected())) return;
  if (!(await ensureStandardEngineMode())) return;
  stopCurrentEngineSearch();
  clearAnalysisState();
  state.analysis.optionsOpen = false;
  setAppMode("analysis");
  showGameScreen();
  if (analysisPgnTextEl) {
    analysisPgnTextEl.value = raw;
  }
  loadAnalysisPgnFromText();
}

function loadAnalysisFenFromText() {
  if (!analysisFenTextEl) return;
  const rawFen = String(analysisFenTextEl.value || "").trim();
  if (!rawFen) {
    showAppMessage("Paste FEN first.");
    return;
  }
  loadFenIntoAnalysis(rawFen, "FEN loaded.");
}

function loadFenIntoAnalysis(rawFen, successMessage = "FEN loaded.") {
  const check = new Chess();
  try {
    check.load(rawFen);
  } catch (_) {
    showAppMessage("Invalid FEN.");
    return;
  }

  state.archive.currentAnalysisSource = null;
  state.archive.currentAnalysisReport = null;
  state.analysis.judgmentCycleState = {};
  stopCurrentEngineSearch();
  clearAnalysisState();
  state.analysisPgnMeta = { tags: {}, rootComments: [] };
  state.analysisTree = createAnalysisTreeRoot(check.fen());
  const tree = getAnalysisTree();
  tree.currentId = tree.rootId;
  state.game = buildGameFromAnalysisNode(tree.rootId);
  state.viewPly = 0;
  markAnalysisPgnDirty();
  render();
  updateAnalysisFenText(true);
  updateAnalysisPgnText(true);
  renderAnalysisInfoPanel();
  showAppMessage(successMessage);
}

function openAnalysisForFen(rawFen, successMessage = "FEN loaded.") {
  showGameScreen();
  setAppMode("analysis");
  loadFenIntoAnalysis(rawFen, successMessage);
}

async function saveAnalysisPgnToFile() {
  const pgn = createAnalysisExportPgn();
  if (!pgn.trim()) {
    showAppMessage("No moves to save.");
    return;
  }
  try {
    const filePath = await ipcRenderer.invoke("file:saveText", {
      defaultPath: "analysis.pgn",
      filters: [{ name: "PGN", extensions: ["pgn"] }],
      content: pgn
    });
    if (!filePath) return;
    showAppMessage("PGN saved.");
  } catch (err) {
    showAppMessage(`Save failed: ${String(err?.message || err)}`);
  }
}

function getViewedAnalysisNode() {
  if (state.appMode !== "analysis") return null;
  const path = getAnalysisDisplayedLineNodeIds();
  const nodeId = path[state.viewPly] || getAnalysisTree().rootId;
  return getAnalysisTreeNode(nodeId);
}

function renderAnalysisInfoPanel() {
  if (!analysisInfoTextEl || state.appMode !== "analysis") return;
  const viewedNode = getViewedAnalysisNode();
  const rootNotes = Array.isArray(state.analysisPgnMeta.rootComments) ? state.analysisPgnMeta.rootComments : [];
  const tags = state.analysisPgnMeta.tags || {};
  let text = "";
  let placeholder = "No comments for this move.";
  const isRootContext = !viewedNode || viewedNode.id === getAnalysisTree().rootId;
  if (isRootContext) {
    text = rootNotes.join("\n");
    const tagOrder = ["Event", "Site", "Date", "Round", "White", "Black", "Result"];
    const lines = [];
    for (const key of tagOrder) {
      if (tags[key]) lines.push(`${key}: ${tags[key]}`);
    }
    for (const [key, value] of Object.entries(tags)) {
      if (tagOrder.includes(key)) continue;
      if (value) lines.push(`${key}: ${value}`);
    }
    placeholder = lines.length
      ? `Game comments (PGN tags: ${lines.join(" | ")})`
      : "Game comments (root).";
  } else {
    text = viewedNode?.comment || "";
    const moveLabel = `${Math.floor((viewedNode.ply + 1) / 2)}${viewedNode.ply % 2 === 1 ? "." : "..."} ${viewedNode.san || viewedNode.uci || ""}`;
    placeholder = `Comment for ${moveLabel}`;
  }
  suppressAnalysisInfoInput = true;
  analysisInfoTextEl.value = text;
  analysisInfoTextEl.placeholder = placeholder;
  suppressAnalysisInfoInput = false;
}

function cycleBoardAnalysisJudgment(side, judgment) {
  const results = Array.isArray(state.archive.currentAnalysisReport?.results) ? state.archive.currentAnalysisReport.results : [];
  const filtered = results.filter(
    (item) => String(item?.side || "") === String(side || "") && String(item?.judgment || "") === String(judgment || "")
  );
  if (!filtered.length) return;
  const cycleKey = `${side}:${judgment}`;
  const nextIndex = Number.isInteger(state.analysis.judgmentCycleState[cycleKey])
    ? (state.analysis.judgmentCycleState[cycleKey] + 1) % filtered.length
    : 0;
  state.analysis.judgmentCycleState[cycleKey] = nextIndex;
  setViewPly(filtered[nextIndex].ply);
}

function persistAnalysisInfoCommentEdit() {
  if (!analysisInfoTextEl || state.appMode !== "analysis" || suppressAnalysisInfoInput) return;
  const tree = getAnalysisTree();
  const viewedNode = getViewedAnalysisNode();
  const raw = String(analysisInfoTextEl.value || "");
  const clean = sanitizePgnComment(raw);
  if (!viewedNode || viewedNode.id === tree.rootId) {
    state.analysisPgnMeta.rootComments = clean ? [clean] : [];
  } else {
    viewedNode.comment = clean;
    viewedNode.updatedAt = Date.now();
  }
  markAnalysisPgnDirty();
  updateAnalysisPgnText();
}

function getPremoveMoveInput(from, to) {
  const fromPiece = state.game.get(from);
  if (!fromPiece) return { from, to };
  if (fromPiece.type === "p") {
    const targetRank = to[1];
    const promoteRank = fromPiece.color === "w" ? "8" : "1";
    if (targetRank === promoteRank) {
      return { from, to, promotion: "q" };
    }
  }
  return { from, to };
}

function playSoundForVerboseMove(move) {
  if (!move || typeof move !== "object") return;
  const isCapture =
    typeof move.flags === "string" && (move.flags.includes("c") || move.flags.includes("e"));
  playSound(isCapture ? "capture" : "move");
}

function queuePremove(from, to) {
  if (!canQueuePremove()) return false;
  const fromPiece = state.game.get(from);
  if (!fromPiece || fromPiece.color !== state.player2Color) return false;
  if (from === to) return false;
  state.premove = getPremoveMoveInput(from, to);
  state.premoveSelectFrom = null;
  clearSelection();
  return true;
}

function tryPlayQueuedPremove() {
  if (!state.premove) return false;
  if (!isAtLatestPosition()) return false;
  if (isGameInteractionLocked()) {
    clearPremove();
    return false;
  }
  if (!isHumanTurn()) return false;
  const moveInput = state.premove;
  clearPremove();
  return attemptMove(moveInput);
}

function formatClock(ms) {
  const safe = Math.max(0, Math.floor(ms));
  if (safe < LOW_TIME_THRESHOLD_MS) {
    const totalCentis = Math.floor(safe / 10);
    const seconds = Math.floor(totalCentis / 100);
    const centis = totalCentis % 100;
    return `00:${String(seconds).padStart(2, "0")}.${String(centis).padStart(2, "0")}`;
  }
  const totalSeconds = Math.floor(safe / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function clampProgress(ms) {
  const baseline = isBotTournamentSpectatorMode()
    ? Math.max(
        Number(state.botTournamentSpectator.whiteStartMs || 0),
        Number(state.botTournamentSpectator.blackStartMs || 0),
        1
      )
    : INITIAL_CLOCK_MS;
  const ratio = ms / baseline;
  return Math.max(0, Math.min(1, ratio));
}

function renderClocks() {
  clockTopEl.classList.toggle("hidden", state.isUnlimitedTime);
  clockBottomEl.classList.toggle("hidden", state.isUnlimitedTime);
  if (state.isUnlimitedTime) return;

  const bottomColor = getBottomVisibleColor();
  const topColor = bottomColor === "w" ? "b" : "w";
  const whiteMs = isBotTournamentSpectatorMode() ? Number(state.botTournamentSpectator.whiteMs || 0) : state.clocks.whiteMs;
  const blackMs = isBotTournamentSpectatorMode() ? Number(state.botTournamentSpectator.blackMs || 0) : state.clocks.blackMs;
  const topMs = topColor === "w" ? whiteMs : blackMs;
  const bottomMs = bottomColor === "w" ? whiteMs : blackMs;

  clockTopTimeEl.textContent = formatClock(topMs);
  clockBottomTimeEl.textContent = formatClock(bottomMs);

  clockTopProgressEl.style.transform = `scaleX(${clampProgress(topMs)})`;
  clockBottomProgressEl.style.transform = `scaleX(${clampProgress(bottomMs)})`;

  clockTopEl.classList.remove("active");
  clockBottomEl.classList.remove("active");
  clockTopEl.classList.toggle("low-time", topMs < LOW_TIME_THRESHOLD_MS);
  clockBottomEl.classList.toggle("low-time", bottomMs < LOW_TIME_THRESHOLD_MS);

  if (isBotTournamentSpectatorMode() && state.game.isGameOver()) return;
  if (!isClockRunning() && !isBotTournamentSpectatorMode()) return;
  const activeTurnColor = isBotTournamentSpectatorMode()
    ? String(state.botTournamentSpectator.activeColor || state.game.turn() || "w")
    : state.game.turn();
  if (activeTurnColor === topColor) {
    clockTopEl.classList.add("active");
  } else {
    clockBottomEl.classList.add("active");
  }
}

function renderPlayerBars() {
  if (isBotTournamentSpectatorMode()) {
    const whiteName = state.botTournamentSpectator.whiteName || "White";
    const blackName = state.botTournamentSpectator.blackName || "Black";
    const bottomColor = getBottomVisibleColor();
    const topColor = oppositeColor(bottomColor);
    const topName = topColor === "w" ? whiteName : blackName;
    const bottomName = bottomColor === "w" ? whiteName : blackName;
    if (playerTopNameEl) playerTopNameEl.textContent = topName;
    else playerTopBarEl.textContent = topName;
    if (playerBottomNameEl) playerBottomNameEl.textContent = bottomName;
    else playerBottomBarEl.textContent = bottomName;
    return;
  }
  if (isOnlineGameActive()) {
    const active = state.online.activeGames.get(state.online.currentGameId) || {};
    const whiteName = formatOnlinePlayerLabel(active.whiteName || "White", active.whiteRating);
    const blackName = formatOnlinePlayerLabel(active.blackName || "Black", active.blackRating);
    const bottomColor = getBottomVisibleColor();
    const topColor = oppositeColor(bottomColor);
    const topName = topColor === "w" ? whiteName : blackName;
    const bottomName = bottomColor === "w" ? whiteName : blackName;
    if (playerTopNameEl) playerTopNameEl.textContent = topName;
    else playerTopBarEl.textContent = topName;
    if (playerBottomNameEl) playerBottomNameEl.textContent = bottomName;
    else playerBottomBarEl.textContent = bottomName;
    return;
  }
  if (state.appMode === "tablebase") {
    const bottomColor = getBottomVisibleColor();
    const topColor = oppositeColor(bottomColor);
    const topName = topColor === "w" ? "White" : "Black";
    const bottomName = bottomColor === "w" ? "White" : "Black";
    if (playerTopNameEl) playerTopNameEl.textContent = topName;
    else playerTopBarEl.textContent = topName;
    if (playerBottomNameEl) playerBottomNameEl.textContent = bottomName;
    else playerBottomBarEl.textContent = bottomName;
    return;
  }
  if (state.appMode === "puzzle") {
    if (playerTopNameEl) playerTopNameEl.textContent = "Puzzle";
    else playerTopBarEl.textContent = "Puzzle";
    const playerLabel = getLocalHumanPlayerName();
    if (playerBottomNameEl) playerBottomNameEl.textContent = playerLabel;
    else playerBottomBarEl.textContent = playerLabel;
    return;
  }
  const selectedEngine = getActiveEngineRecord();
  const opponentDisplayName = state.engineRuntime.displayName
    || (selectedEngine ? formatEngineName(selectedEngine) : "")
    || state.engineRuntime.idName
    || "Engine";
  if (playerTopNameEl) {
    playerTopNameEl.textContent = opponentDisplayName;
  } else {
    playerTopBarEl.textContent = opponentDisplayName;
  }
  if (playerBottomNameEl) {
    playerBottomNameEl.textContent = getLocalHumanPlayerName();
  } else {
    playerBottomBarEl.textContent = getLocalHumanPlayerName();
  }
}

function getMaterialImbalanceData(viewGame) {
  const counts = {
    w: { p: 0, n: 0, b: 0, r: 0, q: 0 },
    b: { p: 0, n: 0, b: 0, r: 0, q: 0 }
  };
  const board = viewGame.board();
  for (const row of board) {
    for (const piece of row) {
      if (!piece || piece.type === "k") continue;
      if (counts[piece.color] && counts[piece.color][piece.type] !== undefined) {
        counts[piece.color][piece.type] += 1;
      }
    }
  }

  const extras = { w: {}, b: {} };
  const order = ["q", "r", "b", "n", "p"];
  for (const type of order) {
    const diff = counts.w[type] - counts.b[type];
    if (diff > 0) extras.w[type] = diff;
    if (diff < 0) extras.b[type] = -diff;
  }

  const score = { w: 0, b: 0 };
  for (const type of Object.keys(PIECE_VALUES)) {
    score.w += (extras.w[type] || 0) * PIECE_VALUES[type];
    score.b += (extras.b[type] || 0) * PIECE_VALUES[type];
  }
  return { extras, score };
}

function renderMaterialStrip(stripEl, sideColor, extras, plusValue) {
  if (!stripEl) return;
  stripEl.innerHTML = "";
  const order = ["q", "r", "b", "n", "p"];
  for (const type of order) {
    const count = Number(extras?.[type] || 0);
    if (count <= 0) continue;
    for (let i = 0; i < count; i += 1) {
      const img = document.createElement("img");
      img.className = "material-piece";
      img.src = pieceAssetPath({ color: sideColor, type });
      img.alt = `${sideColor}${type}`;
      stripEl.appendChild(img);
    }
  }
  if (plusValue > 0) {
    const plus = document.createElement("span");
    plus.className = "material-plus";
    plus.textContent = `+${plusValue}`;
    stripEl.appendChild(plus);
  }
  const isEmpty = !stripEl.children.length;
  stripEl.classList.toggle("hidden", isEmpty);
}

function renderMaterialImbalance() {
  if (!materialTopEl || !materialBottomEl) return;
  if (state.appMode !== "play") {
    materialTopEl.classList.add("hidden");
    materialBottomEl.classList.add("hidden");
    return;
  }
  const viewGame = getViewGame();
  const { extras, score } = getMaterialImbalanceData(viewGame);
  const bottomColor = getBottomVisibleColor();
  const topColor = oppositeColor(bottomColor);
  const whiteAheadBy = score.w - score.b;
  const blackAheadBy = score.b - score.w;
  const plusBySide = {
    w: whiteAheadBy > 0 ? whiteAheadBy : 0,
    b: blackAheadBy > 0 ? blackAheadBy : 0
  };
  renderMaterialStrip(materialTopEl, topColor, extras[topColor], plusBySide[topColor]);
  renderMaterialStrip(materialBottomEl, bottomColor, extras[bottomColor], plusBySide[bottomColor]);
}

function updateRematchButtonState() {
  if (!rematchBtnEl) return;
  if (isBotTournamentSpectatorMode()) {
    if (playerControlsBarEl) {
      playerControlsBarEl.classList.remove("game-finished");
    }
    rematchBtnEl.classList.add("hidden");
    if (postGameAnalysisBtnEl) postGameAnalysisBtnEl.classList.add("hidden");
    if (resignBtnEl) resignBtnEl.classList.add("hidden");
    if (undoPairBtnEl) undoPairBtnEl.classList.add("hidden");
    if (mainMenuBtnEl) mainMenuBtnEl.classList.add("hidden");
    if (botTournamentSpectatorBackBtnEl) botTournamentSpectatorBackBtnEl.classList.remove("hidden");
    return;
  }
  if (isBotTournamentHumanMode()) {
    const gameFinished = isGameInteractionLocked();
    if (playerControlsBarEl) {
      playerControlsBarEl.classList.toggle("game-finished", gameFinished);
    }
    rematchBtnEl.classList.add("hidden");
    if (postGameAnalysisBtnEl) postGameAnalysisBtnEl.classList.add("hidden");
    if (undoPairBtnEl) undoPairBtnEl.classList.add("hidden");
    if (onlineDrawBtnEl) onlineDrawBtnEl.classList.add("hidden");
    if (onlineDrawAcceptBtnEl) onlineDrawAcceptBtnEl.classList.add("hidden");
    if (onlineDrawRejectBtnEl) onlineDrawRejectBtnEl.classList.add("hidden");
    if (onlineTakebackBtnEl) onlineTakebackBtnEl.classList.add("hidden");
    if (onlineTakebackAcceptBtnEl) onlineTakebackAcceptBtnEl.classList.add("hidden");
    if (onlineTakebackRejectBtnEl) onlineTakebackRejectBtnEl.classList.add("hidden");
    if (botTournamentSpectatorBackBtnEl) botTournamentSpectatorBackBtnEl.classList.add("hidden");
    if (resignBtnEl) resignBtnEl.classList.toggle("hidden", gameFinished);
    if (mainMenuBtnEl) mainMenuBtnEl.classList.toggle("hidden", !gameFinished);
    return;
  }
  if (state.appMode === "puzzle") {
    if (playerControlsBarEl) {
      playerControlsBarEl.classList.remove("game-finished");
    }
    rematchBtnEl.classList.add("hidden");
    if (postGameAnalysisBtnEl) postGameAnalysisBtnEl.classList.add("hidden");
    if (resignBtnEl) resignBtnEl.classList.add("hidden");
    if (onlineDrawBtnEl) onlineDrawBtnEl.classList.add("hidden");
    if (onlineDrawAcceptBtnEl) onlineDrawAcceptBtnEl.classList.add("hidden");
    if (onlineDrawRejectBtnEl) onlineDrawRejectBtnEl.classList.add("hidden");
    if (onlineTakebackBtnEl) onlineTakebackBtnEl.classList.add("hidden");
    if (onlineTakebackAcceptBtnEl) onlineTakebackAcceptBtnEl.classList.add("hidden");
    if (onlineTakebackRejectBtnEl) onlineTakebackRejectBtnEl.classList.add("hidden");
    if (undoPairBtnEl) undoPairBtnEl.classList.add("hidden");
    if (mainMenuBtnEl) mainMenuBtnEl.classList.add("hidden");
    if (btnTablebaseBackSetupEl) btnTablebaseBackSetupEl.classList.add("hidden");
    if (btnTablebaseTrainingHintEl) btnTablebaseTrainingHintEl.classList.add("hidden");
    if (btnTablebaseExitTrainingEl) btnTablebaseExitTrainingEl.classList.add("hidden");
    if (btnPuzzleHintEl) {
      const showPuzzleHint = !!puzzleModule?.isHintVisible();
      btnPuzzleHintEl.classList.toggle("hidden", !showPuzzleHint);
    }
    if (btnPuzzleExitEl) btnPuzzleExitEl.classList.remove("hidden");
    if (btnPuzzleNextEl) {
      btnPuzzleNextEl.classList.toggle("hidden", !puzzleModule?.isNextVisible());
    }
    if (btnPuzzleAnalyzeEl) {
      btnPuzzleAnalyzeEl.classList.toggle("hidden", !puzzleModule?.isAnalyzeVisible());
    }
    return;
  }
  if (state.appMode === "tablebase") {
    if (playerControlsBarEl) {
      playerControlsBarEl.classList.toggle("game-finished", isTablebaseTrainingFinished());
    }
    if (undoPairBtnEl) {
      undoPairBtnEl.title = "Undo one move";
      undoPairBtnEl.setAttribute("aria-label", "Undo one move");
    }
    rematchBtnEl.classList.toggle("hidden", !isTablebaseTrainingFinished());
    if (postGameAnalysisBtnEl) postGameAnalysisBtnEl.classList.add("hidden");
    if (resignBtnEl) resignBtnEl.classList.add("hidden");
    if (onlineDrawBtnEl) onlineDrawBtnEl.classList.add("hidden");
    if (onlineDrawAcceptBtnEl) onlineDrawAcceptBtnEl.classList.add("hidden");
    if (onlineDrawRejectBtnEl) onlineDrawRejectBtnEl.classList.add("hidden");
    if (onlineTakebackBtnEl) onlineTakebackBtnEl.classList.add("hidden");
    if (onlineTakebackAcceptBtnEl) onlineTakebackAcceptBtnEl.classList.add("hidden");
    if (onlineTakebackRejectBtnEl) onlineTakebackRejectBtnEl.classList.add("hidden");
    if (undoPairBtnEl) undoPairBtnEl.classList.toggle("hidden", isTablebaseTrainingActive());
    if (mainMenuBtnEl) mainMenuBtnEl.classList.toggle("hidden", isTablebaseTrainingActive());
    if (btnTablebaseBackSetupEl) {
      btnTablebaseBackSetupEl.classList.toggle("hidden", state.appMode !== "tablebase" || isTablebaseTrainingActive());
    }
    if (btnTablebaseTrainingHintEl) {
      const showHintButton =
        isTablebaseTrainingActive() &&
        !isTablebaseTrainingFinished() &&
        !!state.tablebase.training.config?.hintEnabled;
      btnTablebaseTrainingHintEl.classList.toggle("hidden", !showHintButton);
    }
    if (btnTablebaseExitTrainingEl) {
      btnTablebaseExitTrainingEl.classList.toggle("hidden", !isTablebaseTrainingActive());
    }
    return;
  }
  if (undoPairBtnEl) {
    undoPairBtnEl.title = "Undo last two moves";
    undoPairBtnEl.setAttribute("aria-label", "Undo last two moves");
  }
  if (btnTablebaseExitTrainingEl) {
    btnTablebaseExitTrainingEl.classList.add("hidden");
  }
  if (btnTablebaseBackSetupEl) {
    btnTablebaseBackSetupEl.classList.add("hidden");
  }
  if (btnTablebaseTrainingHintEl) {
    btnTablebaseTrainingHintEl.classList.add("hidden");
  }
  if (btnPuzzleHintEl) {
    btnPuzzleHintEl.classList.add("hidden");
  }
  if (btnPuzzleExitEl) {
    btnPuzzleExitEl.classList.add("hidden");
  }
  if (btnPuzzleNextEl) {
    btnPuzzleNextEl.classList.add("hidden");
  }
  if (btnPuzzleAnalyzeEl) {
    btnPuzzleAnalyzeEl.classList.add("hidden");
  }
  if (isOnlineGameActive()) {
    const gameFinished = isGameInteractionLocked();
    if (playerControlsBarEl) {
      playerControlsBarEl.classList.toggle("game-finished", gameFinished);
    }
    rematchBtnEl.classList.add("hidden");
    if (postGameAnalysisBtnEl) {
      postGameAnalysisBtnEl.classList.toggle("hidden", !gameFinished);
    }
    if (resignBtnEl) {
      resignBtnEl.classList.toggle("hidden", gameFinished);
    }
    if (onlineDrawBtnEl) {
      onlineDrawBtnEl.classList.toggle("hidden", gameFinished);
    }
    if (onlineDrawAcceptBtnEl) {
      onlineDrawAcceptBtnEl.classList.toggle("hidden", gameFinished);
    }
    if (onlineDrawRejectBtnEl) {
      onlineDrawRejectBtnEl.classList.toggle("hidden", gameFinished);
    }
    if (onlineTakebackBtnEl) {
      onlineTakebackBtnEl.classList.toggle("hidden", gameFinished);
    }
    if (onlineTakebackAcceptBtnEl) {
      onlineTakebackAcceptBtnEl.classList.toggle("hidden", gameFinished);
    }
    if (onlineTakebackRejectBtnEl) {
      onlineTakebackRejectBtnEl.classList.toggle("hidden", gameFinished);
    }
    if (undoPairBtnEl) {
      undoPairBtnEl.classList.add("hidden");
    }
    if (mainMenuBtnEl) {
      mainMenuBtnEl.classList.toggle("hidden", !gameFinished);
    }
    return;
  }
  const gameFinished = isGameInteractionLocked();
  if (playerControlsBarEl) {
    playerControlsBarEl.classList.toggle("game-finished", gameFinished);
  }
  if (onlineDrawBtnEl) {
    onlineDrawBtnEl.classList.add("hidden");
  }
  if (onlineDrawAcceptBtnEl) {
    onlineDrawAcceptBtnEl.classList.add("hidden");
  }
  if (onlineDrawRejectBtnEl) {
    onlineDrawRejectBtnEl.classList.add("hidden");
  }
  if (onlineTakebackBtnEl) {
    onlineTakebackBtnEl.classList.add("hidden");
  }
  if (onlineTakebackAcceptBtnEl) {
    onlineTakebackAcceptBtnEl.classList.add("hidden");
  }
  if (onlineTakebackRejectBtnEl) {
    onlineTakebackRejectBtnEl.classList.add("hidden");
  }
  rematchBtnEl.classList.toggle("hidden", !gameFinished);
  if (postGameAnalysisBtnEl) {
    postGameAnalysisBtnEl.classList.toggle("hidden", !gameFinished);
  }
  if (resignBtnEl) {
    resignBtnEl.classList.toggle("hidden", gameFinished);
  }
  if (undoPairBtnEl) {
    undoPairBtnEl.classList.toggle("hidden", gameFinished);
  }
  if (mainMenuBtnEl) {
    mainMenuBtnEl.classList.toggle("hidden", !gameFinished);
  }
}

function canUndoPair() {
  if (isBotTournamentSpectatorMode()) return false;
  if (isBotTournamentHumanMode()) return false;
  if (isOnlineGameActive()) return false;
  if (state.appMode === "puzzle") return false;
  if (!isAtLatestPosition()) return false;
  if (state.promotion) return false;
  if (isGameInteractionLocked()) return false;
  if (isTablebaseTrainingActive()) return false;
  if (state.appMode === "tablebase") return state.game.history().length >= 1;
  if (isEngineTurn()) return false;
  return state.game.history().length >= 2;
}

function hasPlayer2MovedAtLeastOnce() {
  const history = state.game.history({ verbose: true });
  return history.some((mv) => mv.color === state.player2Color);
}

function clearResignConfirmation() {
  state.resignConfirmUntil = 0;
  if (state.resignConfirmTimerId !== null) {
    window.clearTimeout(state.resignConfirmTimerId);
    state.resignConfirmTimerId = null;
  }
}

function updatePlayerActionButtonStates() {
  if (botTournamentSpectatorBackBtnEl) {
    botTournamentSpectatorBackBtnEl.disabled = !isBotTournamentSpectatorMode();
  }
  if (isBotTournamentSpectatorMode()) {
    if (undoPairBtnEl) undoPairBtnEl.disabled = true;
    if (resignBtnEl) {
      resignBtnEl.disabled = true;
      resignBtnEl.classList.remove("armed-resign");
    }
    return;
  }
  if (isBotTournamentHumanMode()) {
    if (undoPairBtnEl) undoPairBtnEl.disabled = true;
    if (resignBtnEl) {
      resignBtnEl.classList.toggle(
        "armed-resign",
        state.resignConfirmUntil > Date.now() && !isGameInteractionLocked()
      );
      resignBtnEl.disabled = isGameInteractionLocked() || !hasPlayer2MovedAtLeastOnce();
    }
    return;
  }
  if (undoPairBtnEl) {
    undoPairBtnEl.disabled = !canUndoPair();
  }
  if (btnTablebaseExitTrainingEl) {
    btnTablebaseExitTrainingEl.disabled = false;
  }
  if (btnTablebaseTrainingHintEl) {
    btnTablebaseTrainingHintEl.disabled = !(
      isTablebaseTrainingActive() &&
      !isTablebaseTrainingFinished() &&
      !!state.tablebase.training.config?.hintEnabled &&
      isTablebaseTrainingUsersTurn() &&
      state.tablebase.session.fetchStatus === "success"
    );
  }
  if (btnPuzzleHintEl) {
    btnPuzzleHintEl.disabled = !(state.appMode === "puzzle" && puzzleModule && !puzzleModule.isHintDisabled());
  }
  if (btnPuzzleExitEl) {
    btnPuzzleExitEl.disabled = state.appMode !== "puzzle";
  }
  if (btnPuzzleNextEl) {
    btnPuzzleNextEl.disabled = !(state.appMode === "puzzle" && puzzleModule?.isNextVisible());
  }
  if (btnPuzzleAnalyzeEl) {
    btnPuzzleAnalyzeEl.disabled = !(state.appMode === "puzzle" && puzzleModule && !puzzleModule.isAnalyzeDisabled());
  }
  if (resignBtnEl) {
    if (state.appMode === "tablebase") {
      resignBtnEl.disabled = true;
      resignBtnEl.classList.remove("armed-resign");
    } else {
    resignBtnEl.classList.toggle(
      "armed-resign",
      state.resignConfirmUntil > Date.now() && !isGameInteractionLocked()
    );
    resignBtnEl.disabled = isGameInteractionLocked() || !hasPlayer2MovedAtLeastOnce();
    }
  }
  if (onlineDrawBtnEl) {
    const offerState = getOnlineOfferState("draw");
    onlineDrawBtnEl.disabled = !offerState.ownPending && !offerState.opponentPending ? !canOfferOnlineDraw() : true;
    onlineDrawBtnEl.classList.toggle("online-offer-pending", offerState.ownPending);
    onlineDrawBtnEl.classList.toggle("online-offer-incoming", offerState.opponentPending);
    onlineDrawBtnEl.title = offerState.opponentPending
      ? "Incoming draw offer"
      : offerState.ownPending
        ? "Draw offer pending"
        : "Offer draw";
    onlineDrawBtnEl.setAttribute("aria-label", onlineDrawBtnEl.title);
  }
  if (onlineDrawAcceptBtnEl) {
    const offerState = getOnlineOfferState("draw");
    onlineDrawAcceptBtnEl.classList.toggle("hidden", !isOnlineGameActive() || !offerState.opponentPending);
    onlineDrawAcceptBtnEl.disabled = !isOnlineGameActive() || isGameInteractionLocked();
    onlineDrawAcceptBtnEl.classList.add("accept");
  }
  if (onlineDrawRejectBtnEl) {
    const offerState = getOnlineOfferState("draw");
    onlineDrawRejectBtnEl.classList.toggle("hidden", !isOnlineGameActive() || !offerState.opponentPending);
    onlineDrawRejectBtnEl.disabled = !isOnlineGameActive() || isGameInteractionLocked();
    onlineDrawRejectBtnEl.classList.add("reject");
  }
  if (onlineTakebackBtnEl) {
    const offerState = getOnlineOfferState("takeback");
    onlineTakebackBtnEl.disabled = !offerState.ownPending && !offerState.opponentPending ? !canOfferOnlineTakeback() : true;
    onlineTakebackBtnEl.classList.toggle("online-offer-pending", offerState.ownPending);
    onlineTakebackBtnEl.classList.toggle("online-offer-incoming", offerState.opponentPending);
    onlineTakebackBtnEl.title = offerState.opponentPending
      ? "Incoming takeback request"
      : offerState.ownPending
        ? "Takeback request pending"
        : "Request takeback";
    onlineTakebackBtnEl.setAttribute("aria-label", onlineTakebackBtnEl.title);
  }
  if (onlineTakebackAcceptBtnEl) {
    const offerState = getOnlineOfferState("takeback");
    onlineTakebackAcceptBtnEl.classList.toggle("hidden", !isOnlineGameActive() || !offerState.opponentPending);
    onlineTakebackAcceptBtnEl.disabled = !isOnlineGameActive() || isGameInteractionLocked();
    onlineTakebackAcceptBtnEl.classList.add("accept");
  }
  if (onlineTakebackRejectBtnEl) {
    const offerState = getOnlineOfferState("takeback");
    onlineTakebackRejectBtnEl.classList.toggle("hidden", !isOnlineGameActive() || !offerState.opponentPending);
    onlineTakebackRejectBtnEl.disabled = !isOnlineGameActive() || isGameInteractionLocked();
    onlineTakebackRejectBtnEl.classList.add("reject");
  }
}

function tickClocks(timestamp) {
  if (!state.clocks.lastTickTs) {
    state.clocks.lastTickTs = timestamp;
  }

  const delta = Math.max(0, timestamp - state.clocks.lastTickTs);
  state.clocks.lastTickTs = timestamp;

  if (isBotTournamentSpectatorMode()) {
    if (!state.game.isGameOver()) {
      const activeTurnColor = String(state.botTournamentSpectator.activeColor || state.game.turn() || "w");
      if (activeTurnColor === "w") {
        state.botTournamentSpectator.whiteMs = Math.max(0, Number(state.botTournamentSpectator.whiteMs || 0) - delta);
      } else {
        state.botTournamentSpectator.blackMs = Math.max(0, Number(state.botTournamentSpectator.blackMs || 0) - delta);
      }
    }
    state.clocks.whiteMs = state.botTournamentSpectator.whiteMs;
    state.clocks.blackMs = state.botTournamentSpectator.blackMs;
    renderClocks();
    state.clocks.rafId = window.requestAnimationFrame(tickClocks);
    return;
  }

  const running = isClockRunning();

  if (running) {
    if (state.game.turn() === "w") {
      const prevWhiteMs = state.clocks.whiteMs;
      state.clocks.whiteMs = Math.max(0, state.clocks.whiteMs - delta);
      maybePlayLowTimeSoundForColor("w", prevWhiteMs, state.clocks.whiteMs);
      if (!isOnlineGameActive() && state.clocks.whiteMs === 0 && !state.timeoutLoser) {
        state.timeoutLoser = "white";
        stopEngineThinkingIfRunning();
        closePromotionMenu();
        clearSelection();
        render();
      }
    } else {
      const prevBlackMs = state.clocks.blackMs;
      state.clocks.blackMs = Math.max(0, state.clocks.blackMs - delta);
      maybePlayLowTimeSoundForColor("b", prevBlackMs, state.clocks.blackMs);
      if (!isOnlineGameActive() && state.clocks.blackMs === 0 && !state.timeoutLoser) {
        state.timeoutLoser = "black";
        stopEngineThinkingIfRunning();
        closePromotionMenu();
        clearSelection();
        render();
      }
    }
  }

  // Watchdog: if game state advanced without a full render (rare timing race),
  // force a repaint so board, premove marks, and move list stay in sync.
  if (state.lastRenderedGamePly !== getLatestPly()) {
    render();
  }

  renderClocks();
  state.clocks.rafId = window.requestAnimationFrame(tickClocks);
}

function ensureClockLoop() {
  if (state.clocks.rafId !== null) return;
  state.clocks.rafId = window.requestAnimationFrame(tickClocks);
}

function getViewGame() {
  if (
    isCurrentFairyVariantGame() &&
    (state.appMode === "play" || state.appMode === "puzzle" || state.appMode === "tablebase" || state.appMode === "analysis")
  ) {
    const variantName = getCurrentFairyVariantName();
    const defaultStartFen = getDefaultStartFenForVariant(state.currentVariant);
    const viewGame = createFairyVariantGame(variantName, state.currentGameStartFen || state.playStartFen || defaultStartFen);
    const history = state.game.history({ verbose: true });
    for (let i = 0; i < state.viewPly; i += 1) {
      const mv = history[i];
      if (!mv) break;
      applyMoveToGameInstance(viewGame, mv);
    }
    return viewGame;
  }
  const viewGame = new Chess();
  const startFen = new Chess().fen();
  if (state.appMode === "analysis" && state.analysisTree) {
    const tree = getAnalysisTree();
    const root = tree.nodes[tree.rootId];
    if (root && typeof root.fen === "string" && root.fen !== startFen) {
      try {
        viewGame.load(root.fen);
      } catch (_) {
        // fallback to standard start position
      }
    }
  } else if (
    (state.appMode === "play" || state.appMode === "tablebase" || state.appMode === "puzzle") &&
    state.currentGameStartFen &&
    state.currentGameStartFen !== startFen
  ) {
    try {
      viewGame.load(state.currentGameStartFen);
    } catch (_) {
      // fallback to standard start position
    }
  }
  const history = state.game.history({ verbose: true });
  for (let i = 0; i < state.viewPly; i += 1) {
    const mv = history[i];
    applyMoveToGameInstance(viewGame, mv);
  }
  return viewGame;
}

function selectSquare(square) {
  if (!isAtLatestPosition()) return;
  state.selectedSquare = square;
  state.selectedDropPiece = null;
  state.selectedDropColor = null;
  state.legalTargets.clear();
  state.captureTargets.clear();
  state.moveOptionsByTarget.clear();
  const moves = state.game.moves({ square, verbose: true });
  for (const mv of moves) {
    state.legalTargets.add(mv.to);
    if (!state.moveOptionsByTarget.has(mv.to)) {
      state.moveOptionsByTarget.set(mv.to, []);
    }
    state.moveOptionsByTarget.get(mv.to).push(mv);
    if (mv.flags.includes("c") || mv.flags.includes("e")) {
      state.captureTargets.add(mv.to);
    }
  }
}

function selectCrazyhouseDropPiece(pieceType, pieceColor = getHumanPlayerColor()) {
  if (!isCurrentCrazyhouseVariantGame() || !isAtLatestPosition()) return;
  const drop = String(pieceType || "").trim().toLowerCase();
  if (!/^[pnbrq]$/.test(drop)) return;
  const color = String(pieceColor || "").trim().toLowerCase();
  if (color !== "w" && color !== "b") return;
  state.selectedSquare = null;
  state.selectedDropPiece = drop;
  state.selectedDropColor = color;
  state.legalTargets.clear();
  state.captureTargets.clear();
  state.moveOptionsByTarget.clear();
  const moves = state.game.moves({ verbose: true });
  for (const mv of moves) {
    if (!mv?.drop || mv.drop !== drop) continue;
    state.legalTargets.add(mv.to);
    if (!state.moveOptionsByTarget.has(mv.to)) {
      state.moveOptionsByTarget.set(mv.to, []);
    }
    state.moveOptionsByTarget.get(mv.to).push(mv);
  }
}

function attemptMove(moveInput, options = {}) {
  const analysisParentId = hasMoveTreeMode() ? getAnalysisTree().currentId : null;
  const tablebaseTrainingReviewFailure = getTablebaseTrainingReviewFailure(moveInput);
  if (tablebaseTrainingReviewFailure) {
    setTablebaseTrainingMessage(tablebaseTrainingReviewFailure, "error");
    showAppMessage(tablebaseTrainingReviewFailure);
    return false;
  }
  const move = state.game.move(moveInput);
  if (!move) return false;
  if (state.appMode === "puzzle" && !options.skipPuzzleValidation && puzzleModule) {
    const expectedPuzzleUci = String(puzzleModule.getExpectedMoveUci?.() || "");
    const playedPuzzleUci = `${move.from}${move.to}${String(move.promotion || "").toLowerCase()}`;
    if (expectedPuzzleUci && playedPuzzleUci !== expectedPuzzleUci) {
      state.game.undo();
      showAppMessage("Retry. That is not the puzzle move.");
      clearSelection();
      closePromotionMenu();
      render();
      return false;
    }
  }
  if (isTablebaseTrainingActive()) {
    clearTablebaseTrainingHint();
  }
  if (state.appMode === "puzzle" && !options.preservePuzzleHint) {
    clearBoardAnnotations();
  }
  if (isTablebaseTrainingActive() && !state.tablebase.training.pendingAutoReply) {
    setTablebaseTrainingMessage("");
  }
  const isCapture = typeof move.flags === "string" && (move.flags.includes("c") || move.flags.includes("e"));
  playSound(isCapture ? "capture" : "move");
  state.premoveSelectFrom = null;
  if (move.color === state.player2Color) {
    state.premove = null;
  }
  if (state.appMode !== "tablebase" && selectedIncrementMs > 0) {
    if (move.color === "w") {
      state.clocks.whiteMs += selectedIncrementMs;
    } else {
      state.clocks.blackMs += selectedIncrementMs;
    }
  }
  state.viewPly = getLatestPly();
  if (hasMoveTreeMode()) {
    addAnalysisTreeChildMove(analysisParentId, move, state.game.fen(), state.game.turn());
    if (state.appMode === "analysis") {
      markAnalysisPgnDirty();
      state.analysis.eval = null;
      state.analysis.lines = new Map();
      state.analysis.depth = null;
      state.analysis.hashPermill = null;
      state.analysis.searching = false;
      state.analysis.lastFenRequested = "";
    }
  }
  closePromotionMenu();
  clearSelection();
  if (move.color !== state.player2Color) {
    tryPlayQueuedPremove();
  }
  if (state.appMode === "tablebase") {
    requestTablebaseForFen(state.game.fen());
  }
  if (state.appMode === "puzzle" && puzzleModule) {
    puzzleModule.onMoveApplied(move, { system: !!options.puzzleSystemMove });
  }
  if (isOnlineGameActive() && move.color === state.player2Color) {
    const uci = `${move.from}${move.to}${move.promotion || ""}`;
    ipcRenderer
      .invoke("online:game:move", {
        gameId: state.online.currentGameId,
        move: uci
      })
      .then((res) => {
        if (!res?.ok) {
          showAppMessage(`Online move rejected: ${res?.error || "unknown error"}`);
          state.game = rebuildGameFromFenAndUciMoves(
            state.online.currentInitialFen,
            state.online.currentMovesUci
          );
          state.viewPly = getLatestPly();
          render();
        }
      })
      .catch((err) => {
        showAppMessage(`Online move failed: ${String(err?.message || err)}`);
        state.game = rebuildGameFromFenAndUciMoves(
          state.online.currentInitialFen,
          state.online.currentMovesUci
        );
        state.viewPly = getLatestPly();
        render();
      });
  }
  return true;
}

function getPromotionOptionsForTarget(toSquare) {
  const options = state.moveOptionsByTarget.get(toSquare) || [];
  return options.filter((mv) => mv.promotion);
}

function tryResolveMoveToTarget(toSquare) {
  if (state.selectedDropPiece && state.legalTargets.has(toSquare)) {
    return attemptMove({ drop: state.selectedDropPiece, to: toSquare });
  }
  if (!state.selectedSquare || !state.legalTargets.has(toSquare)) return false;
  const promotionOptions = getPromotionOptionsForTarget(toSquare);
  if (promotionOptions.length > 0) {
    openPromotionMenu(promotionOptions);
    return true;
  }
  return attemptMove({ from: state.selectedSquare, to: toSquare });
}

function onSquareClick(event) {
  if (state.suppressNextClick) {
    state.suppressNextClick = false;
    event.preventDefault();
    return;
  }
  const annotationsCleared = clearBoardAnnotations();
  if (isEditorLikeMode()) {
    const square = event.currentTarget.dataset.square;
    const tool = state.appMode === "tablebase-setup" ? state.tablebase.setup.selectedTool : state.editor.selectedTool;
    if (tool === "erase") {
      setEditorPiece(square, null);
      render();
      return;
    }
    const piece = toolToPiece(tool);
    if (piece && setEditorPiece(square, piece) !== false) {
      render();
      return;
    }
    if (annotationsCleared) render();
    return;
  }
  if (state.promotion) {
    if (annotationsCleared) render();
    return;
  }
  if (!isAtLatestPosition()) {
    if (hasMoveTreeMode()) {
      checkoutAnalysisAtViewPly();
    } else {
      if (annotationsCleared) render();
      return;
    }
  }
  if (state.appMode !== "analysis" && isGameInteractionLocked()) {
    if (annotationsCleared) render();
    return;
  }

  const square = event.currentTarget.dataset.square;
  const piece = state.game.get(square);
  const isPlayerTurnNow = state.appMode === "analysis" ? true : isHumanTurn();

  if (!isPlayerTurnNow) {
    if (!canQueuePremove()) {
      if (annotationsCleared) render();
      return;
    }
    if (state.premove && !state.premoveSelectFrom) {
      clearPremove();
      render();
      return;
    }
    if (state.premoveSelectFrom) {
      if (square === state.premoveSelectFrom) {
        state.premoveSelectFrom = null;
      } else if (piece && piece.color === state.player2Color) {
        state.premoveSelectFrom = square;
      } else {
        queuePremove(state.premoveSelectFrom, square);
      }
      render();
      return;
    }
    if (piece && piece.color === state.player2Color) {
      state.premoveSelectFrom = square;
      render();
      return;
    }
    if (annotationsCleared) render();
    return;
  }
  state.premoveSelectFrom = null;

  const turn = state.game.turn();

  if (state.selectedDropPiece) {
    if (tryResolveMoveToTarget(square)) {
      render();
      return;
    }
    if (piece && piece.color === turn) {
      selectSquare(square);
      render();
      return;
    }
    clearSelection();
    render();
    return;
  }

  if (state.selectedSquare) {
    if (tryResolveMoveToTarget(square)) {
      render();
      return;
    }

    if (piece && piece.color === turn) {
      selectSquare(square);
      render();
      return;
    }

    clearSelection();
    render();
    return;
  }

  if (piece && piece.color === turn) {
    selectSquare(square);
    render();
    return;
  }

  if (annotationsCleared) {
    render();
  }
}

function beginDrag(event) {
  if (event.button === 2) {
    event.preventDefault();
    const square = event.currentTarget.dataset.square;
    state.annotations.rightDrag = {
      startSquare: square,
      currentSquare: square,
      startX: event.clientX,
      startY: event.clientY,
      currentX: event.clientX,
      currentY: event.clientY,
      moved: false
    };
    window.addEventListener("pointermove", onRightDrawPointerMove);
    window.addEventListener("pointerup", onRightDrawPointerUp);
    window.addEventListener("pointercancel", onRightDrawPointerUp);
    renderBoardAnnotations();
    return;
  }
  if (isEditorLikeMode()) {
    if (event.button !== 0) return;
    const square = event.currentTarget.dataset.square;
    const piece = getEditorPiece(square);
    if (!piece) return;
    state.drag = {
      from: square,
      previewEl: null,
      piece,
      startX: event.clientX,
      startY: event.clientY,
      isDragging: false,
      mode: "editor"
    };
    window.addEventListener("pointermove", onDragPointerMove);
    window.addEventListener("pointerup", onDragPointerUp);
    window.addEventListener("pointercancel", onDragPointerUp);
    return;
  }
  if (state.promotion) return;
  if (!isAtLatestPosition()) {
    if (hasMoveTreeMode()) {
      checkoutAnalysisAtViewPly();
    } else {
      return;
    }
  }
  if (state.appMode !== "analysis" && isGameInteractionLocked()) return;
  if (event.button !== 0) return;
  clearBoardAnnotations();

  const square = event.currentTarget.dataset.square;
  const piece = state.game.get(square);
  if (!piece) return;
  const playerTurnNow = state.appMode === "analysis" ? true : isHumanTurn();
  if (playerTurnNow) {
    if (piece.color !== state.game.turn()) return;
  } else {
    if (!canQueuePremove()) return;
    if (piece.color !== state.player2Color) return;
  }

  state.drag = {
    from: square,
    previewEl: null,
    piece,
    startX: event.clientX,
    startY: event.clientY,
    isDragging: false,
    mode: playerTurnNow ? "move" : "premove"
  };

  window.addEventListener("pointermove", onDragPointerMove);
  window.addEventListener("pointerup", onDragPointerUp);
  window.addEventListener("pointercancel", onDragPointerUp);
}

function startEditorPaletteDrag(event, piece) {
  if (!isEditorLikeMode()) return;
  if (!piece || event.button !== 0) return;
  state.drag = {
    from: null,
    previewEl: null,
    piece: { color: piece.color, type: piece.type },
    startX: event.clientX,
    startY: event.clientY,
    isDragging: false,
    mode: "editor-palette"
  };
  window.addEventListener("pointermove", onDragPointerMove);
  window.addEventListener("pointerup", onDragPointerUp);
  window.addEventListener("pointercancel", onDragPointerUp);
}

function startCrazyhousePocketDrag(event, pieceType, pieceColor = getHumanPlayerColor()) {
  if (!isCurrentCrazyhouseVariantGame() || state.appMode !== "play") return;
  if (event.button !== 0) return;
  const drop = String(pieceType || "").trim().toLowerCase();
  if (!/^[pnbrq]$/.test(drop)) return;
  const color = String(pieceColor || "").trim().toLowerCase();
  if (color !== "w" && color !== "b") return;
  selectCrazyhouseDropPiece(drop, color);
  state.drag = {
    from: null,
    previewEl: null,
    piece: { color, type: drop },
    startX: event.clientX,
    startY: event.clientY,
    isDragging: false,
    mode: "crazyhouse-pocket",
    dropPieceType: drop
  };
  window.addEventListener("pointermove", onDragPointerMove);
  window.addEventListener("pointerup", onDragPointerUp);
  window.addEventListener("pointercancel", onDragPointerUp);
}

function updateDragPreviewPosition(clientX, clientY) {
  if (!state.drag || !state.drag.previewEl) return;
  state.drag.previewEl.style.left = `${clientX}px`;
  state.drag.previewEl.style.top = `${clientY}px`;
}

function endDrag() {
  if (state.drag?.previewEl) {
    state.drag.previewEl.remove();
  }
  state.drag = null;
  window.removeEventListener("pointermove", onDragPointerMove);
  window.removeEventListener("pointerup", onDragPointerUp);
  window.removeEventListener("pointercancel", onDragPointerUp);
}

function endRightDraw() {
  state.annotations.rightDrag = null;
  window.removeEventListener("pointermove", onRightDrawPointerMove);
  window.removeEventListener("pointerup", onRightDrawPointerUp);
  window.removeEventListener("pointercancel", onRightDrawPointerUp);
}

function getSquareAtPoint(clientX, clientY) {
  const elem = document.elementFromPoint(clientX, clientY);
  if (!elem) return null;
  const square = elem.closest(".square");
  return square ? square.dataset.square : null;
}

function onDragPointerMove(event) {
  if (!state.drag) return;
  if (!state.drag.isDragging) {
    const dx = event.clientX - state.drag.startX;
    const dy = event.clientY - state.drag.startY;
    const distance = Math.hypot(dx, dy);
    if (distance < 6) return;

    const preview = document.createElement("img");
    preview.className = "drag-piece-preview";
    preview.src = pieceAssetPath(state.drag.piece);
    preview.alt = `${state.drag.piece.color}${state.drag.piece.type}`;
    document.body.appendChild(preview);
    if (state.drag.mode === "move") {
      // Activate selection only when a true drag begins, not on every click press.
      selectSquare(state.drag.from);
      render();
    }
    state.drag.previewEl = preview;
    state.drag.isDragging = true;
  }
  updateDragPreviewPosition(event.clientX, event.clientY);
}

function onDragPointerUp(event) {
  if (!state.drag) return;
  const dragMode = state.drag.mode;
  const wasDragging = state.drag.isDragging;
  if (!wasDragging) {
    endDrag();
    return;
  }

  state.suppressNextClick = true;
  window.setTimeout(() => {
    state.suppressNextClick = false;
  }, 0);
  const from = state.drag.from;
  const to = getSquareAtPoint(event.clientX, event.clientY);

  let moved = false;
  if (dragMode === "editor") {
    const movedPiece = state.drag.piece;
    if (to && to !== from) {
      if (state.appMode === "tablebase-setup") {
        const targetPiece = getEditorPiece(to);
        setEditorPiece(from, null);
        if (setEditorPiece(to, movedPiece) !== false) {
          moved = true;
        } else {
          setEditorPiece(from, movedPiece);
          if (targetPiece) {
            setEditorPiece(to, targetPiece);
          } else {
            setEditorPiece(to, null);
          }
        }
      } else if (setEditorPiece(to, movedPiece) !== false) {
        setEditorPiece(from, null);
        moved = true;
      }
    } else if (!to) {
      // Dropping outside the board erases the dragged piece.
      setEditorPiece(from, null);
      moved = true;
    }
  } else if (dragMode === "editor-palette") {
    if (to && setEditorPiece(to, state.drag.piece) !== false) {
      moved = true;
    }
  } else if (dragMode === "crazyhouse-pocket") {
    if (to) {
      moved = attemptMove({ drop: state.drag.dropPieceType, to });
    }
  } else if (dragMode === "move") {
    if (to && from === state.selectedSquare) {
      moved = tryResolveMoveToTarget(to);
    }
  } else if (to) {
    moved = queuePremove(from, to);
  }

  endDrag();

  if (!moved && dragMode !== "editor") {
    clearSelection();
  }
  render();
}

function onRightDrawPointerMove(event) {
  const drag = state.annotations.rightDrag;
  if (!drag) return;
  drag.currentX = event.clientX;
  drag.currentY = event.clientY;
  const square = getSquareAtPoint(event.clientX, event.clientY);
  drag.currentSquare = square;
  const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
  if (distance >= 6) {
    drag.moved = true;
  }
  renderBoardAnnotations();
}

function onRightDrawPointerUp(event) {
  const drag = state.annotations.rightDrag;
  if (!drag) return;
  event.preventDefault();
  const endSquare = getSquareAtPoint(event.clientX, event.clientY);
  if (drag.moved && endSquare && endSquare !== drag.startSquare) {
    state.annotations.arrows.push({ from: drag.startSquare, to: endSquare });
  } else {
    if (state.annotations.highlightedSquares.has(drag.startSquare)) {
      state.annotations.highlightedSquares.delete(drag.startSquare);
    } else {
      state.annotations.highlightedSquares.add(drag.startSquare);
    }
  }
  endRightDraw();
  render();
}

function getSquareRect(square) {
  const cell = boardEl.querySelector(`[data-square="${square}"]`);
  return cell ? cell.getBoundingClientRect() : null;
}

function closePromotionMenu() {
  state.promotion = null;
  promotionMenuEl.classList.add("hidden");
  promotionMenuEl.innerHTML = "";
  boardShellEl.classList.remove("promotion-active");
}

function openPromotionMenu(promotionMoves) {
  if (!promotionMoves || promotionMoves.length === 0) return;

  const originMove = promotionMoves[0];
  const squareRect = getSquareRect(originMove.to);
  const boardRect = boardEl.getBoundingClientRect();
  if (!squareRect) return;

  state.promotion = {
    from: originMove.from,
    to: originMove.to,
    color: originMove.color,
    options: promotionMoves
  };

  promotionMenuEl.innerHTML = "";

  const preferredOrder = ["q", "r", "n", "b"];
  const mapByPiece = new Map();
  for (const mv of promotionMoves) {
    mapByPiece.set(mv.promotion, mv);
  }

  for (const pieceType of preferredOrder) {
    const mv = mapByPiece.get(pieceType);
    if (!mv) continue;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "promotion-option";
    btn.title = `Promote to ${pieceType.toUpperCase()}`;

    const img = document.createElement("img");
    img.src = pieceAssetPath({ color: mv.color, type: pieceType });
    img.alt = `${mv.color}${pieceType}`;
    btn.appendChild(img);

    btn.addEventListener("click", () => {
      attemptMove({
        from: mv.from,
        to: mv.to,
        promotion: mv.promotion
      });
      render();
    });

    promotionMenuEl.appendChild(btn);
  }

  const boardLeft = squareRect.left - boardRect.left;
  const boardTop = squareRect.top - boardRect.top;
  const menuWidth = squareRect.width;
  const menuHeight = squareRect.height * 4;
  const isWhitePromoting = originMove.color === "w";
  const preferredTop = isWhitePromoting ? boardTop - squareRect.height * 3 : boardTop;
  const maxTop = Math.max(0, boardRect.height - menuHeight);
  const top = Math.max(0, Math.min(preferredTop, maxTop));
  const maxLeft = Math.max(0, boardRect.width - menuWidth);
  const left = Math.max(0, Math.min(boardLeft, maxLeft));

  promotionMenuEl.style.left = `${left}px`;
  promotionMenuEl.style.top = `${top}px`;
  promotionMenuEl.style.width = `${menuWidth}px`;
  promotionMenuEl.style.height = `${menuHeight}px`;

  boardShellEl.classList.add("promotion-active");
  promotionMenuEl.classList.remove("hidden");
}

function getThreatenedKingSquare() {
  const viewGame = getViewGame();
  if (!viewGame.inCheck()) return null;
  const checkedColor = viewGame.turn(); // side to move is the side in check
  for (const rank of ranks) {
    for (const file of files) {
      const squareName = `${file}${rank}`;
      const piece = viewGame.get(squareName);
      if (piece && piece.type === "k" && piece.color === checkedColor) {
        return squareName;
      }
    }
  }
  return null;
}

function renderBoard() {
  applyBoardTheme();
  boardEl.innerHTML = "";
  if (isEditorLikeMode()) {
    const blackBottomVisible = !!state.boardFlipped;
    const fileOrder = blackBottomVisible ? [...files].reverse() : files;
    const rankOrder = blackBottomVisible ? [...ranks].reverse() : ranks;
    const leftEdgeFile = fileOrder[0];
    const bottomEdgeRank = rankOrder[rankOrder.length - 1];
    for (const rank of rankOrder) {
      for (const file of fileOrder) {
        const squareName = `${file}${rank}`;
        const squareEl = document.createElement("button");
        squareEl.type = "button";
        squareEl.className = "square";
        squareEl.dataset.square = squareName;

        const fileIndex = files.indexOf(file);
        const rankNum = Number(rank);
        const isLight = (fileIndex + rankNum) % 2 === 1;
        squareEl.classList.add(isLight ? "light" : "dark");
        if (state.annotations.highlightedSquares.has(squareName)) {
          squareEl.classList.add("annotated-square");
        }

        const piece = getEditorPiece(squareName);
        if (piece) {
          const pieceImg = document.createElement("img");
          pieceImg.className = "piece";
          pieceImg.draggable = false;
          pieceImg.src = pieceAssetPath(piece);
          pieceImg.alt = `${piece.color}${piece.type}`;
          squareEl.appendChild(pieceImg);
        }

        if (file === leftEdgeFile) {
          const leftLabel = document.createElement("span");
          leftLabel.className = "coord-left-label";
          leftLabel.textContent = rank;
          squareEl.appendChild(leftLabel);
        }
        if (rank === bottomEdgeRank) {
          const bottomLabel = document.createElement("span");
          bottomLabel.className = "coord-bottom-label";
          bottomLabel.textContent = file;
          squareEl.appendChild(bottomLabel);
        }

        squareEl.addEventListener("click", onSquareClick);
        squareEl.addEventListener("pointerdown", beginDrag);
        boardEl.appendChild(squareEl);
      }
    }
    renderBoardAnnotations();
    return;
  }
  const viewGame = getViewGame();
  const history = state.game.history({ verbose: true });
  const viewedMove = state.viewPly > 0 ? history[state.viewPly - 1] : null;
  const { savedResults: boardSavedResults, judgmentByPly: boardJudgmentByPly } = getSavedJudgmentDisplayState(history);
  const viewedJudgmentResult =
    state.viewPly > 0 && boardJudgmentByPly.has(state.viewPly)
      ? boardSavedResults[state.viewPly - 1] || null
      : null;
  const viewedJudgmentMarker =
    state.appMode === "analysis" && state.analysis.showJudgmentMarkers
      ? getBoardAnalysisJudgmentMarker(viewedJudgmentResult?.judgment)
      : null;
  const threatenedKingSquare = getThreatenedKingSquare();
  const isMate = viewGame.isCheckmate();
  const threeCheckCounts = isCurrentThreeCheckVariantGame()
    ? parseThreeCheckReceivedCountsFromFen(viewGame.fen())
    : { w: 0, b: 0 };
  const blackBottomVisible = !!state.boardFlipped;
  const fileOrder = blackBottomVisible ? [...files].reverse() : files;
  const rankOrder = blackBottomVisible ? [...ranks].reverse() : ranks;
  const leftEdgeFile = fileOrder[0];
  const bottomEdgeRank = rankOrder[rankOrder.length - 1];

  for (const rank of rankOrder) {
    for (const file of fileOrder) {
      const squareName = `${file}${rank}`;
      const squareEl = document.createElement("button");
      squareEl.type = "button";
      squareEl.className = "square";
      squareEl.dataset.square = squareName;

      const fileIndex = files.indexOf(file);
      const rankNum = Number(rank);
      const isLight = (fileIndex + rankNum) % 2 === 1;
      squareEl.classList.add(isLight ? "light" : "dark");
      if (isCurrentKingOfTheHillVariantGame() && KING_OF_THE_HILL_SQUARES.has(squareName)) {
        squareEl.classList.add("king-of-the-hill-square");
      }
      if (isCurrentRacingKingsVariantGame() && RACING_KINGS_TARGET_SQUARES.has(squareName)) {
        squareEl.classList.add("racing-kings-target-square");
      }

      if (state.selectedSquare === squareName) {
        squareEl.classList.add("selected");
      }
      if (viewedMove && (viewedMove.from === squareName || viewedMove.to === squareName)) {
        squareEl.classList.add("last-move");
      }
      if (state.premove && (state.premove.from === squareName || state.premove.to === squareName)) {
        squareEl.classList.add("premove-square");
      }
      if (threatenedKingSquare === squareName) {
        squareEl.classList.add(isMate ? "king-in-checkmate" : "king-in-check");
      }
      if (state.legalTargets.has(squareName)) {
        squareEl.classList.add("target");
        if (state.captureTargets.has(squareName)) {
          squareEl.classList.add("capture-target");
        }
      }
      if (state.annotations.highlightedSquares.has(squareName)) {
        squareEl.classList.add("annotated-square");
      }

      const piece = viewGame.get(squareName);
      if (piece) {
        const pieceImg = document.createElement("img");
        pieceImg.className = "piece";
        pieceImg.draggable = false;
        if (state.drag && state.drag.from === squareName) {
          pieceImg.classList.add("drag-origin");
        }
        pieceImg.src = pieceAssetPath(piece);
        pieceImg.alt = `${piece.color}${piece.type}`;
        squareEl.appendChild(pieceImg);

        if (piece.type === "k" && isCurrentThreeCheckVariantGame()) {
          const receivedChecks = Number(threeCheckCounts[piece.color] || 0);
          if (receivedChecks > 0) {
            const badge = document.createElement("span");
            badge.className = "threecheck-counter";
            badge.textContent = String(receivedChecks);
            squareEl.appendChild(badge);
          }
        }

        if (piece.type === "k" && state.resignedColor === piece.color) {
          const surrenderIcon = document.createElement("img");
          surrenderIcon.className = "surrender-marker";
          surrenderIcon.src = "../assets/extras/surrender.png";
          surrenderIcon.alt = "Resigned";
          squareEl.appendChild(surrenderIcon);
        }

        if (viewedJudgmentMarker && viewedMove?.to === squareName) {
          const judgmentBadge = document.createElement("span");
          judgmentBadge.className = `board-analysis-judgment ${viewedJudgmentMarker.className}`;
          judgmentBadge.textContent = viewedJudgmentMarker.text;
          squareEl.appendChild(judgmentBadge);
        }
      }

      if (file === leftEdgeFile) {
        const leftLabel = document.createElement("span");
        leftLabel.className = "coord-left-label";
        leftLabel.textContent = rank;
        squareEl.appendChild(leftLabel);
      }

      if (rank === bottomEdgeRank) {
        const bottomLabel = document.createElement("span");
        bottomLabel.className = "coord-bottom-label";
        bottomLabel.textContent = file;
        squareEl.appendChild(bottomLabel);
      }

      squareEl.addEventListener("click", onSquareClick);
      squareEl.addEventListener("pointerdown", beginDrag);
      boardEl.appendChild(squareEl);
    }
  }
  renderBoardAnnotations();
}

function renderMoveList() {
  if (isEditorLikeMode()) {
    moveListEl.innerHTML = "";
    return;
  }
  const history = state.game.history({ verbose: true });
  const selectedMoveIndex = state.viewPly - 1;
  const displayedNodePath = getAnalysisDisplayedLineNodeIds();
  const { judgmentByPly } = getSavedJudgmentDisplayState(history);

  if (history.length === 0) {
    moveListEl.innerHTML = "";
    return;
  }

  const table = document.createElement("table");
  table.className = "move-table";

  for (let i = 0; i < history.length; i += 2) {
    const row = document.createElement("tr");

    const moveNumCell = document.createElement("td");
    moveNumCell.className = "move-num";
    moveNumCell.textContent = String(Math.floor(i / 2) + 1);
    row.appendChild(moveNumCell);

    const whiteCell = document.createElement("td");
    whiteCell.className = "move-white";
    const whiteMove = history[i];
    if (whiteMove) {
      const whiteWrap = document.createElement("div");
      whiteWrap.className = "move-cell-content";
      const whiteMarker = judgmentByPly.get(i + 1);
      if (whiteMarker) {
        const marker = document.createElement("span");
        marker.className = `move-judgment-marker ${whiteMarker.className}`;
        marker.textContent = whiteMarker.text;
        whiteWrap.appendChild(marker);
      }
      const whiteSan = document.createElement("span");
      whiteSan.className = "move-san";
      whiteSan.textContent = whiteMove.san;
      whiteWrap.appendChild(whiteSan);
      whiteCell.classList.add("move-cell");
      whiteCell.dataset.ply = String(i + 1);
      if (i === selectedMoveIndex) whiteCell.classList.add("move-san-last");

      if (hasMoveTreeMode() && !isTablebaseTrainingActive() && displayedNodePath.length > i + 1) {
        const whiteParentId = displayedNodePath[i];
        const whiteChildId = displayedNodePath[i + 1];
        const whiteParent = getAnalysisTreeNode(whiteParentId);
        if (whiteParent && Array.isArray(whiteParent.children) && whiteParent.children.length > 1) {
          const chip = document.createElement("span");
          chip.className = "variation-chip";
          chip.dataset.parentId = whiteParentId;
          chip.dataset.activeChildId = whiteChildId;
          chip.textContent = `+${whiteParent.children.length - 1}`;
          whiteWrap.appendChild(chip);
        }
      }
      whiteCell.appendChild(whiteWrap);
    }
    row.appendChild(whiteCell);

    const blackCell = document.createElement("td");
    blackCell.className = "move-black";
    const blackMove = history[i + 1];
    if (blackMove) {
      const blackWrap = document.createElement("div");
      blackWrap.className = "move-cell-content";
      const blackMarker = judgmentByPly.get(i + 2);
      if (blackMarker) {
        const marker = document.createElement("span");
        marker.className = `move-judgment-marker ${blackMarker.className}`;
        marker.textContent = blackMarker.text;
        blackWrap.appendChild(marker);
      }
      const blackSan = document.createElement("span");
      blackSan.className = "move-san";
      blackSan.textContent = blackMove.san;
      blackWrap.appendChild(blackSan);
      blackCell.classList.add("move-cell");
      blackCell.dataset.ply = String(i + 2);
      if (i + 1 === selectedMoveIndex) blackCell.classList.add("move-san-last");

      if (hasMoveTreeMode() && !isTablebaseTrainingActive() && displayedNodePath.length > i + 2) {
        const blackParentId = displayedNodePath[i + 1];
        const blackChildId = displayedNodePath[i + 2];
        const blackParent = getAnalysisTreeNode(blackParentId);
        if (blackParent && Array.isArray(blackParent.children) && blackParent.children.length > 1) {
          const chip = document.createElement("span");
          chip.className = "variation-chip";
          chip.dataset.parentId = blackParentId;
          chip.dataset.activeChildId = blackChildId;
          chip.textContent = `+${blackParent.children.length - 1}`;
          blackWrap.appendChild(chip);
        }
      }
      blackCell.appendChild(blackWrap);
    }
    row.appendChild(blackCell);

    table.appendChild(row);
  }

  moveListEl.innerHTML = "";
  moveListEl.appendChild(table);
  const selectedEl = moveListEl.querySelector(".move-san-last");
  if (selectedEl && selectedEl instanceof HTMLElement) {
    selectedEl.scrollIntoView({ block: "nearest", inline: "nearest" });
  } else {
    moveListEl.scrollTop = moveListEl.scrollHeight;
  }
}

function getGameInfoMessage() {
  if (state.appMode === "tablebase-setup") {
    return "Tablebase setup: place up to 7 pieces, including both kings.";
  }
  if (state.appMode === "tablebase") {
    if (isTablebaseTrainingActive()) {
      if (isTablebaseTrainingFinished()) {
        return state.tablebase.training.lastResult || "Training finished.";
      }
      if (state.tablebase.training.pendingAutoReply) {
        return "Tablebase is making its reply.";
      }
      const side = state.tablebase.training.config.userColor === "b" ? "Black" : "White";
      return `Training mode: you are playing ${side}.`;
    }
    if (state.tablebase.session.fetchStatus === "loading") {
      return "Fetching tablebase result...";
    }
    if (state.tablebase.session.fetchStatus === "error") {
      return "Tablebase lookup failed. You can still play moves.";
    }
    if (getLatestPly() === 0) {
      return "Tablebase ready. Play either side and results update after each move.";
    }
    return null;
  }
  if (state.appMode === "puzzle") {
    return puzzleModule ? puzzleModule.getInfoMessage() : "Solve the current puzzle.";
  }
  if (isOnlineGameActive()) {
    const drawOffer = getOnlineOfferState("draw");
    const takebackOffer = getOnlineOfferState("takeback");
    if (state.online.finished) {
      const status = String(state.online.finishStatus || "").toLowerCase();
      const winner = state.online.finishWinner;
      if (status === "resign") {
        if (winner === "w") return "Black resigned. White wins.";
        if (winner === "b") return "White resigned. Black wins.";
        return "Game ended by resignation.";
      }
      if (status === "outoftime" || status === "timeout") {
        if (winner === "w") return "Black lost on time.";
        if (winner === "b") return "White lost on time.";
        return "Game ended on time.";
      }
      if (status === "mate") {
        if (winner === "w") return "White wins by checkmate.";
        if (winner === "b") return "Black wins by checkmate.";
        return "Game ended by checkmate.";
      }
      if (status === "stalemate") return "Draw by stalemate.";
      if (["draw", "repetition", "50moves", "insufficient", "variantend"].includes(status)) {
        return "Game drawn.";
      }
      if (status === "aborted") return "Game aborted.";
      return "Game finished.";
    }
    if (getLatestPly() === 0) {
      const side = state.player2Color === "w" ? "White" : "Black";
      return `Online game started. You play as ${side}.`;
    }
    if (takebackOffer.opponentPending) return "Opponent requested a takeback.";
    if (drawOffer.opponentPending) return "Opponent offered a draw.";
    if (takebackOffer.ownPending) return "Takeback request pending.";
    if (drawOffer.ownPending) return "Draw offer pending.";
    return null;
  }

  if (state.resignedColor === "w") {
    return "White resigned. Black wins.";
  }
  if (state.resignedColor === "b") {
    return "Black resigned. White wins.";
  }

  if (state.timeoutLoser === "white") {
    return "White lost on time.";
  }
  if (state.timeoutLoser === "black") {
    return "Black lost on time.";
  }

  const fairyResult = getFairyVariantResultInfo();
  if (fairyResult?.message) {
    return fairyResult.message;
  }

  if (getLatestPly() === 0) {
    const side = state.player2Color === "w" ? "White" : "Black";
    return `You play as ${side}. Make your move!`;
  }

  if (state.game.isCheckmate()) {
    const winner = state.game.turn() === "w" ? "Black" : "White";
    return `${winner} wins by checkmate.`;
  }

  if (state.game.isStalemate()) {
    return "Draw by stalemate.";
  }

  if (state.game.isInsufficientMaterial()) {
    return "Draw by insufficient material.";
  }

  if (state.game.isThreefoldRepetition()) {
    return "Draw by threefold repetition.";
  }

  if (typeof state.game.isDrawByFiftyMoves === "function" && state.game.isDrawByFiftyMoves()) {
    return "Draw by 50-move rule.";
  }

  return null;
}

function getFinishedGameResultInfo() {
  if (state.resignedColor === "w") {
    return { result: "0-1", termination: "White resigned", token: "resign-black-win" };
  }
  if (state.resignedColor === "b") {
    return { result: "1-0", termination: "Black resigned", token: "resign-white-win" };
  }
  if (state.timeoutLoser === "white") {
    return { result: "0-1", termination: "White lost on time", token: "time-black-win" };
  }
  if (state.timeoutLoser === "black") {
    return { result: "1-0", termination: "Black lost on time", token: "time-white-win" };
  }
  const fairyResult = getFairyVariantResultInfo();
  if (fairyResult) {
    return {
      result: fairyResult.result,
      termination: fairyResult.termination,
      token: fairyResult.token
    };
  }
  if (state.game.isCheckmate()) {
    const whiteWon = state.game.turn() === "b";
    return {
      result: whiteWon ? "1-0" : "0-1",
      termination: "Checkmate",
      token: whiteWon ? "mate-white-win" : "mate-black-win"
    };
  }
  if (state.game.isStalemate()) {
    return { result: "1/2-1/2", termination: "Stalemate", token: "draw-stalemate" };
  }
  if (state.game.isInsufficientMaterial()) {
    return { result: "1/2-1/2", termination: "Insufficient material", token: "draw-insufficient" };
  }
  if (state.game.isThreefoldRepetition()) {
    return { result: "1/2-1/2", termination: "Threefold repetition", token: "draw-threefold" };
  }
  if (typeof state.game.isDrawByFiftyMoves === "function" && state.game.isDrawByFiftyMoves()) {
    return { result: "1/2-1/2", termination: "50-move rule", token: "draw-fifty" };
  }
  if (state.game.isDraw()) {
    return { result: "1/2-1/2", termination: "Draw", token: "draw" };
  }
  return { result: "*", termination: "Unknown", token: "unknown" };
}

function buildFairyVariantPgnForAutoSave() {
  const history = state.game.history({ verbose: true });
  const info = getFinishedGameResultInfo();
  const playerIsWhite = state.player2Color === "w";
  const playerName = getLocalHumanPlayerName();
  const engineName = state.engineRuntime.displayName || state.engineRuntime.idName || getSelectedEngineRecord()?.name || "Engine";
  const whiteName = playerIsWhite ? playerName : engineName;
  const blackName = playerIsWhite ? engineName : playerName;
  const date = new Date();
  const dateTag = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
  const variantDisplayName = getCurrentVariantDisplayName();
  const defaultFen = getDefaultStartFenForVariant(state.currentVariant);
  const tags = {
    Event: "Offline Variant Game",
    Site: "Local",
    Date: dateTag,
    White: whiteName,
    Black: blackName,
    Result: info.result,
    Termination: info.termination,
    UserName: playerName,
    UserSide: playerIsWhite ? "white" : "black",
    Variant: variantDisplayName,
    VariantName: variantDisplayName,
    SetUp: "1",
    FEN: state.currentGameStartFen || state.playStartFen || defaultFen,
    FinalFEN: state.game.fen(),
    VariantMoves: history.map((mv) => uciFromMove(mv)).filter(Boolean).join(" "),
    TimeControl: state.isUnlimitedTime
      ? "-"
      : `${Math.max(0, Math.floor(selectedInitialClockMs / 1000))}+${Math.max(
          0,
          Math.floor(selectedIncrementMs / 1000)
        )}`
  };
  const tagLines = Object.entries(tags).map(
    ([key, value]) => `[${key} "${String(value).replace(/\\/g, "\\\\").replace(/"/g, "\\\"")}"]`
  );
  const movetext = buildMainlineSanFromHistory(history);
  return {
    pgn: `${tagLines.join("\n")}\n\n${movetext} ${info.result}`.trim(),
    resultInfo: info
  };
}

function buildCurrentGamePgnForAutoSave() {
  if (isCurrentFairyVariantGame()) {
    return buildFairyVariantPgnForAutoSave();
  }
  const snapshot = cloneCurrentGame();
  const info = getFinishedGameResultInfo();
  const playerIsWhite = state.player2Color === "w";
  const playerName = getLocalHumanPlayerName();
  const engineName = state.engineRuntime.displayName || state.engineRuntime.idName || getSelectedEngineRecord()?.name || "Engine";
  const whiteName = playerIsWhite ? playerName : engineName;
  const blackName = playerIsWhite ? engineName : playerName;
  const date = new Date();
  const dateTag = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
  const defaultFen = new Chess().fen();

  snapshot.header("Event", "Offline Game");
  snapshot.header("Site", "Local");
  snapshot.header("Date", dateTag);
  snapshot.header("White", whiteName);
  snapshot.header("Black", blackName);
  snapshot.header("Result", info.result);
  snapshot.header("Termination", info.termination);
  snapshot.header("UserName", playerName);
  snapshot.header("UserSide", playerIsWhite ? "white" : "black");
  snapshot.header(
    "TimeControl",
    state.isUnlimitedTime
      ? "-"
      : `${Math.max(0, Math.floor(selectedInitialClockMs / 1000))}+${Math.max(
          0,
          Math.floor(selectedIncrementMs / 1000)
        )}`
  );
  snapshot.header("FinalFEN", snapshot.fen());
  if (state.currentGameStartFen && state.currentGameStartFen !== defaultFen) {
    snapshot.header("SetUp", "1");
    snapshot.header("FEN", state.currentGameStartFen);
  }

  return { pgn: snapshot.pgn({ maxWidth: 0 }), resultInfo: info };
}

async function maybeAutoSaveFinishedGame() {
  if (state.appMode !== "play") return;
  if (isOnlineGameActive()) return;
  if (isCurrentCrazyhouseVariantGame()) return;
  if (!isGameInteractionLocked()) return;
  if (getLatestPly() === 0) return;
  if (state.autoSave.inFlight) return;

  const info = getFinishedGameResultInfo();
  const saveKey = `${state.currentGameStartFen || ""}|${getLatestPly()}|${info.token}|${info.result}`;
  if (state.autoSave.lastSavedKey === saveKey) return;

  state.autoSave.inFlight = true;
  try {
    const payload = buildCurrentGamePgnForAutoSave();
    const playerSide = state.player2Color === "w" ? "white" : "black";
    const res = await ipcRenderer.invoke("games:autoSavePgn", {
      pgn: payload.pgn,
      result: payload.resultInfo.token,
      playerSide
    });
    if (!res?.ok) {
      console.error("Auto-save failed:", res?.error || "unknown error");
      return;
    }
    state.autoSave.lastSavedKey = saveKey;
  } catch (err) {
    console.error("Auto-save failed:", err);
  } finally {
    state.autoSave.inFlight = false;
  }
}

function maybeHandleBotTournamentHumanGameCompletion() {
  if (!isBotTournamentHumanMode()) return;
  if (!isGameInteractionLocked()) return;
  if (state.botTournamentHumanGame.resultReported) return;
  const info = getFinishedGameResultInfo();
  if (!info?.result || info.result === "*") return;
  state.botTournamentHumanGame.resultReported = true;
  ensureBotTournamentModule().completeHumanMatch({
    tournamentId: state.botTournamentHumanGame.tournamentId,
    pairingKey: state.botTournamentHumanGame.pairingKey,
    result: info.result
  });
}

function renderInfoBanner() {
  const message = getGameInfoMessage();
  if (!message) {
    infoBannerEl.classList.add("hidden");
    infoTextEl.textContent = "";
    return;
  }
  infoTextEl.textContent = message;
  infoBannerEl.classList.remove("hidden");
}

function render() {
  updateTablebaseTrainingUi();
  updateCrazyhouseUi();
  renderBoard();
  renderMoveList();
  if (isEditorLikeMode()) {
    updateEditorToolSelectionUi();
  }
  renderClocks();
  renderMaterialImbalance();
  renderOnlineChatPanel();
  renderAnalysisEvalBar();
  if (state.appMode === "analysis") {
    renderAnalysisSidePanel();
  } else if (state.appMode === "tablebase") {
    renderTablebaseSidePanel();
  } else if (sidePanelEl) {
    sidePanelEl.style.height = "";
  }
  renderInfoBanner();
  renderPlayerBars();
  updateRematchButtonState();
  updatePlayerActionButtonStates();
  updateHomeProfileMenuItems();
  state.lastRenderedGamePly = getLatestPly();
  if (state.appMode === "analysis") {
    requestAnalysisForCurrentPosition();
  } else if (state.appMode === "play") {
    if (!isBotTournamentSpectatorMode()) {
      maybeRequestEngineMove();
      maybePlayGameEndNotify();
      maybeAutoSaveFinishedGame();
      maybeHandleBotTournamentHumanGameCompletion();
    }
  } else if (state.appMode === "tablebase") {
    maybePlayGameEndNotify();
  } else if (state.appMode === "puzzle") {
    // Puzzle mode is driven entirely by the puzzle module.
  }
}

function resetGame() {
  const variantDefaultFen = getDefaultStartFenForVariant(state.currentVariant);
  state.game = createPlayModeGame(variantDefaultFen);
  if (state.appMode === "play") {
    const defaultFen = variantDefaultFen;
    state.currentGameStartFen = defaultFen;
    if (state.playStartFen && state.playStartFen !== defaultFen) {
      try {
        state.game = createPlayModeGame(state.playStartFen);
        state.currentGameStartFen = state.playStartFen;
      } catch (_) {
        state.playStartFen = defaultFen;
        state.currentVariant = "standard";
        state.game = new Chess();
        state.currentGameStartFen = new Chess().fen();
      }
    }
  } else {
    state.currentVariant = "standard";
    state.game = new Chess();
    state.currentGameStartFen = new Chess().fen();
  }
  state.viewPly = 0;
  state.analysisPgnMeta = { tags: {}, rootComments: [] };
  markAnalysisPgnDirty();
  if (state.appMode === "analysis") {
    buildAnalysisTreeFromGame();
  } else {
    state.analysisTree = null;
  }
  state.clocks.whiteMs = selectedInitialClockMs;
  state.clocks.blackMs = selectedInitialClockMs;
  state.clocks.lastTickTs = null;
  state.sound.lowTimePlayed.w = false;
  state.sound.lowTimePlayed.b = false;
  state.sound.gameEndKey = "";
  state.timeoutLoser = null;
  state.resignedColor = null;
  clearResignConfirmation();
  clearPremove();
  clearBoardAnnotations();
  state.engineRuntime.thinking = false;
  state.engineRuntime.searchKind = null;
  state.autoSave.inFlight = false;
  state.autoSave.lastSavedKey = "";
  closePromotionMenu();
  clearSelection();
  if (state.engineRuntime.connected) {
    if (state.appMode === "play") {
      ipcRenderer.invoke("engine:send", "ucinewgame");
    }
    ipcRenderer.invoke("engine:send", "isready");
  }
  render();
}

function applySelectedTimeControlFromCard(cardEl) {
  if (!cardEl) return;
  if (cardEl.dataset.mode === "unlimited") {
    state.isUnlimitedTime = true;
    selectedInitialClockMs = INITIAL_CLOCK_MS;
    selectedIncrementMs = 0;
    return;
  }
  state.isUnlimitedTime = false;
  const baseMin = Number(cardEl.dataset.baseMin);
  const incSec = Number(cardEl.dataset.incSec);
  if (!Number.isFinite(baseMin) || baseMin <= 0) return;
  selectedInitialClockMs = Math.round(baseMin * 60 * 1000);
  selectedIncrementMs = Number.isFinite(incSec) && incSec > 0 ? Math.round(incSec * 1000) : 0;
}

function saveEngineRegistry() {
  try {
    localStorage.setItem(ENGINES_STORAGE_KEY, JSON.stringify(state.engines));
    localStorage.setItem(SELECTED_ENGINE_STORAGE_KEY, state.selectedEngine || "");
    localStorage.setItem(DEFAULT_ENGINE_STORAGE_KEY, state.defaultEngine || "");
  } catch (_) {
    // ignore storage errors
  }
}

function loadEngineRegistry() {
  try {
    const raw = localStorage.getItem(ENGINES_STORAGE_KEY);
    const selectedRaw = localStorage.getItem(SELECTED_ENGINE_STORAGE_KEY);
    const defaultRaw = localStorage.getItem(DEFAULT_ENGINE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) {
      state.engines = parsed
        .filter((e) => e && typeof e.id === "string" && typeof e.name === "string" && typeof e.path === "string")
        .map((e) => ({ id: e.id, name: e.name, path: e.path }));
    }
    if (typeof selectedRaw === "string") {
      state.selectedEngine = selectedRaw;
    }
    if (typeof defaultRaw === "string") {
      state.defaultEngine = defaultRaw;
    }
  } catch (_) {
    state.engines = [];
    state.selectedEngine = "";
    state.defaultEngine = "";
  }
}

async function syncBuiltinEngines() {
  try {
    const res = await ipcRenderer.invoke("engine:listBuiltin");
    if (!res?.ok || !Array.isArray(res.items)) return;
    let changed = false;
    for (const item of res.items) {
      if (!item || typeof item.id !== "string" || typeof item.name !== "string" || typeof item.path !== "string") {
        continue;
      }
      const existingIndex = state.engines.findIndex((e) => e.id === item.id || e.path === item.path);
      if (existingIndex >= 0) {
        const existing = state.engines[existingIndex];
        if (existing.id !== item.id || existing.name !== item.name || existing.path !== item.path) {
          state.engines[existingIndex] = { id: item.id, name: item.name, path: item.path };
          changed = true;
        }
      } else {
        state.engines.unshift({ id: item.id, name: item.name, path: item.path });
        changed = true;
      }
    }
    normalizeDefaultEngine();
    if (!state.defaultEngine) {
      const stockfish = state.engines.find((e) => e.id === "builtin-stockfish");
      if (stockfish) {
        state.defaultEngine = stockfish.id;
        changed = true;
      }
    }
    if (!state.selectedEngine && state.defaultEngine) {
      state.selectedEngine = state.defaultEngine;
      changed = true;
    }
    if (changed) {
      saveEngineRegistry();
    }
  } catch (_) {
    // ignore builtin engine sync failures
  }
}

function normalizeDefaultEngine() {
  if (state.engines.length === 0) {
    state.defaultEngine = "";
    return;
  }
  const defaultExists = state.engines.some((e) => e.id === state.defaultEngine);
  if (defaultExists) return;
  if (state.engines.length === 1) {
    state.defaultEngine = state.engines[0].id;
    return;
  }
  if (!state.defaultEngine) {
    state.defaultEngine = state.engines[0].id;
  }
}

function getDefaultEngineRecord() {
  return state.engines.find((e) => e.id === state.defaultEngine) || null;
}

function formatEngineName(engine) {
  if (!engine) return "";
  return engine.id === state.defaultEngine ? `${engine.name} (default)` : engine.name;
}

function renderEngineRegistry() {
  normalizeDefaultEngine();
  engineSelectEl.innerHTML = "";
  if (state.engines.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No engines loaded";
    engineSelectEl.appendChild(option);
    engineSelectEl.value = "";
    enginePathEl.textContent = "No engine selected.";
    btnSetDefaultEngineEl.disabled = true;
    btnRenameEngineEl.disabled = true;
    btnRemoveEngineEl.disabled = true;
    updateEngineControlButtonStates();
    renderSetupEngineDisplay();
    return;
  }

  for (const engine of state.engines) {
    const option = document.createElement("option");
    option.value = engine.id;
    option.textContent = formatEngineName(engine);
    engineSelectEl.appendChild(option);
  }

  const hasSelected = state.engines.some((e) => e.id === state.selectedEngine);
  if (!hasSelected) {
    state.selectedEngine = state.engines[0].id;
  }
  engineSelectEl.value = state.selectedEngine;

  const selected = state.engines.find((e) => e.id === state.selectedEngine);
  enginePathEl.textContent = selected ? selected.path : "No engine selected.";
  btnSetDefaultEngineEl.disabled = !selected;
  btnRenameEngineEl.disabled = !selected;
  btnRemoveEngineEl.disabled = !selected;
  updateEngineControlButtonStates();
  renderSetupEngineDisplay();
}

function makeEngineNameFromPath(filePath) {
  const normalized = String(filePath || "");
  const slashIdx = Math.max(normalized.lastIndexOf("\\"), normalized.lastIndexOf("/"));
  const base = slashIdx >= 0 ? normalized.slice(slashIdx + 1) : normalized;
  const dotIdx = base.lastIndexOf(".");
  return dotIdx > 0 ? base.slice(0, dotIdx) : base;
}

async function addEngineFromFilePicker() {
  const picked = await ipcRenderer.invoke("file:pickFile", {
    filters: [{ name: "Executables", extensions: ["exe"] }, { name: "All Files", extensions: ["*"] }]
  });
  if (!picked?.filePath) return;

  const existing = state.engines.find((e) => e.path.toLowerCase() === picked.filePath.toLowerCase());
  if (existing) {
    state.selectedEngine = existing.id;
    renderEngineRegistry();
    saveEngineRegistry();
    return;
  }

  const engine = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    name: makeEngineNameFromPath(picked.filePath),
    path: picked.filePath
  };
  state.engines.push(engine);
  if (state.engines.length === 1) {
    state.defaultEngine = engine.id;
  }
  state.selectedEngine = engine.id;
  renderEngineRegistry();
  saveEngineRegistry();
}

function renameSelectedEngine() {
  const selected = getSelectedEngineRecord();
  if (!selected) {
    setEngineStatus("No engine selected.", true);
    return;
  }
  renameEngineInputEl.value = selected.name;
  renameEngineModalEl.classList.remove("hidden");
  renameEngineInputEl.focus();
  renameEngineInputEl.select();
}

function closeRenameEngineModal() {
  renameEngineModalEl.classList.add("hidden");
}

function saveRenamedEngine() {
  const selected = getSelectedEngineRecord();
  if (!selected) {
    setEngineStatus("No engine selected.", true);
    closeRenameEngineModal();
    return;
  }
  const nextName = String(renameEngineInputEl.value || "").trim();
  if (!nextName) {
    setEngineStatus("Engine name cannot be empty.", true);
    return;
  }
  if (nextName.length > 64) {
    setEngineStatus("Engine name must be 64 characters or fewer.", true);
    return;
  }
  selected.name = nextName;
  closeRenameEngineModal();
  renderEngineRegistry();
  render();
  saveEngineRegistry();
}

function setSelectedEngineAsDefault() {
  const selected = getSelectedEngineRecord();
  if (!selected) {
    setEngineStatus("No engine selected.", true);
    return;
  }
  state.defaultEngine = selected.id;
  renderEngineRegistry();
  render();
  saveEngineRegistry();
  setEngineStatus(`Default engine set: ${selected.name}`);
}

function getSelectedEngineRecord() {
  return state.engines.find((e) => e.id === state.selectedEngine) || null;
}

function getActiveEngineRecord() {
  if (state.engineRuntime.connectedEngineId) {
    return state.engines.find((e) => e.id === state.engineRuntime.connectedEngineId) || null;
  }
  return getSelectedEngineRecord();
}

function renderSetupEngineDisplay() {
  if (!setupEngineDisplayEl) return;
  const selected = getSelectedEngineRecord();
  setupEngineDisplayEl.textContent = selected
    ? formatEngineName(selected)
    : state.engineRuntime.idName || "No engine loaded";
}

function updateEngineControlButtonStates() {
  const hasSelectedEngine = !!getSelectedEngineRecord();
  const isConnected = state.engineRuntime.connected;
  btnEngineConnectEl.disabled = !hasSelectedEngine;
  btnEngineDisconnectEl.disabled = !isConnected;
  btnEngineApplyEl.disabled = !isConnected;
}

function setEngineStatus(text, isError = false) {
  engineStatusEl.textContent = text;
  engineStatusEl.style.color = isError ? "#d88080" : "#9fd08a";
}

function parseUciOptionLine(line) {
  // Example: option name Threads type spin default 1 min 1 max 1024
  const m = line.match(/^option name (.+?) type (\w+)(.*)$/);
  if (!m) return null;
  const name = m[1].trim();
  const type = m[2].trim();
  const tail = m[3] || "";
  const extract = (key) => {
    const r = new RegExp(`\\b${key}\\s+(.+?)(?=\\s+\\b(?:default|min|max|var)\\b|$)`);
    const found = tail.match(r);
    return found ? found[1].trim() : null;
  };
  const defaultValue = extract("default");
  const minValue = extract("min");
  const maxValue = extract("max");
  return { name, type, defaultValue, minValue, maxValue };
}

function clampNumber(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function nearestPow2Exponent(value) {
  const safe = Math.max(1, Number(value));
  return Math.round(Math.log2(safe));
}

function resetEngineRuntimeState() {
  if (state.engineRuntime.playStopTimerId !== null) {
    window.clearTimeout(state.engineRuntime.playStopTimerId);
  }
  state.engineRuntime.connected = false;
  state.engineRuntime.connectedEngineId = "";
  state.engineRuntime.ready = false;
  state.engineRuntime.idName = "";
  state.engineRuntime.displayName = "";
  state.engineRuntime.stdoutBuffer = "";
  state.engineRuntime.options = new Map();
  state.engineRuntime.thinking = false;
  state.engineRuntime.searchKind = null;
  state.engineRuntime.playStopTimerId = null;
  clearAnalysisState();
}

function feedEngineStdout(text) {
  state.engineRuntime.stdoutBuffer += text;
  const lines = state.engineRuntime.stdoutBuffer.split(/\r?\n/);
  state.engineRuntime.stdoutBuffer = lines.pop() || "";

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (line.startsWith("id name ")) {
      state.engineRuntime.idName = line.slice("id name ".length).trim();
      if (state.engineRuntime.connected && !state.engineRuntime.ready) {
        setEngineStatus(`Connected: ${state.engineRuntime.idName}`);
      }
      continue;
    }

    if (line.startsWith("option name ")) {
      const parsed = parseUciOptionLine(line);
      if (parsed) {
        state.engineRuntime.options.set(parsed.name, parsed);
      }
      continue;
    }

    if (line === "uciok") {
      ipcRenderer.invoke("engine:send", "isready");
      continue;
    }

    if (line === "readyok") {
      state.engineRuntime.ready = true;
      state.engineRuntime.thinking = false;
      setEngineStatus(`Ready: ${state.engineRuntime.idName || "Engine"}`);
      updateUciControlsFromOptions();
      if (state.appMode === "analysis") {
        requestAnalysisForCurrentPosition(true);
      } else {
        maybeRequestEngineMove();
      }
      continue;
    }

    if (line.startsWith("info ")) {
      if (state.engineRuntime.searchKind === "computer-analysis") {
        const run = computerAnalysisBridge;
        const currentItem =
          run.currentIndex >= 0 && run.currentIndex < run.queue.length
            ? run.queue[run.currentIndex]
            : null;
        const perspectiveTurn =
          run.analyzingBaseline
            ? run.startTurn
            : currentItem?.turn === "b"
              ? "b"
              : "w";
        const parsedInfo = parseAnalysisInfoLine(line, perspectiveTurn);
        if (parsedInfo && parsedInfo.multipv === 1) {
          run.currentEval = parsedInfo;
        }
      }
      if (state.appMode === "analysis") {
        const parsedInfo = parseAnalysisInfoLine(line);
        if (parsedInfo) {
          state.analysis.lines.set(parsedInfo.multipv, parsedInfo);
          if (parsedInfo.multipv === 1) {
            state.analysis.eval = parsedInfo;
            state.analysis.depth = parsedInfo.depth;
            if (parsedInfo.hashPermill != null) {
              state.analysis.hashPermill = parsedInfo.hashPermill;
            }
          }
          renderAnalysisEvalBar();
          renderAnalysisSidePanel();
        }
      }
      continue;
    }

    if (line.startsWith("bestmove ")) {
      if (state.engineRuntime.playStopTimerId !== null) {
        window.clearTimeout(state.engineRuntime.playStopTimerId);
        state.engineRuntime.playStopTimerId = null;
      }
      state.engineRuntime.thinking = false;
      const best = line.split(/\s+/)[1];
      const searchKind = state.engineRuntime.searchKind;
      if (searchKind === "computer-analysis") {
        const run = computerAnalysisBridge;
        if (run.stopTimerId !== null) {
          window.clearTimeout(run.stopTimerId);
          run.stopTimerId = null;
        }
        if (run.timeoutId !== null) {
          window.clearTimeout(run.timeoutId);
          run.timeoutId = null;
        }
        if (run.running && run.analyzingBaseline) {
          run.baselineEval = cloneEvalObject(run.currentEval) || makeFallbackComputerAnalysisEval(run.startFen);
          run.baselineBestMoveUci =
            typeof run.currentEval?.pv === "string" && run.currentEval.pv.trim()
              ? String(run.currentEval.pv.trim().split(/\s+/)[0] || "")
              : "";
          run.analyzingBaseline = false;
        } else if (run.running && run.currentIndex >= 0 && run.currentIndex < run.queue.length) {
          const queueItem = run.queue[run.currentIndex];
          const beforeEval =
            run.results.length > 0
              ? run.results[run.results.length - 1].afterEval
              : run.baselineEval || makeFallbackComputerAnalysisEval(queueItem.beforeFen || run.startFen);
          const previousSameSideResult = [...run.results].reverse().find((entry) => entry?.side === queueItem.side) || null;
          const preMoveBestMoveUci =
            run.results.length > 0
              ? String(run.results[run.results.length - 1].bestMoveUci || "").trim()
              : String(run.baselineBestMoveUci || "").trim();
          const preMoveBestPv =
            run.results.length > 0
              ? String(run.results[run.results.length - 1].bestLinePv || "").trim()
              : String(run.baselineEval?.pv || "").trim();
          run.results.push(
            makeComputerAnalysisResultEntry(
              queueItem,
              run.currentEval,
              beforeEval,
              previousSameSideResult?.afterEval || null,
              preMoveBestMoveUci,
              preMoveBestPv,
              run.variantKey
            )
          );
        }
        run.currentEval = null;
        state.engineRuntime.searchKind = null;
        notifyComputerAnalysisBridgeProgress();
        window.setTimeout(() => {
          runNextComputerAnalysisPosition();
        }, 0);
        continue;
      }
      if (searchKind === "analysis" || state.appMode === "analysis") {
        state.engineRuntime.searchKind = "analysis";
        state.analysis.searching = false;
        render();
        continue;
      }
      state.engineRuntime.searchKind = null;
      if (best && best !== "(none)") {
        const applied = applyEngineBestMove(best);
        if (!applied) {
          render();
        } else {
          // Rarely the immediate paint can be skipped under heavy input timing.
          // Queue one more repaint to keep board state and clocks visually in sync.
          window.requestAnimationFrame(() => render());
        }
      }
      continue;
    }
  }
}

function setNumericControl(controlEl, opt) {
  if (!opt) {
    controlEl.disabled = true;
    delete controlEl.dataset.mode;
    delete controlEl.dataset.initialized;
    return;
  }
  controlEl.disabled = false;
  let min = Number(opt.minValue);
  let max = Number(opt.maxValue);
  const def = Number(opt.defaultValue);
  if (!Number.isFinite(min)) min = Number(controlEl.min || 0);
  if (!Number.isFinite(max)) max = Number(controlEl.max || min || 1);
  if (controlEl === optThreadsEl) {
    max = Math.min(max, UCI_THREADS_SAFE_MAX, DEVICE_THREADS_CAP);
  }
  if (controlEl === optMultiPvEl) {
    max = Math.min(max, UCI_MULTIPV_SAFE_MAX);
  }
  if (max < min) max = min;
  if (Number.isFinite(min)) controlEl.min = String(min);
  if (Number.isFinite(max)) controlEl.max = String(max);
  controlEl.step = "1";
  controlEl.dataset.mode = "linear";
  const current = Number(controlEl.value);
  const hasCurrent = controlEl.dataset.initialized === "1" && Number.isFinite(current);
  if (hasCurrent) {
    const clamped = Math.max(min, Math.min(max, current));
    controlEl.value = String(clamped);
  } else if (Number.isFinite(def)) {
    const clamped = Math.max(min, Math.min(max, def));
    controlEl.value = String(clamped);
  } else {
    const clamped = Math.max(min, Math.min(max, Number.isFinite(current) ? current : min));
    controlEl.value = String(clamped);
  }
  controlEl.dataset.initialized = "1";
}

function setHashControlFromOption(opt) {
  if (!opt) {
    optHashEl.disabled = true;
    delete optHashEl.dataset.mode;
    delete optHashEl.dataset.initialized;
    return;
  }
  optHashEl.disabled = false;
  let minRaw = Number(opt.minValue);
  let maxRaw = Number(opt.maxValue);
  let defRaw = Number(opt.defaultValue);

  if (!Number.isFinite(minRaw) || minRaw < 1) minRaw = 1;
  if (!Number.isFinite(maxRaw) || maxRaw < minRaw) maxRaw = Math.max(minRaw, 16);
  maxRaw = Math.min(maxRaw, UCI_HASH_SAFE_MAX_MB);
  if (maxRaw < minRaw) maxRaw = minRaw;
  if (!Number.isFinite(defRaw) || defRaw < minRaw || defRaw > maxRaw) defRaw = minRaw;

  let minExp = Math.ceil(Math.log2(minRaw));
  let maxExp = Math.floor(Math.log2(maxRaw));
  if (!Number.isFinite(minExp)) minExp = 0;
  if (!Number.isFinite(maxExp)) maxExp = minExp;
  if (maxExp < minExp) maxExp = minExp;

  const defExp = clampNumber(nearestPow2Exponent(defRaw), minExp, maxExp);
  const preferredExp = clampNumber(nearestPow2Exponent(64), minExp, maxExp);
  optHashEl.min = String(minExp);
  optHashEl.max = String(maxExp);
  optHashEl.step = "1";
  const currentHashValue = getSliderNumericValue(optHashEl);
  const hasCurrent = optHashEl.dataset.initialized === "1" && Number.isFinite(currentHashValue);
  if (hasCurrent) {
    const currentExp = clampNumber(nearestPow2Exponent(currentHashValue), minExp, maxExp);
    optHashEl.value = String(currentExp);
  } else {
    optHashEl.value = String(preferredExp);
  }
  optHashEl.dataset.mode = "pow2";
  optHashEl.dataset.initialized = "1";
}

function getSliderNumericValue(controlEl) {
  if (controlEl.dataset.mode === "pow2") {
    return 2 ** Number(controlEl.value);
  }
  return Number(controlEl.value);
}

function syncAnalysisControlsFromMainEngineControls() {
  if (!analysisMultiPvEl || !analysisThreadsEl || !analysisHashEl) return;

  analysisMultiPvEl.min = optMultiPvEl.min;
  analysisMultiPvEl.max = optMultiPvEl.max;
  analysisMultiPvEl.step = optMultiPvEl.step || "1";
  analysisMultiPvEl.value = String(getSliderNumericValue(optMultiPvEl));

  analysisThreadsEl.min = optThreadsEl.min;
  analysisThreadsEl.max = optThreadsEl.max;
  analysisThreadsEl.step = optThreadsEl.step || "1";
  analysisThreadsEl.value = String(getSliderNumericValue(optThreadsEl));

  analysisHashEl.min = optHashEl.min;
  analysisHashEl.max = optHashEl.max;
  analysisHashEl.step = optHashEl.step || "1";
  analysisHashEl.value = optHashEl.value;
  analysisHashEl.dataset.mode = optHashEl.dataset.mode || "";
}

function syncMainEngineControlsFromAnalysisControls() {
  if (!analysisMultiPvEl || !analysisThreadsEl || !analysisHashEl) return;
  optMultiPvEl.value = String(getSliderNumericValue(analysisMultiPvEl));
  optThreadsEl.value = String(getSliderNumericValue(analysisThreadsEl));
  optHashEl.value = analysisHashEl.value;
  if (analysisHashEl.dataset.mode) {
    optHashEl.dataset.mode = analysisHashEl.dataset.mode;
  }
}

function updateAnalysisSliderValueLabels() {
  if (analysisDepthValueEl) {
    analysisDepthValueEl.textContent = formatDepthPreset(getAnalysisDepthLimit());
  }
  if (analysisMultiPvValueEl && analysisMultiPvEl) {
    analysisMultiPvValueEl.textContent = String(getSliderNumericValue(analysisMultiPvEl));
  }
  if (analysisThreadsValueEl && analysisThreadsEl) {
    analysisThreadsValueEl.textContent = String(getSliderNumericValue(analysisThreadsEl));
  }
  if (analysisHashValueEl && analysisHashEl) {
    analysisHashValueEl.textContent = String(getSliderNumericValue(analysisHashEl));
  }
}

function updateUciControlsFromOptions() {
  const options = state.engineRuntime.options;
  const threads = options.get("Threads");
  const hash = options.get("Hash");
  const multiPv = options.get("MultiPV");
  const skill = options.get("Skill Level");
  const elo = options.get("UCI_Elo");
  const limitStrength = options.get("UCI_LimitStrength");

  setNumericControl(optThreadsEl, threads);
  setHashControlFromOption(hash);
  setNumericControl(optMultiPvEl, multiPv);
  setNumericControl(optSkillEl, skill);
  setNumericControl(optEloEl, elo);

  optLimitStrengthEl.disabled = !limitStrength;
  if (limitStrength && typeof limitStrength.defaultValue === "string") {
    optLimitStrengthEl.checked = limitStrength.defaultValue.toLowerCase() === "true";
  }
  updateEngineSliderValueLabels();
  syncAnalysisControlsFromMainEngineControls();
  updateAnalysisSliderValueLabels();
}

function updateEngineSliderValueLabels() {
  optThreadsValueEl.textContent = String(getSliderNumericValue(optThreadsEl));
  optHashValueEl.textContent = String(getSliderNumericValue(optHashEl));
  optMultiPvValueEl.textContent = String(getSliderNumericValue(optMultiPvEl));
  optSkillValueEl.textContent = String(getSliderNumericValue(optSkillEl));
  optEloValueEl.textContent = String(getSliderNumericValue(optEloEl));
}

async function connectSelectedEngine() {
  const selected = getSelectedEngineRecord();
  if (!selected) {
    setEngineStatus("No engine selected.", true);
    return;
  }
  if (state.engineRuntime.connected && state.engineRuntime.connectedEngineId === selected.id) {
    setEngineStatus(`Already connected: ${selected.name}`);
    return;
  }

  resetEngineRuntimeState();
  state.engineRuntime.displayName = selected.name;
  setEngineStatus("Connecting...");
  const result = await ipcRenderer.invoke("engine:start", { enginePath: selected.path });
  if (!result?.ok) {
    setEngineStatus(`Connect failed: ${result?.error || "Unknown error"}`, true);
    return;
  }
  state.engineRuntime.connected = true;
  state.engineRuntime.connectedEngineId = selected.id;
  updateEngineControlButtonStates();
}

async function disconnectEngine() {
  stopCurrentEngineSearch();
  await ipcRenderer.invoke("engine:stop");
  resetEngineRuntimeState();
  setEngineStatus("Disconnected");
  updateEngineControlButtonStates();
}

async function sendOptionIfSupported(optionName, value) {
  if (!state.engineRuntime.options.has(optionName)) return;
  await ipcRenderer.invoke("engine:send", `setoption name ${optionName} value ${value}`);
}

async function applyEngineOptions() {
  if (!state.engineRuntime.connected) {
    setEngineStatus("Connect engine first.", true);
    return;
  }
  await sendOptionIfSupported("Threads", getSliderNumericValue(optThreadsEl));
  await sendOptionIfSupported("Hash", getSliderNumericValue(optHashEl));
  await sendOptionIfSupported("MultiPV", getSliderNumericValue(optMultiPvEl));
  await sendOptionIfSupported("Skill Level", getSliderNumericValue(optSkillEl));
  await sendOptionIfSupported("UCI_LimitStrength", optLimitStrengthEl.checked ? "true" : "false");
  await sendOptionIfSupported("UCI_Elo", getSliderNumericValue(optEloEl));
  await ipcRenderer.invoke("engine:send", "isready");
  setEngineStatus("Options sent. Waiting ready...");
}

async function applyAnalysisEngineOptions() {
  syncMainEngineControlsFromAnalysisControls();
  updateEngineSliderValueLabels();
  updateAnalysisSliderValueLabels();
  if (!state.engineRuntime.connected) return;
  await sendOptionIfSupported("Threads", getSliderNumericValue(analysisThreadsEl));
  await sendOptionIfSupported("Hash", getSliderNumericValue(analysisHashEl));
  await sendOptionIfSupported("MultiPV", getSliderNumericValue(analysisMultiPvEl));
  await ipcRenderer.invoke("engine:send", "isready");
  setEngineStatus("Analysis options sent. Waiting ready...");
}

function buildUciMovesFromHistory() {
  const history = state.game.history({ verbose: true });
  return history.map((mv) => uciFromMove(mv)).filter(Boolean);
}

function maybeRequestEngineMove() {
  if (isOnlineGameActive()) return;
  if (state.appMode !== "play") return;
  if (!state.engineRuntime.connected || !state.engineRuntime.ready) return;
  if (state.engineRuntime.thinking) return;
  if (!isAtLatestPosition()) return;
  if (isGameInteractionLocked()) return;
  if (state.promotion) return;
  if (!isEngineTurn()) return;

  const moves = buildUciMovesFromHistory();
  const defaultFen = new Chess().fen();
  const baseFen = state.playStartFen && state.playStartFen !== defaultFen ? state.playStartFen : null;
  const positionCmd = baseFen
    ? moves.length > 0
      ? `position fen ${baseFen} moves ${moves.join(" ")}`
      : `position fen ${baseFen}`
    : moves.length > 0
      ? `position startpos moves ${moves.join(" ")}`
      : "position startpos";
  const goCommand =
    state.bots.active && state.bots.currentBotSearchMode === "nodes"
      ? `go nodes ${Math.max(1, Number(state.bots.currentBotNodes) || 1)}`
      : `go movetime ${ENGINE_MOVE_TIME_MS}`;
  if (state.engineRuntime.playStopTimerId !== null) {
    window.clearTimeout(state.engineRuntime.playStopTimerId);
    state.engineRuntime.playStopTimerId = null;
  }
  state.engineRuntime.searchKind = "play";
  state.engineRuntime.thinking = true;
  ipcRenderer
    .invoke("engine:send", positionCmd)
    .then((res) => {
      if (!res?.ok) {
        state.engineRuntime.thinking = false;
        setEngineStatus(`Engine send failed: ${res?.error || "position"}`, true);
        return;
      }
      return ipcRenderer.invoke("engine:send", goCommand);
    })
    .then((res) => {
      if (!res) return;
      if (!res?.ok) {
        state.engineRuntime.thinking = false;
        setEngineStatus(`Engine send failed: ${res?.error || "go"}`, true);
        return;
      }
      if (state.bots.active && state.bots.currentBotSearchMode === "nodes") {
        state.engineRuntime.playStopTimerId = window.setTimeout(() => {
          if (!state.engineRuntime.thinking || state.engineRuntime.searchKind !== "play") return;
          ipcRenderer.invoke("engine:send", "stop").catch(() => {});
          state.engineRuntime.playStopTimerId = null;
        }, BOT_NODE_SEARCH_MAX_MS);
      }
    })
    .catch((err) => {
      state.engineRuntime.thinking = false;
      setEngineStatus(`Engine send failed: ${String(err?.message || err)}`, true);
    });
}

function applyEngineBestMove(uci) {
  const moveInput = parseMoveUci(uci);
  if (!moveInput) return false;
  if (!isAtLatestPosition()) return false;
  if (isGameInteractionLocked()) return false;
  if (!isEngineTurn()) return false;
  const ok = attemptMove(moveInput);
  if (ok) {
    render();
    return true;
  }
  return false;
}

function updateSetupValueLabels() {
  mainTimeValueEl.textContent = formatMainTimeValue(selectedInitialClockMs);
  incrementValueEl.textContent = `${Math.round(selectedIncrementMs / 1000)}s`;
}

function applySetupSlidersFromSelection() {
  mainTimeSliderEl.value = String(Math.round(selectedInitialClockMs / 1000));
  incrementSliderEl.value = String(Math.round(selectedIncrementMs / 1000));
  updateSetupValueLabels();
}

function setPlayer2ColorPreference(pref) {
  state.player2ColorPref = pref;
  sideWhiteEl.classList.toggle("selected", pref === "w");
  sideBlackEl.classList.toggle("selected", pref === "b");
  sideRandomEl.classList.toggle("selected", pref === "random");
}

function openSetupModal() {
  return modalHelpers.openSetupModal();
}

function closeSetupModal() {
  return modalHelpers.closeSetupModal();
}

function openEngineControlsModal() {
  return modalHelpers.openEngineControlsModal();
}

function closeEngineControlsModal() {
  return modalHelpers.closeEngineControlsModal();
}

function closeHomeProfileMenu() {
  return modalHelpers.closeHomeProfileMenu();
}

async function syncFullscreenState() {
  try {
    state.isFullscreen = !!(await ipcRenderer.invoke("window:isFullscreen"));
  } catch (_) {
    state.isFullscreen = false;
  }
  updateHomeProfileMenuItems();
}

async function setWindowFullscreen(isFullscreen) {
  const res = await ipcRenderer.invoke("window:setFullscreen", { isFullscreen: !!isFullscreen });
  if (!res?.ok) {
    showAppMessage(res?.error || "Unable to change window mode.");
    return false;
  }
  state.isFullscreen = !!res.isFullscreen;
  updateHomeProfileMenuItems();
  return true;
}

async function toggleWindowFullscreen() {
  await setWindowFullscreen(!state.isFullscreen);
}

function toggleHomeProfileMenu() {
  if (!homeProfileMenuEl) return;
  updateHomeProfileMenuItems();
  homeProfileMenuEl.classList.toggle("hidden");
}

function updateHomeProfileMenuItems() {
  if (!homeProfileMenuEl) return;
  const homeItem = homeProfileMenuEl.querySelector('[data-profile-action="home"]');
  if (!homeItem) return;
  const hideHomeInActivePlay = state.appMode === "play" && !isGameInteractionLocked();
  homeItem.classList.toggle("hidden", hideHomeInActivePlay);
  if (homeProfileOnlineToggleEl) {
    homeProfileOnlineToggleEl.textContent = state.online.connected ? "Online Mode" : "Offline Mode";
  }
  if (btnBackgroundFullscreenToggleEl) {
    btnBackgroundFullscreenToggleEl.textContent = state.isFullscreen ? "Windowed Mode" : "Full Screen Mode";
  }
  updateHomeOnlineToolbarVisibility();
}

function goHomeFromProfileMenu() {
  if (state.appMode === "analysis") {
    stopCurrentEngineSearch();
    clearAnalysisState();
    state.analysis.optionsOpen = false;
    setAppMode("play");
    resetGame();
    clearBotGameContext();
    showHomeScreen();
    return;
  }
  if (state.appMode === "editor") {
    setAppMode("play");
    clearBotGameContext();
    showHomeScreen();
    render();
    return;
  }
  if (isTablebaseMode()) {
    exitTablebaseFlow();
    return;
  }
  if (state.appMode === "puzzle") {
    if (puzzleModule) {
      puzzleModule.exitSession();
    }
    return;
  }
  if (state.appMode === "play") {
    if (!isGameInteractionLocked()) {
      return;
    }
    clearResignConfirmation();
    resetGame();
    if (state.bots.active) {
      clearBotGameContext();
      ensureBotsModule().showScreen();
      return;
    }
    showHomeScreen();
  }
}

function setAccountMessage(text, isError = false) {
  if (!accountMsgEl) return;
  accountMsgEl.textContent = text || "";
  accountMsgEl.style.color = isError ? "#e08f8f" : "#b9b9b9";
}

function closeAccountModal() {
  return modalHelpers.closeAccountModal();
}

function openAccountModal() {
  return modalHelpers.openAccountModal();
}

function saveAccountSettingsFromModal() {
  const syncOnline = !!accountSyncOnlineEl?.checked;
  state.profile.syncOnlineName = syncOnline;
  if (syncOnline) {
    const onlineName = String(state.online.account?.username || "").trim();
    if (onlineName) {
      state.profile.name = sanitizeProfileName(onlineName, Number.POSITIVE_INFINITY);
    } else {
      state.profile.name = sanitizeProfileName(accountNameInputEl?.value, Number.POSITIVE_INFINITY);
    }
  } else {
    state.profile.name = sanitizeProfileName(accountNameInputEl?.value, 25);
  }
  state.profile.avatarDataUrl = accountDraftAvatarDataUrl || "";
  saveProfileSettings();
  renderProfileUi();
  renderPlayerBars();
  closeAccountModal();
  showAppMessage("Account updated.");
}

function closeArchiveModal() {
  closeArchiveBulkAnalysisModal();
  if (!state.archive.bulk.running) {
    closeArchiveBulkProgressModal();
  }
  return modalHelpers.closeArchiveModal();
}

function closeArchiveDeleteConfirmModal() {
  return modalHelpers.closeArchiveDeleteConfirmModal();
}

function showArchiveDeleteProgress(current, total) {
  return modalHelpers.showArchiveDeleteProgress(current, total);
}

function hideArchiveDeleteProgress() {
  return modalHelpers.hideArchiveDeleteProgress();
}

function promptDeleteAllArchiveGamesForCurrentTab() {
  const items = getArchiveItemsForCurrentTab();
  if (!items.length) {
    showAppMessage(
      state.archive.tab === "online"
        ? "No online games to delete."
        : state.archive.tab === "botvbot"
          ? "No bot vs bot games to delete."
        : state.archive.tab === "variants"
          ? "No variant games to delete."
          : "No offline games to delete."
    );
    return;
  }
  pendingArchiveBulkDelete = { tab: state.archive.tab, total: items.length };
  if (archiveDeleteConfirmTextEl) {
    archiveDeleteConfirmTextEl.textContent = `Are you sure you want to delete all ${items.length} ${
      state.archive.tab === "online" ? "online" : state.archive.tab === "botvbot" ? "bot vs bot" : state.archive.tab === "variants" ? "variant" : "offline"
    } game${items.length === 1 ? "" : "s"}?`;
  }
  if (archiveDeleteConfirmAcceptEl) {
    archiveDeleteConfirmAcceptEl.textContent =
      state.archive.tab === "online"
        ? "Delete All Online"
        : state.archive.tab === "botvbot"
          ? "Delete All Bot Games"
        : state.archive.tab === "variants"
          ? "Delete All Variants"
          : "Delete All Offline";
  }
  if (archiveDeleteConfirmModalEl) {
    archiveDeleteConfirmModalEl.classList.remove("hidden");
  }
}

function closeThemeModal() {
  return modalHelpers.closeThemeModal();
}

function setBackgroundMessage(text, isError = false) {
  return modalHelpers.setBackgroundMessage(text, isError);
}

function renderBackgroundModalDraft() {
  return modalHelpers.renderBackgroundModalDraft();
}

function closeBackgroundModal() {
  return modalHelpers.closeBackgroundModal();
}

function openBackgroundModal() {
  return modalHelpers.openBackgroundModal();
}

function saveBackgroundSettingsFromModal() {
  if (backgroundDraftMode === "image" && !backgroundDraftValue) {
    setBackgroundMessage("Choose an image first.", true);
    return;
  }
  state.theme.appBackgroundMode = backgroundDraftMode;
  state.theme.appBackgroundValue = backgroundDraftValue || "";
  applyAppBackgroundTheme();
  saveThemeSettings();
  closeBackgroundModal();
  showAppMessage("Background updated.");
}

async function openThemeModal(kind) {
  if (!themeModalEl || !themeGridEl || !themeStatusEl || !themeModalTitleEl) return;
  const isBoard = kind === "board";
  const isPieces = kind === "pieces";
  const isSound = kind === "sound";
  activeThemeModalKind = kind;
  themeModalTitleEl.textContent = isBoard ? "Select Board" : isPieces ? "Select Pieces" : "Select Sound";
  themeGridEl.innerHTML = "";
  themeStatusEl.textContent = "Loading...";
  if (themeImportActionsEl) {
    themeImportActionsEl.classList.add("hidden");
  }
  themeModalEl.classList.remove("hidden");

  const channel = isBoard ? "assets:listBoards" : isPieces ? "assets:listPieceSets" : "assets:listSoundSets";
  let res;
  try {
    res = await ipcRenderer.invoke(channel);
  } catch (err) {
    themeStatusEl.textContent = `Failed to load: ${String(err?.message || err)}`;
    return;
  }
  if (!res?.ok) {
    themeStatusEl.textContent = `Failed to load: ${res?.error || "unknown error"}`;
    return;
  }

  const items = Array.isArray(res.items) ? res.items : [];
  if (isPieces) {
    state.customAssets.pieceSets.clear();
    for (const item of items) {
      if (item?.id && item?.files) {
        state.customAssets.pieceSets.set(item.id, item);
      }
    }
  }
  if (!items.length) {
    themeStatusEl.textContent = "No items found.";
    return;
  }
  themeStatusEl.textContent = `${items.length} available`;

  const frag = document.createDocumentFragment();
  for (const item of items) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `theme-item ${isBoard ? "boards" : isPieces ? "pieces" : "sound"}`;
    const selected = isBoard
      ? state.theme.boardImage === item.image
      : isPieces
        ? state.theme.pieceSet === item.id
        : state.theme.soundSet === item.id;
    btn.classList.toggle("selected", !!selected);

    if (isBoard || isPieces) {
      const img = document.createElement("img");
      img.className = "theme-thumb";
      img.src = isBoard ? item.image : item.preview;
      img.alt = item.name || item.id || "item";
      btn.appendChild(img);
    } else {
      const img = document.createElement("img");
      img.className = "theme-thumb";
      img.src = THEME_SOUND_ICON;
      img.alt = "sound";
      btn.appendChild(img);
    }

    const caption = document.createElement("span");
    caption.className = "theme-caption";
    caption.textContent = item.name || item.id || "";
    btn.appendChild(caption);

    if ((isBoard || isPieces) && item.imported) {
      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "theme-delete-btn";
      delBtn.textContent = "x";
      delBtn.setAttribute("aria-label", `Delete ${item.name || item.id || "imported item"}`);
      delBtn.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();
        const channel = isBoard ? "assets:deleteBoard" : "assets:deletePieceSet";
        const result = await ipcRenderer.invoke(channel, { id: item.id });
        if (!result?.ok) {
          themeStatusEl.textContent = `Delete failed: ${result?.error || "unknown error"}`;
          return;
        }
        if (isBoard && state.theme.boardImage === item.image) {
          state.theme.boardImage = "../assets/board/wood4.jpg";
          applyBoardTheme();
          saveThemeSettings();
          render();
        } else if (isPieces && state.theme.pieceSet === item.id) {
          state.theme.pieceSet = "maestro";
          initEditorPalette();
          saveThemeSettings();
          render();
        }
        showAppMessage(`${isBoard ? "Board" : "Piece set"} deleted.`);
        openThemeModal(kind);
      });
      btn.appendChild(delBtn);
    }

    btn.addEventListener("click", () => {
      if (isBoard) {
        state.theme.boardImage = item.image;
        applyBoardTheme();
      } else if (isPieces) {
        state.theme.pieceSet = item.id;
        initEditorPalette();
      } else {
        state.theme.soundSet = item.id;
        rebuildSoundEffects();
      }
      saveThemeSettings();
      closeThemeModal();
      render();
      showAppMessage(`${isBoard ? "Board" : isPieces ? "Piece set" : "Sound set"} updated.`);
    });

    frag.appendChild(btn);
  }

  if (isBoard || isPieces) {
    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = `theme-item theme-add ${isBoard ? "boards" : "pieces"}`;
    addBtn.setAttribute("aria-label", isBoard ? "Add board" : "Add piece set");

    const plus = document.createElement("span");
    plus.className = "theme-add-icon";
    plus.textContent = "+";
    addBtn.appendChild(plus);

    const caption = document.createElement("span");
    caption.className = "theme-caption";
    caption.textContent = isBoard ? "Add Board" : "Add Piece Set";
    addBtn.appendChild(caption);

    addBtn.addEventListener("click", async () => {
      try {
        const channel = isBoard ? "assets:importBoard" : "assets:importPieceSet";
        const result = await ipcRenderer.invoke(channel);
        if (result?.canceled) return;
        if (!result?.ok) {
          themeStatusEl.textContent = `Import failed: ${result?.error || "unknown error"}`;
          return;
        }
        showAppMessage(`${isBoard ? "Board" : "Piece set"} imported.`);
        openThemeModal(kind);
      } catch (err) {
        themeStatusEl.textContent = `Import failed: ${String(err?.message || err)}`;
      }
    });

    frag.appendChild(addBtn);
  }
  themeGridEl.appendChild(frag);
}

async function preloadCustomThemeAssets() {
  try {
    const res = await ipcRenderer.invoke("assets:listPieceSets");
    if (!res?.ok) return;
    state.customAssets.pieceSets.clear();
    for (const item of Array.isArray(res.items) ? res.items : []) {
      if (item?.id && item?.files) {
        state.customAssets.pieceSets.set(item.id, item);
      }
    }
  } catch (_) {
    // ignore preload failures
  }
}

function formatArchiveTimestamp(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return "";
  const d = new Date(ms);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function openArchiveGame(item) {
  if (!item?.filePath) return;
  let resolvedContent = typeof item.content === "string" ? item.content.trim() : "";
  if (!resolvedContent) {
    const readRes = await ipcRenderer.invoke("games:read", { filePath: item.filePath });
    if (!readRes?.ok) {
      showAppMessage(`Open failed: ${readRes?.error || "Unable to read file."}`);
      return;
    }
    resolvedContent = String(readRes.content || "").trim();
  }
  if (!resolvedContent) {
    showAppMessage("Selected game is empty.");
    return;
  }
  const { tags } = parsePgnTagsAndMovetext(resolvedContent);
  if (isFairyArchiveGame(tags)) {
    await openFairyArchiveGameFromTags(tags, resolvedContent, {
      filePath: item.filePath,
      pgnHash: item.pgnHash || hashArchivePgnText(resolvedContent)
    }, item);
    return;
  }
  state.archive.currentAnalysisReport = await loadArchiveComputerAnalysisForItem(item, resolvedContent, tags);
  state.analysis.judgmentCycleState = {};
  state.archive.currentAnalysisSource = {
    filePath: item.filePath,
    pgn: resolvedContent,
    pgnHash: item.pgnHash || hashArchivePgnText(resolvedContent)
  };
  state.currentVariant = "standard";
  if (!(await ensureStandardEngineMode())) return;
  closeArchiveModal();
  stopCurrentEngineSearch();
  clearAnalysisState();
  state.analysis.optionsOpen = false;
  setAppMode("analysis");
  showGameScreen();
  if (analysisPgnTextEl) {
    analysisPgnTextEl.value = resolvedContent;
  }
  loadAnalysisPgnFromText();
}

function buildFairyAnalysisTreeFromVariantMoves(variantKey, startFen, variantMoves) {
  const tree = createAnalysisTreeRoot(startFen);
  const game = createFairyVariantGame(getFairyVariantNameForVariantKey(variantKey), startFen);
  const moves = String(variantMoves || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  let parentId = tree.rootId;
  for (const uci of moves) {
    const moveInput = parseMoveUci(uci);
    if (!moveInput) break;
    const applied = applyMoveToGameInstance(game, moveInput);
    if (!applied) break;
    const parent = tree.nodes[parentId];
    if (!parent) break;
    const now = Date.now();
    const nodeId = makeAnalysisNodeId();
    tree.nodes[nodeId] = {
      id: nodeId,
      parentId: parent.id,
      children: [],
      ply: parent.ply + 1,
      fen: game.fen(),
      turn: game.turn(),
      move: {
        from: applied.from || null,
        to: applied.to,
        promotion: applied.promotion || null,
        drop: applied.drop || null,
        uci: uciFromMove(applied)
      },
      san: applied.san || null,
      uci: uciFromMove(applied),
      comment: "",
      nags: [],
      eval: null,
      evalByEngineKey: {},
      ui: { arrows: [], highlights: [] },
      createdAt: now,
      updatedAt: now
    };
    parent.children.push(nodeId);
    parent.updatedAt = now;
    parentId = nodeId;
  }
  tree.currentId = parentId;
  state.analysisTree = tree;
}

async function openFairyArchiveGameFromTags(tags, resolvedContent = "", archiveSource = null, archiveItem = null) {
  const variantKey = getFairyArchiveVariantKey(tags);
  if (!variantKey) {
    showAppMessage("This archive entry does not contain a supported Fairy variant.");
    return;
  }
  const variantDisplayName = getVariantDisplayNameForKey(variantKey);
  const startFen = String(tags.FEN || "").trim() || getDefaultStartFenForVariant(variantKey);
  const variantMoves = String(tags.VariantMoves || "").trim();
  if (!variantMoves) {
    showAppMessage(`This ${variantDisplayName} archive entry is missing VariantMoves.`);
    return;
  }
  try {
    await loadFairyApi();
  } catch (err) {
    showAppMessage(`Failed to load Fairy rules engine: ${String(err?.message || err)}`);
    return;
  }
  closeArchiveModal();
  state.archive.currentAnalysisReport = archiveItem
    ? await loadArchiveComputerAnalysisForItem(archiveItem, resolvedContent, tags)
    : null;
  state.analysis.judgmentCycleState = {};
  state.archive.currentAnalysisSource = {
    filePath: String(archiveSource?.filePath || "").trim(),
    pgn: resolvedContent,
    pgnHash: String(archiveSource?.pgnHash || (resolvedContent ? hashArchivePgnText(resolvedContent) : "")).trim()
  };
  state.currentVariant = variantKey;
  if (!(await ensureFairyEngineConnectedForVariants())) return;
  const variantModeRes = await setEngineVariantMode(getFairyVariantNameForVariantKey(variantKey));
  if (!variantModeRes.ok) {
    setEngineStatus(variantModeRes.error, true);
    showAppMessage(variantModeRes.error);
    return;
  }
  stopCurrentEngineSearch();
  clearAnalysisState();
  state.analysis.optionsOpen = false;
  state.analysisPgnMeta = {
    tags: {
      Variant: variantDisplayName,
      VariantName: variantDisplayName,
      SetUp: "1",
      FEN: startFen,
      Result: String(tags.Result || "*"),
      White: String(tags.White || "White"),
      Black: String(tags.Black || "Black"),
      Termination: String(tags.Termination || "")
    },
    rootComments: []
  };
  setAppMode("analysis");
  showGameScreen();
  state.currentGameStartFen = startFen;
  state.playStartFen = startFen;
  buildFairyAnalysisTreeFromVariantMoves(variantKey, startFen, variantMoves);
  state.game = buildGameFromAnalysisNode(getAnalysisTree().currentId);
  state.viewPly = 0;
  render();
  updateAnalysisPgnText(true);
  if (analysisPgnTextEl && resolvedContent.trim()) {
    analysisPgnTextEl.value = resolvedContent.trim();
  }
  renderAnalysisInfoPanel();
}

function getArchiveUserOutcome(tags) {
  const result = String(tags.Result || "*").trim();
  if (result === "1/2-1/2") return "draw";
  if (result !== "1-0" && result !== "0-1") return "unfinished";
  let side = String(tags.UserSide || "").trim().toLowerCase();
  if (side !== "white" && side !== "black") {
    const userName = String(tags.UserName || state.profile.name || "").trim().toLowerCase();
    const whiteName = String(tags.White || "").trim().toLowerCase();
    const blackName = String(tags.Black || "").trim().toLowerCase();
    if (userName && whiteName === userName) side = "white";
    else if (userName && blackName === userName) side = "black";
  }
  if (side !== "white" && side !== "black") return "unknown";
  if (result === "1-0") return side === "white" ? "win" : "loss";
  return side === "black" ? "win" : "loss";
}

function getArchiveStatusText(tags) {
  const result = String(tags.Result || "*").trim();
  const term = String(tags.Termination || "").trim();
  if (result === "1-0" || result === "0-1") {
    const winner = result === "1-0" ? "White" : "Black";
    return term ? `${term} • ${winner} is victorious` : `${winner} is victorious`;
  }
  if (result === "1/2-1/2") return term || "Draw";
  return term || "Unfinished game";
}

function classifyTimeControlSpeed(baseSec) {
  if (!Number.isFinite(baseSec) || baseSec <= 0) return "UNLIMITED";
  if (baseSec <= 120) return "BULLET";
  if (baseSec <= 480) return "BLITZ";
  if (baseSec <= 1500) return "RAPID";
  return "CLASSICAL";
}

function formatArchiveTimeControl(tags) {
  const tc = String(tags.TimeControl || "-").trim();
  if (!tc || tc === "-") return "∞ • UNLIMITED";
  const m = tc.match(/^(\d+)\+(\d+)$/);
  if (!m) return tc;
  const baseSec = Number(m[1]);
  const incSec = Number(m[2]);
  const baseLabel = baseSec % 60 === 0 ? String(baseSec / 60) : `${baseSec}s`;
  return `${baseLabel}+${incSec} • ${classifyTimeControlSpeed(baseSec)}`;
}

function formatArchivePlayedAt(ms) {
  const n = Number(ms || 0);
  if (!Number.isFinite(n) || n <= 0) return "";
  const d = new Date(n);
  const pad = (v) => String(v).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}

function pieceFromFenChar(ch) {
  const lower = ch.toLowerCase();
  if (!["p", "n", "b", "r", "q", "k"].includes(lower)) return null;
  return { color: ch === lower ? "b" : "w", type: lower };
}

function createArchiveBoardPreview(fen) {
  const root = document.createElement("div");
  root.className = "archive-mini-board";
  root.style.backgroundImage = `url("${state.theme.boardImage || "../assets/board/wood4.jpg"}")`;
  const placement = String(fen || "").split(/\s+/)[0] || "";
  const ranksFen = placement.split("/");
  for (let r = 0; r < 8; r += 1) {
    const row = ranksFen[r] || "8";
    let file = 0;
    for (const ch of row) {
      if (/\d/.test(ch)) {
        file += Number(ch);
        continue;
      }
      const piece = pieceFromFenChar(ch);
      if (!piece) continue;
      const cell = document.createElement("div");
      cell.className = "archive-mini-piece-cell";
      cell.style.gridColumn = String(file + 1);
      cell.style.gridRow = String(r + 1);
      const img = document.createElement("img");
      img.className = "archive-mini-piece";
      img.src = pieceAssetPath(piece);
      img.alt = `${piece.color}${piece.type}`;
      cell.appendChild(img);
      root.appendChild(cell);
      file += 1;
    }
  }
  return root;
}

async function openArchiveModal() {
  if (!archiveModalEl || !archiveStatusEl || !archiveListEl) return;
  hideArchiveContextMenu();
  archiveModalEl.classList.remove("hidden");
  archiveStatusEl.textContent = "Loading saved games...";
  archiveListEl.innerHTML = "";

  let res;
  try {
    res = await ipcRenderer.invoke("games:list");
  } catch (err) {
    archiveStatusEl.textContent = `Failed to load archive: ${String(err?.message || err)}`;
    return;
  }

  if (!res?.ok) {
    archiveStatusEl.textContent = `Failed to load archive: ${res?.error || "unknown error"}`;
    return;
  }

  const items = Array.isArray(res.items) ? res.items : [];
  state.archive.cachedItems = await Promise.all(
    items.map(async (item) => {
      const readRes = await ipcRenderer.invoke("games:read", { filePath: item.filePath });
      const content = readRes?.ok ? String(readRes.content || "") : "";
      const { tags } = parsePgnTagsAndMovetext(content);
      const pgnHash = content ? hashArchivePgnText(content) : "";
      let analysisMeta = null;
      let cachedAnalysis = null;
      try {
        const analysisRes = await ipcRenderer.invoke("games:readAnalysis", { filePath: item.filePath });
        const cached = analysisRes?.ok ? analysisRes.analysis : null;
        if (
          cached &&
          cached.pgnHash === pgnHash &&
          cached.analysis &&
          (String(cached.analysis.variantKey || "").trim().toLowerCase() === "standard"
            || String(cached.analysis.variantKey || "").trim().toLowerCase() === "chess960")
        ) {
          cachedAnalysis = cached;
          analysisMeta = {
            available: true,
            depth: Number(cached.analysis.depth || 0),
            updatedAt: Number(cached.updatedAt || 0)
          };
        }
      } catch (err) {
        console.error("Failed to read archive analysis cache:", err);
      }
      return {
        ...item,
        content,
        tags,
        pgnHash,
        analysisMeta,
        cachedAnalysis
      };
    })
  );
  setArchiveTab(state.archive.tab);
}

function setArchiveTab(tab) {
  state.archive.tab = tab === "online" ? "online" : tab === "variants" ? "variants" : tab === "botvbot" ? "botvbot" : "offline";
  if (archiveTabOfflineEl) {
    archiveTabOfflineEl.classList.toggle("active", state.archive.tab === "offline");
  }
  if (archiveTabBotvbotEl) {
    archiveTabBotvbotEl.classList.toggle("active", state.archive.tab === "botvbot");
  }
  if (archiveTabVariantsEl) {
    archiveTabVariantsEl.classList.toggle("active", state.archive.tab === "variants");
  }
  if (archiveTabOnlineEl) {
    archiveTabOnlineEl.classList.toggle("active", state.archive.tab === "online");
  }
  if (archiveOnlineActionsEl) {
    archiveOnlineActionsEl.classList.remove("hidden");
  }
  if (btnArchiveSyncOnlineEl) {
    btnArchiveSyncOnlineEl.classList.toggle("hidden", state.archive.tab !== "online");
    btnArchiveSyncOnlineEl.disabled = state.archive.bulk.running;
  }
  if (btnArchiveBulkAnalysisEl) {
    btnArchiveBulkAnalysisEl.classList.toggle("hidden", state.archive.tab !== "online");
    btnArchiveBulkAnalysisEl.disabled = state.archive.bulk.running;
  }
  if (btnArchiveDeleteAllEl) {
    btnArchiveDeleteAllEl.disabled = state.archive.bulk.running;
    btnArchiveDeleteAllEl.textContent =
      state.archive.tab === "online"
        ? "Delete All Online"
        : state.archive.tab === "botvbot"
          ? "Delete All Bot Games"
        : state.archive.tab === "variants"
          ? "Delete All Variants"
          : "Delete All Offline";
  }
  renderArchiveListForCurrentTab();
}

function getArchiveItemsForCurrentTab() {
  const allItems = Array.isArray(state.archive.cachedItems) ? state.archive.cachedItems : [];
  const isOnlineTab = state.archive.tab === "online";
  const isBotVsBotTab = state.archive.tab === "botvbot";
  const isVariantsTab = state.archive.tab === "variants";
  return allItems.filter((item) => {
    const isOnline = /^lichess_/i.test(String(item?.name || ""));
    const isBotVsBot = String(item?.tags?.BotVsBot || "").trim() === "1";
    const isVariant = isFairyArchiveGame(item?.tags || {});
    if (isOnlineTab) return isOnline;
    if (isBotVsBotTab) return !isOnline && !isVariant && isBotVsBot;
    if (isVariantsTab) return !isOnline && isVariant;
    return !isOnline && !isVariant && !isBotVsBot;
  });
}

function renderArchiveListForCurrentTab() {
  if (!archiveListEl || !archiveStatusEl) return;
  archiveListEl.innerHTML = "";
  const isOnlineTab = state.archive.tab === "online";
  const isBotVsBotTab = state.archive.tab === "botvbot";
  const isVariantsTab = state.archive.tab === "variants";
  const filtered = getArchiveItemsForCurrentTab();

  if (!filtered.length) {
    archiveStatusEl.textContent = isOnlineTab
      ? "No online games found."
      : isBotVsBotTab
        ? "No bot vs bot games found."
      : isVariantsTab
        ? "No variant games found."
        : "No offline games found.";
    return;
  }
  archiveStatusEl.textContent = `${filtered.length} ${isOnlineTab ? "online" : isBotVsBotTab ? "bot vs bot" : isVariantsTab ? "variant" : "offline"} game${
    filtered.length === 1 ? "" : "s"
  }`;

  const frag = document.createDocumentFragment();
  for (const item of filtered) {
    const tags = item.tags || {};
    const resultClass = getArchiveUserOutcome(tags);
    const finalFen = String(tags.FinalFEN || tags.FEN || new Chess().fen());
    const wrap = document.createElement("div");
    wrap.className = "archive-item-wrap";
    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "archive-item-delete";
    deleteBtn.textContent = "×";
    deleteBtn.title = "Delete game";
    deleteBtn.setAttribute("aria-label", "Delete game");
    deleteBtn.addEventListener("click", async (event) => {
      event.stopPropagation();
      event.preventDefault();
      await deleteArchiveGame(item.filePath);
    });
    wrap.appendChild(deleteBtn);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "archive-item";

    const left = document.createElement("div");
    left.className = "archive-left";
    left.appendChild(createArchiveBoardPreview(finalFen));
    const when = document.createElement("div");
    when.className = "archive-when";
    when.textContent = formatArchivePlayedAt(Number(item.mtimeMs || 0));
    left.appendChild(when);
    btn.appendChild(left);

    const right = document.createElement("div");
    right.className = "archive-right";
    const top = document.createElement("div");
    top.className = "archive-time-control";
    const archiveTimeControl = formatArchiveTimeControl(tags);
    if (isVariantsTab) {
      const variantKey = getFairyArchiveVariantKey(tags);
      const variantName = variantKey
        ? getVariantDisplayNameForKey(variantKey)
        : String(tags.VariantName || tags.Variant || "Variant").trim();
      top.textContent = archiveTimeControl ? `${variantName} • ${archiveTimeControl}` : variantName;
    } else {
      top.textContent = archiveTimeControl;
    }
    right.appendChild(top);

    const names = document.createElement("div");
    names.className = "archive-names";
    names.textContent = `${tags.White || "White"} vs ${tags.Black || "Black"}`;
    right.appendChild(names);

    if (item.analysisMeta?.available && Number(item.analysisMeta.depth) > 0) {
      const analysisInfo = document.createElement("div");
      analysisInfo.className = "archive-when";
      analysisInfo.textContent = `Computer analysis available • d${Number(item.analysisMeta.depth)}`;
      right.appendChild(analysisInfo);
    }

    const status = document.createElement("div");
    status.className = `archive-result archive-result-${resultClass}`;
    status.textContent = getArchiveStatusText(tags);
    right.appendChild(status);

    btn.appendChild(right);
    btn.addEventListener("click", () => {
      openArchiveGame(item);
    });
    btn.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      showArchiveContextMenu(event.clientX, event.clientY, item.filePath);
    });
    wrap.appendChild(btn);
    frag.appendChild(wrap);
  }
  archiveListEl.appendChild(frag);
}

async function deleteArchiveGame(filePath) {
  if (!filePath) return false;
  try {
    const res = await ipcRenderer.invoke("games:delete", { filePath });
    if (!res?.ok) {
      showAppMessage(`Delete failed: ${res?.error || "unknown error"}`);
      return false;
    }
    state.archive.cachedItems = (state.archive.cachedItems || []).filter((item) => item.filePath !== filePath);
    renderArchiveListForCurrentTab();
    return true;
  } catch (err) {
    showAppMessage(`Delete failed: ${String(err?.message || err)}`);
    return false;
  }
}

async function deleteAllArchiveGamesForCurrentTab() {
  const items = getArchiveItemsForCurrentTab();
  if (!items.length) {
    showAppMessage(
      state.archive.tab === "online"
        ? "No online games to delete."
        : state.archive.tab === "variants"
          ? "No variant games to delete."
          : "No offline games to delete."
    );
    return;
  }
  showArchiveDeleteProgress(0, items.length);
  let deleted = 0;
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    // Use the existing file-path delete path so offline and online archive files behave identically.
    // eslint-disable-next-line no-await-in-loop
    const ok = await deleteArchiveGame(item.filePath);
    if (ok) deleted += 1;
    showArchiveDeleteProgress(i + 1, items.length);
  }
  hideArchiveDeleteProgress();
  if (deleted > 0) {
    showAppMessage(`Deleted ${deleted} archived game${deleted === 1 ? "" : "s"}.`);
  }
}

async function syncLatestOnlineGamesIntoArchive() {
  if (!state.online.connected) {
    showAppMessage("Connect Lichess first.");
    return;
  }
  let username = state.online.account?.username || "";
  if (!username) {
    try {
      const accountRes = await ipcRenderer.invoke("online:account:get");
      if (accountRes?.ok) {
        state.online.account = accountRes.account || null;
        username = state.online.account?.username || "";
      }
    } catch (_) {
      // handled below
    }
  }
  if (!username) {
    showAppMessage("Unable to determine account username.");
    return;
  }
  try {
    archiveStatusEl.textContent = "Syncing latest 100 online games...";
    const res = await ipcRenderer.invoke("online:games:sync", {
      username,
      max: 100,
      recent: true
    });
    if (!res?.ok) {
      archiveStatusEl.textContent = `Sync failed: ${res?.error || "unknown error"}`;
      return;
    }
    showAppMessage(`Online sync done: imported ${res.imported}, skipped ${res.skipped}`);
    await openArchiveModal();
    setArchiveTab("online");
  } catch (err) {
    archiveStatusEl.textContent = `Sync failed: ${String(err?.message || err)}`;
  }
}

function buildArchiveBulkAnalysisQueue(items, depth) {
  const onlineItems = Array.isArray(items) ? items : [];
  const targetDepth = Math.max(10, Math.min(15, Number(depth || 10)));
  const eligible = [];
  let skippedExisting = 0;
  let skippedUnsupported = 0;
  for (const item of onlineItems) {
    if (!isComputerAnalysisSupportedForTags(item?.tags || {})) {
      skippedUnsupported += 1;
      continue;
    }
    const savedDepth = Number(item?.analysisMeta?.depth || 0);
    if (item?.analysisMeta?.available && savedDepth >= targetDepth) {
      skippedExisting += 1;
      continue;
    }
    eligible.push(item);
  }
  return { eligible, skippedExisting, skippedUnsupported };
}

function getArchiveBulkTargetItems() {
  const onlineItems = getArchiveItemsForCurrentTab();
  const depth = Math.max(10, Math.min(15, Number(archiveBulkDepthEl?.value || state.archive.bulk.depth || 10)));
  const requested = String(archiveBulkCountEl?.value || state.archive.bulk.selectedCount || "all");
  const { eligible, skippedExisting, skippedUnsupported } = buildArchiveBulkAnalysisQueue(onlineItems, depth);
  const count =
    requested === "all"
      ? eligible.length
      : Math.max(0, Math.min(eligible.length, Math.trunc(Number(requested) || 0)));
  return {
    depth,
    requested,
    queue: count > 0 ? eligible.slice(0, count) : [],
    skippedExisting,
    skippedUnsupported
  };
}

async function runComputerAnalysisInBackground({ item, depth } = {}) {
  const archiveItem = item || null;
  const pgn = String(archiveItem?.content || "").trim();
  if (!archiveItem?.filePath || !pgn) {
    return { ok: false, error: "Archive game content is missing." };
  }
  return new Promise(async (resolve) => {
    let settled = false;
    const finish = (payload) => {
      if (settled) return;
      settled = true;
      resolve(payload);
    };
    try {
      const started = await startComputerAnalysisModuleRun({
        pgn,
        depth,
        silent: true,
        archiveContext: {
          filePath: archiveItem.filePath,
          pgnHash: archiveItem.pgnHash || hashArchivePgnText(pgn),
          pgn
        },
        onComplete: (report) => finish({ ok: true, report }),
        onError: (error, report) => finish({ ok: false, error: error || "Computer analysis failed.", report })
      });
      if (!started?.ok) {
        finish({ ok: false, error: started?.error || "Unable to start computer analysis." });
      }
    } catch (err) {
      finish({ ok: false, error: String(err?.message || err) });
    }
  });
}

function finishArchiveBulkAnalysis(message) {
  const completed = state.archive.bulk.completed;
  const failed = state.archive.bulk.failed;
  const skippedExisting = state.archive.bulk.skippedExisting;
  const skippedUnsupported = state.archive.bulk.skippedUnsupported;
  closeArchiveBulkProgressModal();
  stopArchiveBulkEtaTimer();
  resetArchiveBulkAnalysisState();
  setArchiveTab(state.archive.tab);
  if (archiveStatusEl && state.archive.tab === "online") {
    archiveStatusEl.textContent = message;
  }
  showAppMessage(
    `${message} Completed ${completed}, failed ${failed}, skipped ${skippedExisting + skippedUnsupported}.`
  );
}

async function startArchiveBulkAnalysisRun() {
  if (state.archive.bulk.running) return;
  if (computerAnalysisBridge.running) {
    showAppMessage("Computer analysis is already running.");
    return;
  }
  const plan = getArchiveBulkTargetItems();
  if (!plan.queue.length) {
    showAppMessage("No online games need analysis at that depth.");
    return;
  }
  closeArchiveBulkAnalysisModal();
  state.archive.bulk.running = true;
  state.archive.bulk.cancelRequested = false;
  state.archive.bulk.queue = plan.queue.slice();
  state.archive.bulk.depth = plan.depth;
  state.archive.bulk.selectedCount = plan.requested;
  state.archive.bulk.currentIndex = -1;
  state.archive.bulk.currentItemName = "";
  state.archive.bulk.completed = 0;
  state.archive.bulk.failed = 0;
  state.archive.bulk.skippedExisting = plan.skippedExisting;
  state.archive.bulk.skippedUnsupported = plan.skippedUnsupported;
  state.archive.bulk.durationsMs = [];
  state.archive.bulk.currentStartedAt = 0;
  setArchiveTab(state.archive.tab);
  openArchiveBulkProgressModal();
  stopArchiveBulkEtaTimer();
  state.archive.bulk.etaTimerId = window.setInterval(updateArchiveBulkProgressUi, 1000);
  updateArchiveBulkProgressUi();

  for (let index = 0; index < state.archive.bulk.queue.length; index += 1) {
    const item = state.archive.bulk.queue[index];
    state.archive.bulk.currentIndex = index;
    state.archive.bulk.currentItemName = `${item?.tags?.White || "White"} vs ${item?.tags?.Black || "Black"}`;
    state.archive.bulk.currentStartedAt = Date.now();
    updateArchiveBulkProgressUi();
    // eslint-disable-next-line no-await-in-loop
    const result = await runComputerAnalysisInBackground({ item, depth: state.archive.bulk.depth });
    const durationMs = Math.max(0, Date.now() - state.archive.bulk.currentStartedAt);
    state.archive.bulk.currentStartedAt = 0;
    state.archive.bulk.durationsMs.push(durationMs);
    if (result?.ok && result.report) {
      state.archive.bulk.completed += 1;
      updateArchiveItemWithSavedAnalysis(item.filePath, item.content, {
        depth: Number(result.report.depth || state.archive.bulk.depth),
        variantKey: String(result.report.variantKey || "standard"),
        tags: result.report.tags || {},
        startFen: String(result.report.startFen || ""),
        whiteAccuracy: result.report.whiteAccuracy ?? null,
        blackAccuracy: result.report.blackAccuracy ?? null,
        accuracyByColor: result.report.accuracyByColor || { white: null, black: null },
        judgmentCountsByColor: result.report.judgmentCountsByColor || {
          white: { brilliant: 0, great: 0, inaccuracy: 0, mistake: 0, blunder: 0 },
          black: { brilliant: 0, great: 0, inaccuracy: 0, mistake: 0, blunder: 0 }
        },
        results: Array.isArray(result.report.results) ? result.report.results : [],
        total: Number(result.report.total || 0)
      });
    } else {
      state.archive.bulk.failed += 1;
      console.error("Bulk archive analysis failed:", result?.error || "unknown error", item?.filePath || "");
    }
    updateArchiveBulkProgressUi();
    if (state.archive.bulk.cancelRequested) {
      finishArchiveBulkAnalysis("Bulk analysis stopped.");
      return;
    }
  }
  finishArchiveBulkAnalysis("Bulk analysis complete.");
}

function setSelectedTimeCard(targetCard) {
  if (!targetCard || targetCard.disabled) return;
  timeCardEls.forEach((card) => {
    card.classList.toggle("selected", card === targetCard);
  });
  applySelectedTimeControlFromCard(targetCard);
}

function showHomeScreen() {
  return navigationHelpers.showHomeScreen();
}

function showToolsScreen() {
  return navigationHelpers.showToolsScreen();
}

function showPuzzleScreen() {
  return navigationHelpers.showPuzzleScreen();
}

function showComputerAnalysisScreen() {
  return navigationHelpers.showComputerAnalysisScreen();
}

function showVariantsScreen() {
  return navigationHelpers.showVariantsScreen();
}

function showChess960Screen() {
  return navigationHelpers.showChess960Screen();
}

function showTournamentScreen() {
  return navigationHelpers.showTournamentScreen();
}

function showVisionScreen() {
  return navigationHelpers.showVisionScreen();
}

function showGameScreen() {
  const result = navigationHelpers.showGameScreen();
  if (homeProfileEl) {
    homeProfileEl.classList.toggle("hidden", isBotTournamentSpectatorMode() || isBotTournamentHumanMode());
  }
  return result;
}

function detachGlobalUiNodes() {
  const nodes = [homeProfileEl, accountModalEl, themeModalEl, backgroundModalEl];
  for (const node of nodes) {
    if (!node) continue;
    if (node.parentElement !== document.body) {
      document.body.appendChild(node);
    }
  }
}

function ensureEngineConnectedBeforeStart() {
  if (state.engineRuntime.connected) return true;
  const msg = "Connect engine first.";
  setEngineStatus(msg, true);
  showAppMessage(msg, 2200);
  return false;
}

async function setEngineChess960Mode(enabled) {
  if (!state.engineRuntime.connected) return { ok: false, error: "Engine is not connected." };
  const option = state.engineRuntime.options.get("UCI_Chess960");
  if (!option) {
    return { ok: false, error: "Selected engine does not support Chess960." };
  }
  const sendRes = await ipcRenderer.invoke(
    "engine:send",
    `setoption name UCI_Chess960 value ${enabled ? "true" : "false"}`
  );
  if (!sendRes?.ok) {
    return { ok: false, error: sendRes?.error || "Failed to change engine Chess960 mode." };
  }
  const readyRes = await ipcRenderer.invoke("engine:send", "isready");
  if (!readyRes?.ok) {
    return { ok: false, error: readyRes?.error || "Engine did not acknowledge Chess960 mode change." };
  }
  return { ok: true };
}

async function setEngineVariantMode(variantName) {
  if (!state.engineRuntime.connected) return { ok: false, error: "Engine is not connected." };
  const variant = String(variantName || "").trim() || "chess";
  const hasVariantOption = state.engineRuntime.options.has("UCI_Variant");
  const hasChess960Option = state.engineRuntime.options.has("UCI_Chess960");

  if (!hasVariantOption && !hasChess960Option) {
    return { ok: false, error: "Selected engine does not support variant switching." };
  }

  if (hasVariantOption) {
    const sendVariant = await ipcRenderer.invoke("engine:send", `setoption name UCI_Variant value ${variant}`);
    if (!sendVariant?.ok) {
      return { ok: false, error: sendVariant?.error || "Failed to change engine variant mode." };
    }
  }

  if (hasChess960Option) {
    const enable960 = variant === "fischerandom";
    const send960 = await ipcRenderer.invoke(
      "engine:send",
      `setoption name UCI_Chess960 value ${enable960 ? "true" : "false"}`
    );
    if (!send960?.ok) {
      return { ok: false, error: send960?.error || "Failed to change engine Chess960 mode." };
    }
  }

  const readyRes = await ipcRenderer.invoke("engine:send", "isready");
  if (!readyRes?.ok) {
    return { ok: false, error: readyRes?.error || "Engine did not acknowledge variant mode change." };
  }
  return { ok: true };
}

async function ensureStandardEngineMode() {
  if (!state.engineRuntime.connected) return true;
  const hasVariantOption = state.engineRuntime.options.has("UCI_Variant");
  const hasChess960Option = state.engineRuntime.options.has("UCI_Chess960");
  if (!hasVariantOption && !hasChess960Option) {
    return true;
  }
  const result = await setEngineVariantMode("chess");
  if (!result.ok) {
    setEngineStatus(result.error, true);
    showAppMessage(result.error);
    return false;
  }
  return true;
}

function getBuiltinFairyEngineRecord() {
  return state.engines.find((engine) => engine.id === "builtin-fairy-stockfish") || null;
}

async function waitForEngineReady(timeoutMs = 6000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (state.engineRuntime.connected && state.engineRuntime.ready) return true;
    await new Promise((resolve) => window.setTimeout(resolve, 50));
  }
  return false;
}

async function connectTemporaryRuntimeEngine(engineId, enginePath, displayName = "Engine") {
  if (!enginePath) {
    const message = `${displayName} executable was not found.`;
    setEngineStatus(message, true);
    showAppMessage(message, 2600);
    return false;
  }
  if (!state.engineRuntime.connected || state.engineRuntime.connectedEngineId !== engineId) {
    resetEngineRuntimeState();
    state.engineRuntime.idName = displayName;
    state.engineRuntime.displayName = displayName;
    setEngineStatus(`Connecting ${displayName}...`);
    const result = await ipcRenderer.invoke("engine:start", { enginePath });
    if (!result?.ok) {
      setEngineStatus(`Connect failed: ${result?.error || "Unknown error"}`, true);
      showAppMessage(`Failed to start ${displayName}: ${result?.error || "unknown error"}`, 2600);
      return false;
    }
    state.engineRuntime.connected = true;
    state.engineRuntime.connectedEngineId = engineId;
    updateEngineControlButtonStates();
  }
  const ready = await waitForEngineReady();
  if (!ready) {
    const message = `${displayName} did not become ready in time.`;
    setEngineStatus(message, true);
    showAppMessage(message, 2600);
    return false;
  }
  return true;
}

function getPreferredAnalysisEngineRecord() {
  return getDefaultEngineRecord() || getSelectedEngineRecord() || null;
}

function clearBotGameContext() {
  state.bots.active = false;
  state.bots.currentBotId = "";
  state.bots.currentBotDisplayName = "";
  state.bots.currentBotSearchMode = "movetime";
  state.bots.currentBotNodes = 1;
}

function clearBotTournamentHumanGameState() {
  state.botTournamentHumanGame.active = false;
  state.botTournamentHumanGame.tournamentId = "";
  state.botTournamentHumanGame.pairingKey = "";
  state.botTournamentHumanGame.humanColor = "w";
  state.botTournamentHumanGame.humanName = "";
  state.botTournamentHumanGame.resultReported = false;
}

async function ensurePreferredAnalysisEngineConnected() {
  const engine = getPreferredAnalysisEngineRecord();
  if (!engine) {
    const message = "No analysis engine is configured in Load Engine.";
    setEngineStatus(message, true);
    showAppMessage(message, 2600);
    return false;
  }
  return connectTemporaryRuntimeEngine(engine.id, engine.path, engine.name || "Engine");
}

async function ensureFairyEngineConnectedForVariants() {
  const fairy = getBuiltinFairyEngineRecord();
  if (!fairy) {
    const message = "Bundled Fairy-Stockfish engine was not found.";
    setEngineStatus(message, true);
    showAppMessage(message, 2600);
    return false;
  }
  return connectTemporaryRuntimeEngine(fairy.id, fairy.path, fairy.name || "Fairy-Stockfish");
}

function normalizeChess960VariantStartSettings(settings = {}) {
  const colorRaw = String(settings.color || "random").trim().toLowerCase();
  const strengthNumber = Number(settings.strength);
  const modeRaw = String(settings.positionMode || "random").trim().toLowerCase();
  const positionNumber = Number(settings.positionNumber);
  return {
    color: colorRaw === "white" || colorRaw === "w" ? "w" : colorRaw === "black" || colorRaw === "b" ? "b" : "random",
    strength: Number.isInteger(strengthNumber) ? Math.max(1, Math.min(8, strengthNumber)) : 4,
    positionMode: modeRaw === "number" ? "number" : "random",
    positionNumber: Number.isInteger(positionNumber) ? positionNumber : null
  };
}

async function applyChess960StrengthPreset(strength) {
  const level = Math.max(1, Math.min(8, Number(strength) || 4));
  const skillLevel = Math.round(((level - 1) / 7) * 19);
  const elo = 1100 + (level - 1) * 170;
  const limitStrength = level < 8;
  const preset = { skillLevel, limitStrength, elo };
  await sendOptionIfSupported("Skill Level", preset.skillLevel);
  await sendOptionIfSupported("UCI_LimitStrength", preset.limitStrength ? "true" : "false");
  if (preset.limitStrength && preset.elo !== null) {
    await sendOptionIfSupported("UCI_Elo", preset.elo);
  }
  const readyRes = await ipcRenderer.invoke("engine:send", "isready");
  if (!readyRes?.ok) {
    throw new Error(readyRes?.error || "Engine did not acknowledge Chess960 strength settings.");
  }
}

async function autoConnectDefaultEngineOnStartup() {
  normalizeDefaultEngine();
  const defaultEngine = getDefaultEngineRecord();
  if (!defaultEngine) {
    setEngineStatus("Disconnected");
    return;
  }
  state.selectedEngine = defaultEngine.id;
  renderEngineRegistry();
  await connectSelectedEngine();
}

function setupNewBoardForSelectedTimeControl(startFen = null, player2ColorOverride = null) {
  stopCurrentEngineSearch();
  clearAnalysisState();
  state.online.currentGameId = "";
  state.online.finished = false;
  state.online.finishStatus = "";
  state.online.finishWinner = "";
  state.online.userFlipped = false;
  setAppMode("play");
  if (player2ColorOverride === "w" || player2ColorOverride === "b") {
    state.player2Color = player2ColorOverride;
  } else if (player2ColorOverride === "random") {
    state.player2Color = Math.random() < 0.5 ? "w" : "b";
  } else if (state.player2ColorPref === "w" || state.player2ColorPref === "b") {
    state.player2Color = state.player2ColorPref;
  } else {
    state.player2Color = Math.random() < 0.5 ? "w" : "b";
  }
  state.currentVariant = "standard";
  const defaultFen = new Chess().fen();
  state.playStartFen = typeof startFen === "string" && startFen.trim() ? startFen.trim() : defaultFen;
  state.boardFlipped = state.player2Color === "b";
  showGameScreen();
  resetGame();
  playGameStartNotify();
}

async function startCuratedBotGame(botId) {
  const bot = getCuratedBots().find((item) => item.id === botId);
  if (!bot) {
    return { ok: false, error: "Bot was not found." };
  }
  const displayName = String(bot.displayName || bot.name || "Bot").trim() || "Bot";
  const isLc0LikeBot = bot.kind === "lc0";
  if (!bot.enginePath) {
    return { ok: false, error: `${displayName} executable was not found.` };
  }
  try {
    const connected = await connectTemporaryRuntimeEngine(bot.id, bot.enginePath, displayName);
    if (!connected) {
      return { ok: false, error: `Unable to connect ${displayName}.` };
    }
    if (isLc0LikeBot) {
      const weightsValue = getLc0WeightsOptionValue(bot.enginePath, bot.weightsPath);
      await sendOptionIfSupported("WeightsFile", weightsValue);
      const readyRes = await ipcRenderer.invoke("engine:send", "isready");
      if (!readyRes?.ok) {
        return { ok: false, error: readyRes?.error || "Lc0 bot did not acknowledge its weights file." };
      }
    }
    if (!(await ensureStandardEngineMode())) {
      return { ok: false, error: "Unable to set standard chess mode." };
    }
    state.isUnlimitedTime = true;
    selectedInitialClockMs = INITIAL_CLOCK_MS;
    selectedIncrementMs = 0;
    pendingEditorPlayFen = null;
    state.bots.active = true;
    state.bots.currentBotId = bot.id;
    state.bots.currentBotDisplayName = displayName;
    state.bots.currentBotSearchMode = isLc0LikeBot ? (bot.searchMode || "nodes") : "movetime";
    state.bots.currentBotNodes = isLc0LikeBot ? Math.max(1, Number(bot.nodes) || 1) : 1;
    clearBotTournamentHumanGameState();
    setupNewBoardForSelectedTimeControl(null, "random");
    render();
    return { ok: true };
  } catch (err) {
    console.error(`Failed to start curated bot ${displayName}:`, err);
    return { ok: false, error: String(err?.message || err) };
  }
}

async function startBotTournamentHumanMatch(config = {}) {
  const bot = config?.bot;
  if (!bot?.enginePath) {
    throw new Error("Bot executable was not found for this tournament pairing.");
  }
  const displayName = String(bot.displayName || bot.name || "Bot").trim() || "Bot";
  const isLc0LikeBot = bot.kind === "lc0";
  const humanColor = config?.humanColor === "b" ? "b" : "w";
  const initialMs = Math.max(1000, Number(config?.initialMs || INITIAL_CLOCK_MS));
  const incrementMs = Math.max(0, Number(config?.incrementMs || 0));
  const humanName = String(config?.humanName || state.profile.name || "You").trim() || "You";
  const connected = await connectTemporaryRuntimeEngine(bot.id, bot.enginePath, displayName);
  if (!connected) {
    throw new Error(`Unable to connect ${displayName}.`);
  }
  if (isLc0LikeBot) {
    const weightsValue = getLc0WeightsOptionValue(bot.enginePath, bot.weightsPath);
    await sendOptionIfSupported("WeightsFile", weightsValue);
    const readyRes = await ipcRenderer.invoke("engine:send", "isready");
    if (!readyRes?.ok) {
      throw new Error(readyRes?.error || "Lc0 bot did not acknowledge its weights file.");
    }
  }
  if (!(await ensureStandardEngineMode())) {
    throw new Error("Unable to set standard chess mode.");
  }
  state.isUnlimitedTime = false;
  selectedInitialClockMs = initialMs;
  selectedIncrementMs = incrementMs;
  pendingEditorPlayFen = null;
  state.bots.active = true;
  state.bots.currentBotId = bot.id;
  state.bots.currentBotDisplayName = displayName;
  state.bots.currentBotSearchMode = isLc0LikeBot ? (bot.searchMode || "nodes") : "movetime";
  state.bots.currentBotNodes = isLc0LikeBot ? Math.max(1, Number(bot.nodes) || 1) : 1;
  clearBotTournamentSpectatorState();
  clearBotTournamentHumanGameState();
  state.botTournamentHumanGame.active = true;
  state.botTournamentHumanGame.tournamentId = String(config?.tournamentId || "");
  state.botTournamentHumanGame.pairingKey = String(config?.pairingKey || "");
  state.botTournamentHumanGame.humanColor = humanColor;
  state.botTournamentHumanGame.humanName = humanName;
  state.botTournamentHumanGame.resultReported = false;
  setupNewBoardForSelectedTimeControl(null, humanColor);
  render();
}

function openBotTournamentSpectatorGame(snapshot) {
  applyBotTournamentSpectatorSnapshot(snapshot, { open: true });
}

function updateBotTournamentSpectatorGame(snapshot) {
  if (!isBotTournamentSpectatorMode()) return;
  if (String(state.botTournamentSpectator.tournamentId || "") !== String(snapshot?.tournamentId || "")) return;
  if (String(state.botTournamentSpectator.pairingKey || "") !== String(snapshot?.pairingKey || "")) return;
  applyBotTournamentSpectatorSnapshot(snapshot, { open: false });
}

function exitBotTournamentSpectatorGame() {
  clearBotTournamentSpectatorState();
  ensureBotTournamentModule().showLiveScreen();
}

async function startChess960VariantGame(settings = {}) {
  try {
    const config = normalizeChess960VariantStartSettings(settings);
    await loadFairyApi();
    if (!(await ensureFairyEngineConnectedForVariants())) return false;
    const startFen = config.positionMode === "number"
      ? generateFenFromPositionNumber(config.positionNumber)
      : generateRandomFen();
    if (!startFen) {
      throw new Error("Invalid Chess960 position number.");
    }
    const modeResult = await setEngineVariantMode("fischerandom");
    if (!modeResult.ok) {
      setEngineStatus(modeResult.error, true);
      showAppMessage(modeResult.error);
      return false;
    }
    await applyChess960StrengthPreset(config.strength);
    state.isUnlimitedTime = true;
    state.currentVariant = "chess960";
    stopCurrentEngineSearch();
    clearAnalysisState();
    state.online.currentGameId = "";
    state.online.finished = false;
    state.online.finishStatus = "";
    state.online.finishWinner = "";
    state.online.userFlipped = false;
    state.player2Color = config.color === "random" ? (Math.random() < 0.5 ? "w" : "b") : config.color;
    state.playStartFen = startFen;
    state.boardFlipped = state.player2Color === "b";
    setAppMode("play");
    showGameScreen();
    resetGame();
    playGameStartNotify();
    render();
    return true;
  } catch (err) {
    console.error("Failed to start Chess960 variant game:", err);
    showAppMessage(`Chess960 start failed: ${String(err?.message || err)}`, 3200);
    showToolsScreen();
    render();
    return false;
  }
}

function normalizeVariantColorAndStrengthSettings(settings = {}) {
  const colorRaw = String(settings.color || "random").trim().toLowerCase();
  const strengthNumber = Number(settings.strength);
  return {
    color: colorRaw === "white" || colorRaw === "w" ? "w" : colorRaw === "black" || colorRaw === "b" ? "b" : "random",
    strength: Number.isInteger(strengthNumber) ? Math.max(1, Math.min(8, strengthNumber)) : 4
  };
}

async function startThreeCheckVariantGame(settings = {}) {
  try {
    const config = normalizeVariantColorAndStrengthSettings(settings);
    const startFen = getDefaultStartFenForVariant("threecheck");
    await loadFairyApi();
    if (!(await ensureFairyEngineConnectedForVariants())) return false;
    const modeResult = await setEngineVariantMode("3check");
    if (!modeResult.ok) {
      setEngineStatus(modeResult.error, true);
      showAppMessage(modeResult.error);
      return false;
    }
    await applyChess960StrengthPreset(config.strength);
    state.isUnlimitedTime = true;
    state.currentVariant = "threecheck";
    stopCurrentEngineSearch();
    clearAnalysisState();
    state.online.currentGameId = "";
    state.online.finished = false;
    state.online.finishStatus = "";
    state.online.finishWinner = "";
    state.online.userFlipped = false;
    state.player2Color = config.color === "random" ? (Math.random() < 0.5 ? "w" : "b") : config.color;
    state.playStartFen = startFen;
    state.boardFlipped = state.player2Color === "b";
    setAppMode("play");
    showGameScreen();
    resetGame();
    playGameStartNotify();
    render();
    return true;
  } catch (err) {
    console.error("Failed to start Three-check variant game:", err);
    showAppMessage(`Three-check start failed: ${String(err?.message || err)}`, 3200);
    showToolsScreen();
    render();
    return false;
  }
}

async function startKingOfTheHillVariantGame(settings = {}) {
  try {
    const config = normalizeVariantColorAndStrengthSettings(settings);
    const startFen = getDefaultStartFenForVariant("kingofthehill");
    await loadFairyApi();
    if (!(await ensureFairyEngineConnectedForVariants())) return false;
    const modeResult = await setEngineVariantMode("kingofthehill");
    if (!modeResult.ok) {
      setEngineStatus(modeResult.error, true);
      showAppMessage(modeResult.error);
      return false;
    }
    await applyChess960StrengthPreset(config.strength);
    state.isUnlimitedTime = true;
    state.currentVariant = "kingofthehill";
    stopCurrentEngineSearch();
    clearAnalysisState();
    state.online.currentGameId = "";
    state.online.finished = false;
    state.online.finishStatus = "";
    state.online.finishWinner = "";
    state.online.userFlipped = false;
    state.player2Color = config.color === "random" ? (Math.random() < 0.5 ? "w" : "b") : config.color;
    state.playStartFen = startFen;
    state.boardFlipped = state.player2Color === "b";
    setAppMode("play");
    showGameScreen();
    resetGame();
    playGameStartNotify();
    render();
    return true;
  } catch (err) {
    console.error("Failed to start King of the Hill variant game:", err);
    showAppMessage(`King of the Hill start failed: ${String(err?.message || err)}`, 3200);
    showToolsScreen();
    render();
    return false;
  }
}

async function startAntichessVariantGame(settings = {}) {
  try {
    const config = normalizeVariantColorAndStrengthSettings(settings);
    const startFen = getDefaultStartFenForVariant("antichess");
    await loadFairyApi();
    if (!(await ensureFairyEngineConnectedForVariants())) return false;
    const modeResult = await setEngineVariantMode("antichess");
    if (!modeResult.ok) {
      setEngineStatus(modeResult.error, true);
      showAppMessage(modeResult.error);
      return false;
    }
    await applyChess960StrengthPreset(config.strength);
    state.isUnlimitedTime = true;
    state.currentVariant = "antichess";
    stopCurrentEngineSearch();
    clearAnalysisState();
    state.online.currentGameId = "";
    state.online.finished = false;
    state.online.finishStatus = "";
    state.online.finishWinner = "";
    state.online.userFlipped = false;
    state.player2Color = config.color === "random" ? (Math.random() < 0.5 ? "w" : "b") : config.color;
    state.playStartFen = startFen;
    state.boardFlipped = state.player2Color === "b";
    setAppMode("play");
    showGameScreen();
    resetGame();
    playGameStartNotify();
    render();
    return true;
  } catch (err) {
    console.error("Failed to start Antichess variant game:", err);
    showAppMessage(`Antichess start failed: ${String(err?.message || err)}`, 3200);
    showToolsScreen();
    render();
    return false;
  }
}

async function startAtomicVariantGame(settings = {}) {
  try {
    const config = normalizeVariantColorAndStrengthSettings(settings);
    const startFen = getDefaultStartFenForVariant("atomic");
    await loadFairyApi();
    if (!(await ensureFairyEngineConnectedForVariants())) return false;
    const modeResult = await setEngineVariantMode("atomic");
    if (!modeResult.ok) {
      setEngineStatus(modeResult.error, true);
      showAppMessage(modeResult.error);
      return false;
    }
    await applyChess960StrengthPreset(config.strength);
    state.isUnlimitedTime = true;
    state.currentVariant = "atomic";
    stopCurrentEngineSearch();
    clearAnalysisState();
    state.online.currentGameId = "";
    state.online.finished = false;
    state.online.finishStatus = "";
    state.online.finishWinner = "";
    state.online.userFlipped = false;
    state.player2Color = config.color === "random" ? (Math.random() < 0.5 ? "w" : "b") : config.color;
    state.playStartFen = startFen;
    state.boardFlipped = state.player2Color === "b";
    setAppMode("play");
    showGameScreen();
    resetGame();
    playGameStartNotify();
    render();
    return true;
  } catch (err) {
    console.error("Failed to start Atomic variant game:", err);
    showAppMessage(`Atomic start failed: ${String(err?.message || err)}`, 3200);
    showToolsScreen();
    render();
    return false;
  }
}

async function startHordeVariantGame(settings = {}) {
  try {
    const config = normalizeVariantColorAndStrengthSettings(settings);
    const startFen = getDefaultStartFenForVariant("horde");
    await loadFairyApi();
    if (!(await ensureFairyEngineConnectedForVariants())) return false;
    const modeResult = await setEngineVariantMode("horde");
    if (!modeResult.ok) {
      setEngineStatus(modeResult.error, true);
      showAppMessage(modeResult.error);
      return false;
    }
    await applyChess960StrengthPreset(config.strength);
    state.isUnlimitedTime = true;
    state.currentVariant = "horde";
    stopCurrentEngineSearch();
    clearAnalysisState();
    state.online.currentGameId = "";
    state.online.finished = false;
    state.online.finishStatus = "";
    state.online.finishWinner = "";
    state.online.userFlipped = false;
    state.player2Color = config.color === "random" ? (Math.random() < 0.5 ? "w" : "b") : config.color;
    state.playStartFen = startFen;
    state.boardFlipped = state.player2Color === "b";
    setAppMode("play");
    showGameScreen();
    resetGame();
    playGameStartNotify();
    render();
    return true;
  } catch (err) {
    console.error("Failed to start Horde variant game:", err);
    showAppMessage(`Horde start failed: ${String(err?.message || err)}`, 3200);
    showToolsScreen();
    render();
    return false;
  }
}

async function startRacingKingsVariantGame(settings = {}) {
  try {
    const config = normalizeVariantColorAndStrengthSettings(settings);
    const startFen = getDefaultStartFenForVariant("racingkings");
    await loadFairyApi();
    if (!(await ensureFairyEngineConnectedForVariants())) return false;
    const modeResult = await setEngineVariantMode("racingkings");
    if (!modeResult.ok) {
      setEngineStatus(modeResult.error, true);
      showAppMessage(modeResult.error);
      return false;
    }
    await applyChess960StrengthPreset(config.strength);
    state.isUnlimitedTime = true;
    state.currentVariant = "racingkings";
    stopCurrentEngineSearch();
    clearAnalysisState();
    state.online.currentGameId = "";
    state.online.finished = false;
    state.online.finishStatus = "";
    state.online.finishWinner = "";
    state.online.userFlipped = false;
    state.player2Color = config.color === "random" ? (Math.random() < 0.5 ? "w" : "b") : config.color;
    state.playStartFen = startFen;
    state.boardFlipped = state.player2Color === "b";
    setAppMode("play");
    showGameScreen();
    resetGame();
    playGameStartNotify();
    render();
    return true;
  } catch (err) {
    console.error("Failed to start Racing Kings variant game:", err);
    showAppMessage(`Racing Kings start failed: ${String(err?.message || err)}`, 3200);
    showToolsScreen();
    render();
    return false;
  }
}

async function startCrazyhouseVariantGame(settings = {}) {
  try {
    const config = normalizeVariantColorAndStrengthSettings(settings);
    const startFen = getDefaultStartFenForVariant("crazyhouse");
    await loadFairyApi();
    if (!(await ensureFairyEngineConnectedForVariants())) return false;
    const modeResult = await setEngineVariantMode("crazyhouse");
    if (!modeResult.ok) {
      setEngineStatus(modeResult.error, true);
      showAppMessage(modeResult.error);
      return false;
    }
    await applyChess960StrengthPreset(config.strength);
    state.isUnlimitedTime = true;
    state.currentVariant = "crazyhouse";
    stopCurrentEngineSearch();
    clearAnalysisState();
    state.online.currentGameId = "";
    state.online.finished = false;
    state.online.finishStatus = "";
    state.online.finishWinner = "";
    state.online.userFlipped = false;
    state.player2Color = config.color === "random" ? (Math.random() < 0.5 ? "w" : "b") : config.color;
    state.playStartFen = startFen;
    state.boardFlipped = state.player2Color === "b";
    setAppMode("play");
    showGameScreen();
    resetGame();
    playGameStartNotify();
    render();
    return true;
  } catch (err) {
    console.error("Failed to start Crazyhouse variant game:", err);
    showAppMessage(`Crazyhouse start failed: ${String(err?.message || err)}`, 3200);
    showToolsScreen();
    render();
    return false;
  }
}

function resetStandaloneGame(startFen, options = {}) {
  stopCurrentEngineSearch();
  clearAnalysisState();
  state.online.currentGameId = "";
  state.online.finished = false;
  state.online.finishStatus = "";
  state.online.finishWinner = "";
  state.online.userFlipped = false;
  state.currentVariant = "standard";
  const defaultFen = new Chess().fen();
  state.currentGameStartFen = typeof startFen === "string" && startFen.trim() ? startFen.trim() : defaultFen;
  state.game = new Chess();
  try {
    state.game.load(state.currentGameStartFen);
  } catch (_) {
    state.currentGameStartFen = defaultFen;
    state.game.load(defaultFen);
  }
  state.viewPly = getLatestPly();
  state.analysisPgnMeta = { tags: {}, rootComments: [] };
  markAnalysisPgnDirty();
  state.analysisTree = null;
  state.timeoutLoser = null;
  state.resignedColor = null;
  clearResignConfirmation();
  state.isUnlimitedTime = true;
  state.boardFlipped = !!options.boardFlipped;
  state.clocks.lastTickTs = null;
  state.sound.lowTimePlayed.w = false;
  state.sound.lowTimePlayed.b = false;
  state.sound.gameEndKey = "";
  closePromotionMenu();
  clearSelection();
  clearPremove();
  clearBoardAnnotations();
}

function clearBotTournamentSpectatorState() {
  state.botTournamentSpectator.active = false;
  state.botTournamentSpectator.tournamentId = "";
  state.botTournamentSpectator.pairingKey = "";
  state.botTournamentSpectator.whiteName = "";
  state.botTournamentSpectator.blackName = "";
  state.botTournamentSpectator.whiteStartMs = 0;
  state.botTournamentSpectator.blackStartMs = 0;
  state.botTournamentSpectator.whiteMs = 0;
  state.botTournamentSpectator.blackMs = 0;
  state.botTournamentSpectator.incrementMs = 0;
  state.botTournamentSpectator.activeColor = "w";
}

function applyBotTournamentSpectatorSnapshot(snapshot, { open = false } = {}) {
  const startFen = String(snapshot?.startFen || new Chess().fen()).trim() || new Chess().fen();
  const moveList = Array.isArray(snapshot?.moves) ? snapshot.moves : [];
  const preserveFlip = !!state.boardFlipped;
  const previousPly = isBotTournamentSpectatorMode() ? getLatestPly() : 0;
  if (!isBotTournamentSpectatorMode() || open) {
    resetStandaloneGame(startFen, { boardFlipped: false });
    setAppMode("play");
    clearBotGameContext();
    state.isUnlimitedTime = false;
    selectedInitialClockMs = Math.max(1000, Number(snapshot?.initialMs || INITIAL_CLOCK_MS));
    selectedIncrementMs = Math.max(0, Number(snapshot?.incrementMs || 0));
    state.botTournamentSpectator.active = true;
    if (open) {
      state.boardFlipped = false;
      showGameScreen();
    }
  }
  state.game = new Chess();
  try {
    state.game.load(startFen);
    state.currentGameStartFen = startFen;
  } catch (_) {
    state.game = new Chess();
    state.currentGameStartFen = new Chess().fen();
  }
  for (const uci of moveList) {
    const parsed = parseMoveUci(uci);
    if (!parsed) break;
    const applied = state.game.move(parsed);
    if (!applied) break;
  }
  state.viewPly = getLatestPly();
  if (!open) {
    state.boardFlipped = preserveFlip;
  }
  state.botTournamentSpectator.tournamentId = String(snapshot?.tournamentId || "");
  state.botTournamentSpectator.pairingKey = String(snapshot?.pairingKey || "");
  state.botTournamentSpectator.whiteName = String(snapshot?.whiteName || "White");
  state.botTournamentSpectator.blackName = String(snapshot?.blackName || "Black");
  state.botTournamentSpectator.whiteStartMs = Math.max(0, Number(snapshot?.whiteStartMs || snapshot?.initialMs || 0));
  state.botTournamentSpectator.blackStartMs = Math.max(0, Number(snapshot?.blackStartMs || snapshot?.initialMs || 0));
  state.botTournamentSpectator.whiteMs = Math.max(0, Number(snapshot?.whiteMs || 0));
  state.botTournamentSpectator.blackMs = Math.max(0, Number(snapshot?.blackMs || 0));
  state.botTournamentSpectator.incrementMs = Math.max(0, Number(snapshot?.incrementMs || 0));
  state.botTournamentSpectator.activeColor = String(snapshot?.activeColor || state.game.turn() || "w");
  state.clocks.whiteMs = state.botTournamentSpectator.whiteMs;
  state.clocks.blackMs = state.botTournamentSpectator.blackMs;
  state.clocks.lastTickTs = null;
  const nextPly = getLatestPly();
  if (!open && nextPly > previousPly) {
    const history = state.game.history({ verbose: true });
    playSoundForVerboseMove(history[history.length - 1]);
  }
  render();
}

function cloneCurrentGame() {
  if (isCurrentFairyVariantGame()) {
    return state.game.clone();
  }
  const defaultFen = new Chess().fen();
  const baseFen =
    state.appMode === "play" && state.playStartFen && state.playStartFen !== defaultFen
      ? state.playStartFen
      : null;
  const clone = new Chess();
  if (baseFen) {
    try {
      clone.load(baseFen);
    } catch (_) {
      // fallback to standard start position
    }
  }
  const history = state.game.history({ verbose: true });
  for (const mv of history) {
    const ok = clone.move({
      from: mv.from,
      to: mv.to,
      promotion: mv.promotion
    });
    if (!ok) break;
  }
  return clone;
}

async function openPostGameAnalysis() {
  if (!isGameInteractionLocked()) {
    return;
  }
  if (isCurrentFairyVariantGame()) {
    if (!(await ensureFairyEngineConnectedForVariants())) return;
    const variantModeRes = await setEngineVariantMode(getCurrentFairyVariantName());
    if (!variantModeRes.ok) {
      setEngineStatus(variantModeRes.error, true);
      showAppMessage(variantModeRes.error);
      return;
    }
    stopCurrentEngineSearch();
    clearAnalysisState();
    state.timeoutLoser = null;
    state.resignedColor = null;
    clearResignConfirmation();
    state.analysisPgnMeta = {
      tags: {
        Variant: getCurrentVariantDisplayName(),
        VariantName: getCurrentVariantDisplayName(),
        SetUp: "1",
        FEN: state.currentGameStartFen || state.playStartFen || getDefaultStartFenForVariant(state.currentVariant),
        Result: getFinishedGameResultInfo().result,
        Termination: getFinishedGameResultInfo().termination
      },
      rootComments: []
    };
    setAppMode("analysis");
    buildAnalysisTreeFromGame(state.currentGameStartFen || state.playStartFen || null);
    const tree = getAnalysisTree();
    tree.currentId = getAnalysisMainlineLeafFrom(tree.rootId);
    state.game = buildGameFromAnalysisNode(tree.currentId);
    state.viewPly = getLatestPly();
    render();
    updateAnalysisPgnText(true);
    renderAnalysisInfoPanel();
    return;
  }
  const gameSnapshot = cloneCurrentGame();
  if (!(await ensurePreferredAnalysisEngineConnected())) return;
  if (!(await ensureStandardEngineMode())) return;
  stopCurrentEngineSearch();
  clearAnalysisState();
  state.timeoutLoser = null;
  state.resignedColor = null;
  clearResignConfirmation();
  state.analysisPgnMeta = { tags: {}, rootComments: [] };
  setAppMode("analysis");
  state.game = gameSnapshot;
  const baseFen =
    state.currentGameStartFen && state.currentGameStartFen !== new Chess().fen()
      ? state.currentGameStartFen
      : state.playStartFen || null;
  buildAnalysisTreeFromGame(baseFen);
  const tree = getAnalysisTree();
  tree.currentId = getAnalysisMainlineLeafFrom(tree.rootId);
  state.game = buildGameFromAnalysisNode(tree.currentId);
  state.viewPly = getLatestPly();
  markAnalysisPgnDirty();
  clearSelection();
  clearPremove();
  render();
}

function setViewPly(nextPly) {
  const prevPly = state.viewPly;
  const latest = getLatestPly();
  const clamped = Math.max(0, Math.min(latest, nextPly));
  if (clamped !== state.viewPly) {
    state.viewPly = clamped;
  }
  if (!isEditorLikeMode() && clamped !== prevPly) {
    const history = state.game.history({ verbose: true });
    if (clamped > prevPly) {
      const mv = history[clamped - 1];
      playSoundForVerboseMove(mv);
    } else {
      const mv = history[Math.max(0, prevPly - 1)];
      playSoundForVerboseMove(mv);
    }
  }
  if (state.appMode === "tablebase" && clamped !== prevPly) {
    requestTablebaseForFen(getViewGame().fen());
  }
  if (state.appMode === "analysis") {
    setAnalysisTreeCurrentByPly(state.viewPly);
  }
  closePromotionMenu();
  clearPremove();
  clearSelection();
  if (state.appMode === "analysis") {
    requestAnalysisForCurrentPosition(true);
  }
  render();
}

function hideMoveContextMenu() {
  moveContextTargetPly = null;
  if (moveContextMenuEl) {
    moveContextMenuEl.classList.add("hidden");
  }
}

function hideVariationPickerMenu() {
  if (variationPickerMenuEl) {
    variationPickerMenuEl.classList.add("hidden");
    variationPickerMenuEl.innerHTML = "";
  }
}

function hideArchiveContextMenu() {
  archiveContextTargetPath = "";
  if (archiveContextMenuEl) {
    archiveContextMenuEl.classList.add("hidden");
  }
}

function showArchiveContextMenu(x, y, filePath) {
  if (!archiveContextMenuEl) return;
  archiveContextTargetPath = String(filePath || "");
  archiveContextMenuEl.classList.remove("hidden");
  const menuRect = archiveContextMenuEl.getBoundingClientRect();
  const maxLeft = Math.max(8, window.innerWidth - menuRect.width - 8);
  const maxTop = Math.max(8, window.innerHeight - menuRect.height - 8);
  const left = Math.max(8, Math.min(x, maxLeft));
  const top = Math.max(8, Math.min(y, maxTop));
  archiveContextMenuEl.style.left = `${left}px`;
  archiveContextMenuEl.style.top = `${top}px`;
}

function showMoveContextMenu(x, y, ply) {
  hideVariationPickerMenu();
  if (!moveContextMenuEl) return;
  moveContextTargetPly = ply;
  moveContextMenuEl.classList.remove("hidden");
  const menuRect = moveContextMenuEl.getBoundingClientRect();
  const maxLeft = Math.max(8, window.innerWidth - menuRect.width - 8);
  const maxTop = Math.max(8, window.innerHeight - menuRect.height - 8);
  const left = Math.max(8, Math.min(x, maxLeft));
  const top = Math.max(8, Math.min(y, maxTop));
  moveContextMenuEl.style.left = `${left}px`;
  moveContextMenuEl.style.top = `${top}px`;
}

function showVariationPickerMenu(x, y, parentId, activeChildId) {
  hideMoveContextMenu();
  if (!variationPickerMenuEl) return;
  const parent = getAnalysisTreeNode(parentId);
  if (!parent || !Array.isArray(parent.children) || parent.children.length < 2) return;

  variationPickerMenuEl.innerHTML = "";
  for (let i = 0; i < parent.children.length; i += 1) {
    const childId = parent.children[i];
    const child = getAnalysisTreeNode(childId);
    if (!child) continue;
    const item = document.createElement("button");
    item.type = "button";
    item.className = "variation-picker-item";
    if (childId === activeChildId) item.classList.add("active");
    item.dataset.childId = childId;
    item.textContent = `${i + 1}. ${child.san || child.uci || "Variation"}`;
    variationPickerMenuEl.appendChild(item);
  }

  if (!variationPickerMenuEl.children.length) return;
  variationPickerMenuEl.classList.remove("hidden");
  const menuRect = variationPickerMenuEl.getBoundingClientRect();
  const maxLeft = Math.max(8, window.innerWidth - menuRect.width - 8);
  const maxTop = Math.max(8, window.innerHeight - menuRect.height - 8);
  const left = Math.max(8, Math.min(x, maxLeft));
  const top = Math.max(8, Math.min(y, maxTop));
  variationPickerMenuEl.style.left = `${left}px`;
  variationPickerMenuEl.style.top = `${top}px`;
}

function truncateMovesAfterPly(ply) {
  if (!hasMoveTreeMode()) return;
  const displayedNodePath = getAnalysisDisplayedLineNodeIds();
  const latest = displayedNodePath.length - 1;
  if (!Number.isFinite(ply)) return;
  const keepPly = Math.max(0, Math.min(latest, Math.floor(ply)));
  if (keepPly >= latest) return;

  const targetNodeId = displayedNodePath[keepPly];
  if (!targetNodeId) return;
  deleteAnalysisSubtreeFromNode(targetNodeId);
  setAnalysisCurrentNode(targetNodeId, false);
  setAnalysisTreeCurrentByPly(keepPly);
  state.viewPly = keepPly;
  closePromotionMenu();
  clearPremove();
  clearSelection();
  if (state.appMode === "analysis") {
    clearAnalysisState();
  } else if (state.appMode === "tablebase") {
    requestTablebaseForFen(state.game.fen());
  }
  render();
}

document.addEventListener("pointerdown", (event) => {
  if (!state.promotion) return;
  if (promotionMenuEl.contains(event.target)) return;

  closePromotionMenu();
  clearSelection();
  render();
});

boardShellEl.addEventListener("contextmenu", (event) => {
  event.preventDefault();
});

moveListEl.addEventListener("click", (event) => {
  if (suppressNextMoveListClick) {
    suppressNextMoveListClick = false;
    event.preventDefault();
    return;
  }
  if (isTablebaseTrainingActive()) {
    hideMoveContextMenu();
    hideVariationPickerMenu();
    return;
  }
  hideMoveContextMenu();
  const chip = event.target.closest(".variation-chip");
  if (chip && hasMoveTreeMode() && !isTablebaseTrainingActive()) {
    event.preventDefault();
    const parentId = chip.dataset.parentId;
    const activeChildId = chip.dataset.activeChildId;
    if (parentId && activeChildId) {
      showVariationPickerMenu(event.clientX, event.clientY, parentId, activeChildId);
    }
    return;
  }
  hideVariationPickerMenu();
  const cell = event.target.closest(".move-cell");
  if (!cell) return;
  const ply = Number(cell.dataset.ply);
  if (!Number.isFinite(ply)) return;
  setViewPly(ply);
});

moveListEl.addEventListener("contextmenu", (event) => {
  if (!hasMoveTreeMode() || isTablebaseTrainingActive()) return;
  hideVariationPickerMenu();
  const cell = event.target.closest(".move-cell");
  if (!cell) return;
  event.preventDefault();
  event.stopPropagation();
  suppressNextMoveListClick = true;
  const ply = Number(cell.dataset.ply);
  if (!Number.isFinite(ply)) return;
  showMoveContextMenu(event.clientX, event.clientY, ply);
});

if (analysisComputerSummaryPanelEl) {
  const activateBoardAnalysisSummaryStat = (target) => {
    const stat = target.closest("[data-board-judgment-side][data-board-judgment-type]");
    if (!stat) return false;
    cycleBoardAnalysisJudgment(stat.getAttribute("data-board-judgment-side"), stat.getAttribute("data-board-judgment-type"));
    return true;
  };
  analysisComputerSummaryPanelEl.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    activateBoardAnalysisSummaryStat(event.target);
  });
  analysisComputerSummaryPanelEl.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    if (!(event.target instanceof Element)) return;
    if (!activateBoardAnalysisSummaryStat(event.target)) return;
    event.preventDefault();
  });
}

window.addEventListener("keydown", (event) => {
  if (state.appMode !== "play" && !hasMoveTreeMode() && state.appMode !== "puzzle") return;
  const target = event.target;
  if (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.tagName === "SELECT")
  ) {
    return;
  }
  if (isTablebaseTrainingActive()) {
    return;
  }
  if (event.key === "ArrowRight") {
    event.preventDefault();
    setViewPly(state.viewPly + 1);
  } else if (event.key === "ArrowLeft") {
    event.preventDefault();
    setViewPly(state.viewPly - 1);
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    setViewPly(0);
  } else if (event.key === "ArrowDown") {
    event.preventDefault();
    setViewPly(getLatestPly());
  } else if (event.key === "Delete") {
    if (!hasMoveTreeMode() || isTablebaseTrainingActive()) return;
    event.preventDefault();
    truncateMovesAfterPly(state.viewPly);
  }
});

if (deleteFromHereBtnEl) {
  deleteFromHereBtnEl.addEventListener("click", () => {
    const ply = moveContextTargetPly;
    hideMoveContextMenu();
    truncateMovesAfterPly(ply);
  });
}

if (archiveDeleteBtnEl) {
  archiveDeleteBtnEl.addEventListener("click", async () => {
    const filePath = archiveContextTargetPath;
    hideArchiveContextMenu();
    if (!filePath) return;
    const ok = await deleteArchiveGame(filePath);
    if (ok) {
      showAppMessage("Game deleted.");
    }
  });
}

if (btnArchiveDeleteAllEl) {
  btnArchiveDeleteAllEl.addEventListener("click", () => {
    promptDeleteAllArchiveGamesForCurrentTab();
  });
}

if (archiveDeleteConfirmCloseEl) {
  archiveDeleteConfirmCloseEl.addEventListener("click", () => {
    closeArchiveDeleteConfirmModal();
  });
}

if (archiveDeleteConfirmCancelEl) {
  archiveDeleteConfirmCancelEl.addEventListener("click", () => {
    closeArchiveDeleteConfirmModal();
  });
}

if (archiveDeleteConfirmAcceptEl) {
  archiveDeleteConfirmAcceptEl.addEventListener("click", async () => {
    if (!pendingArchiveBulkDelete) return;
    closeArchiveDeleteConfirmModal();
    await deleteAllArchiveGamesForCurrentTab();
  });
}

if (variationPickerMenuEl) {
  variationPickerMenuEl.addEventListener("click", (event) => {
    const item = event.target.closest(".variation-picker-item");
    if (!item) return;
    const childId = item.dataset.childId;
    if (!childId) return;
    hideVariationPickerMenu();
    setAnalysisCurrentNode(childId, true, true);
  });
}

document.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  if (!moveContextMenuEl || moveContextMenuEl.classList.contains("hidden")) return;
  if (moveContextMenuEl.contains(event.target)) return;
  hideMoveContextMenu();
});

document.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  if (!variationPickerMenuEl || variationPickerMenuEl.classList.contains("hidden")) return;
  if (variationPickerMenuEl.contains(event.target)) return;
  hideVariationPickerMenu();
});

document.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  if (!archiveContextMenuEl || archiveContextMenuEl.classList.contains("hidden")) return;
  if (archiveContextMenuEl.contains(event.target)) return;
  hideArchiveContextMenu();
});

document.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  if (!homeProfileMenuEl || homeProfileMenuEl.classList.contains("hidden")) return;
  if (homeProfileEl && homeProfileEl.contains(event.target)) return;
  closeHomeProfileMenu();
});

document.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  if (!homeOnlineToolbarEl || homeOnlineToolbarEl.classList.contains("hidden")) return;
  if (homeOnlineToolbarEl.contains(event.target)) return;
  closeHomeOnlinePanels();
});

window.addEventListener("resize", hideMoveContextMenu);
window.addEventListener("scroll", hideMoveContextMenu, true);
window.addEventListener("resize", hideVariationPickerMenu);
window.addEventListener("scroll", hideVariationPickerMenu, true);
window.addEventListener("resize", hideArchiveContextMenu);
window.addEventListener("scroll", hideArchiveContextMenu, true);

rematchBtnEl.addEventListener("click", () => {
  if (isTablebaseTrainingActive()) {
    restartTablebaseTraining();
    return;
  }
  resetGame();
  playGameStartNotify();
});
flipBoardBtnEl.addEventListener("click", () => {
  if (isOnlineGameActive()) {
    state.online.userFlipped = true;
  }
  state.boardFlipped = !state.boardFlipped;
  render();
});
undoPairBtnEl.addEventListener("click", () => {
  if (!canUndoPair()) return;
  closePromotionMenu();
  clearPremove();
  clearSelection();
  clearResignConfirmation();
  state.game.undo();
  if (state.appMode !== "tablebase") {
    state.game.undo();
  }
  state.viewPly = getLatestPly();
  if (state.appMode === "tablebase") {
    if (state.analysisTree) {
      buildAnalysisTreeFromGame(state.currentGameStartFen || state.tablebase.session.startFen || null);
    }
    requestTablebaseForFen(state.game.fen());
  }
  render();
});
resignBtnEl.addEventListener("click", () => {
  if (isGameInteractionLocked() || !hasPlayer2MovedAtLeastOnce()) return;
  const now = Date.now();
  if (state.resignConfirmUntil > now) {
    clearResignConfirmation();
    closePromotionMenu();
    clearPremove();
    clearSelection();
    if (isOnlineGameActive()) {
      ipcRenderer
        .invoke("online:game:resign", { gameId: state.online.currentGameId })
        .then((res) => {
          if (!res?.ok) {
            showAppMessage(`Resign failed: ${res?.error || "unknown error"}`);
          }
        })
        .catch((err) => {
          showAppMessage(`Resign failed: ${String(err?.message || err)}`);
        });
    } else {
      state.resignedColor = state.player2Color;
      render();
    }
    return;
  }
  clearResignConfirmation();
  state.resignConfirmUntil = now + 5000;
  state.resignConfirmTimerId = window.setTimeout(() => {
    clearResignConfirmation();
    render();
  }, 5000);
  render();
});

if (onlineDrawBtnEl) {
  onlineDrawBtnEl.addEventListener("click", () => {
    if (!canOfferOnlineDraw()) return;
    const gameId = state.online.currentGameId;
    const offerState = getOnlineOfferState("draw");
    if (!gameId || offerState.ownPending || offerState.opponentPending) return;
    ipcRenderer
      .invoke("online:game:draw", { gameId, accept: true })
      .then((res) => {
        if (!res?.ok) {
          showAppMessage(`Draw action failed: ${res?.error || "unknown error"}`);
          return;
        }
        const active = getOnlineCurrentGameMeta();
        state.online.activeGames.set(gameId, {
          ...active,
          lastOwnDrawOfferPly: getLatestPly()
        });
        setOnlineOfferFlags("draw", { ownPending: true, opponentPending: false });
        render();
        showAppMessage("Draw offer sent.");
      })
      .catch((err) => {
        showAppMessage(`Draw action failed: ${String(err?.message || err)}`);
      });
  });
}

if (onlineDrawAcceptBtnEl) {
  onlineDrawAcceptBtnEl.addEventListener("click", () => {
    if (!isOnlineGameActive() || isGameInteractionLocked()) return;
    const gameId = state.online.currentGameId;
    ipcRenderer
      .invoke("online:game:draw", { gameId, accept: true })
      .then((res) => {
        if (!res?.ok) {
          showAppMessage(`Draw action failed: ${res?.error || "unknown error"}`);
          return;
        }
        setOnlineOfferFlags("draw", { ownPending: false, opponentPending: false });
        render();
        showAppMessage("Draw accepted.");
      })
      .catch((err) => {
        showAppMessage(`Draw action failed: ${String(err?.message || err)}`);
      });
  });
}

if (onlineDrawRejectBtnEl) {
  onlineDrawRejectBtnEl.addEventListener("click", () => {
    if (!isOnlineGameActive() || isGameInteractionLocked()) return;
    const gameId = state.online.currentGameId;
    ipcRenderer
      .invoke("online:game:draw", { gameId, accept: false })
      .then((res) => {
        if (!res?.ok) {
          showAppMessage(`Draw action failed: ${res?.error || "unknown error"}`);
          return;
        }
        setOnlineOfferFlags("draw", { ownPending: false, opponentPending: false });
        render();
        showAppMessage("Draw rejected.");
      })
      .catch((err) => {
        showAppMessage(`Draw action failed: ${String(err?.message || err)}`);
      });
  });
}

if (onlineTakebackBtnEl) {
  onlineTakebackBtnEl.addEventListener("click", () => {
    if (!canOfferOnlineTakeback()) return;
    const gameId = state.online.currentGameId;
    const offerState = getOnlineOfferState("takeback");
    if (!gameId || offerState.ownPending || offerState.opponentPending) return;
    ipcRenderer
      .invoke("online:game:takeback", { gameId, accept: true })
      .then((res) => {
        if (!res?.ok) {
          showAppMessage(`Takeback action failed: ${res?.error || "unknown error"}`);
          return;
        }
        setOnlineOfferFlags("takeback", { ownPending: true, opponentPending: false });
        render();
        showAppMessage("Takeback requested.");
      })
      .catch((err) => {
        showAppMessage(`Takeback action failed: ${String(err?.message || err)}`);
      });
  });
}

if (onlineTakebackAcceptBtnEl) {
  onlineTakebackAcceptBtnEl.addEventListener("click", () => {
    if (!isOnlineGameActive() || isGameInteractionLocked()) return;
    const gameId = state.online.currentGameId;
    ipcRenderer
      .invoke("online:game:takeback", { gameId, accept: true })
      .then((res) => {
        if (!res?.ok) {
          showAppMessage(`Takeback action failed: ${res?.error || "unknown error"}`);
          return;
        }
        setOnlineOfferFlags("takeback", { ownPending: false, opponentPending: false });
        render();
        showAppMessage("Takeback accepted.");
      })
      .catch((err) => {
        showAppMessage(`Takeback action failed: ${String(err?.message || err)}`);
      });
  });
}

if (onlineTakebackRejectBtnEl) {
  onlineTakebackRejectBtnEl.addEventListener("click", () => {
    if (!isOnlineGameActive() || isGameInteractionLocked()) return;
    const gameId = state.online.currentGameId;
    ipcRenderer
      .invoke("online:game:takeback", { gameId, accept: false })
      .then((res) => {
        if (!res?.ok) {
          showAppMessage(`Takeback action failed: ${res?.error || "unknown error"}`);
          return;
        }
        setOnlineOfferFlags("takeback", { ownPending: false, opponentPending: false });
        render();
        showAppMessage("Takeback rejected.");
      })
      .catch((err) => {
        showAppMessage(`Takeback action failed: ${String(err?.message || err)}`);
      });
  });
}

function sendOnlineChatMessage() {
  if (!isOnlineGameActive() || isGameInteractionLocked() || !onlineChatInputEl) return;
  const gameId = state.online.currentGameId;
  const text = String(onlineChatInputEl.value || "").trim();
  if (!gameId || !text) return;
  if (onlineChatSendBtnEl) onlineChatSendBtnEl.disabled = true;
  ipcRenderer
    .invoke("online:game:chat", { gameId, text, room: "player" })
    .then((res) => {
      if (!res?.ok) {
        showAppMessage(`Chat send failed: ${res?.error || "unknown error"}`);
        return;
      }
      onlineChatInputEl.value = "";
    })
    .catch((err) => {
      showAppMessage(`Chat send failed: ${String(err?.message || err)}`);
    })
    .finally(() => {
      renderOnlineChatPanel();
    });
}

if (onlineChatSendBtnEl) {
  onlineChatSendBtnEl.addEventListener("click", sendOnlineChatMessage);
}

if (onlineChatInputEl) {
  onlineChatInputEl.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    sendOnlineChatMessage();
  });
}

mainMenuBtnEl.addEventListener("click", () => {
  if (isBotTournamentSpectatorMode()) {
    exitBotTournamentSpectatorGame();
    return;
  }
  if (isBotTournamentHumanMode()) {
    if (!isGameInteractionLocked()) return;
    const tournamentId = state.botTournamentHumanGame.tournamentId;
    const pairingKey = state.botTournamentHumanGame.pairingKey;
    clearBotGameContext();
    clearBotTournamentHumanGameState();
    resetGame();
    ensureBotTournamentModule().handleHumanMatchExit({ tournamentId, pairingKey });
    return;
  }
  if (isTablebaseMode()) {
    if (isTablebaseTrainingActive()) {
      exitTablebaseTraining();
      return;
    }
    exitTablebaseFlow();
    return;
  }
  clearResignConfirmation();
  state.online.currentGameId = "";
  state.online.finished = false;
  state.online.finishStatus = "";
  state.online.finishWinner = "";
  state.online.userFlipped = false;
  if (onlineChatInputEl) onlineChatInputEl.value = "";
  resetGame();
  if (state.bots.active) {
    clearBotGameContext();
    ensureBotsModule().showScreen();
    return;
  }
  if (isCurrentFairyVariantGame()) {
    state.currentVariant = "standard";
    showVariantsScreen();
    return;
  }
  showHomeScreen();
});

if (botTournamentSpectatorBackBtnEl) {
  botTournamentSpectatorBackBtnEl.addEventListener("click", () => {
    if (!isBotTournamentSpectatorMode()) return;
    exitBotTournamentSpectatorGame();
  });
}

if (btnTablebaseExitTrainingEl) {
  btnTablebaseExitTrainingEl.addEventListener("click", () => {
    exitTablebaseTraining();
  });
}

if (postGameAnalysisBtnEl) {
  postGameAnalysisBtnEl.addEventListener("click", () => {
    openPostGameAnalysis();
  });
}

timeCardEls.forEach((card) => {
  card.addEventListener("click", async () => {
    if (card.disabled) return;
    const mode = normalizeHomePlayMode(state.homePlayMode);
    if (mode === "online-rated" || mode === "online-casual") {
      const rated = mode === "online-rated";
      if (await startOnlineQuickPairFromCard(card, { rated })) {
        setSelectedTimeCard(card);
      } else {
        showAppMessage("Connect Lichess to start online games.");
      }
      return;
    }
    if (!ensureEngineConnectedBeforeStart()) return;
    if (!(await ensureStandardEngineMode())) return;
    setSelectedTimeCard(card);
    setupNewBoardForSelectedTimeControl();
  });
});

if (homePlayModeBarEl) {
  homePlayModeBarEl.addEventListener("click", () => {
    cycleHomePlayMode();
  });
}

btnGameSetupEl.addEventListener("click", () => {
  openSetupModal();
});

if (homeProfileBtnEl) {
  homeProfileBtnEl.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleHomeProfileMenu();
  });
}

if (homeProfileMenuEl) {
  homeProfileMenuEl.addEventListener("click", (event) => {
    const item = event.target.closest(".home-profile-menu-item");
    if (!item) return;
    const label = String(item.dataset.profileAction || "").trim();
    closeHomeProfileMenu();
    if (!label) return;
    if (label === "home") {
      goHomeFromProfileMenu();
      return;
    }
    if (label === "account") {
      openAccountModal();
      return;
    }
    if (label === "board") {
      openThemeModal("board");
      return;
    }
    if (label === "pieces") {
      openThemeModal("pieces");
      return;
    }
    if (label === "sound") {
      openThemeModal("sound");
      return;
    }
    if (label === "background") {
      openBackgroundModal();
      return;
    }
    if (label === "online-mode") {
      openOnlineModal();
      return;
    }
    showAppMessage(`${label[0].toUpperCase()}${label.slice(1)} settings coming soon.`);
  });
}

if (btnGameArchiveEl) {
  btnGameArchiveEl.addEventListener("click", () => {
    openArchiveModal();
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || !state.isFullscreen) return;
  setWindowFullscreen(false).catch(() => {});
});

ipcRenderer.on("window:fullscreen-changed", (_event, payload) => {
  state.isFullscreen = !!payload?.isFullscreen;
  updateHomeProfileMenuItems();
});

if (btnOnlineModeEl) {
  btnOnlineModeEl.addEventListener("click", () => {
    showToolsScreen();
  });
}

if (btnToolsBackEl) {
  btnToolsBackEl.addEventListener("click", () => {
    showHomeScreen();
  });
}

if (btnToolChess960El) {
  btnToolChess960El.addEventListener("click", () => {
    showChess960Screen();
  });
}

if (btnToolPuzzleEl) {
  btnToolPuzzleEl.addEventListener("click", () => {
    ensurePuzzleModule().openSetup();
  });
}

if (btnToolComputerAnalysisEl) {
  btnToolComputerAnalysisEl.addEventListener("click", () => {
    ensureComputerAnalysisModule().openSetup();
  });
}

if (btnToolBotsEl) {
  btnToolBotsEl.addEventListener("click", async () => {
    await refreshCuratedBotRecords();
    ensureBotsModule().showScreen();
  });
}

if (btnToolVariantsEl) {
  btnToolVariantsEl.addEventListener("click", () => {
    showVariantsScreen();
  });
}

if (btnToolTablebaseEl) {
  btnToolTablebaseEl.addEventListener("click", () => {
    ensureTablebaseModule().openTablebaseSetup();
  });
}

if (btnPuzzleBackEl) {
  btnPuzzleBackEl.addEventListener("click", () => {
    ensurePuzzleModule().backToTools();
  });
}

if (btnComputerAnalysisBackEl) {
  btnComputerAnalysisBackEl.addEventListener("click", () => {
    ensureComputerAnalysisModule().backToTools();
  });
}

if (btnBotsBackEl) {
  btnBotsBackEl.addEventListener("click", () => {
    ensureBotsModule().backToTools();
  });
}

if (btnVariantsBackEl) {
  btnVariantsBackEl.addEventListener("click", () => {
    ensureVariantsModule().backToTools();
  });
}

if (btnPuzzleHintEl) {
  btnPuzzleHintEl.addEventListener("click", () => {
    if (state.appMode !== "puzzle" || !puzzleModule) return;
    puzzleModule.showHint();
  });
}

if (btnPuzzleExitEl) {
  btnPuzzleExitEl.addEventListener("click", () => {
    if (state.appMode !== "puzzle" || !puzzleModule) return;
    puzzleModule.exitSession();
  });
}

if (btnPuzzleNextEl) {
  btnPuzzleNextEl.addEventListener("click", () => {
    if (state.appMode !== "puzzle" || !puzzleModule) return;
    puzzleModule.goToNextPuzzle();
  });
}

if (btnPuzzleAnalyzeEl) {
  btnPuzzleAnalyzeEl.addEventListener("click", () => {
    if (state.appMode !== "puzzle" || !puzzleModule) return;
    puzzleModule.analyzeCurrentPuzzle();
  });
}

if (btnTablebaseTrainingEl) {
  btnTablebaseTrainingEl.addEventListener("click", () => {
    openTablebaseTrainingPanel();
  });
}

if (btnTablebaseBackSetupEl) {
  btnTablebaseBackSetupEl.addEventListener("click", () => {
    if (state.appMode !== "tablebase" || isTablebaseTrainingActive()) return;
    if (tablebaseModule) tablebaseModule.openTablebaseSetup({ preserveSetup: true });
  });
}

if (btnTablebaseTrainWhiteEl) {
  btnTablebaseTrainWhiteEl.addEventListener("click", () => {
    state.tablebase.training.selectedColor = "w";
    updateTablebaseTrainingUi();
  });
}

if (btnTablebaseTrainBlackEl) {
  btnTablebaseTrainBlackEl.addEventListener("click", () => {
    state.tablebase.training.selectedColor = "b";
    updateTablebaseTrainingUi();
  });
}

if (btnTablebaseTrainingStartEl) {
  btnTablebaseTrainingStartEl.addEventListener("click", () => {
    startTablebaseTraining({
      userColor: state.tablebase.training.selectedColor,
      reviewEnabled: !!state.tablebase.training.reviewEnabled,
      hintEnabled: !!state.tablebase.training.hintEnabled
    });
  });
}

if (btnTablebaseTrainingCancelEl) {
  btnTablebaseTrainingCancelEl.addEventListener("click", () => {
    closeTablebaseTrainingPanel();
    render();
  });
}

if (btnTablebaseTrainingCloseEl) {
  btnTablebaseTrainingCloseEl.addEventListener("click", () => {
    closeTablebaseTrainingPanel();
    render();
  });
}

if (tablebaseTrainingReviewEl) {
  tablebaseTrainingReviewEl.addEventListener("change", () => {
    state.tablebase.training.reviewEnabled = !!tablebaseTrainingReviewEl.checked;
    if (state.tablebase.training.reviewEnabled) {
      setTablebaseTrainingMessage("Move review on: win fastest, hold draws, and delay losses as long as possible.");
    } else {
      setTablebaseTrainingMessage("");
    }
  });
}

if (tablebaseTrainingHintEnabledEl) {
  tablebaseTrainingHintEnabledEl.addEventListener("change", () => {
    state.tablebase.training.hintEnabled = !!tablebaseTrainingHintEnabledEl.checked;
  });
}

if (btnTablebaseTrainingHintEl) {
  btnTablebaseTrainingHintEl.addEventListener("click", () => {
    showTablebaseTrainingHint();
  });
}

if (tablebaseTrainingModalEl) {
  tablebaseTrainingModalEl.addEventListener("click", (event) => {
    if (event.target !== tablebaseTrainingModalEl) return;
    closeTablebaseTrainingPanel();
    render();
  });
}

if (btnToolTournamentEl) {
  btnToolTournamentEl.addEventListener("click", () => {
    showTournamentScreen();
  });
}

if (btnToolVisionEl) {
  btnToolVisionEl.classList.toggle("hidden", !VISION_EXPERIMENTAL_ENABLED);
  btnToolVisionEl.addEventListener("click", () => {
    showVisionScreen();
  });
}

if (btnChess960BackEl) {
  btnChess960BackEl.addEventListener("click", () => {
    if (chess960Module) chess960Module.backToTools();
    else showToolsScreen();
  });
}

if (btnVisionBackEl) {
  btnVisionBackEl.addEventListener("click", () => {
    if (visionModule) visionModule.backToTools();
    else showToolsScreen();
  });
}

if (btnChess960RandomEl) {
  btnChess960RandomEl.addEventListener("click", () => {
    if (chess960Module) chess960Module.generateRandom();
  });
}

if (btnChess960GenerateNumberEl) {
  btnChess960GenerateNumberEl.addEventListener("click", () => {
    const raw = chess960PositionNumberEl?.value || "";
    const parsed = Number(raw);
    if (!chess960Module || !Number.isInteger(parsed) || parsed < 1 || parsed > 960) {
      showAppMessage("Enter a Chess960 position number from 1 to 960.");
      return;
    }
    const nextFen = chess960Module.generateFromPositionNumber(parsed);
    if (!nextFen) {
      showAppMessage("Unable to generate that Chess960 position.");
    }
  });
}

if (chess960PositionNumberEl) {
  chess960PositionNumberEl.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    btnChess960GenerateNumberEl?.click();
  });
}

if (btnHomeActiveGamesEl) {
  btnHomeActiveGamesEl.addEventListener("click", (event) => {
    event.stopPropagation();
    if (homeActiveGamesPanelEl) {
      const nextOpen = homeActiveGamesPanelEl.classList.contains("hidden");
      closeHomeOnlinePanels();
      if (nextOpen) {
        homeActiveGamesPanelEl.classList.remove("hidden");
      }
    }
  });
}

if (btnHomeChallengeEl) {
  btnHomeChallengeEl.addEventListener("click", (event) => {
    event.stopPropagation();
    if (homeChallengePanelEl) {
      const nextOpen = homeChallengePanelEl.classList.contains("hidden");
      closeHomeOnlinePanels();
      if (nextOpen) {
        homeChallengePanelEl.classList.remove("hidden");
      }
    }
  });
}

if (btnOnlineCloseEl) {
  btnOnlineCloseEl.addEventListener("click", () => {
    closeOnlineModal();
  });
}

if (onlineModalEl) {
  onlineModalEl.addEventListener("click", (event) => {
    if (event.target === onlineModalEl) closeOnlineModal();
  });
}

btnBoardAnalysisEl.addEventListener("click", () => {
  (async () => {
    if (!(await ensurePreferredAnalysisEngineConnected())) return;
    if (!(await ensureStandardEngineMode())) return;
    state.archive.currentAnalysisSource = null;
    state.archive.currentAnalysisReport = null;
    state.analysis.judgmentCycleState = {};
    stopCurrentEngineSearch();
    clearAnalysisState();
    state.online.currentGameId = "";
    state.online.finished = false;
    state.online.finishStatus = "";
    state.online.finishWinner = "";
    state.online.userFlipped = false;
    state.analysis.optionsOpen = false;
    setAppMode("analysis");
    state.player2Color = "w";
    state.boardFlipped = false;
    showGameScreen();
    resetGame();
  })();
});

if (btnBoardEditorEl) {
  btnBoardEditorEl.addEventListener("click", () => {
    openBoardEditor();
  });
}

analysisMainMenuBtnEl.addEventListener("click", async () => {
  stopCurrentEngineSearch();
  clearAnalysisState();
  state.analysis.optionsOpen = false;
  state.currentVariant = "standard";
  await ensureStandardEngineMode();
  setAppMode("play");
  resetGame();
  showHomeScreen();
});

analysisFlipBoardBtnEl.addEventListener("click", () => {
  state.boardFlipped = !state.boardFlipped;
  render();
});

if (analysisToggleJudgmentsBtnEl) {
  analysisToggleJudgmentsBtnEl.addEventListener("click", () => {
    state.analysis.showJudgmentMarkers = !state.analysis.showJudgmentMarkers;
    render();
  });
}

if (btnAnalysisComputerEl) {
  btnAnalysisComputerEl.addEventListener("click", async () => {
    if (!canOpenComputerAnalysisFromAnalysisBoard()) return;
    const pgn = createComputerAnalysisBridgePgn();
    if (!pgn.trim()) {
      showAppMessage("No mainline PGN available for Computer Analysis.");
      return;
    }
    stopCurrentEngineSearch();
    clearAnalysisState();
    state.analysis.optionsOpen = false;
    if (!(await ensurePreferredAnalysisEngineConnected())) return;
    if (!(await ensureStandardEngineMode())) return;
    const preferredDepth = Math.max(
      1,
      Math.min(30, Number(state.archive.currentAnalysisReport?.depth || 10))
    );
    const cachedReport = getCachedComputerAnalysisForCurrentArchiveGame(preferredDepth);
    if (cachedReport) {
      ensureComputerAnalysisModule().openWithSavedReport({
        pgn,
        report: cachedReport,
        archiveContext: state.archive.currentAnalysisSource || null
      });
      showAppMessage(`Loaded saved computer analysis (d${Number(cachedReport.depth || 10)}).`);
      return;
    }
    await ensureComputerAnalysisModule().openAndStart({
      pgn,
      depth: preferredDepth,
      archiveContext: state.archive.currentAnalysisSource || null
    });
  });
}

if (analysisGeneratePgnBtnEl) {
  analysisGeneratePgnBtnEl.addEventListener("click", () => {
    updateAnalysisPgnText();
    showAppMessage("PGN generated.");
  });
}

if (analysisLoadPgnBtnEl) {
  analysisLoadPgnBtnEl.addEventListener("click", () => {
    loadAnalysisPgnFromText();
  });
}

if (analysisSavePgnBtnEl) {
  analysisSavePgnBtnEl.addEventListener("click", () => {
    saveAnalysisPgnToFile();
  });
}

if (analysisInfoTextEl) {
  analysisInfoTextEl.addEventListener("input", () => {
    persistAnalysisInfoCommentEdit();
  });
}

if (analysisLoadFenBtnEl) {
  analysisLoadFenBtnEl.addEventListener("click", () => {
    loadAnalysisFenFromText();
  });
}

analysisEnabledToggleEl.addEventListener("change", () => {
  state.analysis.enabled = !!analysisEnabledToggleEl.checked;
  if (!state.analysis.enabled) {
    stopCurrentEngineSearch();
    state.analysis.searching = false;
  } else if (state.appMode === "analysis") {
    requestAnalysisForCurrentPosition(true);
  }
});

analysisOptionsBtnEl.addEventListener("click", (event) => {
  event.stopPropagation();
  state.analysis.optionsOpen = !state.analysis.optionsOpen;
  renderAnalysisSidePanel();
});

analysisTopPanelEl.addEventListener("click", (event) => {
  event.stopPropagation();
});

analysisOptionsPanelEl.addEventListener("click", (event) => {
  event.stopPropagation();
});

document.addEventListener("click", () => {
  if (state.appMode !== "analysis") return;
  if (!state.analysis.optionsOpen) return;
  state.analysis.optionsOpen = false;
  if (analysisOptionsPanelEl) analysisOptionsPanelEl.classList.add("hidden");
});

btnLoadEngineEl.addEventListener("click", () => {
  openEngineControlsModal();
});

engineSelectEl.addEventListener("change", () => {
  state.selectedEngine = engineSelectEl.value;
  renderEngineRegistry();
  saveEngineRegistry();
});

btnAddEngineEl.addEventListener("click", () => {
  addEngineFromFilePicker();
});

btnSetDefaultEngineEl.addEventListener("click", () => {
  setSelectedEngineAsDefault();
});

btnRenameEngineEl.addEventListener("click", () => {
  renameSelectedEngine();
});
btnRenameEngineSaveEl.addEventListener("click", () => {
  saveRenamedEngine();
});
btnRenameEngineCancelEl.addEventListener("click", () => {
  closeRenameEngineModal();
});
btnRenameEngineCloseEl.addEventListener("click", () => {
  closeRenameEngineModal();
});
renameEngineInputEl.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    saveRenamedEngine();
  } else if (event.key === "Escape") {
    event.preventDefault();
    closeRenameEngineModal();
  }
});

btnRemoveEngineEl.addEventListener("click", async () => {
  const selectedId = state.selectedEngine;
  if (!selectedId) return;
  const removingActiveEngine = state.engineRuntime.connected && state.engineRuntime.connectedEngineId === selectedId;
  if (removingActiveEngine) {
    await disconnectEngine();
  }
  state.engines = state.engines.filter((e) => e.id !== selectedId);
  state.selectedEngine = state.engines[0]?.id ?? "";
  renderEngineRegistry();
  saveEngineRegistry();
});

btnEngineConnectEl.addEventListener("click", () => {
  connectSelectedEngine();
});

btnEngineDisconnectEl.addEventListener("click", () => {
  disconnectEngine();
});

btnEngineApplyEl.addEventListener("click", () => {
  applyEngineOptions();
});

btnSetupCloseEl.addEventListener("click", closeSetupModal);

setupModalEl.addEventListener("click", (event) => {
  if (event.target === setupModalEl) closeSetupModal();
});

if (btnArchiveCloseEl) {
  btnArchiveCloseEl.addEventListener("click", closeArchiveModal);
}

if (archiveModalEl) {
  archiveModalEl.addEventListener("click", (event) => {
    if (event.target === archiveModalEl) closeArchiveModal();
  });
}

if (archiveDeleteConfirmModalEl) {
  archiveDeleteConfirmModalEl.addEventListener("click", (event) => {
    if (event.target === archiveDeleteConfirmModalEl) closeArchiveDeleteConfirmModal();
  });
}

if (archiveTabOfflineEl) {
  archiveTabOfflineEl.addEventListener("click", () => {
    setArchiveTab("offline");
  });
}

if (archiveTabBotvbotEl) {
  archiveTabBotvbotEl.addEventListener("click", () => {
    setArchiveTab("botvbot");
  });
}

if (archiveTabVariantsEl) {
  archiveTabVariantsEl.addEventListener("click", () => {
    setArchiveTab("variants");
  });
}

if (archiveTabOnlineEl) {
  archiveTabOnlineEl.addEventListener("click", () => {
    setArchiveTab("online");
  });
}

if (btnArchiveSyncOnlineEl) {
  btnArchiveSyncOnlineEl.addEventListener("click", () => {
    syncLatestOnlineGamesIntoArchive();
  });
}

if (btnArchiveBulkAnalysisEl) {
  btnArchiveBulkAnalysisEl.addEventListener("click", () => {
    openArchiveBulkAnalysisModal();
  });
}

if (archiveBulkAnalysisCloseEl) {
  archiveBulkAnalysisCloseEl.addEventListener("click", () => {
    closeArchiveBulkAnalysisModal();
  });
}

if (archiveBulkAnalysisCancelEl) {
  archiveBulkAnalysisCancelEl.addEventListener("click", () => {
    closeArchiveBulkAnalysisModal();
  });
}

if (archiveBulkDepthEl) {
  archiveBulkDepthEl.addEventListener("change", () => {
    renderArchiveBulkAnalysisOptions();
  });
}

if (archiveBulkCountEl) {
  archiveBulkCountEl.addEventListener("change", () => {
    state.archive.bulk.selectedCount = String(archiveBulkCountEl.value || "all");
  });
}

if (archiveBulkAnalysisRunEl) {
  archiveBulkAnalysisRunEl.addEventListener("click", () => {
    state.archive.bulk.selectedCount = String(archiveBulkCountEl?.value || "all");
    state.archive.bulk.depth = Math.max(10, Math.min(15, Number(archiveBulkDepthEl?.value || 10)));
    startArchiveBulkAnalysisRun();
  });
}

if (archiveBulkProgressCancelEl) {
  archiveBulkProgressCancelEl.addEventListener("click", () => {
    if (!state.archive.bulk.running) return;
    state.archive.bulk.cancelRequested = true;
    updateArchiveBulkProgressUi();
  });
}

if (btnThemeCloseEl) {
  btnThemeCloseEl.addEventListener("click", closeThemeModal);
}

if (btnThemeImportBoardEl) {
  btnThemeImportBoardEl.addEventListener("click", async () => {
    try {
      const res = await ipcRenderer.invoke("assets:importBoard");
      if (res?.canceled) return;
      if (!res?.ok) {
        themeStatusEl.textContent = `Import failed: ${res?.error || "unknown error"}`;
        return;
      }
      showAppMessage("Board imported.");
      if (activeThemeModalKind === "board") {
        openThemeModal("board");
      }
    } catch (err) {
      themeStatusEl.textContent = `Import failed: ${String(err?.message || err)}`;
    }
  });
}

if (btnThemeImportPiecesEl) {
  btnThemeImportPiecesEl.addEventListener("click", async () => {
    try {
      const res = await ipcRenderer.invoke("assets:importPieceSet");
      if (res?.canceled) return;
      if (!res?.ok) {
        themeStatusEl.textContent = `Import failed: ${res?.error || "unknown error"}`;
        return;
      }
      showAppMessage("Piece set imported.");
      if (activeThemeModalKind === "pieces") {
        openThemeModal("pieces");
      }
    } catch (err) {
      themeStatusEl.textContent = `Import failed: ${String(err?.message || err)}`;
    }
  });
}

if (themeModalEl) {
  themeModalEl.addEventListener("click", (event) => {
    if (event.target === themeModalEl) closeThemeModal();
  });
}

if (btnBackgroundCloseEl) {
  btnBackgroundCloseEl.addEventListener("click", closeBackgroundModal);
}
if (btnBackgroundCancelEl) {
  btnBackgroundCancelEl.addEventListener("click", closeBackgroundModal);
}
if (btnBackgroundApplyEl) {
  btnBackgroundApplyEl.addEventListener("click", saveBackgroundSettingsFromModal);
}
if (btnBackgroundFullscreenToggleEl) {
  btnBackgroundFullscreenToggleEl.addEventListener("click", () => {
    toggleWindowFullscreen().catch((err) => showAppMessage(String(err?.message || err)));
  });
}
if (btnBackgroundDefaultEl) {
  btnBackgroundDefaultEl.addEventListener("click", () => {
    backgroundDraftMode = "default";
    backgroundDraftValue = "";
    setBackgroundMessage("Default background selected.");
    renderBackgroundModalDraft();
  });
}
if (btnBackgroundColorModeEl) {
  btnBackgroundColorModeEl.addEventListener("click", () => {
    backgroundDraftMode = "color";
    backgroundDraftValue = backgroundColorInputEl?.value || "#2c2c2c";
    setBackgroundMessage("Color background selected.");
    renderBackgroundModalDraft();
  });
}
if (btnBackgroundImageModeEl) {
  btnBackgroundImageModeEl.addEventListener("click", () => {
    backgroundDraftMode = "image";
    setBackgroundMessage("Choose an image to apply.");
    renderBackgroundModalDraft();
  });
}
if (backgroundColorInputEl) {
  backgroundColorInputEl.addEventListener("input", () => {
    backgroundDraftMode = "color";
    backgroundDraftValue = backgroundColorInputEl.value || "#2c2c2c";
    renderBackgroundModalDraft();
  });
}
if (backgroundImageInputEl) {
  backgroundImageInputEl.addEventListener("change", async () => {
    const file = backgroundImageInputEl.files && backgroundImageInputEl.files[0];
    if (!file) return;
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Failed to read image."));
        reader.readAsDataURL(file);
      });
      backgroundDraftMode = "image";
      backgroundDraftValue = dataUrl;
      setBackgroundMessage("Image selected.");
      renderBackgroundModalDraft();
    } catch (err) {
      setBackgroundMessage(String(err?.message || err), true);
    }
  });
}
if (backgroundModalEl) {
  backgroundModalEl.addEventListener("click", (event) => {
    if (event.target === backgroundModalEl) closeBackgroundModal();
  });
}

if (btnAccountCloseEl) {
  btnAccountCloseEl.addEventListener("click", closeAccountModal);
}
if (btnAccountCancelEl) {
  btnAccountCancelEl.addEventListener("click", closeAccountModal);
}
if (btnAccountSaveEl) {
  btnAccountSaveEl.addEventListener("click", saveAccountSettingsFromModal);
}
if (accountModalEl) {
  accountModalEl.addEventListener("click", (event) => {
    if (event.target === accountModalEl) closeAccountModal();
  });
}
if (accountAvatarInputEl) {
  accountAvatarInputEl.addEventListener("change", async () => {
    const file = accountAvatarInputEl.files && accountAvatarInputEl.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setAccountMessage("Image is too large (max 3 MB).", true);
      accountAvatarInputEl.value = "";
      return;
    }
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Failed to read image."));
        reader.readAsDataURL(file);
      });
      accountDraftAvatarDataUrl = dataUrl;
      if (accountAvatarPreviewEl) {
        accountAvatarPreviewEl.src = dataUrl || DEFAULT_PROFILE_AVATAR;
      }
      setAccountMessage("Image selected.");
    } catch (_) {
      setAccountMessage("Failed to load image.", true);
    }
  });
}
if (accountNameInputEl) {
  accountNameInputEl.addEventListener("input", () => {
    const enforceMax = !accountSyncOnlineEl || !accountSyncOnlineEl.checked;
    if (enforceMax && accountNameInputEl.value.length > 25) {
      accountNameInputEl.value = accountNameInputEl.value.slice(0, 25);
    }
    setAccountMessage("");
  });
}
if (accountSyncOnlineEl) {
  accountSyncOnlineEl.addEventListener("change", () => {
    const checked = !!accountSyncOnlineEl.checked;
    if (accountNameInputEl) {
      accountNameInputEl.maxLength = checked ? 2048 : 25;
      accountNameInputEl.disabled = checked;
    }
    if (checked) {
      const onlineName = String(state.online.account?.username || "").trim();
      if (accountNameInputEl && onlineName) {
        accountNameInputEl.value = onlineName;
      }
      if (!onlineName) {
        setAccountMessage("Connect online mode to sync username.", true);
      } else {
        setAccountMessage("Online username sync enabled.");
      }
    } else {
      setAccountMessage("");
    }
  });
}

btnEngineControlsCloseEl.addEventListener("click", closeEngineControlsModal);

engineControlsModalEl.addEventListener("click", (event) => {
  if (event.target === engineControlsModalEl) closeEngineControlsModal();
});
renameEngineModalEl.addEventListener("click", (event) => {
  if (event.target === renameEngineModalEl) closeRenameEngineModal();
});

mainTimeSliderEl.addEventListener("input", () => {
  selectedInitialClockMs = Math.round(Number(mainTimeSliderEl.value) * 1000);
  updateSetupValueLabels();
});

incrementSliderEl.addEventListener("input", () => {
  selectedIncrementMs = Math.round(Number(incrementSliderEl.value) * 1000);
  updateSetupValueLabels();
});

[
  optThreadsEl,
  optHashEl,
  optMultiPvEl,
  optSkillEl,
  optEloEl
].forEach((slider) => {
  slider.addEventListener("input", updateEngineSliderValueLabels);
});

analysisDepthEl.addEventListener("input", () => {
  state.analysis.depthPresetIndex = Number(analysisDepthEl.value);
  updateAnalysisSliderValueLabels();
});

analysisDepthEl.addEventListener("change", () => {
  state.analysis.depthPresetIndex = Number(analysisDepthEl.value);
  updateAnalysisSliderValueLabels();
  if (state.appMode === "analysis" && state.analysis.enabled) {
    requestAnalysisForCurrentPosition(true);
  }
});

[analysisMultiPvEl, analysisThreadsEl, analysisHashEl].forEach((slider) => {
  slider.addEventListener("input", updateAnalysisSliderValueLabels);
  slider.addEventListener("change", async () => {
    await applyAnalysisEngineOptions();
    if (state.appMode === "analysis" && state.analysis.enabled) {
      requestAnalysisForCurrentPosition(true);
    }
  });
});

sideWhiteEl.addEventListener("click", () => setPlayer2ColorPreference("w"));
sideBlackEl.addEventListener("click", () => setPlayer2ColorPreference("b"));
sideRandomEl.addEventListener("click", () => setPlayer2ColorPreference("random"));

btnSetupPlayEl.addEventListener("click", () => {
  (async () => {
    if (!ensureEngineConnectedBeforeStart()) return;
    if (!(await ensureStandardEngineMode())) return;
    state.selectedEngine = engineSelectEl.value || state.selectedEngine;
    state.isUnlimitedTime = false;
    saveEngineRegistry();
    const startFen = pendingEditorPlayFen;
    pendingEditorPlayFen = null;
    closeSetupModal();
    setupNewBoardForSelectedTimeControl(startFen);
  })();
});

if (btnOnlineStartLoginEl) {
  btnOnlineStartLoginEl.addEventListener("click", async () => {
    const clientId = String(onlineBackendUrlEl?.value || "").trim() || "offline-lichess-desktop-v1";
    try {
      setOnlineConnectStatus("Connecting...", "neutral");
      const res = await ipcRenderer.invoke("online:auth:start", { clientId });
      if (!res?.ok) {
        setOnlineConnectStatus("Connect failed", "error");
        showAppMessage(`Login start failed: ${res?.error || "unknown error"}`);
        return;
      }
      setOnlineConnectStatus("Waiting for browser authorization...", "neutral");
      showAppMessage("Finish authorization in browser. App will connect automatically.");
    } catch (err) {
      setOnlineConnectStatus(parseOnlineErrorLabel(err), "error");
      showAppMessage(`Login start failed: ${String(err?.message || err)}`);
    }
  });
}

if (btnOnlineLogoutEl) {
  btnOnlineLogoutEl.addEventListener("click", async () => {
    try {
      await ipcRenderer.invoke("online:auth:logout");
      state.online.connected = false;
      state.online.account = null;
      state.online.ratings = null;
      state.online.incomingChallenges.clear();
      state.online.activeGames.clear();
      closeChallengeWaitModal();
      renderOnlineIncomingChallenges();
      renderOnlineActiveGames();
      updateHomeProfileMenuItems();
      setHomePlayMode("offline");
      setOnlineConnectStatus("Logged out", "neutral");
      setOnlineAccountStatus("Disconnected");
      showAppMessage("Logged out from online session.");
    } catch (err) {
      setOnlineConnectStatus("Logout failed", "error");
      showAppMessage(`Logout failed: ${String(err?.message || err)}`);
    }
  });
}

if (onlineBlockChallengesEl) {
  onlineBlockChallengesEl.addEventListener("change", () => {
    state.online.blockChallenges = !!onlineBlockChallengesEl.checked;
    if (state.online.blockChallenges) {
      state.online.incomingChallenges.clear();
    }
    renderOnlineIncomingChallenges();
  });
}

if (btnOnlineCreateChallengeEl) {
  btnOnlineCreateChallengeEl.addEventListener("click", async () => {
    const username = String(onlineChallengeUserEl?.value || "").trim();
    if (!username) {
      setOnlineChallengeStatus("Enter opponent username.", true);
      showAppMessage("Enter opponent username.");
      return;
    }
    const payload = {
      username,
      clockLimitSec: getOnlineChallengeLimitSeconds(),
      clockIncrementSec: getOnlineChallengeIncrementSeconds(),
      color: String(onlineChallengeColorEl?.value || "random"),
      rated: !!onlineChallengeRatedEl?.checked
    };
    try {
      setOnlineChallengeStatus("Sending challenge...");
      const res = await ipcRenderer.invoke("online:challenge:create", payload);
      if (!res?.ok) {
        setOnlineChallengeStatus(`Challenge failed: ${res?.error || "unknown error"}`, true);
        showAppMessage(`Challenge create failed: ${res?.error || "unknown error"}`);
        return;
      }
      const challengeId =
        String(
          res?.data?.challenge?.id ||
            res?.data?.id ||
            ""
        ).trim();
      if (!challengeId) {
        setOnlineChallengeStatus("Challenge sent, but no challenge id returned.", true);
        showAppMessage("Challenge sent, but tracking id is missing.");
        return;
      }
      openChallengeWaitModal({
        kind: "challenge",
        challengeId,
        username,
        clockLimitSec: payload.clockLimitSec,
        clockIncrementSec: payload.clockIncrementSec,
        color: payload.color,
        rated: payload.rated
      });
      setOnlineChallengeStatus("Challenge sent.");
      showAppMessage("Challenge sent.");
    } catch (err) {
      setOnlineChallengeStatus(`Challenge failed: ${String(err?.message || err)}`, true);
      showAppMessage(`Challenge create failed: ${String(err?.message || err)}`);
    }
  });
}

if (btnChallengeWaitCancelEl) {
  btnChallengeWaitCancelEl.addEventListener("click", async () => {
    const pending = state.online.pendingMatchRequest;
    if (!pending) {
      closeChallengeWaitModal();
      return;
    }
    btnChallengeWaitCancelEl.disabled = true;
    try {
      let res = { ok: true };
      if (pending.kind === "challenge") {
        const challengeId = String(pending.challengeId || "").trim();
        if (challengeId) {
          res = await ipcRenderer.invoke("online:challenge:cancel", { challengeId });
        }
      } else if (pending.kind === "seek") {
        res = await ipcRenderer.invoke("online:seek:cancel");
      }
      if (!res?.ok) {
        setOnlineChallengeStatus(`Cancel failed: ${res?.error || "unknown error"}`, true);
        showAppMessage(`Cancel challenge failed: ${res?.error || "unknown error"}`);
      } else {
        setOnlineChallengeStatus(pending.kind === "seek" ? "Quick pair canceled." : "Challenge canceled.");
        showAppMessage(pending.kind === "seek" ? "Quick pair canceled." : "Challenge canceled.");
      }
    } catch (err) {
      setOnlineChallengeStatus(`Cancel failed: ${String(err?.message || err)}`, true);
      showAppMessage(`Cancel challenge failed: ${String(err?.message || err)}`);
    } finally {
      btnChallengeWaitCancelEl.disabled = false;
      closeChallengeWaitModal();
    }
  });
}

ipcRenderer.on("engine:stdout", (_evt, text) => {
  feedEngineStdout(String(text || ""));
});

ipcRenderer.on("online:event:stream", (_evt, payload) => {
  handleOnlineEventStream(payload);
});

ipcRenderer.on("online:auth:completed", async (_evt, payload) => {
  state.online.connected = true;
  updateHomeProfileMenuItems();
  setHomePlayMode(state.homePlayMode === "offline" ? "online-rated" : state.homePlayMode);
  setOnlineConnectStatus(`Connected${payload?.username ? ` as ${payload.username}` : ""}`, "ok");
  showAppMessage("Lichess connected.");
  await autoFetchOnlineIdentity();
});

ipcRenderer.on("online:auth:error", (_evt, payload) => {
  const msg = payload?.error || "OAuth failed.";
  closeChallengeWaitModal();
  setOnlineConnectStatus(parseOnlineErrorLabel(msg), "error");
  setOnlineAccountStatus(msg, true);
  showAppMessage(`Login failed: ${msg}`);
  renderHomePlayModeBar();
});

ipcRenderer.on("online:game:stream", (_evt, payload) => {
  handleOnlineGameStream(payload);
});

ipcRenderer.on("online:stream:error", (_evt, payload) => {
  const msg = payload?.message || "Online stream error.";
  if (state.online.pendingMatchRequest) {
    closeChallengeWaitModal();
  }
  setOnlineConnectStatus(parseOnlineErrorLabel(msg), "error");
  showAppMessage(msg);
});

ipcRenderer.on("engine:stderr", (_evt, text) => {
  const msg = String(text || "").trim();
  if (!msg) return;
  setEngineStatus(`Engine stderr: ${msg}`, true);
});

ipcRenderer.on("engine:closed", (_evt, payload) => {
  if (computerAnalysisBridge.running) {
    failComputerAnalysisBridgeRun("Computer analysis stopped because the engine disconnected.");
  }
  resetEngineRuntimeState();
  const code =
    payload && typeof payload === "object" && "code" in payload ? payload.code : payload;
  const signal =
    payload && typeof payload === "object" && "signal" in payload ? payload.signal : null;
  if (Number.isInteger(code)) {
    setEngineStatus(`Disconnected (code: ${code})`);
  } else if (signal) {
    setEngineStatus(`Disconnected (${signal})`);
  } else {
    setEngineStatus("Disconnected");
  }
  updateEngineControlButtonStates();
});

loadBoardSize();
setupBoardResize();
detachGlobalUiNodes();
loadProfileSettings();
renderProfileUi();
loadThemeSettings();
applyAppBackgroundTheme();
preloadCustomThemeAssets();
applyBoardTheme();
rebuildSoundEffects();
hydrateOnlineSessionUi();
syncFullscreenState();
initOnlineChallengeControls();
loadBuiltinBotOverrides();
loadCustomBotRegistry();
loadEngineRegistry();
syncBuiltinEngines()
  .finally(() => {
    renderEngineRegistry();
    return autoConnectDefaultEngineOnStartup().catch((err) => {
      setEngineStatus(`Auto-connect failed: ${String(err?.message || err)}`, true);
    });
  })
  .finally(() => {
    updateEngineControlButtonStates();
  });
analysisDepthEl.value = String(state.analysis.depthPresetIndex);
updateEngineSliderValueLabels();
syncAnalysisControlsFromMainEngineControls();
updateAnalysisSliderValueLabels();
state.viewPly = getLatestPly();
ensureClockLoop();
resetTablebaseSessionState();
setSelectedTimeCard(timeCardEls.find((c) => c.classList.contains("selected")) || timeCardEls[0]);
setAppMode("play");
showHomeScreen();
render();
