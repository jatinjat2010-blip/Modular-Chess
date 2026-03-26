const samplePuzzles = require("./data/samplePuzzles");

function normalizeTextList(value) {
  return String(value || "")
    .split(",")
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
}

function deriveTurnColor(fen) {
  const parts = String(fen || "").trim().split(/\s+/);
  return parts[1] === "b" ? "b" : "w";
}

function createPuzzleDataService({ Chess }) {
  function validatePuzzles(list) {
    return (Array.isArray(list) ? list : []).filter((puzzle) => {
      try {
        const game = new Chess(puzzle.fen);
        for (const uci of puzzle.moves || []) {
          const move = {
            from: String(uci).slice(0, 2),
            to: String(uci).slice(2, 4),
            promotion: String(uci).slice(4) || undefined
          };
          const ok = game.move(move);
          if (!ok) return false;
        }
        return true;
      } catch (_) {
        return false;
      }
    }).map((puzzle) => ({
      ...puzzle,
      color: deriveTurnColor(puzzle.fen)
    }));
  }

  let puzzles = validatePuzzles(samplePuzzles);
  let datasetMeta = {
    count: puzzles.length
  };

  function replaceDataset(nextPuzzles) {
    const validated = validatePuzzles(nextPuzzles);
    if (validated.length > 0) {
      puzzles = validated;
      datasetMeta = {
        count: puzzles.length
      };
      return puzzles.length;
    }
    puzzles = validatePuzzles(samplePuzzles);
    datasetMeta = {
      count: puzzles.length
    };
    return puzzles.length;
  }

  function getDatasetMeta() {
    return { ...datasetMeta };
  }

  function getAvailableThemes() {
    return Array.from(
      new Set(puzzles.flatMap((puzzle) => Array.isArray(puzzle.themes) ? puzzle.themes : []))
    ).sort((a, b) => a.localeCompare(b));
  }

  function getAvailableOpenings() {
    return Array.from(
      new Set(puzzles.flatMap((puzzle) => Array.isArray(puzzle.openingTags) ? puzzle.openingTags : []))
    ).sort((a, b) => a.localeCompare(b));
  }

  function getMatchingPuzzles(filters) {
    const ratingMin = Number.isFinite(Number(filters?.ratingMin)) ? Number(filters.ratingMin) : 0;
    const ratingMax = Number.isFinite(Number(filters?.ratingMax)) ? Number(filters.ratingMax) : Number.MAX_SAFE_INTEGER;
    const popularityMin = Number.isFinite(Number(filters?.popularityMin)) ? Number(filters.popularityMin) : 0;
    const popularityMax =
      Number.isFinite(Number(filters?.popularityMax)) ? Number(filters.popularityMax) : Number.MAX_SAFE_INTEGER;
    const playsMin = Number.isFinite(Number(filters?.playsMin)) ? Number(filters.playsMin) : 0;
    const playsMax = Number.isFinite(Number(filters?.playsMax)) ? Number(filters.playsMax) : Number.MAX_SAFE_INTEGER;
    const ratingDeviationMax =
      Number.isFinite(Number(filters?.ratingDeviationMax)) ? Number(filters.ratingDeviationMax) : Number.MAX_SAFE_INTEGER;
    const color = filters?.color === "w" || filters?.color === "b" ? filters.color : "any";
    const themeTokens = normalizeTextList(filters?.themesText);
    const openingTokens = normalizeTextList(filters?.openingsText);

    return puzzles.filter((puzzle) => {
      if (puzzle.rating < ratingMin || puzzle.rating > ratingMax) return false;
      if (puzzle.popularity < popularityMin || puzzle.popularity > popularityMax) return false;
      if (puzzle.plays < playsMin || puzzle.plays > playsMax) return false;
      if (puzzle.ratingDeviation > ratingDeviationMax) return false;
      if (color !== "any" && puzzle.color !== color) return false;
      const themes = Array.isArray(puzzle.themes) ? puzzle.themes.map((item) => String(item).toLowerCase()) : [];
      const openings = Array.isArray(puzzle.openingTags)
        ? puzzle.openingTags.map((item) => String(item).toLowerCase())
        : [];
      if (themeTokens.length && !themeTokens.every((token) => themes.some((theme) => theme.includes(token)))) {
        return false;
      }
      if (openingTokens.length && !openingTokens.every((token) => openings.some((opening) => opening.includes(token)))) {
        return false;
      }
      return true;
    });
  }

  return {
    getAvailableOpenings,
    getAvailableThemes,
    getDatasetMeta,
    getMatchingPuzzles,
    replaceDataset
  };
}

module.exports = { createPuzzleDataService };
