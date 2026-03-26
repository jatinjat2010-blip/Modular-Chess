const https = require("https");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class LichessApi {
  constructor({ baseUrl = "https://lichess.org", userAgent = "offline-lichess/1.0", minIntervalMs = 1000 }) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.userAgent = userAgent;
    this.minIntervalMs = Math.max(150, Number(minIntervalMs) || 1000);
    this.lastRequestAt = 0;
    this.queue = Promise.resolve();
  }

  setMinIntervalMs(ms) {
    this.minIntervalMs = Math.max(150, Number(ms) || this.minIntervalMs);
  }

  requestJson(path, { method = "GET", token, headers = {}, body, retries = 2, timeoutMs = 20000 } = {}) {
    return this.#enqueue(() => this.#request(path, { method, token, headers, body, retries, timeoutMs, expect: "json" }));
  }

  requestText(path, { method = "GET", token, headers = {}, body, retries = 2, timeoutMs = 20000 } = {}) {
    return this.#enqueue(() => this.#request(path, { method, token, headers, body, retries, timeoutMs, expect: "text" }));
  }

  startNdjsonStream(
    path,
    { method = "GET", token, headers = {}, body = null, timeoutMs = 90000, onLine, onError, onClose } = {}
  ) {
    const target = new URL(path, this.baseUrl);
    const reqHeaders = {
      "User-Agent": this.userAgent,
      Accept: "application/x-ndjson",
      ...headers
    };
    if (token) {
      reqHeaders.Authorization = `Bearer ${token}`;
    }

    let buffer = "";
    let closed = false;
    const req = https.request(
      {
        protocol: target.protocol,
        hostname: target.hostname,
        port: target.port || (target.protocol === "https:" ? 443 : 80),
        path: `${target.pathname}${target.search}`,
        method,
        headers: reqHeaders,
        timeout: timeoutMs
      },
      (res) => {
        if (res.statusCode && res.statusCode >= 400) {
          const chunks = [];
          res.on("data", (d) => chunks.push(Buffer.from(d)));
          res.on("end", () => {
            const body = Buffer.concat(chunks).toString("utf8");
            if (onError) {
              onError(new Error(`Stream HTTP ${res.statusCode}: ${body.slice(0, 500)}`));
            }
          });
          return;
        }

        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          buffer += chunk;
          let idx = buffer.indexOf("\n");
          while (idx !== -1) {
            const line = buffer.slice(0, idx).trim();
            buffer = buffer.slice(idx + 1);
            if (line && onLine) {
              try {
                onLine(JSON.parse(line));
              } catch (_) {
                // ignore malformed line
              }
            }
            idx = buffer.indexOf("\n");
          }
        });

        res.on("end", () => {
          if (closed) return;
          closed = true;
          if (onClose) onClose();
        });
      }
    );

    req.on("timeout", () => {
      req.destroy(new Error("Stream timeout"));
    });

    req.on("error", (err) => {
      if (closed) return;
      closed = true;
      if (onError) onError(err);
    });

    if (body) {
      let payload = body;
      if (body instanceof URLSearchParams) {
        payload = body.toString();
      } else if (typeof body === "object" && !Buffer.isBuffer(body)) {
        payload = JSON.stringify(body);
      }
      req.end(payload);
    } else {
      req.end();
    }

    return {
      close: () => {
        if (closed) return;
        closed = true;
        req.destroy();
      }
    };
  }

  #enqueue(fn) {
    this.queue = this.queue.then(fn, fn);
    return this.queue;
  }

  async #request(path, opts) {
    const now = Date.now();
    const waitMs = this.minIntervalMs - (now - this.lastRequestAt);
    if (waitMs > 0) {
      await sleep(waitMs);
    }
    this.lastRequestAt = Date.now();

    const target = new URL(path, this.baseUrl);
    const method = opts.method || "GET";
    const headers = {
      "User-Agent": this.userAgent,
      Accept: opts.expect === "json" ? "application/json" : "*/*",
      ...opts.headers
    };
    if (opts.token) {
      headers.Authorization = `Bearer ${opts.token}`;
    }

    let body = opts.body;
    if (body && typeof body === "object" && !(body instanceof URLSearchParams) && !Buffer.isBuffer(body)) {
      body = JSON.stringify(body);
      headers["Content-Type"] = headers["Content-Type"] || "application/json";
    }

    const response = await fetch(target, {
      method,
      headers,
      body,
      signal: AbortSignal.timeout(opts.timeoutMs || 20000)
    });

    if (response.status === 429 && (opts.retries || 0) > 0) {
      const retryAfter = Number(response.headers.get("retry-after") || "1");
      const backoffMs = Math.max(500, retryAfter * 1000);
      await sleep(backoffMs + Math.floor(Math.random() * 250));
      return this.#request(path, { ...opts, retries: (opts.retries || 0) - 1 });
    }

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      const err = new Error(`HTTP ${response.status}: ${text.slice(0, 400)}`);
      err.status = response.status;
      throw err;
    }

    if (opts.expect === "json") {
      const text = await response.text();
      if (!text) return null;
      try {
        return JSON.parse(text);
      } catch (_) {
        return text;
      }
    }
    return response.text();
  }
}

module.exports = { LichessApi };
