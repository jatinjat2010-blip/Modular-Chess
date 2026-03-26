function createModalHelpers({
  state,
  elements,
  constants,
  callbacks,
  drafts
}) {
  function openSetupModal() {
    callbacks.renderEngineRegistry();
    callbacks.renderSetupEngineDisplay();
    callbacks.applySetupSlidersFromSelection();
    callbacks.setPlayer2ColorPreference(state.player2ColorPref);
    elements.setupModalEl.classList.remove("hidden");
  }

  function closeSetupModal() {
    elements.setupModalEl.classList.add("hidden");
    drafts.setPendingEditorPlayFen(null);
  }

  function openEngineControlsModal() {
    elements.engineControlsModalEl.classList.remove("hidden");
  }

  function closeEngineControlsModal() {
    elements.engineControlsModalEl.classList.add("hidden");
  }

  function closeHomeProfileMenu() {
    if (!elements.homeProfileMenuEl) return;
    elements.homeProfileMenuEl.classList.add("hidden");
  }

  function openOnlineModal() {
    if (!elements.onlineModalEl) return;
    callbacks.hydrateOnlineSessionUi();
    callbacks.renderOnlineIncomingChallenges();
    callbacks.renderOnlineActiveGames();
    elements.onlineModalEl.classList.remove("hidden");
  }

  function closeAccountModal() {
    if (!elements.accountModalEl) return;
    elements.accountModalEl.classList.add("hidden");
    drafts.setAccountDraftAvatarDataUrl("");
    if (elements.accountAvatarInputEl) {
      elements.accountAvatarInputEl.value = "";
    }
  }

  function openAccountModal() {
    if (!elements.accountModalEl) return;
    if (elements.accountNameInputEl) {
      elements.accountNameInputEl.value = state.profile.name;
      elements.accountNameInputEl.maxLength = state.profile.syncOnlineName ? 2048 : 25;
      elements.accountNameInputEl.disabled = !!state.profile.syncOnlineName;
    }
    if (elements.accountSyncOnlineEl) {
      elements.accountSyncOnlineEl.checked = !!state.profile.syncOnlineName;
    }
    const avatar = state.profile.avatarDataUrl || "";
    drafts.setAccountDraftAvatarDataUrl(avatar);
    if (elements.accountAvatarPreviewEl) {
      elements.accountAvatarPreviewEl.src = avatar || constants.defaultProfileAvatar;
    }
    if (elements.accountAvatarInputEl) {
      elements.accountAvatarInputEl.value = "";
    }
    callbacks.setAccountMessage("");
    elements.accountModalEl.classList.remove("hidden");
  }

  function closeArchiveModal() {
    if (!elements.archiveModalEl) return;
    callbacks.hideArchiveContextMenu();
    elements.archiveModalEl.classList.add("hidden");
  }

  function closeArchiveDeleteConfirmModal() {
    callbacks.setPendingArchiveBulkDelete(null);
    if (elements.archiveDeleteConfirmModalEl) {
      elements.archiveDeleteConfirmModalEl.classList.add("hidden");
    }
  }

  function showArchiveDeleteProgress(current, total) {
    if (elements.archiveDeleteProgressTextEl) {
      elements.archiveDeleteProgressTextEl.textContent = `Deleting ${current}/${total} games...`;
    }
    if (elements.archiveDeleteProgressFillEl) {
      const pct = total > 0 ? Math.max(0, Math.min(100, Math.round((current / total) * 100))) : 0;
      elements.archiveDeleteProgressFillEl.style.width = `${pct}%`;
    }
    if (elements.archiveDeleteProgressModalEl) {
      elements.archiveDeleteProgressModalEl.classList.remove("hidden");
    }
  }

  function hideArchiveDeleteProgress() {
    if (elements.archiveDeleteProgressModalEl) {
      elements.archiveDeleteProgressModalEl.classList.add("hidden");
    }
    if (elements.archiveDeleteProgressFillEl) {
      elements.archiveDeleteProgressFillEl.style.width = "0%";
    }
  }

  function closeThemeModal() {
    if (!elements.themeModalEl) return;
    elements.themeModalEl.classList.add("hidden");
    drafts.setActiveThemeModalKind("");
  }

  function setBackgroundMessage(text, isError = false) {
    if (!elements.backgroundMsgEl) return;
    elements.backgroundMsgEl.textContent = text || "";
    elements.backgroundMsgEl.style.color = isError ? "#e08f8f" : "#b9b9b9";
  }

  function renderBackgroundModalDraft() {
    const backgroundDraftMode = drafts.getBackgroundDraftMode();
    const backgroundDraftValue = drafts.getBackgroundDraftValue();
    if (elements.backgroundColorWrapEl) {
      elements.backgroundColorWrapEl.classList.toggle("hidden", backgroundDraftMode !== "color");
    }
    if (elements.backgroundImageWrapEl) {
      elements.backgroundImageWrapEl.classList.toggle("hidden", backgroundDraftMode !== "image");
    }
    if (elements.backgroundColorInputEl && backgroundDraftMode === "color" && backgroundDraftValue) {
      elements.backgroundColorInputEl.value = backgroundDraftValue;
    }
    if (elements.backgroundPreviewEl) {
      elements.backgroundPreviewEl.style.backgroundImage =
        backgroundDraftMode === "image" && backgroundDraftValue ? `url("${backgroundDraftValue}")` : "";
      elements.backgroundPreviewEl.style.backgroundColor =
        backgroundDraftMode === "color" && backgroundDraftValue
          ? backgroundDraftValue
          : backgroundDraftMode === "default"
            ? constants.defaultAppBackground
            : "#242424";
    }
  }

  function closeBackgroundModal() {
    if (!elements.backgroundModalEl) return;
    elements.backgroundModalEl.classList.add("hidden");
    if (elements.backgroundImageInputEl) {
      elements.backgroundImageInputEl.value = "";
    }
  }

  function openBackgroundModal() {
    if (!elements.backgroundModalEl) return;
    drafts.setBackgroundDraftMode(state.theme.appBackgroundMode || "default");
    drafts.setBackgroundDraftValue(state.theme.appBackgroundValue || "");
    if (elements.btnBackgroundFullscreenToggleEl) {
      elements.btnBackgroundFullscreenToggleEl.textContent = state.isFullscreen ? "Windowed Mode" : "Full Screen Mode";
    }
    if (elements.backgroundColorInputEl) {
      elements.backgroundColorInputEl.value =
        drafts.getBackgroundDraftMode() === "color" && drafts.getBackgroundDraftValue()
          ? drafts.getBackgroundDraftValue()
          : "#2c2c2c";
    }
    if (elements.backgroundImageInputEl) {
      elements.backgroundImageInputEl.value = "";
    }
    setBackgroundMessage("");
    renderBackgroundModalDraft();
    elements.backgroundModalEl.classList.remove("hidden");
  }

  return {
    openSetupModal,
    closeSetupModal,
    openEngineControlsModal,
    closeEngineControlsModal,
    closeHomeProfileMenu,
    openOnlineModal,
    closeAccountModal,
    openAccountModal,
    closeArchiveModal,
    closeArchiveDeleteConfirmModal,
    showArchiveDeleteProgress,
    hideArchiveDeleteProgress,
    closeThemeModal,
    setBackgroundMessage,
    renderBackgroundModalDraft,
    closeBackgroundModal,
    openBackgroundModal
  };
}

module.exports = { createModalHelpers };
