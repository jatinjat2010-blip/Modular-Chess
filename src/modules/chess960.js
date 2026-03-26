const LIGHT_BISHOP_FILES = [1, 3, 5, 7];
const DARK_BISHOP_FILES = [0, 2, 4, 6];
const KNIGHT_POSITION_TABLE = [
  [1, 1],
  [1, 2],
  [1, 3],
  [1, 4],
  [2, 2],
  [2, 3],
  [2, 4],
  [3, 3],
  [3, 4],
  [4, 4]
];

function randomChoice(values) {
  if (!Array.isArray(values) || values.length === 0) return null;
  return values[Math.floor(Math.random() * values.length)];
}

function placePieceOnNthFreeSquare(rank, piece, freeIndex) {
  let remaining = Number(freeIndex);
  for (let i = 0; i < rank.length; i += 1) {
    if (rank[i] !== null) continue;
    remaining -= 1;
    if (remaining <= 0) {
      rank[i] = piece;
      return true;
    }
  }
  return false;
}

function normalizeChess960PositionNumber(positionNumber) {
  const parsed = Number(positionNumber);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 960) return null;
  return parsed % 960;
}

function generateBackRank() {
  const rank = new Array(8).fill(null);
  const available = new Set([0, 1, 2, 3, 4, 5, 6, 7]);

  const bishopDark = randomChoice([0, 2, 4, 6]);
  const bishopLight = randomChoice([1, 3, 5, 7]);
  rank[bishopDark] = "B";
  rank[bishopLight] = "B";
  available.delete(bishopDark);
  available.delete(bishopLight);

  const queenFile = randomChoice(Array.from(available));
  rank[queenFile] = "Q";
  available.delete(queenFile);

  const knight1 = randomChoice(Array.from(available));
  available.delete(knight1);
  const knight2 = randomChoice(Array.from(available));
  rank[knight1] = "N";
  rank[knight2] = "N";
  available.delete(knight2);

  const rem = Array.from(available).sort((a, b) => a - b);
  rank[rem[0]] = "R";
  rank[rem[1]] = "K";
  rank[rem[2]] = "R";
  return rank.join("");
}

function generateBackRankFromPositionNumber(positionNumber) {
  const normalized = normalizeChess960PositionNumber(positionNumber);
  if (normalized === null) return null;
  let index = normalized;
  const rank = new Array(8).fill(null);

  const lightIndex = index % 4;
  index = Math.floor(index / 4);
  rank[LIGHT_BISHOP_FILES[lightIndex]] = "B";

  const darkIndex = index % 4;
  index = Math.floor(index / 4);
  rank[DARK_BISHOP_FILES[darkIndex]] = "B";

  const queenIndex = index % 6;
  index = Math.floor(index / 6);
  placePieceOnNthFreeSquare(rank, "Q", queenIndex + 1);

  const knightPattern = KNIGHT_POSITION_TABLE[index] || KNIGHT_POSITION_TABLE[0];
  placePieceOnNthFreeSquare(rank, "N", knightPattern[0]);
  placePieceOnNthFreeSquare(rank, "N", knightPattern[1]);

  for (let i = 0; i < rank.length; i += 1) {
    if (rank[i] !== null) continue;
    rank[i] = "R";
    break;
  }
  for (let i = 0; i < rank.length; i += 1) {
    if (rank[i] !== null) continue;
    rank[i] = "K";
    break;
  }
  for (let i = 0; i < rank.length; i += 1) {
    if (rank[i] !== null) continue;
    rank[i] = "R";
    break;
  }

  return rank.join("");
}

function buildFenFromBackRank(whiteBackRank) {
  const white = String(whiteBackRank || "").toUpperCase();
  if (!/^[RNBQK]{8}$/.test(white)) return "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  const black = white.toLowerCase();
  return `${black}/pppppppp/8/8/8/8/PPPPPPPP/${white} w KQkq - 0 1`;
}

function generateRandomFen() {
  return buildFenFromBackRank(generateBackRank());
}

function generateFenFromPositionNumber(positionNumber) {
  const backRank = generateBackRankFromPositionNumber(positionNumber);
  return backRank ? buildFenFromBackRank(backRank) : null;
}

function createChess960Module({
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
  getBoardImage
}) {
  let currentFen = "";
  const positionNumberInputEl = document.getElementById("chess960-position-number");
  const MIN_BOARD_SIZE = 360;
  const MAX_BOARD_SIZE = 980;
  const BOARD_SIZE_STORAGE_KEY = "offline_chess_960_board_size";
  const resizeState = {
    active: false,
    startX: 0,
    startWidth: 0
  };

  function parseFenRows(fen) {
    const placement = String(fen || "").trim().split(/\s+/)[0] || "";
    const rows = placement.split("/");
    if (rows.length !== 8) return null;
    const out = [];
    for (const row of rows) {
      const cols = [];
      for (const ch of row) {
        if (/[1-8]/.test(ch)) {
          const n = Number(ch);
          for (let i = 0; i < n; i += 1) cols.push(null);
        } else if (/[prnbqkPRNBQK]/.test(ch)) {
          const white = ch === ch.toUpperCase();
          cols.push({ color: white ? "w" : "b", type: ch.toLowerCase() });
        } else {
          return null;
        }
      }
      if (cols.length !== 8) return null;
      out.push(cols);
    }
    return out;
  }

  function renderBoardFromFen(fen) {
    if (!chess960BoardEl) return;
    chess960BoardEl.innerHTML = "";
    chess960BoardEl.style.backgroundImage = `url("${getBoardImage()}")`;
    const rows = parseFenRows(fen);
    if (!rows) return;
    for (let r = 0; r < 8; r += 1) {
      for (let c = 0; c < 8; c += 1) {
        const cell = document.createElement("div");
        cell.className = "chess960-square";
        cell.classList.add((r + c) % 2 === 0 ? "light" : "dark");
        const piece = rows[r][c];
        if (piece) {
          const img = document.createElement("img");
          img.className = "chess960-piece";
          img.src = pieceAssetPath(piece);
          img.alt = `${piece.color}${piece.type}`;
          cell.appendChild(img);
        }
        chess960BoardEl.appendChild(cell);
      }
    }
  }

  function renderCurrent() {
    if (!currentFen) return;
    renderBoardFromFen(currentFen);
    if (chess960FenOutputEl) chess960FenOutputEl.value = currentFen;
  }

  function clampSize(px) {
    return Math.max(MIN_BOARD_SIZE, Math.min(MAX_BOARD_SIZE, Math.round(px)));
  }

  function applyBoardSize(px, persist = true) {
    if (!chess960BoardWrapEl) return;
    const safe = clampSize(px);
    chess960BoardWrapEl.style.width = `${safe}px`;
    if (persist) {
      try {
        localStorage.setItem(BOARD_SIZE_STORAGE_KEY, String(safe));
      } catch (_) {
        // ignore storage errors
      }
    }
  }

  function loadBoardSize() {
    const preferred = Math.min(1080, Math.floor(window.innerWidth * 0.82));
    let next = preferred;
    try {
      const raw = localStorage.getItem(BOARD_SIZE_STORAGE_KEY);
      const parsed = Number(raw);
      if (Number.isFinite(parsed) && parsed > 0) next = parsed;
    } catch (_) {
      // ignore storage errors
    }
    applyBoardSize(next, false);
  }

  function stopResize() {
    resizeState.active = false;
    if (chess960BoardWrapEl) chess960BoardWrapEl.classList.remove("resizing");
    window.removeEventListener("pointermove", onResizePointerMove);
    window.removeEventListener("pointerup", onResizePointerUp);
    window.removeEventListener("pointercancel", onResizePointerUp);
  }

  function onResizePointerMove(event) {
    if (!resizeState.active) return;
    const delta = event.clientX - resizeState.startX;
    applyBoardSize(resizeState.startWidth + delta);
  }

  function onResizePointerUp() {
    if (!resizeState.active) return;
    stopResize();
  }

  function onResizePointerDown(event) {
    if (event.button !== 0) return;
    if (!chess960BoardWrapEl) return;
    event.preventDefault();
    resizeState.active = true;
    resizeState.startX = event.clientX;
    resizeState.startWidth = chess960BoardWrapEl.getBoundingClientRect().width;
    chess960BoardWrapEl.classList.add("resizing");
    window.addEventListener("pointermove", onResizePointerMove);
    window.addEventListener("pointerup", onResizePointerUp);
    window.addEventListener("pointercancel", onResizePointerUp);
  }

  function initBoardResize() {
    loadBoardSize();
    if (!chess960ResizeHandleEl) return;
    chess960ResizeHandleEl.addEventListener("pointerdown", onResizePointerDown);
  }

  function generateRandom() {
    currentFen = generateRandomFen();
    if (positionNumberInputEl) positionNumberInputEl.value = "";
    renderCurrent();
    return currentFen;
  }

  function generateFromPositionNumber(positionNumber) {
    const nextFen = generateFenFromPositionNumber(positionNumber);
    if (!nextFen) return null;
    currentFen = nextFen;
    if (positionNumberInputEl) {
      positionNumberInputEl.value = String(Number(positionNumber));
    }
    renderCurrent();
    return currentFen;
  }

  function showScreen() {
    closeHomeProfileMenu();
    closeHomeOnlinePanels();
    if (homeProfileEl) homeProfileEl.classList.add("hidden");
    if (homeScreenEl) homeScreenEl.classList.add("hidden");
    if (toolsScreenEl) toolsScreenEl.classList.add("hidden");
    if (chess960ScreenEl) chess960ScreenEl.classList.remove("hidden");
    if (gameScreenEl) gameScreenEl.classList.add("hidden");
    updateHomeOnlineToolbarVisibility();
    if (!currentFen) generateRandom();
    else renderCurrent();
  }

  function backToTools() {
    closeHomeProfileMenu();
    closeHomeOnlinePanels();
    if (homeProfileEl) homeProfileEl.classList.add("hidden");
    if (homeScreenEl) homeScreenEl.classList.add("hidden");
    if (toolsScreenEl) toolsScreenEl.classList.remove("hidden");
    if (chess960ScreenEl) chess960ScreenEl.classList.add("hidden");
    if (gameScreenEl) gameScreenEl.classList.add("hidden");
    updateHomeOnlineToolbarVisibility();
  }

  function onThemeChange() {
    renderCurrent();
  }

  initBoardResize();

  return {
    showScreen,
    backToTools,
    generateRandom,
    generateFromPositionNumber,
    generateRandomFen,
    onThemeChange
  };
}

module.exports = {
  createChess960Module,
  generateBackRank,
  buildFenFromBackRank,
  generateRandomFen,
  normalizeChess960PositionNumber,
  generateBackRankFromPositionNumber,
  generateFenFromPositionNumber
};
