const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

let fairyPromise = null;
let fairyApi = null;

function colorBoolToShort(color) {
  return color ? "w" : "b";
}

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
      if (ch === "~") {
        continue;
      }
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
      const square = `${file}${rank}`;
      map.set(square, {
        color: ch === ch.toUpperCase() ? "w" : "b",
        type: roleFromFenChar(ch)
      });
    }
  }
  return map;
}

function normalizeFenForRepetition(fen) {
  const parts = String(fen || "").trim().split(/\s+/);
  if (parts.length >= 7) {
    return parts.slice(0, 5).join(" ");
  }
  return parts.slice(0, 4).join(" ");
}

function inferMoveFlags(moveInfo, boardMap) {
  let flags = "";
  if (moveInfo.drop) flags += "d";
  if (moveInfo.san === "O-O") flags += "k";
  if (moveInfo.san === "O-O-O") flags += "q";
  if (moveInfo.capture) flags += "c";
  if (moveInfo.promotion) flags += "p";
  if (moveInfo.drop) return flags;
  const piece = boardMap.get(moveInfo.from);
  if (piece && piece.type === "p" && moveInfo.from[0] === moveInfo.to[0]) {
    const rankDelta = Math.abs(Number(moveInfo.from[1]) - Number(moveInfo.to[1]));
    if (rankDelta === 2) flags += "b";
  }
  return flags;
}

async function loadFairyApi() {
  if (fairyApi) return fairyApi;
  if (!fairyPromise) {
    const baseDir = path.resolve(__dirname, "..", "..", "..", "node_modules", "ffish-es6");
    const wasmBinary = fs.readFileSync(path.join(baseDir, "ffish.wasm"));
    const loadCtorPromise = globalThis.__ffishModuleReadyPromise
      ? globalThis.__ffishModuleReadyPromise
      : import(pathToFileURL(path.join(baseDir, "ffish.js")).href).then((mod) => mod.default);
    fairyPromise = loadCtorPromise
      .then((ModuleCtor) => new ModuleCtor({ wasmBinary }))
      .then((loaded) => {
        fairyApi = loaded;
        return fairyApi;
      });
  }
  return fairyPromise;
}

function getFairyApi() {
  if (!fairyApi) {
    throw new Error("Fairy rules engine is not loaded yet.");
  }
  return fairyApi;
}

class FairyVariantGame {
  constructor(variantName, startFen) {
    const api = getFairyApi();
    this.api = api;
    this.variantName = String(variantName || "chess");
    this.isChess960Rules = this.variantName === "fischerandom";
    this.startFen = String(startFen || "").trim();
    this.boardState = new api.Board(this.variantName, this.startFen, this.isChess960Rules);
    this.moveStack = [];
    this.positionKeys = [normalizeFenForRepetition(this.fen())];
  }

  _deleteBoard(board) {
    if (board && typeof board.delete === "function") {
      try {
        board.delete();
      } catch (_) {
        // ignore wasm cleanup failures
      }
    }
  }

  _resetBoard(fen) {
    this._deleteBoard(this.boardState);
    this.boardState = new this.api.Board(this.variantName, fen, this.isChess960Rules);
  }

  _getBoardMap() {
    return parseFenBoardMap(this.fen());
  }

  _buildVerboseMove(uci, san, boardMap = this._getBoardMap()) {
    if (!uci) return null;
    if (/^[A-Za-z]@[a-z]\d$/.test(uci)) {
      const dropPiece = roleFromFenChar(uci[0]);
      const to = uci.slice(2, 4);
      const moveInfo = {
        color: this.turn(),
        piece: dropPiece,
        from: null,
        to,
        san,
        promotion: undefined,
        capture: typeof this.boardState.isCapture === "function" ? !!this.boardState.isCapture(uci) : false,
        drop: dropPiece,
        uci
      };
      moveInfo.flags = inferMoveFlags(moveInfo, boardMap);
      moveInfo.captured = moveInfo.capture ? (boardMap.get(to)?.type || undefined) : undefined;
      return moveInfo;
    }
    if (uci.length < 4) return null;
    const from = uci.slice(0, 2);
    const to = uci.slice(2, 4);
    const promotion = uci.length > 4 ? uci[4].toLowerCase() : undefined;
    const piece = boardMap.get(from);
    if (!piece) return null;
    const capture = typeof this.boardState.isCapture === "function" ? !!this.boardState.isCapture(uci) : !!boardMap.get(to);
    const moveInfo = {
      color: piece.color,
      piece: piece.type,
      from,
      to,
      san,
      promotion,
      capture,
      drop: null,
      uci
    };
    moveInfo.flags = inferMoveFlags(moveInfo, boardMap);
    moveInfo.captured = capture ? (boardMap.get(to)?.type || undefined) : undefined;
    return moveInfo;
  }

  clone() {
    const cloned = new FairyVariantGame(this.variantName, this.startFen);
    for (const entry of this.moveStack) {
      if (entry.drop) {
        cloned.move({
          drop: entry.drop,
          to: entry.to
        });
      } else {
        cloned.move({
          from: entry.from,
          to: entry.to,
          promotion: entry.promotion
        });
      }
    }
    return cloned;
  }

  load(fen) {
    this.startFen = String(fen || "").trim();
    this.moveStack = [];
    this._resetBoard(this.startFen);
    this.positionKeys = [normalizeFenForRepetition(this.fen())];
    return this.fen();
  }

  fen() {
    return this.boardState.fen();
  }

  turn() {
    return colorBoolToShort(this.boardState.turn());
  }

  get(squareName) {
    return this._getBoardMap().get(String(squareName || "")) || null;
  }

  board() {
    const boardMap = this._getBoardMap();
    const rows = [];
    for (let rank = 8; rank >= 1; rank -= 1) {
      const row = [];
      for (let fileIdx = 0; fileIdx < 8; fileIdx += 1) {
        const file = String.fromCharCode(97 + fileIdx);
        row.push(boardMap.get(`${file}${rank}`) || null);
      }
      rows.push(row);
    }
    return rows;
  }

  moves(options = {}) {
    const uciMoves = String(this.boardState.legalMoves() || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    const sanMoves = String(this.boardState.legalMovesSan() || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    const boardMap = this._getBoardMap();
    const verboseMoves = [];
    for (let i = 0; i < uciMoves.length; i += 1) {
      const uci = uciMoves[i];
      const san = sanMoves[i] || this.boardState.sanMove(uci);
      const moveInfo = this._buildVerboseMove(uci, san, boardMap);
      if (!moveInfo) continue;
      if (options.square && moveInfo.from !== String(options.square || "")) continue;
      verboseMoves.push(moveInfo);
    }
    if (options.verbose) return verboseMoves;
    return verboseMoves.map((move) => move.san);
  }

  move(moveInput) {
    if (!moveInput || typeof moveInput !== "object") return null;
    let uci = "";
    if (moveInput.drop) {
      const drop = roleFromFenChar(String(moveInput.drop || ""));
      const to = String(moveInput.to || "");
      if (!drop || !/^[a-h][1-8]$/.test(to)) return null;
      uci = `${drop.toUpperCase()}@${to}`;
    } else {
      const from = String(moveInput.from || "");
      const to = String(moveInput.to || "");
      if (!/^[a-h][1-8]$/.test(from) || !/^[a-h][1-8]$/.test(to)) return null;
      const promotion = moveInput.promotion ? String(moveInput.promotion).toLowerCase() : "";
      uci = `${from}${to}${promotion}`;
    }
    const legalMoves = this.moves({ verbose: true });
    const chosen = legalMoves.find((move) => `${move.from}${move.to}${move.promotion || ""}` === uci);
    const chosenMove = chosen || legalMoves.find((move) => move.uci === uci);
    if (!chosenMove) return null;
    const pushed = this.boardState.push(uci);
    if (!pushed) return null;
    const entry = {
      color: chosenMove.color,
      piece: chosenMove.piece,
      from: chosenMove.from,
      to: chosenMove.to,
      san: chosenMove.san,
      flags: chosenMove.flags,
      promotion: chosenMove.promotion,
      captured: chosenMove.captured,
      drop: chosenMove.drop || null,
      uci,
      afterFen: this.fen()
    };
    this.moveStack.push(entry);
    this.positionKeys.push(normalizeFenForRepetition(entry.afterFen));
    return {
      color: entry.color,
      piece: entry.piece,
      from: entry.from,
      to: entry.to,
      san: entry.san,
      flags: entry.flags,
      promotion: entry.promotion,
      captured: entry.captured,
      drop: entry.drop,
      uci: entry.uci
    };
  }

  undo() {
    if (!this.moveStack.length) return null;
    const entry = this.moveStack.pop();
    this.boardState.pop();
    this.positionKeys.pop();
    return {
      color: entry.color,
      piece: entry.piece,
      from: entry.from,
      to: entry.to,
      san: entry.san,
      flags: entry.flags,
      promotion: entry.promotion,
      captured: entry.captured,
      drop: entry.drop,
      uci: entry.uci
    };
  }

  history(options = {}) {
    if (options.verbose) {
      return this.moveStack.map((entry) => ({
        color: entry.color,
        piece: entry.piece,
        from: entry.from,
        to: entry.to,
        san: entry.san,
        flags: entry.flags,
        promotion: entry.promotion,
        captured: entry.captured,
        drop: entry.drop,
        uci: entry.uci
      }));
    }
    return this.moveStack.map((entry) => entry.san);
  }

  pocket(color) {
    const short = String(color || "").trim().toLowerCase();
    const isWhite = short === "w" || short === "white";
    if (typeof this.boardState.pocket !== "function") return "";
    return String(this.boardState.pocket(isWhite) || "");
  }

  inCheck() {
    return this.boardState.isCheck();
  }

  isCheck() {
    return this.boardState.isCheck();
  }

  isCheckmate() {
    return this.boardState.numberLegalMoves() === 0 && this.boardState.isCheck();
  }

  isStalemate() {
    return this.boardState.numberLegalMoves() === 0 && !this.boardState.isCheck();
  }

  isInsufficientMaterial() {
    return this.boardState.isInsufficientMaterial();
  }

  isThreefoldRepetition() {
    const current = normalizeFenForRepetition(this.fen());
    return this.positionKeys.filter((key) => key === current).length >= 3;
  }

  isDrawByFiftyMoves() {
    return Number(this.boardState.halfmoveClock() || 0) >= 100;
  }

  isDraw() {
    return this.isStalemate() || this.isInsufficientMaterial() || this.isThreefoldRepetition() || this.isDrawByFiftyMoves();
  }

  isGameOver() {
    return this.boardState.isGameOver(true);
  }

  result() {
    if (typeof this.boardState.result === "function") {
      return String(this.boardState.result() || "*");
    }
    return "*";
  }
}

function createFairyVariantGame(variantName, fen) {
  return new FairyVariantGame(variantName, fen);
}

function createChess960Game(fen) {
  return createFairyVariantGame("fischerandom", fen);
}

module.exports = {
  loadFairyApi,
  loadChess960Api: loadFairyApi,
  createFairyVariantGame,
  createChess960Game
};
