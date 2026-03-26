const PUZZLE_APP_MODES = Object.freeze({
  SETUP: "puzzle-setup",
  PLAY: "puzzle"
});

const DEFAULT_PUZZLE_FILTERS = Object.freeze({
  ratingMin: 600,
  ratingMax: 4000,
  popularityMin: 0,
  popularityMax: 100,
  playsMin: 0,
  playsMax: 10000000,
  ratingDeviationMax: 1000,
  color: "any",
  themesText: "",
  openingsText: "",
  hintsEnabled: false,
  autoNext: true
});

module.exports = {
  DEFAULT_PUZZLE_FILTERS,
  PUZZLE_APP_MODES
};
