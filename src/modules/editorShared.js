function createEditorSharedHelpers({ Chess, files }) {
  function makeBoardFromMatrix(matrix) {
    const board = {};
    for (let rankIndex = 0; rankIndex < 8; rankIndex += 1) {
      for (let fileIndex = 0; fileIndex < 8; fileIndex += 1) {
        const piece = matrix[rankIndex][fileIndex];
        if (!piece) continue;
        const sq = `${files[fileIndex]}${8 - rankIndex}`;
        board[sq] = { color: piece.color, type: piece.type };
      }
    }
    return board;
  }

  function makeEditorStartBoard() {
    return makeBoardFromMatrix(new Chess().board());
  }

  function cloneBoard(board) {
    const next = {};
    for (const [square, piece] of Object.entries(board || {})) {
      if (!piece) continue;
      next[square] = { color: piece.color, type: piece.type };
    }
    return next;
  }

  function getPiece(board, square) {
    const piece = board?.[square];
    if (!piece) return null;
    return { color: piece.color, type: piece.type };
  }

  function setPiece(board, square, piece) {
    if (!piece) {
      delete board[square];
      return;
    }
    board[square] = { color: piece.color, type: piece.type };
  }

  function countPieces(board) {
    return Object.values(board || {}).filter(Boolean).length;
  }

  function normalizeEpSquare(value) {
    const raw = String(value || "-").trim().toLowerCase();
    if (!raw || raw === "-") return "-";
    if (!/^[a-h][36]$/.test(raw)) return "-";
    return raw;
  }

  function getEpOptions(editorState) {
    const options = [];
    const sideToMove = editorState.turn === "b" ? "b" : "w";
    const isWhiteJustMoved = sideToMove === "b";
    const targetRank = isWhiteJustMoved ? "3" : "6";
    const movedPawnRank = isWhiteJustMoved ? "4" : "5";
    const capturerColor = isWhiteJustMoved ? "b" : "w";
    const capturerRank = movedPawnRank;

    for (let fileIndex = 0; fileIndex < files.length; fileIndex += 1) {
      const file = files[fileIndex];
      const movedPawnSquare = `${file}${movedPawnRank}`;
      const movedPawn = editorState.board[movedPawnSquare];
      if (!movedPawn || movedPawn.type !== "p") continue;
      if (isWhiteJustMoved && movedPawn.color !== "w") continue;
      if (!isWhiteJustMoved && movedPawn.color !== "b") continue;

      let capturerExists = false;
      for (const delta of [-1, 1]) {
        const adjIndex = fileIndex + delta;
        if (adjIndex < 0 || adjIndex >= files.length) continue;
        const adjFile = files[adjIndex];
        const capturerSq = `${adjFile}${capturerRank}`;
        const capturer = editorState.board[capturerSq];
        if (capturer && capturer.type === "p" && capturer.color === capturerColor) {
          capturerExists = true;
          break;
        }
      }
      if (capturerExists) {
        options.push(`${file}${targetRank}`);
      }
    }

    return options;
  }

  function buildFenPlacement(board) {
    const rows = [];
    for (let rank = 8; rank >= 1; rank -= 1) {
      let row = "";
      let empties = 0;
      for (const file of files) {
        const sq = `${file}${rank}`;
        const piece = board[sq];
        if (!piece) {
          empties += 1;
          continue;
        }
        if (empties > 0) {
          row += String(empties);
          empties = 0;
        }
        const letter = piece.type.toLowerCase();
        row += piece.color === "w" ? letter.toUpperCase() : letter;
      }
      if (empties > 0) row += String(empties);
      rows.push(row);
    }
    return rows.join("/");
  }

  function getFen(editorState) {
    const placement = buildFenPlacement(editorState.board || {});
    const turn = editorState.turn === "b" ? "b" : "w";
    let castling = "";
    if (editorState.castling.K) castling += "K";
    if (editorState.castling.Q) castling += "Q";
    if (editorState.castling.k) castling += "k";
    if (editorState.castling.q) castling += "q";
    if (!castling) castling = "-";
    const ep = normalizeEpSquare(editorState.ep);
    const halfmove = Math.max(0, Math.floor(Number(editorState.halfmove) || 0));
    const fullmove = Math.max(1, Math.floor(Number(editorState.fullmove) || 1));
    return `${placement} ${turn} ${castling} ${ep} ${halfmove} ${fullmove}`;
  }

  function loadStateFromFen(editorState, rawFen) {
    const test = new Chess();
    test.load(rawFen);
    editorState.board = makeBoardFromMatrix(test.board());
    const parts = String(rawFen || "").trim().split(/\s+/);
    editorState.turn = parts[1] === "b" ? "b" : "w";
    const castling = parts[2] || "-";
    editorState.castling = {
      K: castling.includes("K"),
      Q: castling.includes("Q"),
      k: castling.includes("k"),
      q: castling.includes("q")
    };
    editorState.ep = normalizeEpSquare(parts[3] || "-");
    editorState.halfmove = Math.max(0, Math.floor(Number(parts[4]) || 0));
    editorState.fullmove = Math.max(1, Math.floor(Number(parts[5]) || 1));
    return editorState;
  }

  function areKingsAdjacent(board) {
    let whiteKing = null;
    let blackKing = null;
    for (const [sq, piece] of Object.entries(board || {})) {
      if (!piece || piece.type !== "k") continue;
      if (piece.color === "w") whiteKing = sq;
      if (piece.color === "b") blackKing = sq;
    }
    if (!whiteKing || !blackKing) return false;
    const wf = files.indexOf(whiteKing[0]);
    const wr = Number(whiteKing[1]);
    const bf = files.indexOf(blackKing[0]);
    const br = Number(blackKing[1]);
    return Math.abs(wf - bf) <= 1 && Math.abs(wr - br) <= 1;
  }

  function validateEditorState(editorState, options = {}) {
    const board = editorState.board || {};
    const pieceCount = countPieces(board);
    const maxPieces = Number(options.maxPieces);
    if (Number.isFinite(maxPieces) && pieceCount > maxPieces) {
      return { ok: false, error: `Invalid position: maximum ${maxPieces} pieces allowed.`, pieceCount };
    }

    let whiteKings = 0;
    let blackKings = 0;
    for (const [sq, piece] of Object.entries(board)) {
      if (!piece) continue;
      if (piece.type === "p" && (sq[1] === "1" || sq[1] === "8")) {
        return { ok: false, error: `Invalid position: pawn on ${sq}.`, pieceCount };
      }
      if (piece.type === "k" && piece.color === "w") whiteKings += 1;
      if (piece.type === "k" && piece.color === "b") blackKings += 1;
    }

    if (whiteKings !== 1 || blackKings !== 1) {
      return {
        ok: false,
        error: "Invalid position: exactly one white king and one black king are required.",
        pieceCount
      };
    }

    if (areKingsAdjacent(board)) {
      return { ok: false, error: "Invalid position: kings cannot be adjacent.", pieceCount };
    }

    const fen = getFen(editorState);
    const test = new Chess();
    try {
      test.load(fen);
    } catch (_) {
      return { ok: false, error: "Invalid FEN: position or metadata is not legal.", pieceCount };
    }

    const fenParts = fen.split(/\s+/);
    if (fenParts.length >= 2) {
      const sideToMove = fenParts[1] === "b" ? "b" : "w";
      const opposite = sideToMove === "w" ? "b" : "w";
      const oppositeTurnFen = [fenParts[0], opposite, fenParts[2], "-", fenParts[4], fenParts[5]].join(" ");
      const oppositeCheckProbe = new Chess();
      try {
        oppositeCheckProbe.load(oppositeTurnFen);
        if (oppositeCheckProbe.inCheck()) {
          if (sideToMove === "b") {
            return {
              ok: false,
              error: "Invalid position: White king cannot be in check when Black is to move.",
              pieceCount
            };
          }
          return {
            ok: false,
            error: "Invalid position: Black king cannot be in check when White is to move.",
            pieceCount
          };
        }
      } catch (_) {
        return { ok: false, error: "Invalid FEN: failed to verify check state.", pieceCount };
      }
    }

    return { ok: true, fen, pieceCount };
  }

  return {
    makeBoardFromMatrix,
    makeEditorStartBoard,
    cloneBoard,
    getPiece,
    setPiece,
    countPieces,
    normalizeEpSquare,
    getEpOptions,
    buildFenPlacement,
    getFen,
    loadStateFromFen,
    areKingsAdjacent,
    validateEditorState
  };
}

module.exports = { createEditorSharedHelpers };
