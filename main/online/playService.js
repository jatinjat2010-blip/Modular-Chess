class PlayService {
  constructor({ lichessApi, onEvent, onGameEvent, onError }) {
    this.lichessApi = lichessApi;
    this.onEvent = onEvent;
    this.onGameEvent = onGameEvent;
    this.onError = onError;
    this.eventStream = null;
    this.gameStreams = new Map();
    this.seekStream = null;
    this.activeToken = "";
  }

  setToken(token) {
    this.activeToken = String(token || "");
  }

  startEventStream() {
    this.stopEventStream();
    if (!this.activeToken) {
      throw new Error("Missing token for event stream.");
    }
    this.eventStream = this.lichessApi.startNdjsonStream("/api/stream/event", {
      token: this.activeToken,
      onLine: (evt) => {
        if (this.onEvent) this.onEvent(evt);
      },
      onError: (err) => {
        if (this.onError) this.onError({ kind: "event", message: String(err?.message || err) });
      },
      onClose: () => {
        this.eventStream = null;
      }
    });
  }

  stopEventStream() {
    if (this.eventStream) {
      this.eventStream.close();
      this.eventStream = null;
    }
  }

  joinGameStream(gameId) {
    const id = String(gameId || "").trim();
    if (!id) throw new Error("Missing gameId.");
    this.leaveGameStream(id);
    if (!this.activeToken) {
      throw new Error("Missing token for game stream.");
    }
    const stream = this.lichessApi.startNdjsonStream(`/api/board/game/stream/${encodeURIComponent(id)}`, {
      token: this.activeToken,
      onLine: (evt) => {
        if (this.onGameEvent) this.onGameEvent(id, evt);
      },
      onError: (err) => {
        if (this.onError) this.onError({ kind: "game", gameId: id, message: String(err?.message || err) });
      },
      onClose: () => {
        this.gameStreams.delete(id);
      }
    });
    this.gameStreams.set(id, stream);
  }

  leaveGameStream(gameId) {
    const id = String(gameId || "").trim();
    const stream = this.gameStreams.get(id);
    if (stream) {
      stream.close();
      this.gameStreams.delete(id);
    }
  }

  stopAllGameStreams() {
    for (const [id, stream] of this.gameStreams.entries()) {
      stream.close();
      this.gameStreams.delete(id);
    }
  }

  startSeek({ timeMinutes, incrementSeconds, rated = false, color = "random", variant = "standard" }) {
    if (!this.activeToken) {
      throw new Error("Missing token for seek.");
    }
    this.cancelSeek();
    const form = new URLSearchParams();
    const safeTime = Number(timeMinutes);
    const safeInc = Number(incrementSeconds);
    form.set("time", String(safeTime));
    form.set("increment", String(safeInc));
    form.set("rated", rated ? "true" : "false");

    const seekDebug = `seek payload: time=${safeTime}, increment=${safeInc}, rated=${rated}, color=${String(
      color || ""
    )}, variant=${String(variant || "")}`;
    if (this.onError) this.onError({ kind: "seek-debug", message: seekDebug });

    this.seekStream = this.lichessApi.startNdjsonStream("/api/board/seek", {
      method: "POST",
      token: this.activeToken,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/x-ndjson"
      },
      body: form,
      onLine: () => {
        // real-time seek emits heartbeat empty lines; gameStart arrives via event stream.
      },
      onError: (err) => {
        if (this.onError) {
          this.onError({
            kind: "seek",
            message: `${seekDebug} | ${String(err?.message || err)}`
          });
        }
      },
      onClose: () => {
        this.seekStream = null;
      }
    });
  }

  cancelSeek() {
    if (this.seekStream) {
      this.seekStream.close();
      this.seekStream = null;
    }
  }

  dispose() {
    this.cancelSeek();
    this.stopEventStream();
    this.stopAllGameStreams();
  }
}

module.exports = { PlayService };
