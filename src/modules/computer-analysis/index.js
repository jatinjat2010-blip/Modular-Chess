const { Chess } = require("chess.js");
const { createChess960Game } = require("../variants/chess960Game");

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatEvalLabel(result) {
  if (!result || !result.eval) return "--";
  if (result.eval.kind === "mate") {
    const value = Number(result.eval.value || 0);
    return `M${value > 0 ? "+" : "-"}${Math.abs(value)}`;
  }
  const value = Number(result.normalizedValue || 0);
  const text = value.toFixed(1);
  return value > 0 ? `+${text}` : text;
}

function formatAccuracyLabel(value) {
  if (!Number.isFinite(Number(value))) return "--";
  return `${Math.round(Number(value))}%`;
}

function formatJudgmentCount(value) {
  if (!Number.isFinite(Number(value))) return "0";
  return String(Math.max(0, Math.trunc(Number(value))));
}

function formatJudgmentLabel(value) {
  switch (String(value || "").toLowerCase()) {
    case "brilliant":
      return "Brilliant";
    case "great":
      return "Great";
    case "inaccuracy":
      return "Inaccuracy";
    case "mistake":
      return "Mistake";
    case "blunder":
      return "Blunder";
    default:
      return "";
  }
}

function getJudgmentMarker(value) {
  switch (String(value || "").toLowerCase()) {
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

const BOARD_FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const BOARD_RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"];

function roleFromFenChar(ch) {
  const lower = String(ch || "").toLowerCase();
  switch (lower) {
    case "p":
    case "n":
    case "b":
    case "r":
    case "q":
    case "k":
      return lower;
    default:
      return "";
  }
}

function expandBoardPart(boardPart) {
  const rows = String(boardPart || "").split("/");
  const out = [];
  for (const row of rows) {
    const expanded = [];
    for (const ch of row) {
      if (/\d/.test(ch)) {
        const count = Number(ch);
        for (let i = 0; i < count; i += 1) expanded.push(null);
      } else {
        expanded.push(ch);
      }
    }
    out.push(expanded);
  }
  return out;
}

function parseFenBoardMap(fen) {
  const boardPart = String(fen || "").trim().split(/\s+/)[0] || "";
  const rows = expandBoardPart(boardPart);
  const map = new Map();
  for (let rankIdx = 0; rankIdx < 8; rankIdx += 1) {
    const rank = 8 - rankIdx;
    const row = rows[rankIdx] || [];
    for (let fileIdx = 0; fileIdx < 8; fileIdx += 1) {
      const ch = row[fileIdx];
      if (!ch) continue;
      const file = String.fromCharCode(97 + fileIdx);
      map.set(`${file}${rank}`, {
        color: ch === ch.toUpperCase() ? "w" : "b",
        type: roleFromFenChar(ch)
      });
    }
  }
  return map;
}

function parseBestMoveSquares(uci) {
  const text = String(uci || "").trim();
  if (!/^[a-h][1-8][a-h][1-8][nbrqk]?$/.test(text)) return null;
  return {
    from: text.slice(0, 2),
    to: text.slice(2, 4)
  };
}

function uciToMoveObject(uci) {
  const text = String(uci || "").trim();
  if (!/^[a-h][1-8][a-h][1-8][nbrq]?$/i.test(text)) return null;
  const move = {
    from: text.slice(0, 2),
    to: text.slice(2, 4)
  };
  if (text.length > 4) move.promotion = text.slice(4, 5).toLowerCase();
  return move;
}

function buildAdviceLineFromResult(result) {
  if (!result?.beforeFen || !result?.preMoveBestPv) return [];
  try {
    const variantKey = String(result?.variantKey || "standard").trim().toLowerCase();
    const chess =
      variantKey === "chess960"
        ? createChess960Game(String(result.beforeFen))
        : new Chess();
    if (variantKey !== "chess960") {
      chess.load(String(result.beforeFen));
    }
    const pvMoves = String(result.preMoveBestPv)
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    const entries = [];
    for (let index = 0; index < pvMoves.length; index += 1) {
      const moveObj = uciToMoveObject(pvMoves[index]);
      if (!moveObj) break;
      const move = chess.move({
        from: moveObj.from,
        to: moveObj.to,
        promotion: moveObj.promotion
      });
      if (!move) break;
      entries.push({
        index,
        san: move.san,
        fen: chess.fen()
      });
    }
    return entries;
  } catch {
    return [];
  }
}

function squareCenter(square, flipped) {
  const file = square.charCodeAt(0) - 97;
  const rank = Number(square[1]);
  const x = flipped ? 7 - file : file;
  const y = flipped ? rank - 1 : 8 - rank;
  return {
    x: x + 0.5,
    y: y + 0.5
  };
}

function renderBoardArrowSvg(uci, flipped) {
  const move = parseBestMoveSquares(uci);
  if (!move) return "";
  const from = squareCenter(move.from, flipped);
  const to = squareCenter(move.to, flipped);
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length;
  const uy = dy / length;
  const headLength = 0.42;
  const headWidth = 0.22;
  const baseX = to.x - ux * headLength;
  const baseY = to.y - uy * headLength;
  const perpX = -uy;
  const perpY = ux;
  const leftX = baseX + perpX * headWidth;
  const leftY = baseY + perpY * headWidth;
  const rightX = baseX - perpX * headWidth;
  const rightY = baseY - perpY * headWidth;
  const shaftEndX = to.x - ux * 0.18;
  const shaftEndY = to.y - uy * 0.18;
  return `
    <svg class="computer-analysis-board-arrow" viewBox="0 0 8 8" aria-hidden="true">
      <line
        x1="${from.x}"
        y1="${from.y}"
        x2="${shaftEndX}"
        y2="${shaftEndY}"
        class="computer-analysis-board-arrow-line"
      ></line>
      <polygon
        points="${to.x},${to.y} ${leftX},${leftY} ${rightX},${rightY}"
        class="computer-analysis-board-arrow-head"
      ></polygon>
    </svg>
  `;
}

function createGraphSvg(results, selectedPly = null) {
  const items = Array.isArray(results) ? results : [];
  const width = 820;
  const height = 260;
  const paddingLeft = 38;
  const paddingRight = 16;
  const paddingTop = 16;
  const paddingBottom = 34;
  const innerWidth = width - paddingLeft - paddingRight;
  const innerHeight = height - paddingTop - paddingBottom;
  const maxAbs = 7;
  const xStep = items.length > 1 ? innerWidth / (items.length - 1) : 0;
  const clamp = (value) => Math.max(-maxAbs, Math.min(maxAbs, Number(value || 0)));
  const points = items.map((item, index) => {
    const x = paddingLeft + xStep * index;
    const y = paddingTop + ((maxAbs - clamp(item.normalizedValue)) / (maxAbs * 2)) * innerHeight;
    return { x, y, label: item.moveLabel || String(index + 1), value: formatEvalLabel(item) };
  });
  const polyline = points.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ");
  const axisY = paddingTop + innerHeight / 2;
  const yTicks = [-7, -3.5, 0, 3.5, 7];
  const whiteAreaPath = [];
  const blackAreaPath = [];

  if (points.length) {
    let whiteStarted = false;
    let blackStarted = false;
    for (let i = 0; i < points.length; i += 1) {
      const point = points[i];
      const value = clamp(items[i]?.normalizedValue);
      const x = point.x;
      const y = point.y;
      const prevValue = i > 0 ? clamp(items[i - 1]?.normalizedValue) : value;
      const prevPoint = i > 0 ? points[i - 1] : point;
      const crossesAxis = i > 0 && ((prevValue > 0 && value < 0) || (prevValue < 0 && value > 0));
      let crossingX = x;
      if (crossesAxis) {
        const ratio = prevValue / (prevValue - value);
        crossingX = prevPoint.x + (x - prevPoint.x) * ratio;
      }

      if (value >= 0) {
        if (!whiteStarted) {
          whiteAreaPath.push(`M ${i > 0 && crossesAxis ? crossingX : x} ${axisY}`);
          whiteStarted = true;
        } else if (i > 0 && crossesAxis) {
          whiteAreaPath.push(`L ${crossingX} ${axisY}`);
        }
        whiteAreaPath.push(`L ${x} ${y}`);
        if (i === points.length - 1 || clamp(items[i + 1]?.normalizedValue) < 0) {
          const endX =
            i < points.length - 1 && clamp(items[i + 1]?.normalizedValue) < 0
              ? (() => {
                  const nextValue = clamp(items[i + 1]?.normalizedValue);
                  const nextPoint = points[i + 1];
                  const ratio = value / (value - nextValue);
                  return x + (nextPoint.x - x) * ratio;
                })()
              : x;
          if (endX !== x) {
            whiteAreaPath.push(`L ${endX} ${axisY}`);
          } else {
            whiteAreaPath.push(`L ${x} ${axisY}`);
          }
          whiteAreaPath.push("Z");
          whiteStarted = false;
        }
      }

      if (value <= 0) {
        if (!blackStarted) {
          blackAreaPath.push(`M ${i > 0 && crossesAxis ? crossingX : x} ${axisY}`);
          blackStarted = true;
        } else if (i > 0 && crossesAxis) {
          blackAreaPath.push(`L ${crossingX} ${axisY}`);
        }
        blackAreaPath.push(`L ${x} ${y}`);
        if (i === points.length - 1 || clamp(items[i + 1]?.normalizedValue) > 0) {
          const endX =
            i < points.length - 1 && clamp(items[i + 1]?.normalizedValue) > 0
              ? (() => {
                  const nextValue = clamp(items[i + 1]?.normalizedValue);
                  const nextPoint = points[i + 1];
                  const ratio = value / (value - nextValue);
                  return x + (nextPoint.x - x) * ratio;
                })()
              : x;
          if (endX !== x) {
            blackAreaPath.push(`L ${endX} ${axisY}`);
          } else {
            blackAreaPath.push(`L ${x} ${axisY}`);
          }
          blackAreaPath.push("Z");
          blackStarted = false;
        }
      }
    }
  }

  return `
    <svg class="computer-analysis-graph-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Move evaluation graph">
      <rect x="0" y="0" width="${width}" height="${height}" rx="18" ry="18" class="computer-analysis-graph-bg"></rect>
      ${yTicks
        .map((tick) => {
          const y = paddingTop + ((maxAbs - tick) / (maxAbs * 2)) * innerHeight;
          return `
            <line x1="${paddingLeft}" y1="${y}" x2="${width - paddingRight}" y2="${y}" class="computer-analysis-graph-grid"></line>
            <text x="${paddingLeft - 8}" y="${y + 4}" text-anchor="end" class="computer-analysis-graph-tick">${tick > 0 ? "+" : ""}${tick}</text>
          `;
        })
        .join("")}
      ${whiteAreaPath.length ? `<path d="${whiteAreaPath.join(" ")}" class="computer-analysis-graph-area computer-analysis-graph-area-white"></path>` : ""}
      ${blackAreaPath.length ? `<path d="${blackAreaPath.join(" ")}" class="computer-analysis-graph-area computer-analysis-graph-area-black"></path>` : ""}
      <line x1="${paddingLeft}" y1="${axisY}" x2="${width - paddingRight}" y2="${axisY}" class="computer-analysis-graph-axis"></line>
      <line x1="${paddingLeft}" y1="${paddingTop}" x2="${paddingLeft}" y2="${height - paddingBottom}" class="computer-analysis-graph-axis"></line>
      ${polyline ? `<polyline points="${polyline}" class="computer-analysis-graph-line"></polyline>` : ""}
      ${points
        .map((point, index) => {
          const item = items[index];
          const isSelected = Number(selectedPly) === Number(item?.ply);
          const judgmentMarker = getJudgmentMarker(item?.judgment);
          return `
            ${
              judgmentMarker
                ? `
                  <g class="computer-analysis-graph-judgment ${escapeHtml(judgmentMarker.className)}" transform="translate(${point.x}, ${point.y})">
                    <text class="computer-analysis-graph-judgment-text" text-anchor="middle" dominant-baseline="central" y="0.5">${escapeHtml(
                      judgmentMarker.text
                    )}</text>
                  </g>
                `
                : ""
            }
            <circle
              cx="${point.x}"
              cy="${point.y}"
              r="${isSelected ? "6.5" : "4.5"}"
              class="computer-analysis-graph-hit"
              data-ply="${Number(item?.ply || 0)}"
              tabindex="0"
              role="button"
              aria-label="Select move ${escapeHtml(point.label)} ${escapeHtml(item?.san || "")} ${escapeHtml(point.value)}"
            ></circle>
            ${
              isSelected
                ? `
                  <circle
                    cx="${point.x}"
                    cy="${point.y}"
                    r="6.5"
                    class="computer-analysis-graph-dot is-selected"
                    data-ply="${Number(item?.ply || 0)}"
                    tabindex="0"
                    role="button"
                    aria-label="Select move ${escapeHtml(point.label)} ${escapeHtml(item?.san || "")} ${escapeHtml(point.value)}"
                  ></circle>
                `
                : ""
            }
          `;
        })
        .join("")}
    </svg>
  `;
}

function createComputerAnalysisModule({
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
  closeHomeProfileMenu,
  closeHomeOnlinePanels,
  updateHomeOnlineToolbarVisibility,
  setAppMode,
  showHomeScreen,
  openAnalysisFromPgn,
  showAppMessage,
  pieceAssetPath,
  getBoardImage,
  startRun,
  stopRun
}) {
  const state = {
    screen: "setup",
    pgnText: "",
    depth: 10,
    busy: false,
    error: "",
    progressText: "",
    report: null,
    selectedPly: null,
    advicePly: null,
    adviceStep: null,
    boardFlipped: false,
    tableScrollTop: 0,
    judgmentCycleState: {},
    archiveContext: null
  };
  let activeKeydownHandler = null;

  function getSelectedResult() {
    const results = Array.isArray(state.report?.results) ? state.report.results : [];
    const targetPly = Number(state.selectedPly);
    return results.find((item) => Number(item?.ply) === targetPly) || null;
  }

  function getAdviceResult() {
    const results = Array.isArray(state.report?.results) ? state.report.results : [];
    const targetPly = Number(state.advicePly);
    return results.find((item) => Number(item?.ply) === targetPly) || null;
  }

  function getAdviceLine() {
    return buildAdviceLineFromResult(getAdviceResult());
  }

  function getAdviceEntry() {
    if (state.adviceStep == null) return null;
    const adviceLine = getAdviceLine();
    const targetStep = Number(state.adviceStep);
    return adviceLine.find((entry) => Number(entry.index) === targetStep) || null;
  }

  function getDisplayedFen() {
    const adviceEntry = getAdviceEntry();
    if (adviceEntry?.fen) return adviceEntry.fen;
    const selected = getSelectedResult();
    if (selected?.fen) return selected.fen;
    return String(state.report?.startFen || "");
  }

  function renderBoardPreview() {
    const fen = getDisplayedFen();
    const selected = getSelectedResult();
    const adviceEntry = getAdviceEntry();
    const judgmentMarker = adviceEntry ? null : getJudgmentMarker(selected?.judgment);
    if (!fen) {
      return `<div class="computer-analysis-empty">No board position available.</div>`;
    }
    const boardMap = parseFenBoardMap(fen);
    const files = state.boardFlipped ? [...BOARD_FILES].reverse() : BOARD_FILES;
    const ranks = state.boardFlipped ? [...BOARD_RANKS].reverse() : BOARD_RANKS;
    const leftEdgeFile = files[0];
    const bottomEdgeRank = ranks[ranks.length - 1];
    const cells = [];
    for (const rank of ranks) {
      for (const file of files) {
        const squareName = `${file}${rank}`;
        const piece = boardMap.get(squareName);
        const isLight = (BOARD_FILES.indexOf(file) + Number(rank)) % 2 === 1;
        cells.push(`
          <div class="computer-analysis-board-square ${isLight ? "light" : "dark"}">
            ${
              piece
                ? `<img class="computer-analysis-board-piece" src="${escapeHtml(
                    pieceAssetPath(piece)
                  )}" alt="${escapeHtml(`${piece.color}${piece.type}`)}" draggable="false">`
                : ""
            }
            ${
              judgmentMarker && selected?.to === squareName
                ? `<span class="computer-analysis-board-judgment ${escapeHtml(
                    judgmentMarker.className
                  )}">${escapeHtml(judgmentMarker.text)}</span>`
                : ""
            }
            ${
              file === leftEdgeFile
                ? `<span class="computer-analysis-board-rank">${escapeHtml(rank)}</span>`
                : ""
            }
            ${
              rank === bottomEdgeRank
                ? `<span class="computer-analysis-board-file">${escapeHtml(file)}</span>`
                : ""
            }
          </div>
        `);
      }
    }
    return `
      <div class="computer-analysis-board-wrap">
        <div class="computer-analysis-board-grid" style="background-image: url('${escapeHtml(getBoardImage())}');">${cells.join("")}</div>
        ${adviceEntry ? "" : selected?.bestMoveUci ? renderBoardArrowSvg(selected.bestMoveUci, state.boardFlipped) : ""}
      </div>
    `;
  }

  function showScreen() {
    closeHomeProfileMenu();
    if (homeProfileEl) homeProfileEl.classList.add("hidden");
    closeHomeOnlinePanels();
    if (homeScreenEl) homeScreenEl.classList.add("hidden");
    if (toolsScreenEl) toolsScreenEl.classList.add("hidden");
    if (puzzleScreenEl) puzzleScreenEl.classList.add("hidden");
    if (computerAnalysisScreenEl) computerAnalysisScreenEl.classList.remove("hidden");
    if (variantsScreenEl) variantsScreenEl.classList.add("hidden");
    if (chess960ScreenEl) chess960ScreenEl.classList.add("hidden");
    if (tournamentScreenEl) tournamentScreenEl.classList.add("hidden");
    if (visionScreenEl) visionScreenEl.classList.add("hidden");
    if (gameScreenEl) gameScreenEl.classList.add("hidden");
    updateHomeOnlineToolbarVisibility();
  }

  function backToTools() {
    if (state.screen === "report") {
      stopRun();
      state.busy = false;
      state.progressText = "";
      state.error = "";
      state.report = null;
      state.selectedPly = null;
      state.advicePly = null;
      state.adviceStep = null;
      state.boardFlipped = false;
      state.judgmentCycleState = {};
      state.screen = "setup";
      setAppMode("computer-analysis-setup");
      render();
      return;
    }
    stopRun();
    state.busy = false;
    state.progressText = "";
    state.error = "";
    state.selectedPly = null;
    state.advicePly = null;
    state.adviceStep = null;
    state.judgmentCycleState = {};
    state.archiveContext = null;
    state.screen = "setup";
    if (computerAnalysisScreenEl) computerAnalysisScreenEl.classList.add("hidden");
    if (toolsScreenEl) toolsScreenEl.classList.remove("hidden");
    setAppMode("play");
    updateHomeOnlineToolbarVisibility();
  }

  function openSetup() {
    showScreen();
    state.screen = "setup";
    state.error = "";
    state.progressText = "";
    state.busy = false;
    state.selectedPly = null;
    state.advicePly = null;
    state.adviceStep = null;
    state.judgmentCycleState = {};
    state.archiveContext = null;
    setAppMode("computer-analysis-setup");
    render();
  }

  function onRunStarted(payload) {
    state.busy = true;
    state.error = "";
    state.progressText = `Preparing ${Number(payload?.total || 0)} positions...`;
    state.report = null;
    state.selectedPly = null;
    state.advicePly = null;
    state.adviceStep = null;
    state.judgmentCycleState = {};
    state.boardFlipped = false;
    state.screen = "report";
    setAppMode("computer-analysis-report");
    render();
  }

  function onRunProgress(payload) {
    const current = Number(payload?.current || 0);
    const total = Number(payload?.total || 0);
    const item = payload?.item || null;
    state.progressText = item
      ? total > 0
        ? `Analyzing move ${current}/${total}${item?.san ? `: ${item.san}` : ""}`
        : "Analyzing..."
      : "Analyzing starting position...";
    state.report = payload?.report || state.report;
    if (state.selectedPly == null && item?.ply != null) {
      state.selectedPly = Number(item.ply);
    }
    state.screen = "report";
    setAppMode("computer-analysis-report");
    render();
  }

  function onRunComplete(report) {
    state.busy = false;
    state.progressText = `Analyzed ${Array.isArray(report?.results) ? report.results.length : 0} moves.`;
    state.report = report || null;
    if (state.selectedPly == null) {
      const last = Array.isArray(report?.results) && report.results.length ? report.results[report.results.length - 1] : null;
      state.selectedPly = last?.ply != null ? Number(last.ply) : null;
    }
    state.screen = "report";
    setAppMode("computer-analysis-report");
    render();
  }

  function onRunError(message, report = null) {
    state.busy = false;
    state.error = String(message || "Computer analysis failed.");
    state.progressText = "";
    if (report) {
      state.report = report;
      if (state.selectedPly == null) {
        const last = Array.isArray(report?.results) && report.results.length ? report.results[report.results.length - 1] : null;
        state.selectedPly = last?.ply != null ? Number(last.ply) : null;
      }
      state.screen = "report";
      setAppMode("computer-analysis-report");
    } else {
      state.screen = "setup";
      setAppMode("computer-analysis-setup");
    }
    showAppMessage(state.error);
    render();
  }

  async function handleStart(event) {
    event.preventDefault();
    if (state.busy) return;
    state.error = "";
    render();
    const result = await startRun({
      pgn: state.pgnText,
      depth: state.depth,
      archiveContext: state.archiveContext,
      onStarted: onRunStarted,
      onProgress: onRunProgress,
      onComplete: onRunComplete,
      onError: onRunError
    });
    if (!result?.ok) {
      state.busy = false;
      state.error = result?.error || "Unable to start computer analysis.";
      setAppMode("computer-analysis-setup");
      render();
    }
  }

  async function openAndStart({ pgn = "", depth = 10, archiveContext = null } = {}) {
    const nextPgn = String(pgn || "").trim();
    if (!nextPgn) {
      showAppMessage("No PGN available for Computer Analysis.");
      return { ok: false, error: "Missing PGN." };
    }
    showScreen();
    state.screen = "setup";
    state.pgnText = nextPgn;
    state.depth = Math.max(1, Math.min(30, Number(depth) || 10));
    state.error = "";
    state.progressText = "";
    state.busy = false;
    state.report = null;
    state.selectedPly = null;
    state.advicePly = null;
    state.adviceStep = null;
    state.boardFlipped = false;
    state.archiveContext = archiveContext || null;
    setAppMode("computer-analysis-setup");
    render();

    const result = await startRun({
      pgn: state.pgnText,
      depth: state.depth,
      archiveContext: state.archiveContext,
      onStarted: onRunStarted,
      onProgress: onRunProgress,
      onComplete: onRunComplete,
      onError: onRunError
    });
    if (!result?.ok) {
      state.busy = false;
      state.error = result?.error || "Unable to start computer analysis.";
      setAppMode("computer-analysis-setup");
      render();
    }
    return result;
  }

  function openWithSavedReport({ pgn = "", report = null, archiveContext = null } = {}) {
    const nextPgn = String(pgn || "").trim();
    if (!nextPgn || !report) {
      return { ok: false, error: "Missing cached computer analysis report." };
    }
    showScreen();
    state.screen = "report";
    state.pgnText = nextPgn;
    state.depth = Math.max(1, Math.min(30, Number(report?.depth) || 10));
    state.error = "";
    state.progressText = `Loaded saved analysis at depth ${state.depth}.`;
    state.busy = false;
    state.report = report;
    state.selectedPly = null;
    state.advicePly = null;
    state.adviceStep = null;
    state.boardFlipped = false;
    state.archiveContext = archiveContext || null;
    state.judgmentCycleState = {};
    if (state.selectedPly == null) {
      const last = Array.isArray(report?.results) && report.results.length ? report.results[report.results.length - 1] : null;
      state.selectedPly = last?.ply != null ? Number(last.ply) : null;
    }
    setAppMode("computer-analysis-report");
    render();
    return { ok: true, cached: true };
  }

  function renderSetupScreen() {
    return `
      <div class="computer-analysis-shell">
        <div class="computer-analysis-header">
          <div>
            <div class="computer-analysis-eyebrow">Computer Analysis</div>
            <h2 class="computer-analysis-title">Analyze a PGN</h2>
            <p class="computer-analysis-subtitle">Paste a game PGN, choose a search depth, and let the local engine evaluate every move on the main line.</p>
          </div>
          <div class="computer-analysis-summary-card">
            <div class="computer-analysis-summary-label">Default Depth</div>
            <div class="computer-analysis-summary-value">${escapeHtml(state.depth)}</div>
          </div>
        </div>
        <form id="computer-analysis-form" class="computer-analysis-card computer-analysis-form">
          <label class="computer-analysis-label" for="computer-analysis-pgn">PGN</label>
          <textarea
            id="computer-analysis-pgn"
            class="computer-analysis-textarea"
            placeholder="Paste a full PGN here..."
          >${escapeHtml(state.pgnText)}</textarea>

          <div class="computer-analysis-depth-row">
            <label class="computer-analysis-label" for="computer-analysis-depth">Search depth</label>
            <div class="computer-analysis-depth-control">
              <input id="computer-analysis-depth" class="computer-analysis-depth-slider" type="range" min="1" max="30" step="1" value="${escapeHtml(state.depth)}">
              <div id="computer-analysis-depth-value" class="computer-analysis-depth-value">${escapeHtml(state.depth)}</div>
            </div>
          </div>

          ${state.error ? `<div class="computer-analysis-error">${escapeHtml(state.error)}</div>` : ""}

          <div class="computer-analysis-actions">
            <button type="submit" class="engine-btn computer-analysis-start-btn"${state.busy ? " disabled" : ""}>${state.busy ? "Starting..." : "Start Analysis"}</button>
          </div>
        </form>
      </div>
    `;
  }

  function renderReportScreen() {
    const report = state.report;
    const results = Array.isArray(report?.results) ? report.results : [];
    const whitePlayerName = String(report?.tags?.White || "").trim() || "White";
    const blackPlayerName = String(report?.tags?.Black || "").trim() || "Black";
    const whiteJudgments = report?.judgmentCountsByColor?.white || {};
    const blackJudgments = report?.judgmentCountsByColor?.black || {};
    const advice = getAdviceResult();
    const adviceLine = getAdviceLine();
    const adviceEntry = getAdviceEntry();
    const hasAdvice =
      advice &&
      (advice.judgment === "inaccuracy" || advice.judgment === "mistake" || advice.judgment === "blunder") &&
      advice.preMoveBestLineSan;
    return `
      <div class="computer-analysis-shell">
        <div class="computer-analysis-header">
          <div>
            <div class="computer-analysis-eyebrow">Computer Analysis</div>
            <h2 class="computer-analysis-title">Report</h2>
            <p class="computer-analysis-subtitle">Move-by-move engine evaluation for the pasted game.</p>
          </div>
          <div class="computer-analysis-summary-group">
            <div class="computer-analysis-summary-card">
              <div class="computer-analysis-summary-label">Moves</div>
              <div class="computer-analysis-summary-value">${escapeHtml(results.length)}</div>
            </div>
            <div class="computer-analysis-summary-card">
              <div class="computer-analysis-summary-label">Depth</div>
              <div class="computer-analysis-summary-value">${escapeHtml(report?.depth || state.depth)}</div>
            </div>
          </div>
        </div>

        <div class="computer-analysis-report-grid">
          <div class="computer-analysis-card computer-analysis-graph-card">
            <div class="computer-analysis-card-title">Evaluation Graph</div>
            <div class="computer-analysis-graph-wrap">
              ${results.length ? createGraphSvg(results, state.selectedPly) : `<div class="computer-analysis-empty">No graph data yet.</div>`}
            </div>
            <div class="computer-analysis-progress">${escapeHtml(state.progressText || "")}</div>
          </div>

          <div class="computer-analysis-card computer-analysis-table-card">
            <div class="computer-analysis-card-title">Move Report</div>
            <div class="computer-analysis-player-accuracy">
              <div class="computer-analysis-player-accuracy-card is-white">
                <div class="computer-analysis-player-accuracy-label">${escapeHtml(whitePlayerName)} Accuracy</div>
                <div class="computer-analysis-player-accuracy-value">${escapeHtml(formatAccuracyLabel(report?.whiteAccuracy))}</div>
                <div class="computer-analysis-player-accuracy-stats">
                  <span class="computer-analysis-player-accuracy-stat is-brilliant" data-judgment-side="w" data-judgment-type="brilliant" tabindex="0" role="button">!! ${escapeHtml(formatJudgmentCount(whiteJudgments.brilliant))}</span>
                  <span class="computer-analysis-player-accuracy-stat is-great" data-judgment-side="w" data-judgment-type="great" tabindex="0" role="button">! ${escapeHtml(formatJudgmentCount(whiteJudgments.great))}</span>
                  <span class="computer-analysis-player-accuracy-stat is-inaccuracy" data-judgment-side="w" data-judgment-type="inaccuracy" tabindex="0" role="button">?! ${escapeHtml(formatJudgmentCount(whiteJudgments.inaccuracy))}</span>
                  <span class="computer-analysis-player-accuracy-stat is-mistake" data-judgment-side="w" data-judgment-type="mistake" tabindex="0" role="button">? ${escapeHtml(formatJudgmentCount(whiteJudgments.mistake))}</span>
                  <span class="computer-analysis-player-accuracy-stat is-blunder" data-judgment-side="w" data-judgment-type="blunder" tabindex="0" role="button">?? ${escapeHtml(formatJudgmentCount(whiteJudgments.blunder))}</span>
                </div>
              </div>
              <div class="computer-analysis-player-accuracy-card is-black">
                <div class="computer-analysis-player-accuracy-label">${escapeHtml(blackPlayerName)} Accuracy</div>
                <div class="computer-analysis-player-accuracy-value">${escapeHtml(formatAccuracyLabel(report?.blackAccuracy))}</div>
                <div class="computer-analysis-player-accuracy-stats">
                  <span class="computer-analysis-player-accuracy-stat is-brilliant" data-judgment-side="b" data-judgment-type="brilliant" tabindex="0" role="button">!! ${escapeHtml(formatJudgmentCount(blackJudgments.brilliant))}</span>
                  <span class="computer-analysis-player-accuracy-stat is-great" data-judgment-side="b" data-judgment-type="great" tabindex="0" role="button">! ${escapeHtml(formatJudgmentCount(blackJudgments.great))}</span>
                  <span class="computer-analysis-player-accuracy-stat is-inaccuracy" data-judgment-side="b" data-judgment-type="inaccuracy" tabindex="0" role="button">?! ${escapeHtml(formatJudgmentCount(blackJudgments.inaccuracy))}</span>
                  <span class="computer-analysis-player-accuracy-stat is-mistake" data-judgment-side="b" data-judgment-type="mistake" tabindex="0" role="button">? ${escapeHtml(formatJudgmentCount(blackJudgments.mistake))}</span>
                  <span class="computer-analysis-player-accuracy-stat is-blunder" data-judgment-side="b" data-judgment-type="blunder" tabindex="0" role="button">?? ${escapeHtml(formatJudgmentCount(blackJudgments.blunder))}</span>
                </div>
              </div>
            </div>
            <div class="computer-analysis-table-wrap">
              ${
                results.length
                  ? `
                    <table class="computer-analysis-table">
                      <thead>
                        <tr>
                          <th>Move</th>
                          <th>SAN</th>
                          <th>Eval</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${results
                          .map(
                            (item) => `
                              <tr class="computer-analysis-row${Number(state.selectedPly) === Number(item.ply) ? " is-selected" : ""}" data-ply="${Number(item.ply || 0)}" tabindex="0">
                                <td>${escapeHtml(item.side === "w" ? item.moveLabel || "" : "")}</td>
                                <td>
                                  <div class="computer-analysis-move-cell">
                                    <span class="computer-analysis-move-san">${escapeHtml(item.san || "")}</span>
                                    ${
                                      item.judgment
                                        ? `<span class="computer-analysis-judgment-badge is-${escapeHtml(
                                            item.judgment
                                          )}" data-ply="${Number(item.ply || 0)}" tabindex="0" role="button" aria-label="${escapeHtml(
                                            `Show best line for ${formatJudgmentLabel(item.judgment)}`
                                          )}">${escapeHtml(formatJudgmentLabel(item.judgment))}</span>`
                                        : ""
                                    }
                                  </div>
                                </td>
                                <td>${escapeHtml(formatEvalLabel(item))}</td>
                              </tr>
                            `
                          )
                          .join("")}
                      </tbody>
                    </table>
                  `
                  : `<div class="computer-analysis-empty">${state.busy ? "Waiting for engine results..." : "No analyzed moves yet."}</div>`
              }
            </div>
          </div>

          <div class="computer-analysis-card computer-analysis-board-card">
            <div class="computer-analysis-board-head">
              <div class="computer-analysis-card-title">Board</div>
              <div class="computer-analysis-board-actions">
                ${
                  report?.variantKey === "chess960"
                    ? ""
                    : `
                      <button type="button" id="computer-analysis-analysis-btn" class="player-action-btn computer-analysis-analysis-btn" title="Open in analysis" aria-label="Open in analysis">
                        <img src="../assets/extras/analysis.png" alt="Open in analysis">
                      </button>
                    `
                }
                <button type="button" id="computer-analysis-home-btn" class="player-action-btn computer-analysis-home-btn" title="Home" aria-label="Home">
                  <img src="../assets/extras/menu.png" alt="Home">
                </button>
                <button type="button" id="computer-analysis-flip-btn" class="player-action-btn computer-analysis-flip-btn" title="Flip board" aria-label="Flip board">
                  <img src="../assets/extras/flipboard.png" alt="Flip board">
                </button>
              </div>
            </div>
            <div class="computer-analysis-board-caption">
              ${escapeHtml(
                adviceEntry?.san
                  ? `Best line after ${adviceEntry.san}`
                  : getSelectedResult()?.san
                    ? `Position after ${getSelectedResult().moveLabel} ${getSelectedResult().san}`
                    : "Starting position"
              )}
            </div>
            ${renderBoardPreview()}
            ${
              hasAdvice
                ? `
                  <div class="computer-analysis-best-line">
                    <div class="computer-analysis-best-line-label">Best was:</div>
                    <div class="computer-analysis-best-line-moves">
                      ${adviceLine
                        .map(
                          (entry) => `
                            <button
                              type="button"
                              class="computer-analysis-best-line-move${Number(state.adviceStep) === Number(entry.index) ? " is-selected" : ""}"
                              data-advice-step="${Number(entry.index)}"
                              aria-label="${escapeHtml(`Show best line move ${entry.san}`)}"
                            >${escapeHtml(entry.san)}</button>
                          `
                        )
                        .join("")}
                    </div>
                  </div>
                `
                : ""
            }
          </div>
        </div>

      </div>
    `;
  }

  function attachEvents() {
    const formEl = document.getElementById("computer-analysis-form");
    const pgnEl = document.getElementById("computer-analysis-pgn");
    const depthEl = document.getElementById("computer-analysis-depth");
    const depthValueEl = document.getElementById("computer-analysis-depth-value");
    const flipBtnEl = document.getElementById("computer-analysis-flip-btn");
    const homeBtnEl = document.getElementById("computer-analysis-home-btn");
    const analysisBtnEl = document.getElementById("computer-analysis-analysis-btn");
    const graphWrapEl = document.querySelector(".computer-analysis-graph-wrap");
    const tableWrapEl = document.querySelector(".computer-analysis-table-wrap");
    const rowEls = Array.from(document.querySelectorAll(".computer-analysis-row"));
    const judgmentBadgeEls = Array.from(document.querySelectorAll(".computer-analysis-judgment-badge"));
    const judgmentStatEls = Array.from(document.querySelectorAll("[data-judgment-side][data-judgment-type]"));
    const adviceMoveEls = Array.from(document.querySelectorAll("[data-advice-step]"));

    const selectPly = (ply, options = {}) => {
      const numericPly = Number(ply);
      if (!Number.isFinite(numericPly) || numericPly <= 0) return;
      state.tableScrollTop = tableWrapEl ? tableWrapEl.scrollTop : state.tableScrollTop;
      state.selectedPly = numericPly;
      if (!options.keepAdvice) {
        state.advicePly = null;
        state.adviceStep = null;
      }
      render();
      if (options.scrollRow !== false) {
        window.requestAnimationFrame(() => {
          const rowEl = document.querySelector(`.computer-analysis-row[data-ply="${numericPly}"]`);
          rowEl?.scrollIntoView({ block: "nearest", behavior: "smooth" });
        });
      }
    };
    const results = Array.isArray(state.report?.results) ? state.report.results : [];
    const cycleJudgmentStat = (side, judgment) => {
      const filtered = results.filter(
        (item) => String(item?.side || "") === String(side || "") && String(item?.judgment || "") === String(judgment || "")
      );
      if (!filtered.length) return;
      const cycleKey = `${side}:${judgment}`;
      const nextIndex = Number.isInteger(state.judgmentCycleState[cycleKey])
        ? (state.judgmentCycleState[cycleKey] + 1) % filtered.length
        : 0;
      state.judgmentCycleState[cycleKey] = nextIndex;
      selectPly(filtered[nextIndex].ply);
    };
    const selectedIndex = results.findIndex((item) => Number(item?.ply) === Number(state.selectedPly));
    const firstPly = results.length ? Number(results[0].ply) : null;
    const lastPly = results.length ? Number(results[results.length - 1].ply) : null;

    if (pgnEl) {
      pgnEl.addEventListener("input", () => {
        state.pgnText = String(pgnEl.value || "");
      });
    }
    if (tableWrapEl) {
      tableWrapEl.scrollTop = Number(state.tableScrollTop || 0);
      tableWrapEl.addEventListener("scroll", () => {
        state.tableScrollTop = tableWrapEl.scrollTop;
      });
    }
    if (activeKeydownHandler) {
      window.removeEventListener("keydown", activeKeydownHandler);
      activeKeydownHandler = null;
    }
    if (state.screen === "report") {
      activeKeydownHandler = (event) => {
        if (event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLInputElement) return;
        if (!results.length) return;
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          if (selectedIndex > 0) {
            selectPly(results[selectedIndex - 1].ply);
          } else if (firstPly != null) {
            selectPly(firstPly);
          }
          return;
        }
        if (event.key === "ArrowRight") {
          event.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < results.length - 1) {
            selectPly(results[selectedIndex + 1].ply);
          } else if (firstPly != null) {
            selectPly(firstPly);
          }
          return;
        }
        if (event.key === "ArrowUp") {
          event.preventDefault();
          if (firstPly != null) {
            selectPly(firstPly);
          }
          return;
        }
        if (event.key === "ArrowDown") {
          event.preventDefault();
          if (lastPly != null) {
            selectPly(lastPly);
          }
        }
      };
      window.addEventListener("keydown", activeKeydownHandler);
    }
    if (depthEl && depthValueEl) {
      const syncDepth = () => {
        state.depth = Math.max(1, Math.min(30, Number(depthEl.value || 10)));
        depthValueEl.textContent = String(state.depth);
      };
      depthEl.addEventListener("input", syncDepth);
      depthEl.addEventListener("change", syncDepth);
    }
    if (formEl) {
      formEl.addEventListener("submit", handleStart);
    }
    if (flipBtnEl) {
      flipBtnEl.addEventListener("click", () => {
        state.boardFlipped = !state.boardFlipped;
        render();
      });
    }
    if (homeBtnEl) {
      homeBtnEl.addEventListener("click", () => {
        stopRun();
        state.busy = false;
        state.progressText = "";
        state.error = "";
        state.report = null;
        state.selectedPly = null;
        state.advicePly = null;
        state.adviceStep = null;
        state.boardFlipped = false;
        state.judgmentCycleState = {};
        state.archiveContext = null;
        state.screen = "setup";
        setAppMode("play");
        if (typeof showHomeScreen === "function") {
          showHomeScreen();
        }
      });
    }
    if (analysisBtnEl) {
      analysisBtnEl.addEventListener("click", async () => {
        const pgn = String(state.pgnText || "").trim();
        if (!pgn) {
          showAppMessage("No PGN available to open in analysis.");
          return;
        }
        stopRun();
        state.busy = false;
        state.progressText = "";
        state.error = "";
        state.selectedPly = null;
        state.advicePly = null;
        state.adviceStep = null;
        state.boardFlipped = false;
        state.judgmentCycleState = {};
        state.screen = "setup";
        if (typeof openAnalysisFromPgn === "function") {
          await openAnalysisFromPgn({
            pgn,
            report: state.report,
            archiveContext: state.archiveContext
          });
        }
      });
    }
    if (graphWrapEl) {
      graphWrapEl.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof Element)) return;
        const pointEl = target.closest("[data-ply]");
        if (!pointEl) return;
        selectPly(pointEl.getAttribute("data-ply"));
      });
      graphWrapEl.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        const target = event.target;
        if (!(target instanceof Element)) return;
        const pointEl = target.closest("[data-ply]");
        if (!pointEl) return;
        event.preventDefault();
        selectPly(pointEl.getAttribute("data-ply"));
      });
    }
    for (const rowEl of rowEls) {
      rowEl.addEventListener("click", () => {
        selectPly(rowEl.getAttribute("data-ply"), { scrollRow: false });
      });
      rowEl.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        selectPly(rowEl.getAttribute("data-ply"), { scrollRow: false });
      });
    }
    for (const badgeEl of judgmentBadgeEls) {
      badgeEl.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const ply = Number(badgeEl.getAttribute("data-ply"));
        if (!Number.isFinite(ply) || ply <= 0) return;
        const isSame = state.advicePly === ply;
        state.advicePly = isSame ? null : ply;
        state.adviceStep = null;
        selectPly(ply, { keepAdvice: true, scrollRow: false });
      });
      badgeEl.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        event.stopPropagation();
        const ply = Number(badgeEl.getAttribute("data-ply"));
        if (!Number.isFinite(ply) || ply <= 0) return;
        const isSame = state.advicePly === ply;
        state.advicePly = isSame ? null : ply;
        state.adviceStep = null;
        selectPly(ply, { keepAdvice: true, scrollRow: false });
      });
    }
    for (const statEl of judgmentStatEls) {
      statEl.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        cycleJudgmentStat(statEl.getAttribute("data-judgment-side"), statEl.getAttribute("data-judgment-type"));
      });
      statEl.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        event.stopPropagation();
        cycleJudgmentStat(statEl.getAttribute("data-judgment-side"), statEl.getAttribute("data-judgment-type"));
      });
    }
    for (const adviceMoveEl of adviceMoveEls) {
      adviceMoveEl.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const step = Number(adviceMoveEl.getAttribute("data-advice-step"));
        if (!Number.isFinite(step) || step < 0) return;
        state.adviceStep = step;
        render();
      });
      adviceMoveEl.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        event.stopPropagation();
        const step = Number(adviceMoveEl.getAttribute("data-advice-step"));
        if (!Number.isFinite(step) || step < 0) return;
        state.adviceStep = step;
        render();
      });
    }
  }

  function render() {
    if (!computerAnalysisRootEl) return;
    computerAnalysisRootEl.innerHTML = state.screen === "report" ? renderReportScreen() : renderSetupScreen();
    attachEvents();
  }

  return {
    openSetup,
    openAndStart,
    openWithSavedReport,
    showScreen,
    backToTools,
    onRunStarted,
    onRunProgress,
    onRunComplete,
    onRunError
  };
}

module.exports = { createComputerAnalysisModule };
