const { spawn } = require("child_process");
const readline = require("readline");

class VisionService {
  constructor({ pythonCommand = "python", scriptPath, cwd }) {
    this.pythonCommand = pythonCommand;
    this.scriptPath = scriptPath;
    this.cwd = cwd;
    this.proc = null;
    this.nextId = 1;
    this.pending = new Map();
    this.startPromise = null;
  }

  async start() {
    if (this.proc && !this.proc.killed) {
      return this.status();
    }
    if (this.startPromise) return this.startPromise;

    this.startPromise = new Promise((resolve, reject) => {
      let settled = false;
      try {
        const proc = spawn(this.pythonCommand, [this.scriptPath], {
          cwd: this.cwd,
          stdio: ["pipe", "pipe", "pipe"]
        });
        this.proc = proc;

        const rl = readline.createInterface({ input: proc.stdout });
        rl.on("line", (line) => this._onLine(line));

        let stderrTail = "";
        proc.stderr.on("data", (chunk) => {
          stderrTail = `${stderrTail}${chunk.toString("utf8")}`.slice(-4000);
        });

        proc.on("error", (err) => {
          this._failAll(String(err?.message || err));
          this.proc = null;
          if (!settled) {
            settled = true;
            reject(err);
          }
        });

        proc.on("close", (code, signal) => {
          const reason = stderrTail.trim() || `Vision backend exited (${signal || code || "unknown"}).`;
          this._failAll(reason);
          this.proc = null;
          this.startPromise = null;
          if (!settled) {
            settled = true;
            reject(new Error(reason));
          }
        });

        this.request("status", {}, 15000)
          .then((res) => {
            if (!settled) {
              settled = true;
              resolve(res);
            }
          })
          .catch((err) => {
            if (!settled) {
              settled = true;
              reject(err);
            }
          })
          .finally(() => {
            this.startPromise = null;
          });
      } catch (err) {
        this.startPromise = null;
        reject(err);
      }
    });

    return this.startPromise;
  }

  async stop() {
    if (!this.proc) return { ok: true, running: false };
    try {
      await this.request("stop", {}, 5000);
    } catch (_) {
      // ignore and kill below
    }
    if (this.proc && !this.proc.killed) {
      this.proc.kill();
    }
    this.proc = null;
    return { ok: true, running: false };
  }

  async status() {
    if (!this.proc || this.proc.killed) {
      return this.start();
    }
    return this.request("status", {}, 10000);
  }

  async recognizeImage(payload) {
    await this.start();
    return this.request("recognize", payload || {}, 120000);
  }

  dispose() {
    if (this.proc && !this.proc.killed) {
      this.proc.kill();
    }
    this._failAll("Vision backend disposed.");
    this.proc = null;
  }

  request(cmd, payload = {}, timeoutMs = 30000) {
    if (!this.proc || this.proc.killed || !this.proc.stdin) {
      return Promise.reject(new Error("Vision backend is not running."));
    }
    const id = `v_${this.nextId++}`;
    const message = JSON.stringify({ id, cmd, payload });
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Vision request timed out: ${cmd}`));
      }, timeoutMs);
      this.pending.set(id, {
        resolve: (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        reject: (err) => {
          clearTimeout(timer);
          reject(err);
        }
      });
      this.proc.stdin.write(`${message}\n`, "utf8", (err) => {
        if (err) {
          const pending = this.pending.get(id);
          this.pending.delete(id);
          if (pending) pending.reject(new Error(String(err?.message || err)));
        }
      });
    });
  }

  _onLine(line) {
    let msg = null;
    try {
      msg = JSON.parse(String(line || "").trim());
    } catch (_) {
      return;
    }
    const pending = this.pending.get(msg?.id);
    if (!pending) return;
    this.pending.delete(msg.id);
    if (msg && msg.ok === false) {
      pending.reject(new Error(String(msg.error || "Vision backend error.")));
      return;
    }
    pending.resolve(msg);
  }

  _failAll(reason) {
    for (const [id, pending] of this.pending.entries()) {
      this.pending.delete(id);
      pending.reject(new Error(String(reason || "Vision backend stopped.")));
    }
  }
}

module.exports = { VisionService };
