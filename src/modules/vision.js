const path = require("path");
const { pathToFileURL } = require("url");

function createChessVisionModule({
  ipcRenderer,
  homeProfileEl,
  homeScreenEl,
  toolsScreenEl,
  chess960ScreenEl,
  tournamentScreenEl,
  visionScreenEl,
  gameScreenEl,
  closeHomeProfileMenu,
  closeHomeOnlinePanels,
  updateHomeOnlineToolbarVisibility,
  loadFenIntoAnalysis,
  showAppMessage
}) {
  const el = {
    modeUpload: document.getElementById("btn-vision-mode-upload"),
    modeCamera: document.getElementById("btn-vision-mode-camera"),
    backendStatus: document.getElementById("vision-backend-status"),
    uploadActions: document.getElementById("vision-upload-actions"),
    cameraActions: document.getElementById("vision-camera-actions"),
    pickImage: document.getElementById("btn-vision-pick-image"),
    selectedFile: document.getElementById("vision-selected-file"),
    recognize: document.getElementById("btn-vision-recognize"),
    startCamera: document.getElementById("btn-vision-start-camera"),
    capture: document.getElementById("btn-vision-capture"),
    stopCamera: document.getElementById("btn-vision-stop-camera"),
    cameraStatus: document.getElementById("vision-camera-status"),
    orientation: document.getElementById("vision-orientation-select"),
    retry: document.getElementById("btn-vision-retry"),
    useAnalysis: document.getElementById("btn-vision-use-analysis"),
    imagePreview: document.getElementById("vision-image-preview"),
    cameraPreview: document.getElementById("vision-camera-preview"),
    previewEmpty: document.getElementById("vision-preview-empty"),
    captureCanvas: document.getElementById("vision-capture-canvas"),
    fenOutput: document.getElementById("vision-fen-output"),
    sideToMove: document.getElementById("vision-side-to-move"),
    castleK: document.getElementById("vision-castle-k"),
    castleQ: document.getElementById("vision-castle-q"),
    castlek: document.getElementById("vision-castle-kb"),
    castleq: document.getElementById("vision-castle-qb"),
    resultStatus: document.getElementById("vision-result-status")
  };

  const state = {
    mode: "upload",
    backendReady: false,
    selectedImagePath: "",
    selectedImageDataUrl: "",
    recognizedPlacement: "",
    stream: null
  };

  function setBackendStatus(text, isErr = false) {
    if (!el.backendStatus) return;
    el.backendStatus.textContent = String(text || "");
    el.backendStatus.style.color = isErr ? "#e08f8f" : "#bdbdbd";
  }

  function setResultStatus(text, isErr = false) {
    if (!el.resultStatus) return;
    el.resultStatus.textContent = String(text || "");
    el.resultStatus.style.color = isErr ? "#e08f8f" : "#bdbdbd";
  }

  function renderMode() {
    const isUpload = state.mode === "upload";
    el.modeUpload?.classList.toggle("selected", isUpload);
    el.modeCamera?.classList.toggle("selected", !isUpload);
    el.uploadActions?.classList.toggle("hidden", !isUpload);
    el.cameraActions?.classList.toggle("hidden", isUpload);
  }

  function renderPreview() {
    const hasImage = !!(state.selectedImagePath || state.selectedImageDataUrl);
    const cameraActive = !!state.stream;
    el.imagePreview?.classList.toggle("hidden", !hasImage || cameraActive);
    el.cameraPreview?.classList.toggle("hidden", !cameraActive);
    el.previewEmpty?.classList.toggle("hidden", hasImage || cameraActive);
  }

  function clearRecognition() {
    state.recognizedPlacement = "";
    if (el.fenOutput) el.fenOutput.value = "";
    setResultStatus("No recognition run yet.");
  }

  function buildCastlingString() {
    let out = "";
    if (el.castleK?.checked) out += "K";
    if (el.castleQ?.checked) out += "Q";
    if (el.castlek?.checked) out += "k";
    if (el.castleq?.checked) out += "q";
    return out || "-";
  }

  function composeFen() {
    const placement = String(state.recognizedPlacement || "").trim();
    if (!placement) return "";
    return `${placement} ${String(el.sideToMove?.value || "w")} ${buildCastlingString()} - 0 1`;
  }

  function updateFenOutput() {
    if (el.fenOutput) el.fenOutput.value = composeFen();
  }

  async function refreshBackendStatus() {
    const res = await ipcRenderer.invoke("vision:status");
    state.backendReady = !!res?.ready;
    if (state.backendReady) setBackendStatus("Vision backend ready.");
    else setBackendStatus(res?.error || res?.message || "Vision backend unavailable.", true);
    if (el.recognize) el.recognize.disabled = !state.backendReady;
  }

  function setPreviewFromPath(filePath) {
    if (!el.imagePreview) return;
    el.imagePreview.src = pathToFileURL(path.resolve(filePath)).toString();
    renderPreview();
  }

  function setPreviewFromDataUrl(dataUrl) {
    if (!el.imagePreview) return;
    el.imagePreview.src = dataUrl;
    renderPreview();
  }

  async function pickImage() {
    const res = await ipcRenderer.invoke("file:pickFile", {
      filters: [{ name: "Images", extensions: ["png", "jpg", "jpeg", "webp", "bmp"] }]
    });
    if (!res?.filePath) return;
    state.selectedImagePath = String(res.filePath);
    state.selectedImageDataUrl = "";
    if (el.selectedFile) el.selectedFile.textContent = path.basename(state.selectedImagePath);
    setPreviewFromPath(state.selectedImagePath);
    clearRecognition();
  }

  async function startCamera() {
    try {
      await stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      state.stream = stream;
      if (el.cameraPreview) {
        el.cameraPreview.srcObject = stream;
        await el.cameraPreview.play().catch(() => {});
      }
      if (el.cameraStatus) el.cameraStatus.textContent = "Camera ready.";
      renderPreview();
    } catch (err) {
      const msg = `Camera failed: ${String(err?.message || err)}`;
      if (el.cameraStatus) el.cameraStatus.textContent = msg;
      showAppMessage(msg);
    }
  }

  async function stopCamera() {
    if (state.stream) {
      for (const track of state.stream.getTracks()) track.stop();
      state.stream = null;
    }
    if (el.cameraPreview) {
      el.cameraPreview.pause();
      el.cameraPreview.srcObject = null;
    }
    if (el.cameraStatus) el.cameraStatus.textContent = "Camera idle.";
    renderPreview();
  }

  function captureSnapshot() {
    const video = el.cameraPreview;
    const canvas = el.captureCanvas;
    if (!video || !canvas || !state.stream) {
      showAppMessage("Start camera first.");
      return;
    }
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, width, height);
    state.selectedImageDataUrl = canvas.toDataURL("image/png");
    state.selectedImagePath = "";
    if (el.selectedFile) el.selectedFile.textContent = "Captured frame";
    setPreviewFromDataUrl(state.selectedImageDataUrl);
    clearRecognition();
    if (el.cameraStatus) el.cameraStatus.textContent = "Snapshot captured.";
  }

  async function recognize() {
    if (!state.backendReady) return showAppMessage("Vision backend is not ready.");
    if (!state.selectedImagePath && !state.selectedImageDataUrl) {
      return showAppMessage("Select or capture an image first.");
    }
    setResultStatus("Recognizing position...");
    const res = await ipcRenderer.invoke("vision:recognize-image", {
      imagePath: state.selectedImagePath,
      imageDataUrl: state.selectedImageDataUrl,
      whiteBottom: String(el.orientation?.value || "white") === "white"
    });
    if (!res?.ok) {
      setResultStatus(res?.error || "Recognition failed.", true);
      showAppMessage(res?.error || "Recognition failed.");
      return;
    }
    state.recognizedPlacement = String(res.fenPlacement || "").trim();
    if (el.sideToMove) el.sideToMove.value = String(res.sideToMove || "w");
    const castling = String(res.castling || "-");
    if (el.castleK) el.castleK.checked = castling.includes("K");
    if (el.castleQ) el.castleQ.checked = castling.includes("Q");
    if (el.castlek) el.castlek.checked = castling.includes("k");
    if (el.castleq) el.castleq.checked = castling.includes("q");
    updateFenOutput();
    const warningText = Array.isArray(res.warnings) && res.warnings.length ? ` Warning: ${res.warnings[0]}` : "";
    setResultStatus(`Recognition complete.${warningText}`);
  }

  function retryRecognition() {
    clearRecognition();
    updateFenOutput();
  }

  function useInAnalysis() {
    const fen = composeFen();
    if (!fen) return showAppMessage("Recognize a board first.");
    loadFenIntoAnalysis(fen, "Vision position loaded into analysis.");
  }

  function showScreen() {
    closeHomeProfileMenu();
    closeHomeOnlinePanels();
    homeProfileEl?.classList.add("hidden");
    homeScreenEl?.classList.add("hidden");
    toolsScreenEl?.classList.add("hidden");
    chess960ScreenEl?.classList.add("hidden");
    tournamentScreenEl?.classList.add("hidden");
    visionScreenEl?.classList.remove("hidden");
    gameScreenEl?.classList.add("hidden");
    updateHomeOnlineToolbarVisibility();
    renderMode();
    renderPreview();
    refreshBackendStatus().catch((err) => {
      state.backendReady = false;
      setBackendStatus(String(err?.message || err), true);
    });
  }

  function backToTools() {
    stopCamera().catch(() => {});
    closeHomeProfileMenu();
    closeHomeOnlinePanels();
    homeProfileEl?.classList.add("hidden");
    homeScreenEl?.classList.add("hidden");
    toolsScreenEl?.classList.remove("hidden");
    chess960ScreenEl?.classList.add("hidden");
    tournamentScreenEl?.classList.add("hidden");
    visionScreenEl?.classList.add("hidden");
    gameScreenEl?.classList.add("hidden");
    updateHomeOnlineToolbarVisibility();
  }

  function wire() {
    el.modeUpload?.addEventListener("click", () => {
      state.mode = "upload";
      stopCamera().catch(() => {});
      renderMode();
      renderPreview();
    });
    el.modeCamera?.addEventListener("click", () => {
      state.mode = "camera";
      renderMode();
      renderPreview();
    });
    el.pickImage?.addEventListener("click", () => {
      pickImage().catch((err) => showAppMessage(`Open failed: ${String(err?.message || err)}`));
    });
    el.startCamera?.addEventListener("click", () => {
      startCamera();
    });
    el.stopCamera?.addEventListener("click", () => {
      stopCamera().catch(() => {});
    });
    el.capture?.addEventListener("click", captureSnapshot);
    el.recognize?.addEventListener("click", () => {
      recognize().catch((err) => {
        setResultStatus(String(err?.message || err), true);
        showAppMessage(`Recognition failed: ${String(err?.message || err)}`);
      });
    });
    el.retry?.addEventListener("click", retryRecognition);
    el.useAnalysis?.addEventListener("click", useInAnalysis);
    el.sideToMove?.addEventListener("change", updateFenOutput);
    [el.castleK, el.castleQ, el.castlek, el.castleq].forEach((node) => node?.addEventListener("change", updateFenOutput));
  }

  wire();

  return {
    showScreen,
    backToTools,
    onThemeChange() {}
  };
}

module.exports = { createChessVisionModule };
