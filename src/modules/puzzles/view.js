function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderTagList(title, values, emptyText) {
  if (!Array.isArray(values) || values.length === 0) {
    return `
      <div class="puzzle-filter-hint">
        <strong>${escapeHtml(title)}:</strong> ${escapeHtml(emptyText)}
      </div>
    `;
  }
  return `
    <div class="puzzle-filter-hint">
      <strong>${escapeHtml(title)}:</strong> ${values.map((value) => `<span class="puzzle-tag">${escapeHtml(value)}</span>`).join("")}
    </div>
  `;
}

function buildSelectableTagList(title, values, selectedText, dataKind) {
  const selected = new Set(
    String(selectedText || "")
      .split(",")
      .map((token) => token.trim().toLowerCase())
      .filter(Boolean)
  );
  if (!Array.isArray(values) || values.length === 0) {
    return `
      <div class="puzzle-filter-hint">
        <strong>${escapeHtml(title)}:</strong> No suggestions available yet.
      </div>
    `;
  }
  return `
    <div class="puzzle-filter-hint">
      <strong>${escapeHtml(title)}:</strong>
      <div class="puzzle-tag-cloud">
        ${values
          .map((value) => {
            const active = selected.has(String(value).toLowerCase());
            return `<button type="button" class="puzzle-tag puzzle-tag-button${active ? " is-active" : ""}" data-tag-kind="${escapeHtml(
              dataKind
            )}" data-tag-value="${escapeHtml(value)}">${escapeHtml(value)}</button>`;
          })
          .join("")}
      </div>
    </div>
  `;
}

function createPuzzleView({ state, elements }) {
  function renderSetup(matchCount) {
    if (!elements.puzzleRootEl) return;
    const filters = state.filters;
    elements.puzzleRootEl.innerHTML = `
      <div class="puzzle-shell__header">
        <div>
          <div class="puzzle-shell__eyebrow">Puzzle Module</div>
          <h2 class="puzzle-shell__title">Puzzle Trainer</h2>
          <div class="puzzle-shell__dataset">Dataset: lichess</div>
        </div>
        <div class="puzzle-shell__summary">
          <div class="puzzle-shell__summary-label">Matching Puzzles</div>
          <div class="puzzle-shell__summary-value">${matchCount}</div>
        </div>
      </div>
      <div class="puzzle-shell__body puzzle-setup-grid">
        <section class="puzzle-shell__card puzzle-card-wide">
          <h3>Filter Puzzles</h3>
          <p>Choose the kind of Lichess-style puzzles you want, then start a continuous solving session.</p>
          <div class="puzzle-form-grid">
            <label class="puzzle-field">
              <span>Rating Min</span>
              <input id="puzzle-rating-min" type="number" min="0" max="4000" value="${filters.ratingMin}" />
            </label>
            <label class="puzzle-field">
              <span>Rating Max</span>
              <input id="puzzle-rating-max" type="number" min="0" max="4000" value="${filters.ratingMax}" />
            </label>
            <label class="puzzle-field">
              <span>Popularity Min</span>
              <input id="puzzle-popularity-min" type="number" min="0" max="100" value="${filters.popularityMin}" />
            </label>
            <label class="puzzle-field">
              <span>Popularity Max</span>
              <input id="puzzle-popularity-max" type="number" min="0" max="100" value="${filters.popularityMax}" />
            </label>
            <label class="puzzle-field">
              <span>Plays Min</span>
              <input id="puzzle-plays-min" type="number" min="0" max="10000000" value="${filters.playsMin}" />
            </label>
            <label class="puzzle-field">
              <span>Plays Max</span>
              <input id="puzzle-plays-max" type="number" min="0" max="10000000" value="${filters.playsMax}" />
            </label>
            <label class="puzzle-field">
              <span>Rating Deviation Max</span>
              <input id="puzzle-rating-deviation-max" type="number" min="1" max="1000" value="${filters.ratingDeviationMax}" />
            </label>
            <label class="puzzle-field">
              <span>Side To Move</span>
              <select id="puzzle-color">
                <option value="any"${filters.color === "any" ? " selected" : ""}>Any</option>
                <option value="w"${filters.color === "w" ? " selected" : ""}>White</option>
                <option value="b"${filters.color === "b" ? " selected" : ""}>Black</option>
              </select>
            </label>
            <label class="puzzle-field puzzle-field-full">
              <span>Themes Contains</span>
              <input id="puzzle-themes-text" type="text" value="${escapeHtml(filters.themesText)}" placeholder="mate, endgame, fork" />
            </label>
            <label class="puzzle-field puzzle-field-full">
              <span>Opening Tags Contains</span>
              <input id="puzzle-openings-text" type="text" value="${escapeHtml(filters.openingsText)}" placeholder="sicilian, french, ruy lopez" />
            </label>
          </div>
          <div class="puzzle-check-row">
            <label class="puzzle-check">
              <input id="puzzle-hints-enabled" type="checkbox"${filters.hintsEnabled ? " checked" : ""} />
              <span>Hints enabled</span>
            </label>
            <label class="puzzle-check">
              <input id="puzzle-auto-next" type="checkbox"${filters.autoNext ? " checked" : ""} />
              <span>Auto next</span>
            </label>
          </div>
          <div class="puzzle-actions">
            <button id="btn-puzzle-start" class="home-action-btn tools-action-btn puzzle-start-btn" type="button">Start Puzzles</button>
            <button id="btn-puzzle-refresh" class="home-action-btn tools-action-btn puzzle-refresh-btn" type="button"${state.setupBusy ? " disabled" : ""}>Refresh</button>
          </div>
          <div class="puzzle-status${state.setupMessage ? "" : " hidden"}">${escapeHtml(state.setupMessage)}</div>
        </section>
        <section class="puzzle-shell__card">
          <h3>Filter Guide</h3>
          <p>These controls mirror the main metadata fields we can filter from the bundled Lichess puzzle dataset.</p>
          ${buildSelectableTagList("Suggested themes", state.suggestedThemes, filters.themesText, "theme")}
          ${buildSelectableTagList("Suggested openings", state.suggestedOpenings, filters.openingsText, "opening")}
          ${renderTagList("Selected themes", String(filters.themesText || "").split(",").map((v) => v.trim()).filter(Boolean), "None")}
          ${renderTagList("Selected openings", String(filters.openingsText || "").split(",").map((v) => v.trim()).filter(Boolean), "None")}
        </section>
      </div>
    `;
  }

  return {
    renderSetup
  };
}

module.exports = { createPuzzleView };
