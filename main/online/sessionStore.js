const fs = require("fs/promises");
const path = require("path");

class SessionStore {
  constructor({ app, safeStorage }) {
    this.app = app;
    this.safeStorage = safeStorage;
  }

  get filePath() {
    return path.join(this.app.getPath("userData"), "online-session.json");
  }

  async load() {
    try {
      const raw = await fs.readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;
      if (typeof parsed.cipher === "string" && parsed.cipher) {
        return this.#decryptPayload(parsed.cipher);
      }
      if (parsed.payload && typeof parsed.payload === "object") {
        return parsed.payload;
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  async save(payload) {
    const dir = path.dirname(this.filePath);
    await fs.mkdir(dir, { recursive: true });
    const data = this.#encryptPayload(payload);
    await fs.writeFile(this.filePath, JSON.stringify(data, null, 2), "utf8");
  }

  async clear() {
    try {
      await fs.unlink(this.filePath);
    } catch (_) {
      // no-op
    }
  }

  #encryptPayload(payload) {
    const body = JSON.stringify(payload || {});
    if (this.safeStorage && this.safeStorage.isEncryptionAvailable()) {
      const buf = this.safeStorage.encryptString(body);
      return { cipher: buf.toString("base64") };
    }
    return { payload };
  }

  #decryptPayload(cipherBase64) {
    if (this.safeStorage && this.safeStorage.isEncryptionAvailable()) {
      const buf = Buffer.from(cipherBase64, "base64");
      const json = this.safeStorage.decryptString(buf);
      return JSON.parse(json);
    }
    return null;
  }
}

module.exports = { SessionStore };
