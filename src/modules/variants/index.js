const DEFAULT_CHESS960_SETTINGS = {
  color: "random",
  strength: "4",
  positionMode: "random",
  positionNumber: ""
};

const DEFAULT_THREECHECK_SETTINGS = {
  color: "random",
  strength: "4"
};

const DEFAULT_KING_OF_THE_HILL_SETTINGS = {
  color: "random",
  strength: "4"
};

const DEFAULT_ANTICHESS_SETTINGS = {
  color: "random",
  strength: "4"
};

const DEFAULT_ATOMIC_SETTINGS = {
  color: "random",
  strength: "4"
};

const DEFAULT_HORDE_SETTINGS = {
  color: "random",
  strength: "4"
};

const DEFAULT_RACING_KINGS_SETTINGS = {
  color: "random",
  strength: "4"
};

const DEFAULT_CRAZYHOUSE_SETTINGS = {
  color: "random",
  strength: "4"
};

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderStrengthButtons(selectedValue, prefix = "") {
  return Array.from({ length: 8 }, (_, index) => {
    const value = String(index + 1);
    return `<button type="button" class="variants-strength-btn${selectedValue === value ? " is-selected" : ""}" data-setting-group="${prefix}strength" data-setting-value="${value}">${value}</button>`;
  }).join("");
}

function createVariantsModule({
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
  closeHomeProfileMenu,
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
}) {
  const viewState = {
    chess960ModalOpen: false,
    threeCheckModalOpen: false,
    kingOfTheHillModalOpen: false,
    antichessModalOpen: false,
    atomicModalOpen: false,
    hordeModalOpen: false,
    racingKingsModalOpen: false,
    crazyhouseModalOpen: false,
    startingGame: false,
    chess960Error: "",
    threeCheckError: "",
    kingOfTheHillError: "",
    antichessError: "",
    atomicError: "",
    hordeError: "",
    racingKingsError: "",
    crazyhouseError: "",
    chess960Settings: { ...DEFAULT_CHESS960_SETTINGS },
    threeCheckSettings: { ...DEFAULT_THREECHECK_SETTINGS },
    kingOfTheHillSettings: { ...DEFAULT_KING_OF_THE_HILL_SETTINGS },
    antichessSettings: { ...DEFAULT_ANTICHESS_SETTINGS },
    atomicSettings: { ...DEFAULT_ATOMIC_SETTINGS },
    hordeSettings: { ...DEFAULT_HORDE_SETTINGS },
    racingKingsSettings: { ...DEFAULT_RACING_KINGS_SETTINGS },
    crazyhouseSettings: { ...DEFAULT_CRAZYHOUSE_SETTINGS }
  };

  function renderScreen() {
    if (!variantsRootEl) return;
    const chess960 = viewState.chess960Settings;
    const threeCheck = viewState.threeCheckSettings;
    const kingOfTheHill = viewState.kingOfTheHillSettings;
    const antichess = viewState.antichessSettings;
    const atomic = viewState.atomicSettings;
    const horde = viewState.hordeSettings;
    const racingKings = viewState.racingKingsSettings;
    const crazyhouse = viewState.crazyhouseSettings;
    const useRandomPosition = chess960.positionMode !== "number";
    variantsRootEl.innerHTML = `
      <div class="variants-shell">
        <div class="variants-shell__header">
          <div class="variants-shell__eyebrow">Variants Module</div>
          <h2 class="variants-shell__title">Variants</h2>
          <p class="variants-shell__subtitle">Start playable chess variants against the local engine.</p>
        </div>
        <div class="variants-shell__body">
          <button id="btn-variant-chess960" class="home-action-btn tools-action-btn variants-action-btn" type="button">
            Chess960
          </button>
          <button id="btn-variant-threecheck" class="home-action-btn tools-action-btn variants-action-btn" type="button">
            Three-check
          </button>
          <button id="btn-variant-kingofthehill" class="home-action-btn tools-action-btn variants-action-btn" type="button">
            King of the Hill
          </button>
          <button id="btn-variant-antichess" class="home-action-btn tools-action-btn variants-action-btn" type="button">
            Antichess
          </button>
          <button id="btn-variant-atomic" class="home-action-btn tools-action-btn variants-action-btn" type="button">
            Atomic
          </button>
          <button id="btn-variant-horde" class="home-action-btn tools-action-btn variants-action-btn" type="button">
            Horde
          </button>
          <button id="btn-variant-racingkings" class="home-action-btn tools-action-btn variants-action-btn" type="button">
            Racing Kings
          </button>
          <button id="btn-variant-crazyhouse" class="home-action-btn tools-action-btn variants-action-btn" type="button">
            Crazyhouse
          </button>
        </div>
      </div>

      <div class="variants-modal${viewState.chess960ModalOpen ? "" : " hidden"}" id="variants-chess960-modal" role="dialog" aria-modal="true" aria-labelledby="variants-chess960-title">
        <div class="variants-modal__backdrop" data-action="close-chess960-modal"></div>
        <div class="variants-modal__card">
          <button class="variants-modal__close" type="button" data-action="close-chess960-modal" aria-label="Close Chess960 setup">&times;</button>
          <div class="variants-modal__eyebrow">Variants</div>
          <h3 class="variants-modal__title" id="variants-chess960-title">Chess960 Setup</h3>
          <p class="variants-modal__subtitle">Choose your side, engine strength, and the starting setup before play begins.</p>
          <div class="variants-modal__note">
            Chess960 keeps all normal chess rules except the back-rank pieces start shuffled.
            Castling is still allowed, but it follows Chess960 castling rules.
          </div>
          <form id="variants-chess960-form" class="variants-form">
            <input type="hidden" name="chess960-color" value="${escapeHtml(chess960.color)}">
            <input type="hidden" name="chess960-strength" value="${escapeHtml(chess960.strength)}">
            <input type="hidden" name="chess960-position-mode" value="${escapeHtml(chess960.positionMode)}">

            <div class="variants-form__section">
              <div class="variants-form__label">Play as</div>
              <div class="variants-choice-grid" role="group" aria-label="Choose color">
                <button type="button" class="variants-choice${chess960.color === "white" ? " is-selected" : ""}" data-setting-group="color" data-setting-value="white">White</button>
                <button type="button" class="variants-choice${chess960.color === "black" ? " is-selected" : ""}" data-setting-group="color" data-setting-value="black">Black</button>
                <button type="button" class="variants-choice${chess960.color === "random" ? " is-selected" : ""}" data-setting-group="color" data-setting-value="random">Random</button>
              </div>
            </div>

            <div class="variants-form__section">
              <div class="variants-form__label">Engine strength</div>
              <div class="variants-strength-grid" role="group" aria-label="Choose engine strength">
                ${renderStrengthButtons(chess960.strength)}
              </div>
            </div>

            <div class="variants-form__section">
              <div class="variants-form__label">Starting position</div>
              <div class="variants-choice-stack" role="group" aria-label="Choose starting position mode">
                <button type="button" class="variants-toggle${useRandomPosition ? " is-selected" : ""}" data-setting-group="position-mode" data-setting-value="random">Random</button>
                <button type="button" class="variants-toggle${useRandomPosition ? "" : " is-selected"}" data-setting-group="position-mode" data-setting-value="number">Use position number</button>
              </div>
              <div class="variants-position-field">
                <label class="variants-form__sublabel" for="variants-chess960-position-number">Position number (1-960)</label>
                <input
                  id="variants-chess960-position-number"
                  class="variants-input"
                  name="chess960-position-number"
                  type="number"
                  min="1"
                  max="960"
                  step="1"
                  placeholder="518"
                  value="${escapeHtml(chess960.positionNumber)}"
                  ${useRandomPosition ? "disabled" : ""}
                >
              </div>
            </div>

            ${viewState.chess960Error ? `<div class="variants-form__error">${escapeHtml(viewState.chess960Error)}</div>` : ""}

            <div class="variants-form__actions">
              <button type="button" class="variants-secondary-btn" data-action="close-chess960-modal">Cancel</button>
              <button type="submit" class="variants-primary-btn"${viewState.startingGame ? " disabled" : ""}>
                ${viewState.startingGame ? "Starting..." : "Play"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div class="variants-modal${viewState.threeCheckModalOpen ? "" : " hidden"}" id="variants-threecheck-modal" role="dialog" aria-modal="true" aria-labelledby="variants-threecheck-title">
        <div class="variants-modal__backdrop" data-action="close-threecheck-modal"></div>
        <div class="variants-modal__card">
          <button class="variants-modal__close" type="button" data-action="close-threecheck-modal" aria-label="Close Three-check setup">&times;</button>
          <div class="variants-modal__eyebrow">Variants</div>
          <h3 class="variants-modal__title" id="variants-threecheck-title">Three-check Setup</h3>
          <p class="variants-modal__subtitle">Choose your side and engine strength before starting a Three-check game.</p>
          <div class="variants-modal__note">
            In Three-check, giving your opponent three checks wins the game immediately.
            Otherwise, the rest of the rules play like standard chess.
          </div>
          <form id="variants-threecheck-form" class="variants-form">
            <input type="hidden" name="threecheck-color" value="${escapeHtml(threeCheck.color)}">
            <input type="hidden" name="threecheck-strength" value="${escapeHtml(threeCheck.strength)}">

            <div class="variants-form__section">
              <div class="variants-form__label">Play as</div>
              <div class="variants-choice-grid" role="group" aria-label="Choose color">
                <button type="button" class="variants-choice${threeCheck.color === "white" ? " is-selected" : ""}" data-setting-group="threecheck-color" data-setting-value="white">White</button>
                <button type="button" class="variants-choice${threeCheck.color === "black" ? " is-selected" : ""}" data-setting-group="threecheck-color" data-setting-value="black">Black</button>
                <button type="button" class="variants-choice${threeCheck.color === "random" ? " is-selected" : ""}" data-setting-group="threecheck-color" data-setting-value="random">Random</button>
              </div>
            </div>

            <div class="variants-form__section">
              <div class="variants-form__label">Engine strength</div>
              <div class="variants-strength-grid" role="group" aria-label="Choose engine strength">
                ${renderStrengthButtons(threeCheck.strength, "threecheck-")}
              </div>
            </div>

            ${viewState.threeCheckError ? `<div class="variants-form__error">${escapeHtml(viewState.threeCheckError)}</div>` : ""}

            <div class="variants-form__actions">
              <button type="button" class="variants-secondary-btn" data-action="close-threecheck-modal">Cancel</button>
              <button type="submit" class="variants-primary-btn"${viewState.startingGame ? " disabled" : ""}>
                ${viewState.startingGame ? "Starting..." : "Play"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div class="variants-modal${viewState.kingOfTheHillModalOpen ? "" : " hidden"}" id="variants-kingofthehill-modal" role="dialog" aria-modal="true" aria-labelledby="variants-kingofthehill-title">
        <div class="variants-modal__backdrop" data-action="close-kingofthehill-modal"></div>
        <div class="variants-modal__card">
          <button class="variants-modal__close" type="button" data-action="close-kingofthehill-modal" aria-label="Close King of the Hill setup">&times;</button>
          <div class="variants-modal__eyebrow">Variants</div>
          <h3 class="variants-modal__title" id="variants-kingofthehill-title">King of the Hill Setup</h3>
          <p class="variants-modal__subtitle">Choose your side and engine strength before starting a King of the Hill game.</p>
          <div class="variants-modal__note">
            In King of the Hill, bringing your king to one of the four center squares wins immediately.
            Otherwise, the game follows standard chess rules.
          </div>
          <form id="variants-kingofthehill-form" class="variants-form">
            <input type="hidden" name="kingofthehill-color" value="${escapeHtml(kingOfTheHill.color)}">
            <input type="hidden" name="kingofthehill-strength" value="${escapeHtml(kingOfTheHill.strength)}">

            <div class="variants-form__section">
              <div class="variants-form__label">Play as</div>
              <div class="variants-choice-grid" role="group" aria-label="Choose color">
                <button type="button" class="variants-choice${kingOfTheHill.color === "white" ? " is-selected" : ""}" data-setting-group="kingofthehill-color" data-setting-value="white">White</button>
                <button type="button" class="variants-choice${kingOfTheHill.color === "black" ? " is-selected" : ""}" data-setting-group="kingofthehill-color" data-setting-value="black">Black</button>
                <button type="button" class="variants-choice${kingOfTheHill.color === "random" ? " is-selected" : ""}" data-setting-group="kingofthehill-color" data-setting-value="random">Random</button>
              </div>
            </div>

            <div class="variants-form__section">
              <div class="variants-form__label">Engine strength</div>
              <div class="variants-strength-grid" role="group" aria-label="Choose engine strength">
                ${renderStrengthButtons(kingOfTheHill.strength, "kingofthehill-")}
              </div>
            </div>

            ${viewState.kingOfTheHillError ? `<div class="variants-form__error">${escapeHtml(viewState.kingOfTheHillError)}</div>` : ""}

            <div class="variants-form__actions">
              <button type="button" class="variants-secondary-btn" data-action="close-kingofthehill-modal">Cancel</button>
              <button type="submit" class="variants-primary-btn"${viewState.startingGame ? " disabled" : ""}>
                ${viewState.startingGame ? "Starting..." : "Play"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div class="variants-modal${viewState.antichessModalOpen ? "" : " hidden"}" id="variants-antichess-modal" role="dialog" aria-modal="true" aria-labelledby="variants-antichess-title">
        <div class="variants-modal__backdrop" data-action="close-antichess-modal"></div>
        <div class="variants-modal__card">
          <button class="variants-modal__close" type="button" data-action="close-antichess-modal" aria-label="Close Antichess setup">&times;</button>
          <div class="variants-modal__eyebrow">Variants</div>
          <h3 class="variants-modal__title" id="variants-antichess-title">Antichess Setup</h3>
          <p class="variants-modal__subtitle">Choose your side and engine strength before starting an Antichess game.</p>
          <div class="variants-modal__note">
            In Antichess, captures are mandatory and the goal is to get rid of all your pieces.
            Checks and checkmate do not matter in this variant.
          </div>
          <form id="variants-antichess-form" class="variants-form">
            <input type="hidden" name="antichess-color" value="${escapeHtml(antichess.color)}">
            <input type="hidden" name="antichess-strength" value="${escapeHtml(antichess.strength)}">

            <div class="variants-form__section">
              <div class="variants-form__label">Play as</div>
              <div class="variants-choice-grid" role="group" aria-label="Choose color">
                <button type="button" class="variants-choice${antichess.color === "white" ? " is-selected" : ""}" data-setting-group="antichess-color" data-setting-value="white">White</button>
                <button type="button" class="variants-choice${antichess.color === "black" ? " is-selected" : ""}" data-setting-group="antichess-color" data-setting-value="black">Black</button>
                <button type="button" class="variants-choice${antichess.color === "random" ? " is-selected" : ""}" data-setting-group="antichess-color" data-setting-value="random">Random</button>
              </div>
            </div>

            <div class="variants-form__section">
              <div class="variants-form__label">Engine strength</div>
              <div class="variants-strength-grid" role="group" aria-label="Choose engine strength">
                ${renderStrengthButtons(antichess.strength, "antichess-")}
              </div>
            </div>

            ${viewState.antichessError ? `<div class="variants-form__error">${escapeHtml(viewState.antichessError)}</div>` : ""}

            <div class="variants-form__actions">
              <button type="button" class="variants-secondary-btn" data-action="close-antichess-modal">Cancel</button>
              <button type="submit" class="variants-primary-btn"${viewState.startingGame ? " disabled" : ""}>
                ${viewState.startingGame ? "Starting..." : "Play"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div class="variants-modal${viewState.atomicModalOpen ? "" : " hidden"}" id="variants-atomic-modal" role="dialog" aria-modal="true" aria-labelledby="variants-atomic-title">
        <div class="variants-modal__backdrop" data-action="close-atomic-modal"></div>
        <div class="variants-modal__card">
          <button class="variants-modal__close" type="button" data-action="close-atomic-modal" aria-label="Close Atomic setup">&times;</button>
          <div class="variants-modal__eyebrow">Variants</div>
          <h3 class="variants-modal__title" id="variants-atomic-title">Atomic Setup</h3>
          <p class="variants-modal__subtitle">Choose your side and engine strength before starting an Atomic game.</p>
          <div class="variants-modal__note">
            In Atomic, captures explode and destroy surrounding non-pawn pieces as well.
            Kings may not capture if that would explode, and a king beside an enemy king is not automatically in check.
          </div>
          <form id="variants-atomic-form" class="variants-form">
            <input type="hidden" name="atomic-color" value="${escapeHtml(atomic.color)}">
            <input type="hidden" name="atomic-strength" value="${escapeHtml(atomic.strength)}">

            <div class="variants-form__section">
              <div class="variants-form__label">Play as</div>
              <div class="variants-choice-grid" role="group" aria-label="Choose color">
                <button type="button" class="variants-choice${atomic.color === "white" ? " is-selected" : ""}" data-setting-group="atomic-color" data-setting-value="white">White</button>
                <button type="button" class="variants-choice${atomic.color === "black" ? " is-selected" : ""}" data-setting-group="atomic-color" data-setting-value="black">Black</button>
                <button type="button" class="variants-choice${atomic.color === "random" ? " is-selected" : ""}" data-setting-group="atomic-color" data-setting-value="random">Random</button>
              </div>
            </div>

            <div class="variants-form__section">
              <div class="variants-form__label">Engine strength</div>
              <div class="variants-strength-grid" role="group" aria-label="Choose engine strength">
                ${renderStrengthButtons(atomic.strength, "atomic-")}
              </div>
            </div>

            ${viewState.atomicError ? `<div class="variants-form__error">${escapeHtml(viewState.atomicError)}</div>` : ""}

            <div class="variants-form__actions">
              <button type="button" class="variants-secondary-btn" data-action="close-atomic-modal">Cancel</button>
              <button type="submit" class="variants-primary-btn"${viewState.startingGame ? " disabled" : ""}>
                ${viewState.startingGame ? "Starting..." : "Play"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div class="variants-modal${viewState.hordeModalOpen ? "" : " hidden"}" id="variants-horde-modal" role="dialog" aria-modal="true" aria-labelledby="variants-horde-title">
        <div class="variants-modal__backdrop" data-action="close-horde-modal"></div>
        <div class="variants-modal__card">
          <button class="variants-modal__close" type="button" data-action="close-horde-modal" aria-label="Close Horde setup">&times;</button>
          <div class="variants-modal__eyebrow">Variants</div>
          <h3 class="variants-modal__title" id="variants-horde-title">Horde Setup</h3>
          <p class="variants-modal__subtitle">Choose your side and engine strength before starting a Horde game.</p>
          <div class="variants-modal__note">
            In Horde, one side starts with a massive pawn army and no king.
            The other side wins by eliminating the horde, while the horde wins by taking everything else down.
          </div>
          <form id="variants-horde-form" class="variants-form">
            <input type="hidden" name="horde-color" value="${escapeHtml(horde.color)}">
            <input type="hidden" name="horde-strength" value="${escapeHtml(horde.strength)}">

            <div class="variants-form__section">
              <div class="variants-form__label">Play as</div>
              <div class="variants-choice-grid" role="group" aria-label="Choose color">
                <button type="button" class="variants-choice${horde.color === "white" ? " is-selected" : ""}" data-setting-group="horde-color" data-setting-value="white">White</button>
                <button type="button" class="variants-choice${horde.color === "black" ? " is-selected" : ""}" data-setting-group="horde-color" data-setting-value="black">Black</button>
                <button type="button" class="variants-choice${horde.color === "random" ? " is-selected" : ""}" data-setting-group="horde-color" data-setting-value="random">Random</button>
              </div>
            </div>

            <div class="variants-form__section">
              <div class="variants-form__label">Engine strength</div>
              <div class="variants-strength-grid" role="group" aria-label="Choose engine strength">
                ${renderStrengthButtons(horde.strength, "horde-")}
              </div>
            </div>

            ${viewState.hordeError ? `<div class="variants-form__error">${escapeHtml(viewState.hordeError)}</div>` : ""}

            <div class="variants-form__actions">
              <button type="button" class="variants-secondary-btn" data-action="close-horde-modal">Cancel</button>
              <button type="submit" class="variants-primary-btn"${viewState.startingGame ? " disabled" : ""}>
                ${viewState.startingGame ? "Starting..." : "Play"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div class="variants-modal${viewState.racingKingsModalOpen ? "" : " hidden"}" id="variants-racingkings-modal" role="dialog" aria-modal="true" aria-labelledby="variants-racingkings-title">
        <div class="variants-modal__backdrop" data-action="close-racingkings-modal"></div>
        <div class="variants-modal__card">
          <button class="variants-modal__close" type="button" data-action="close-racingkings-modal" aria-label="Close Racing Kings setup">&times;</button>
          <div class="variants-modal__eyebrow">Variants</div>
          <h3 class="variants-modal__title" id="variants-racingkings-title">Racing Kings Setup</h3>
          <p class="variants-modal__subtitle">Choose your side and engine strength before starting a Racing Kings game.</p>
          <div class="variants-modal__note">
            In Racing Kings, both sides race their kings to the back rank first.
            There is no check or checkmate, and the winner is the first king to reach the goal rank legally.
          </div>
          <form id="variants-racingkings-form" class="variants-form">
            <input type="hidden" name="racingkings-color" value="${escapeHtml(racingKings.color)}">
            <input type="hidden" name="racingkings-strength" value="${escapeHtml(racingKings.strength)}">

            <div class="variants-form__section">
              <div class="variants-form__label">Play as</div>
              <div class="variants-choice-grid" role="group" aria-label="Choose color">
                <button type="button" class="variants-choice${racingKings.color === "white" ? " is-selected" : ""}" data-setting-group="racingkings-color" data-setting-value="white">White</button>
                <button type="button" class="variants-choice${racingKings.color === "black" ? " is-selected" : ""}" data-setting-group="racingkings-color" data-setting-value="black">Black</button>
                <button type="button" class="variants-choice${racingKings.color === "random" ? " is-selected" : ""}" data-setting-group="racingkings-color" data-setting-value="random">Random</button>
              </div>
            </div>

            <div class="variants-form__section">
              <div class="variants-form__label">Engine strength</div>
              <div class="variants-strength-grid" role="group" aria-label="Choose engine strength">
                ${renderStrengthButtons(racingKings.strength, "racingkings-")}
              </div>
            </div>

            ${viewState.racingKingsError ? `<div class="variants-form__error">${escapeHtml(viewState.racingKingsError)}</div>` : ""}

            <div class="variants-form__actions">
              <button type="button" class="variants-secondary-btn" data-action="close-racingkings-modal">Cancel</button>
              <button type="submit" class="variants-primary-btn"${viewState.startingGame ? " disabled" : ""}>
                ${viewState.startingGame ? "Starting..." : "Play"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div class="variants-modal${viewState.crazyhouseModalOpen ? "" : " hidden"}" id="variants-crazyhouse-modal" role="dialog" aria-modal="true" aria-labelledby="variants-crazyhouse-title">
        <div class="variants-modal__backdrop" data-action="close-crazyhouse-modal"></div>
        <div class="variants-modal__card">
          <button class="variants-modal__close" type="button" data-action="close-crazyhouse-modal" aria-label="Close Crazyhouse setup">&times;</button>
          <div class="variants-modal__eyebrow">Variants</div>
          <h3 class="variants-modal__title" id="variants-crazyhouse-title">Crazyhouse Setup</h3>
          <p class="variants-modal__subtitle">Choose your side and engine strength before starting a Crazyhouse game.</p>
          <div class="variants-modal__note">
            In Crazyhouse, captured pieces switch sides and go into your pocket.
            On your turn, you can drop pocket pieces back onto empty squares.
          </div>
          <form id="variants-crazyhouse-form" class="variants-form">
            <input type="hidden" name="crazyhouse-color" value="${escapeHtml(crazyhouse.color)}">
            <input type="hidden" name="crazyhouse-strength" value="${escapeHtml(crazyhouse.strength)}">

            <div class="variants-form__section">
              <div class="variants-form__label">Play as</div>
              <div class="variants-choice-grid" role="group" aria-label="Choose color">
                <button type="button" class="variants-choice${crazyhouse.color === "white" ? " is-selected" : ""}" data-setting-group="crazyhouse-color" data-setting-value="white">White</button>
                <button type="button" class="variants-choice${crazyhouse.color === "black" ? " is-selected" : ""}" data-setting-group="crazyhouse-color" data-setting-value="black">Black</button>
                <button type="button" class="variants-choice${crazyhouse.color === "random" ? " is-selected" : ""}" data-setting-group="crazyhouse-color" data-setting-value="random">Random</button>
              </div>
            </div>

            <div class="variants-form__section">
              <div class="variants-form__label">Engine strength</div>
              <div class="variants-strength-grid" role="group" aria-label="Choose engine strength">
                ${renderStrengthButtons(crazyhouse.strength, "crazyhouse-")}
              </div>
            </div>

            ${viewState.crazyhouseError ? `<div class="variants-form__error">${escapeHtml(viewState.crazyhouseError)}</div>` : ""}

            <div class="variants-form__actions">
              <button type="button" class="variants-secondary-btn" data-action="close-crazyhouse-modal">Cancel</button>
              <button type="submit" class="variants-primary-btn"${viewState.startingGame ? " disabled" : ""}>
                ${viewState.startingGame ? "Starting..." : "Play"}
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  function openChess960Modal() {
    viewState.chess960Error = "";
    viewState.chess960ModalOpen = true;
    viewState.threeCheckModalOpen = false;
    renderScreen();
  }

  function closeChess960Modal() {
    if (viewState.startingGame) return;
    viewState.chess960Error = "";
    viewState.chess960ModalOpen = false;
    renderScreen();
  }

  function openThreeCheckModal() {
    viewState.threeCheckError = "";
    viewState.threeCheckModalOpen = true;
    viewState.chess960ModalOpen = false;
    viewState.kingOfTheHillModalOpen = false;
    renderScreen();
  }

  function closeThreeCheckModal() {
    if (viewState.startingGame) return;
    viewState.threeCheckError = "";
    viewState.threeCheckModalOpen = false;
    renderScreen();
  }

  function openKingOfTheHillModal() {
    viewState.kingOfTheHillError = "";
    viewState.kingOfTheHillModalOpen = true;
    viewState.chess960ModalOpen = false;
    viewState.threeCheckModalOpen = false;
    viewState.antichessModalOpen = false;
    renderScreen();
  }

  function closeKingOfTheHillModal() {
    if (viewState.startingGame) return;
    viewState.kingOfTheHillError = "";
    viewState.kingOfTheHillModalOpen = false;
    renderScreen();
  }

  function openAntichessModal() {
    viewState.antichessError = "";
    viewState.antichessModalOpen = true;
    viewState.chess960ModalOpen = false;
    viewState.threeCheckModalOpen = false;
    viewState.kingOfTheHillModalOpen = false;
    renderScreen();
  }

  function openAtomicModal() {
    viewState.atomicError = "";
    viewState.atomicModalOpen = true;
    viewState.chess960ModalOpen = false;
    viewState.threeCheckModalOpen = false;
    viewState.kingOfTheHillModalOpen = false;
    viewState.antichessModalOpen = false;
    renderScreen();
  }

  function openHordeModal() {
    viewState.hordeError = "";
    viewState.hordeModalOpen = true;
    viewState.chess960ModalOpen = false;
    viewState.threeCheckModalOpen = false;
    viewState.kingOfTheHillModalOpen = false;
    viewState.antichessModalOpen = false;
    viewState.atomicModalOpen = false;
    renderScreen();
  }

  function openRacingKingsModal() {
    viewState.racingKingsError = "";
    viewState.racingKingsModalOpen = true;
    viewState.chess960ModalOpen = false;
    viewState.threeCheckModalOpen = false;
    viewState.kingOfTheHillModalOpen = false;
    viewState.antichessModalOpen = false;
    viewState.atomicModalOpen = false;
    viewState.hordeModalOpen = false;
    renderScreen();
  }

  function openCrazyhouseModal() {
    viewState.crazyhouseError = "";
    viewState.crazyhouseModalOpen = true;
    viewState.chess960ModalOpen = false;
    viewState.threeCheckModalOpen = false;
    viewState.kingOfTheHillModalOpen = false;
    viewState.antichessModalOpen = false;
    viewState.atomicModalOpen = false;
    viewState.hordeModalOpen = false;
    viewState.racingKingsModalOpen = false;
    renderScreen();
  }

  function closeAntichessModal() {
    if (viewState.startingGame) return;
    viewState.antichessError = "";
    viewState.antichessModalOpen = false;
    renderScreen();
  }

  function closeAtomicModal() {
    if (viewState.startingGame) return;
    viewState.atomicError = "";
    viewState.atomicModalOpen = false;
    renderScreen();
  }

  function closeHordeModal() {
    if (viewState.startingGame) return;
    viewState.hordeError = "";
    viewState.hordeModalOpen = false;
    renderScreen();
  }

  function closeRacingKingsModal() {
    if (viewState.startingGame) return;
    viewState.racingKingsError = "";
    viewState.racingKingsModalOpen = false;
    renderScreen();
  }

  function closeCrazyhouseModal() {
    if (viewState.startingGame) return;
    viewState.crazyhouseError = "";
    viewState.crazyhouseModalOpen = false;
    renderScreen();
  }

  function collectChess960Settings(form) {
    const formData = new FormData(form);
    const positionMode = String(formData.get("chess960-position-mode") || "random");
    const positionNumberRaw = String(formData.get("chess960-position-number") || "").trim();
    return {
      color: String(formData.get("chess960-color") || "random"),
      strength: String(formData.get("chess960-strength") || "4"),
      positionMode: positionMode === "number" ? "number" : "random",
      positionNumber: positionNumberRaw
    };
  }

  function collectThreeCheckSettings(form) {
    const formData = new FormData(form);
    return {
      color: String(formData.get("threecheck-color") || "random"),
      strength: String(formData.get("threecheck-strength") || "4")
    };
  }

  function collectKingOfTheHillSettings(form) {
    const formData = new FormData(form);
    return {
      color: String(formData.get("kingofthehill-color") || "random"),
      strength: String(formData.get("kingofthehill-strength") || "4")
    };
  }

  function collectAntichessSettings(form) {
    const formData = new FormData(form);
    return {
      color: String(formData.get("antichess-color") || "random"),
      strength: String(formData.get("antichess-strength") || "4")
    };
  }

  function collectAtomicSettings(form) {
    const formData = new FormData(form);
    return {
      color: String(formData.get("atomic-color") || "random"),
      strength: String(formData.get("atomic-strength") || "4")
    };
  }

  function collectHordeSettings(form) {
    const formData = new FormData(form);
    return {
      color: String(formData.get("horde-color") || "random"),
      strength: String(formData.get("horde-strength") || "4")
    };
  }

  function collectRacingKingsSettings(form) {
    const formData = new FormData(form);
    return {
      color: String(formData.get("racingkings-color") || "random"),
      strength: String(formData.get("racingkings-strength") || "4")
    };
  }

  function collectCrazyhouseSettings(form) {
    const formData = new FormData(form);
    return {
      color: String(formData.get("crazyhouse-color") || "random"),
      strength: String(formData.get("crazyhouse-strength") || "4")
    };
  }

  function syncChess960FormSelectionStyles(form, settingsOverride = null) {
    if (!(form instanceof HTMLFormElement)) return;
    const next = settingsOverride || collectChess960Settings(form);
    const colorInput = form.querySelector('input[name="chess960-color"]');
    const strengthInput = form.querySelector('input[name="chess960-strength"]');
    const modeInput = form.querySelector('input[name="chess960-position-mode"]');
    if (colorInput instanceof HTMLInputElement) colorInput.value = next.color;
    if (strengthInput instanceof HTMLInputElement) strengthInput.value = next.strength;
    if (modeInput instanceof HTMLInputElement) modeInput.value = next.positionMode;
    for (const node of form.querySelectorAll('[data-setting-group="color"]')) {
      node.classList.toggle("is-selected", node.dataset.settingValue === next.color);
    }
    for (const node of form.querySelectorAll('[data-setting-group="strength"]')) {
      node.classList.toggle("is-selected", node.dataset.settingValue === next.strength);
    }
    for (const node of form.querySelectorAll('[data-setting-group="position-mode"]')) {
      node.classList.toggle("is-selected", node.dataset.settingValue === next.positionMode);
    }
    const positionInput = form.querySelector("#variants-chess960-position-number");
    if (positionInput instanceof HTMLInputElement) {
      positionInput.disabled = next.positionMode !== "number";
    }
  }

  function syncThreeCheckFormSelectionStyles(form, settingsOverride = null) {
    if (!(form instanceof HTMLFormElement)) return;
    const next = settingsOverride || collectThreeCheckSettings(form);
    const colorInput = form.querySelector('input[name="threecheck-color"]');
    const strengthInput = form.querySelector('input[name="threecheck-strength"]');
    if (colorInput instanceof HTMLInputElement) colorInput.value = next.color;
    if (strengthInput instanceof HTMLInputElement) strengthInput.value = next.strength;
    for (const node of form.querySelectorAll('[data-setting-group="threecheck-color"]')) {
      node.classList.toggle("is-selected", node.dataset.settingValue === next.color);
    }
    for (const node of form.querySelectorAll('[data-setting-group="threecheck-strength"]')) {
      node.classList.toggle("is-selected", node.dataset.settingValue === next.strength);
    }
  }

  function syncKingOfTheHillFormSelectionStyles(form, settingsOverride = null) {
    if (!(form instanceof HTMLFormElement)) return;
    const next = settingsOverride || collectKingOfTheHillSettings(form);
    const colorInput = form.querySelector('input[name="kingofthehill-color"]');
    const strengthInput = form.querySelector('input[name="kingofthehill-strength"]');
    if (colorInput instanceof HTMLInputElement) colorInput.value = next.color;
    if (strengthInput instanceof HTMLInputElement) strengthInput.value = next.strength;
    for (const node of form.querySelectorAll('[data-setting-group="kingofthehill-color"]')) {
      node.classList.toggle("is-selected", node.dataset.settingValue === next.color);
    }
    for (const node of form.querySelectorAll('[data-setting-group="kingofthehill-strength"]')) {
      node.classList.toggle("is-selected", node.dataset.settingValue === next.strength);
    }
  }

  function syncAntichessFormSelectionStyles(form, settingsOverride = null) {
    if (!(form instanceof HTMLFormElement)) return;
    const next = settingsOverride || collectAntichessSettings(form);
    const colorInput = form.querySelector('input[name="antichess-color"]');
    const strengthInput = form.querySelector('input[name="antichess-strength"]');
    if (colorInput instanceof HTMLInputElement) colorInput.value = next.color;
    if (strengthInput instanceof HTMLInputElement) strengthInput.value = next.strength;
    for (const node of form.querySelectorAll('[data-setting-group="antichess-color"]')) {
      node.classList.toggle("is-selected", node.dataset.settingValue === next.color);
    }
    for (const node of form.querySelectorAll('[data-setting-group="antichess-strength"]')) {
      node.classList.toggle("is-selected", node.dataset.settingValue === next.strength);
    }
  }

  function syncAtomicFormSelectionStyles(form, settingsOverride = null) {
    if (!(form instanceof HTMLFormElement)) return;
    const next = settingsOverride || collectAtomicSettings(form);
    const colorInput = form.querySelector('input[name="atomic-color"]');
    const strengthInput = form.querySelector('input[name="atomic-strength"]');
    if (colorInput instanceof HTMLInputElement) colorInput.value = next.color;
    if (strengthInput instanceof HTMLInputElement) strengthInput.value = next.strength;
    for (const node of form.querySelectorAll('[data-setting-group="atomic-color"]')) {
      node.classList.toggle("is-selected", node.dataset.settingValue === next.color);
    }
    for (const node of form.querySelectorAll('[data-setting-group="atomic-strength"]')) {
      node.classList.toggle("is-selected", node.dataset.settingValue === next.strength);
    }
  }

  function syncHordeFormSelectionStyles(form, settingsOverride = null) {
    if (!(form instanceof HTMLFormElement)) return;
    const next = settingsOverride || collectHordeSettings(form);
    const colorInput = form.querySelector('input[name="horde-color"]');
    const strengthInput = form.querySelector('input[name="horde-strength"]');
    if (colorInput instanceof HTMLInputElement) colorInput.value = next.color;
    if (strengthInput instanceof HTMLInputElement) strengthInput.value = next.strength;
    for (const node of form.querySelectorAll('[data-setting-group="horde-color"]')) {
      node.classList.toggle("is-selected", node.dataset.settingValue === next.color);
    }
    for (const node of form.querySelectorAll('[data-setting-group="horde-strength"]')) {
      node.classList.toggle("is-selected", node.dataset.settingValue === next.strength);
    }
  }

  function syncRacingKingsFormSelectionStyles(form, settingsOverride = null) {
    if (!(form instanceof HTMLFormElement)) return;
    const next = settingsOverride || collectRacingKingsSettings(form);
    const colorInput = form.querySelector('input[name="racingkings-color"]');
    const strengthInput = form.querySelector('input[name="racingkings-strength"]');
    if (colorInput instanceof HTMLInputElement) colorInput.value = next.color;
    if (strengthInput instanceof HTMLInputElement) strengthInput.value = next.strength;
    for (const node of form.querySelectorAll('[data-setting-group="racingkings-color"]')) {
      node.classList.toggle("is-selected", node.dataset.settingValue === next.color);
    }
    for (const node of form.querySelectorAll('[data-setting-group="racingkings-strength"]')) {
      node.classList.toggle("is-selected", node.dataset.settingValue === next.strength);
    }
  }

  function syncCrazyhouseFormSelectionStyles(form, settingsOverride = null) {
    if (!(form instanceof HTMLFormElement)) return;
    const next = settingsOverride || collectCrazyhouseSettings(form);
    const colorInput = form.querySelector('input[name="crazyhouse-color"]');
    const strengthInput = form.querySelector('input[name="crazyhouse-strength"]');
    if (colorInput instanceof HTMLInputElement) colorInput.value = next.color;
    if (strengthInput instanceof HTMLInputElement) strengthInput.value = next.strength;
    for (const node of form.querySelectorAll('[data-setting-group="crazyhouse-color"]')) {
      node.classList.toggle("is-selected", node.dataset.settingValue === next.color);
    }
    for (const node of form.querySelectorAll('[data-setting-group="crazyhouse-strength"]')) {
      node.classList.toggle("is-selected", node.dataset.settingValue === next.strength);
    }
  }

  async function submitChess960Settings(form) {
    viewState.chess960Settings = collectChess960Settings(form);
    viewState.chess960Error = "";
    if (viewState.chess960Settings.positionMode === "number") {
      const parsed = Number(viewState.chess960Settings.positionNumber);
      if (!Number.isInteger(parsed) || parsed < 1 || parsed > 960) {
        viewState.chess960Error = "Enter a valid Chess960 position number from 1 to 960.";
        renderScreen();
        return;
      }
    }
    viewState.startingGame = true;
    renderScreen();
    const started = await startChess960VariantGame({
      color: viewState.chess960Settings.color,
      strength: viewState.chess960Settings.strength,
      positionMode: viewState.chess960Settings.positionMode,
      positionNumber: viewState.chess960Settings.positionMode === "number"
        ? Number(viewState.chess960Settings.positionNumber)
        : null
    });
    viewState.startingGame = false;
    if (started) {
      viewState.chess960ModalOpen = false;
      viewState.chess960Error = "";
    }
    renderScreen();
  }

  async function submitThreeCheckSettings(form) {
    viewState.threeCheckSettings = collectThreeCheckSettings(form);
    viewState.threeCheckError = "";
    viewState.startingGame = true;
    renderScreen();
    const started = await startThreeCheckVariantGame({
      color: viewState.threeCheckSettings.color,
      strength: viewState.threeCheckSettings.strength
    });
    viewState.startingGame = false;
    if (started) {
      viewState.threeCheckModalOpen = false;
      viewState.threeCheckError = "";
    }
    renderScreen();
  }

  async function submitKingOfTheHillSettings(form) {
    viewState.kingOfTheHillSettings = collectKingOfTheHillSettings(form);
    viewState.kingOfTheHillError = "";
    viewState.startingGame = true;
    renderScreen();
    const started = await startKingOfTheHillVariantGame({
      color: viewState.kingOfTheHillSettings.color,
      strength: viewState.kingOfTheHillSettings.strength
    });
    viewState.startingGame = false;
    if (started) {
      viewState.kingOfTheHillModalOpen = false;
      viewState.kingOfTheHillError = "";
    }
    renderScreen();
  }

  async function submitAntichessSettings(form) {
    viewState.antichessSettings = collectAntichessSettings(form);
    viewState.antichessError = "";
    viewState.startingGame = true;
    renderScreen();
    const started = await startAntichessVariantGame({
      color: viewState.antichessSettings.color,
      strength: viewState.antichessSettings.strength
    });
    viewState.startingGame = false;
    if (started) {
      viewState.antichessModalOpen = false;
      viewState.antichessError = "";
    }
    renderScreen();
  }

  async function submitAtomicSettings(form) {
    viewState.atomicSettings = collectAtomicSettings(form);
    viewState.atomicError = "";
    viewState.startingGame = true;
    renderScreen();
    const started = await startAtomicVariantGame({
      color: viewState.atomicSettings.color,
      strength: viewState.atomicSettings.strength
    });
    viewState.startingGame = false;
    if (started) {
      viewState.atomicModalOpen = false;
      viewState.atomicError = "";
    }
    renderScreen();
  }

  async function submitHordeSettings(form) {
    viewState.hordeSettings = collectHordeSettings(form);
    viewState.hordeError = "";
    viewState.startingGame = true;
    renderScreen();
    const started = await startHordeVariantGame({
      color: viewState.hordeSettings.color,
      strength: viewState.hordeSettings.strength
    });
    viewState.startingGame = false;
    if (started) {
      viewState.hordeModalOpen = false;
      viewState.hordeError = "";
    }
    renderScreen();
  }

  async function submitRacingKingsSettings(form) {
    viewState.racingKingsSettings = collectRacingKingsSettings(form);
    viewState.racingKingsError = "";
    viewState.startingGame = true;
    renderScreen();
    const started = await startRacingKingsVariantGame({
      color: viewState.racingKingsSettings.color,
      strength: viewState.racingKingsSettings.strength
    });
    viewState.startingGame = false;
    if (started) {
      viewState.racingKingsModalOpen = false;
      viewState.racingKingsError = "";
    }
    renderScreen();
  }

  async function submitCrazyhouseSettings(form) {
    viewState.crazyhouseSettings = collectCrazyhouseSettings(form);
    viewState.crazyhouseError = "";
    viewState.startingGame = true;
    renderScreen();
    const started = await startCrazyhouseVariantGame({
      color: viewState.crazyhouseSettings.color,
      strength: viewState.crazyhouseSettings.strength
    });
    viewState.startingGame = false;
    if (started) {
      viewState.crazyhouseModalOpen = false;
      viewState.crazyhouseError = "";
    }
    renderScreen();
  }

  function showScreen() {
    closeHomeProfileMenu();
    if (homeProfileEl) homeProfileEl.classList.add("hidden");
    closeHomeOnlinePanels();
    if (homeScreenEl) homeScreenEl.classList.add("hidden");
    if (toolsScreenEl) toolsScreenEl.classList.add("hidden");
    if (puzzleScreenEl) puzzleScreenEl.classList.add("hidden");
    if (chess960ScreenEl) chess960ScreenEl.classList.add("hidden");
    if (tournamentScreenEl) tournamentScreenEl.classList.add("hidden");
    if (visionScreenEl) visionScreenEl.classList.add("hidden");
    if (gameScreenEl) gameScreenEl.classList.add("hidden");
    if (variantsScreenEl) variantsScreenEl.classList.remove("hidden");
    renderScreen();
    updateHomeOnlineToolbarVisibility();
  }

  function backToTools() {
    closeHomeProfileMenu();
    if (homeProfileEl) homeProfileEl.classList.add("hidden");
    closeHomeOnlinePanels();
    if (homeScreenEl) homeScreenEl.classList.add("hidden");
    if (toolsScreenEl) toolsScreenEl.classList.remove("hidden");
    if (variantsScreenEl) variantsScreenEl.classList.add("hidden");
    if (gameScreenEl) gameScreenEl.classList.add("hidden");
    updateHomeOnlineToolbarVisibility();
  }

  if (variantsRootEl && variantsRootEl.dataset.bound !== "1") {
    variantsRootEl.dataset.bound = "1";
    variantsRootEl.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const actionTarget = target.closest("[data-action]");
      if (actionTarget instanceof HTMLElement) {
        if (actionTarget.dataset.action === "close-chess960-modal") {
          closeChess960Modal();
          return;
        }
        if (actionTarget.dataset.action === "close-threecheck-modal") {
          closeThreeCheckModal();
          return;
        }
        if (actionTarget.dataset.action === "close-kingofthehill-modal") {
          closeKingOfTheHillModal();
          return;
        }
        if (actionTarget.dataset.action === "close-antichess-modal") {
          closeAntichessModal();
          return;
        }
        if (actionTarget.dataset.action === "close-atomic-modal") {
          closeAtomicModal();
          return;
        }
        if (actionTarget.dataset.action === "close-horde-modal") {
          closeHordeModal();
          return;
        }
        if (actionTarget.dataset.action === "close-racingkings-modal") {
          closeRacingKingsModal();
          return;
        }
        if (actionTarget.dataset.action === "close-crazyhouse-modal") {
          closeCrazyhouseModal();
          return;
        }
      }
      const button = target.closest("button");
      if (!button) return;
      if (button.id === "btn-variant-chess960") {
        openChess960Modal();
        return;
      }
      if (button.id === "btn-variant-threecheck") {
        openThreeCheckModal();
        return;
      }
      if (button.id === "btn-variant-kingofthehill") {
        openKingOfTheHillModal();
        return;
      }
      if (button.id === "btn-variant-antichess") {
        openAntichessModal();
        return;
      }
      if (button.id === "btn-variant-atomic") {
        openAtomicModal();
        return;
      }
      if (button.id === "btn-variant-horde") {
        openHordeModal();
        return;
      }
      if (button.id === "btn-variant-racingkings") {
        openRacingKingsModal();
        return;
      }
      if (button.id === "btn-variant-crazyhouse") {
        openCrazyhouseModal();
        return;
      }
      const form = button.closest("form");
      if (!(form instanceof HTMLFormElement)) return;
      const group = button.dataset.settingGroup;
      const value = button.dataset.settingValue;
      if (group === "color" || group === "strength" || group === "position-mode") {
        const nextSettings = collectChess960Settings(form);
        if (group === "color") nextSettings.color = value || "random";
        if (group === "strength") nextSettings.strength = value || "4";
        if (group === "position-mode") nextSettings.positionMode = value === "number" ? "number" : "random";
        syncChess960FormSelectionStyles(form, nextSettings);
        return;
      }
      if (group === "threecheck-color" || group === "threecheck-strength") {
        const nextSettings = collectThreeCheckSettings(form);
        if (group === "threecheck-color") nextSettings.color = value || "random";
        if (group === "threecheck-strength") nextSettings.strength = value || "4";
        syncThreeCheckFormSelectionStyles(form, nextSettings);
        return;
      }
      if (group === "kingofthehill-color" || group === "kingofthehill-strength") {
        const nextSettings = collectKingOfTheHillSettings(form);
        if (group === "kingofthehill-color") nextSettings.color = value || "random";
        if (group === "kingofthehill-strength") nextSettings.strength = value || "4";
        syncKingOfTheHillFormSelectionStyles(form, nextSettings);
        return;
      }
      if (group === "antichess-color" || group === "antichess-strength") {
        const nextSettings = collectAntichessSettings(form);
        if (group === "antichess-color") nextSettings.color = value || "random";
        if (group === "antichess-strength") nextSettings.strength = value || "4";
        syncAntichessFormSelectionStyles(form, nextSettings);
        return;
      }
      if (group === "atomic-color" || group === "atomic-strength") {
        const nextSettings = collectAtomicSettings(form);
        if (group === "atomic-color") nextSettings.color = value || "random";
        if (group === "atomic-strength") nextSettings.strength = value || "4";
        syncAtomicFormSelectionStyles(form, nextSettings);
        return;
      }
      if (group === "horde-color" || group === "horde-strength") {
        const nextSettings = collectHordeSettings(form);
        if (group === "horde-color") nextSettings.color = value || "random";
        if (group === "horde-strength") nextSettings.strength = value || "4";
        syncHordeFormSelectionStyles(form, nextSettings);
        return;
      }
      if (group === "racingkings-color" || group === "racingkings-strength") {
        const nextSettings = collectRacingKingsSettings(form);
        if (group === "racingkings-color") nextSettings.color = value || "random";
        if (group === "racingkings-strength") nextSettings.strength = value || "4";
        syncRacingKingsFormSelectionStyles(form, nextSettings);
        return;
      }
      if (group === "crazyhouse-color" || group === "crazyhouse-strength") {
        const nextSettings = collectCrazyhouseSettings(form);
        if (group === "crazyhouse-color") nextSettings.color = value || "random";
        if (group === "crazyhouse-strength") nextSettings.strength = value || "4";
        syncCrazyhouseFormSelectionStyles(form, nextSettings);
      }
    });
    variantsRootEl.addEventListener("input", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const form = target.closest("form");
      if (!(form instanceof HTMLFormElement)) return;
      if (form.id === "variants-chess960-form") {
        syncChess960FormSelectionStyles(form);
      } else if (form.id === "variants-threecheck-form") {
        syncThreeCheckFormSelectionStyles(form);
      } else if (form.id === "variants-kingofthehill-form") {
        syncKingOfTheHillFormSelectionStyles(form);
      } else if (form.id === "variants-antichess-form") {
        syncAntichessFormSelectionStyles(form);
      } else if (form.id === "variants-atomic-form") {
        syncAtomicFormSelectionStyles(form);
      } else if (form.id === "variants-horde-form") {
        syncHordeFormSelectionStyles(form);
      } else if (form.id === "variants-racingkings-form") {
        syncRacingKingsFormSelectionStyles(form);
      } else if (form.id === "variants-crazyhouse-form") {
        syncCrazyhouseFormSelectionStyles(form);
      }
    });
    variantsRootEl.addEventListener("submit", async (event) => {
      const target = event.target;
      if (!(target instanceof HTMLFormElement)) return;
      event.preventDefault();
      if (viewState.startingGame) return;
      if (target.id === "variants-chess960-form") {
        await submitChess960Settings(target);
      } else if (target.id === "variants-threecheck-form") {
        await submitThreeCheckSettings(target);
      } else if (target.id === "variants-kingofthehill-form") {
        await submitKingOfTheHillSettings(target);
      } else if (target.id === "variants-antichess-form") {
        await submitAntichessSettings(target);
      } else if (target.id === "variants-atomic-form") {
        await submitAtomicSettings(target);
      } else if (target.id === "variants-horde-form") {
        await submitHordeSettings(target);
      } else if (target.id === "variants-racingkings-form") {
        await submitRacingKingsSettings(target);
      } else if (target.id === "variants-crazyhouse-form") {
        await submitCrazyhouseSettings(target);
      }
    });
  }

  return {
    showScreen,
    backToTools
  };
}

module.exports = { createVariantsModule };
