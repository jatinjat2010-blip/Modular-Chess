function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function createBotsModule({
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
  openBotsTournament
}) {
  const viewState = {
    busyBotId: "",
    adding: false,
    addingLc0: false,
    error: "",
    configBotId: "",
    configName: "",
    configRating: 2500,
    lc0ModalOpen: false,
    lc0Name: "",
    lc0Rating: 1800,
    lc0EnginePath: "",
    lc0WeightsPath: ""
  };

  function getBots() {
    return Array.isArray(getCuratedBots?.()) ? getCuratedBots() : [];
  }

  function getConfiguredBot() {
    return getBots().find((item) => item.id === viewState.configBotId) || null;
  }

  function renderScreen() {
    if (!botsRootEl) return;
    const bots = getBots();
    const configuredBot = getConfiguredBot();
    if (viewState.configBotId && !configuredBot) {
      viewState.configBotId = "";
    }
    const showConfigModal = !!configuredBot;
    const showLc0Modal = viewState.lc0ModalOpen;
    botsRootEl.innerHTML = `
      <div class="bots-shell__header">
        <div class="bots-shell__eyebrow">Bots Module</div>
        <h2 class="bots-shell__title">Bots</h2>
        <div class="bots-shell__toolbar">
          <p class="bots-shell__subtitle">Play offline games against local bots.</p>
          <button
            type="button"
            class="home-action-btn tools-action-btn bots-add-btn"
            data-bots-action="open-bot-tournament"
          >
            Bots Tournament
          </button>
          <button
            type="button"
            class="home-action-btn tools-action-btn bots-add-btn"
            data-bots-action="add"
            ${viewState.adding ? "disabled" : ""}
          >
            ${viewState.adding ? "Adding..." : "Add Bot"}
          </button>
          <button
            type="button"
            class="home-action-btn tools-action-btn bots-add-btn"
            data-bots-action="add-lc0"
            ${viewState.addingLc0 ? "disabled" : ""}
          >
            ${viewState.addingLc0 ? "Opening..." : "Add Lc0 Bot"}
          </button>
        </div>
      </div>
      <div class="bots-shell__body">
        ${bots
          .map((bot) => {
            const enabled = bot.enabled !== false;
            const busy = viewState.busyBotId === bot.id;
            return `
              <button
                type="button"
                class="home-action-btn tools-action-btn bots-action-btn${enabled ? "" : " is-disabled"}"
                data-bot-id="${escapeHtml(bot.id)}"
                ${enabled && !busy ? "" : "disabled"}
                aria-label="${escapeHtml(bot.displayName || bot.name)}"
              >
                <span class="bots-action-name">${escapeHtml(bot.displayName || bot.name)}</span>
              </button>
            `;
          })
          .join("")}
      </div>
      ${showConfigModal ? `
        <div class="bots-config-modal">
          <div class="bots-config-dialog" role="dialog" aria-modal="true" aria-label="Configure bot">
            <div class="bots-config-card" data-bots-modal-card="1">
              <div class="bots-config-header">
                <div class="bots-config-title">Configure ${escapeHtml(configuredBot.displayName || configuredBot.name)}</div>
                <button type="button" class="bots-config-close" data-bots-action="close-config-button">Close</button>
              </div>
              <label class="bots-config-field">
                <span class="bots-config-label">Name</span>
                <input
                  type="text"
                  class="bots-config-input"
                  data-bots-input="name"
                  value="${escapeHtml(viewState.configName)}"
                  maxlength="40"
                />
              </label>
              <label class="bots-config-field">
                <span class="bots-config-label">Rating</span>
                <input
                  type="number"
                  class="bots-config-input"
                  data-bots-input="rating"
                  value="${escapeHtml(viewState.configRating)}"
                  min="100"
                  max="5000"
                  step="1"
                />
              </label>
              <div class="bots-config-actions">
                <button type="button" class="home-action-btn tools-action-btn bots-config-btn" data-bots-action="save-config">Save</button>
                <button type="button" class="home-action-btn tools-action-btn bots-config-btn is-danger" data-bots-action="delete-bot">Delete</button>
              </div>
            </div>
          </div>
        </div>
      ` : ""}
      ${showLc0Modal ? `
        <div class="bots-config-modal">
          <div class="bots-config-dialog" role="dialog" aria-modal="true" aria-label="Add Lc0 bot">
            <div class="bots-config-card" data-bots-modal-card="1">
              <div class="bots-config-header">
                <div class="bots-config-title">Add Lc0 Bot</div>
                <button type="button" class="bots-config-close" data-bots-action="close-lc0-modal">Close</button>
              </div>
              <label class="bots-config-field">
                <span class="bots-config-label">Bot Name</span>
                <input
                  type="text"
                  class="bots-config-input"
                  data-bots-input="lc0-name"
                  value="${escapeHtml(viewState.lc0Name)}"
                  maxlength="40"
                />
              </label>
              <label class="bots-config-field">
                <span class="bots-config-label">Rating</span>
                <input
                  type="number"
                  class="bots-config-input"
                  data-bots-input="lc0-rating"
                  value="${escapeHtml(viewState.lc0Rating)}"
                  min="100"
                  max="5000"
                  step="1"
                />
              </label>
              <div class="bots-config-picker-row">
                <div class="bots-config-picker-text">
                  <div class="bots-config-label">Lc0 Engine</div>
                  <div class="bots-config-path">${escapeHtml(viewState.lc0EnginePath || "No engine selected")}</div>
                </div>
                <button type="button" class="home-action-btn tools-action-btn bots-config-btn" data-bots-action="pick-lc0-engine">Choose</button>
              </div>
              <div class="bots-config-picker-row">
                <div class="bots-config-picker-text">
                  <div class="bots-config-label">Weights File</div>
                  <div class="bots-config-path">${escapeHtml(viewState.lc0WeightsPath || "No weights selected")}</div>
                </div>
                <button type="button" class="home-action-btn tools-action-btn bots-config-btn" data-bots-action="pick-lc0-weights">Choose</button>
              </div>
              <div class="bots-config-actions">
                <button type="button" class="home-action-btn tools-action-btn bots-config-btn" data-bots-action="save-lc0-bot">Save</button>
              </div>
            </div>
          </div>
        </div>
      ` : ""}
      ${viewState.error ? `<div class="bots-shell__error">${escapeHtml(viewState.error)}</div>` : ""}
    `;
  }

  function showScreen() {
    closeHomeProfileMenu();
    if (homeProfileEl) homeProfileEl.classList.add("hidden");
    closeHomeOnlinePanels();
    if (homeScreenEl) homeScreenEl.classList.add("hidden");
    if (toolsScreenEl) toolsScreenEl.classList.add("hidden");
    if (puzzleScreenEl) puzzleScreenEl.classList.add("hidden");
    if (computerAnalysisScreenEl) computerAnalysisScreenEl.classList.add("hidden");
    if (botTournamentScreenEl) botTournamentScreenEl.classList.add("hidden");
    if (variantsScreenEl) variantsScreenEl.classList.add("hidden");
    if (chess960ScreenEl) chess960ScreenEl.classList.add("hidden");
    if (tournamentScreenEl) tournamentScreenEl.classList.add("hidden");
    if (visionScreenEl) visionScreenEl.classList.add("hidden");
    if (gameScreenEl) gameScreenEl.classList.add("hidden");
    if (botsScreenEl) botsScreenEl.classList.remove("hidden");
    updateHomeOnlineToolbarVisibility();
    renderScreen();
  }

  function backToTools() {
    if (botsScreenEl) botsScreenEl.classList.add("hidden");
    if (botTournamentScreenEl) botTournamentScreenEl.classList.add("hidden");
    if (toolsScreenEl) toolsScreenEl.classList.remove("hidden");
    if (homeProfileEl) homeProfileEl.classList.add("hidden");
    updateHomeOnlineToolbarVisibility();
  }

  async function handleBotClick(botId) {
    const bot = getBots().find((item) => item.id === botId);
    if (!bot || bot.enabled === false || viewState.busyBotId) return;
    viewState.busyBotId = botId;
    viewState.error = "";
    renderScreen();
    try {
      const result = await startCuratedBotGame(botId);
      if (!result?.ok) {
        viewState.error = result?.error || `Unable to start ${bot.name}.`;
        viewState.busyBotId = "";
        renderScreen();
        return;
      }
      viewState.busyBotId = "";
      viewState.error = "";
      if (botsScreenEl) {
        botsScreenEl.classList.add("hidden");
      }
    } catch (err) {
      viewState.error = String(err?.message || err || `Unable to start ${bot.name}.`);
      viewState.busyBotId = "";
      renderScreen();
    }
  }

  function openConfig(botId) {
    const bot = getBots().find((item) => item.id === botId);
    if (!bot) return;
    viewState.configBotId = bot.id;
    viewState.configName = String(bot.name || "").trim() || "Bot";
    viewState.configRating = Number.isFinite(Number(bot.rating)) ? Math.max(100, Math.round(Number(bot.rating))) : 2500;
    viewState.error = "";
    renderScreen();
  }

  async function saveConfig() {
    const bot = getConfiguredBot();
    if (!bot) return;
    const result = await updateBotConfiguration?.(bot.id, {
      name: viewState.configName,
      rating: viewState.configRating
    });
    if (!result?.ok) {
      viewState.error = result?.error || "Unable to save bot settings.";
      renderScreen();
      return;
    }
    const updatedBot = getBots().find((item) => item.id === bot.id);
    viewState.configName = String(updatedBot?.name || viewState.configName).trim();
    viewState.configRating = Number.isFinite(Number(updatedBot?.rating))
      ? Math.max(100, Math.round(Number(updatedBot.rating)))
      : viewState.configRating;
    viewState.configBotId = "";
    viewState.error = "";
    renderScreen();
  }

  async function deleteConfiguredBot() {
    const bot = getConfiguredBot();
    if (!bot) return;
    const result = await deleteBotConfiguration?.(bot.id);
    if (!result?.ok) {
      viewState.error = result?.error || "Unable to delete bot.";
      renderScreen();
      return;
    }
    viewState.configBotId = "";
    viewState.error = "";
    renderScreen();
  }

  async function handleAddBot() {
    if (viewState.adding || viewState.busyBotId) return;
    viewState.adding = true;
    viewState.error = "";
    renderScreen();
    try {
      const result = await addBotFromFilePicker?.();
      if (!result?.ok && !result?.cancelled) {
        viewState.error = result?.error || "Unable to add bot.";
      }
    } catch (err) {
      viewState.error = String(err?.message || err || "Unable to add bot.");
    } finally {
      viewState.adding = false;
      renderScreen();
    }
  }

  function openLc0Modal() {
    viewState.lc0ModalOpen = true;
    viewState.lc0Name = "";
    viewState.lc0Rating = 1800;
    viewState.lc0EnginePath = "";
    viewState.lc0WeightsPath = "";
    viewState.error = "";
    renderScreen();
  }

  function closeLc0Modal() {
    viewState.lc0ModalOpen = false;
    viewState.error = "";
    renderScreen();
  }

  async function pickLc0Engine() {
    const nextPath = await pickBotExecutablePath?.();
    if (!nextPath) return;
    viewState.lc0EnginePath = nextPath;
    renderScreen();
  }

  async function pickLc0Weights() {
    const nextPath = await pickLc0WeightsPath?.();
    if (!nextPath) return;
    viewState.lc0WeightsPath = nextPath;
    if (!viewState.lc0Name.trim()) {
      const inferredName = inferLc0BotNameFromWeightsPath?.(nextPath) || "";
      if (inferredName) {
        viewState.lc0Name = inferredName;
      }
    }
    const inferredRating = inferLc0BotRating?.(nextPath, 1800);
    if (Number.isFinite(Number(inferredRating))) {
      viewState.lc0Rating = Math.max(100, Math.round(Number(inferredRating)));
    }
    renderScreen();
  }

  async function saveLc0Bot() {
    const result = await addLc0BotProfile?.({
      name: viewState.lc0Name,
      rating: viewState.lc0Rating,
      enginePath: viewState.lc0EnginePath,
      weightsPath: viewState.lc0WeightsPath,
      searchMode: "nodes",
      nodes: 1
    });
    if (!result?.ok) {
      viewState.error = result?.error || "Unable to add Lc0 bot.";
      renderScreen();
      return;
    }
    viewState.lc0ModalOpen = false;
    viewState.error = "";
    renderScreen();
  }

  if (botsRootEl && botsRootEl.dataset.bound !== "1") {
    botsRootEl.dataset.bound = "1";
    botsRootEl.addEventListener("click", (event) => {
      if (!(event.target instanceof Element)) return;
      const actionButton = event.target.closest("[data-bots-action]");
      const action = actionButton?.getAttribute("data-bots-action");
      if (action === "open-bot-tournament") {
        openBotsTournament?.();
        return;
      }
      if (action === "add") {
        handleAddBot();
        return;
      }
      if (action === "add-lc0") {
        openLc0Modal();
        return;
      }
      if (action === "save-config") {
        saveConfig();
        return;
      }
      if (action === "delete-bot") {
        deleteConfiguredBot();
        return;
      }
      if (action === "close-config-button") {
        viewState.configBotId = "";
        viewState.error = "";
        renderScreen();
        return;
      }
      if (action === "close-lc0-modal") {
        closeLc0Modal();
        return;
      }
      if (action === "pick-lc0-engine") {
        pickLc0Engine();
        return;
      }
      if (action === "pick-lc0-weights") {
        pickLc0Weights();
        return;
      }
      if (action === "save-lc0-bot") {
        saveLc0Bot();
        return;
      }
      const button = event.target.closest("[data-bot-id]");
      if (!button) return;
      handleBotClick(button.getAttribute("data-bot-id"));
    });
    botsRootEl.addEventListener("contextmenu", (event) => {
      if (!(event.target instanceof Element)) return;
      const button = event.target.closest("[data-bot-id]");
      if (!button) return;
      event.preventDefault();
      openConfig(button.getAttribute("data-bot-id"));
    });
    botsRootEl.addEventListener("input", (event) => {
      if (!(event.target instanceof HTMLInputElement)) return;
      const kind = event.target.getAttribute("data-bots-input");
      if (kind === "name") {
        viewState.configName = event.target.value;
      } else if (kind === "rating") {
        const next = Number(event.target.value);
        viewState.configRating = Number.isFinite(next) ? next : 2500;
      } else if (kind === "lc0-name") {
        viewState.lc0Name = event.target.value;
      } else if (kind === "lc0-rating") {
        const next = Number(event.target.value);
        viewState.lc0Rating = Number.isFinite(next) ? next : 1800;
      }
    });
  }

  return {
    showScreen,
    backToTools,
    renderScreen
  };
}

module.exports = { createBotsModule };
