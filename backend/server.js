const crypto = require("crypto");
const express = require("express");
const fs = require("fs");
const path = require("path");

function loadDotEnvIfPresent() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, "utf8");
  const lines = raw.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!key || Object.prototype.hasOwnProperty.call(process.env, key)) continue;
    process.env[key] = val;
  }
}

loadDotEnvIfPresent();

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "127.0.0.1";
const PUBLIC_BASE_URL = (process.env.PUBLIC_BASE_URL || `http://${HOST}:${PORT}`).replace(/\/+$/, "");
const LICHESS_CLIENT_ID = String(process.env.LICHESS_CLIENT_ID || "").trim();
const LICHESS_CLIENT_SECRET = String(process.env.LICHESS_CLIENT_SECRET || "").trim();
const LICHESS_SCOPES = String(
  process.env.LICHESS_SCOPES || "board:play challenge:read challenge:write preference:read"
)
  .trim()
  .replace(/\s+/g, " ");

const stateStore = new Map();
const STATE_TTL_MS = 10 * 60 * 1000;

function cleanupExpiredState() {
  const now = Date.now();
  for (const [key, value] of stateStore.entries()) {
    if (!value || now - value.createdAt > STATE_TTL_MS) {
      stateStore.delete(key);
    }
  }
}

function randomBase64Url(bytes = 32) {
  return crypto
    .randomBytes(bytes)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function makeCodeChallenge(verifier) {
  return crypto
    .createHash("sha256")
    .update(verifier)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function htmlEscape(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function callbackPage({ success, title, details, token, account }) {
  const tokenSafe = htmlEscape(token);
  const detailsSafe = htmlEscape(details);
  const titleSafe = htmlEscape(title);
  const user = account?.username ? htmlEscape(account.username) : "";
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${titleSafe}</title>
  <style>
    body { margin: 0; font-family: Segoe UI, Arial, sans-serif; background: #161512; color: #e3e3e3; }
    .wrap { max-width: 860px; margin: 28px auto; padding: 0 16px; }
    .card { border: 1px solid #4a443c; background: #2b2825; padding: 16px; border-radius: 8px; }
    h1 { margin: 0 0 12px; font-size: 22px; }
    .ok { color: #9ad789; }
    .err { color: #e39c9c; }
    .muted { color: #b5b5b5; font-size: 14px; }
    textarea { width: 100%; min-height: 110px; background: #1f1d1b; color: #ddd; border: 1px solid #4a443c; border-radius: 6px; padding: 8px; }
    button { margin-top: 8px; padding: 8px 12px; border: 1px solid #4a443c; background: #35322e; color: #ddd; border-radius: 6px; cursor: pointer; }
    code { background: #1f1d1b; border: 1px solid #4a443c; border-radius: 4px; padding: 2px 6px; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <h1 class="${success ? "ok" : "err"}">${titleSafe}</h1>
      ${user ? `<p>Connected account: <strong>${user}</strong></p>` : ""}
      <p class="muted">${detailsSafe}</p>
      ${
        success
          ? `<p>Copy this token and paste it in app <strong>Online Mode -> Access token</strong> then click <strong>Connect Token</strong>.</p>
             <textarea id="token" readonly>${tokenSafe}</textarea>
             <button id="copy-btn" type="button">Copy token</button>
             <script>
               document.getElementById("copy-btn").addEventListener("click", async () => {
                 const el = document.getElementById("token");
                 el.select();
                 try { await navigator.clipboard.writeText(el.value); } catch (_) { document.execCommand("copy"); }
               });
             </script>`
          : ""
      }
      <p class="muted">Backend: <code>${htmlEscape(PUBLIC_BASE_URL)}</code></p>
    </div>
  </div>
</body>
</html>`;
}

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "offline-lichess-backend",
    now: Date.now(),
    baseUrl: PUBLIC_BASE_URL
  });
});

app.get("/oauth/lichess/start", (req, res) => {
  cleanupExpiredState();
  if (!LICHESS_CLIENT_ID) {
    res.status(500).send(
      callbackPage({
        success: false,
        title: "Missing LICHESS_CLIENT_ID",
        details: "Set LICHESS_CLIENT_ID in backend environment before login."
      })
    );
    return;
  }

  const state = randomBase64Url(24);
  const verifier = randomBase64Url(48);
  const challenge = makeCodeChallenge(verifier);
  stateStore.set(state, { verifier, createdAt: Date.now() });

  const redirectUri = `${PUBLIC_BASE_URL}/oauth/lichess/callback`;
  const params = new URLSearchParams({
    response_type: "code",
    client_id: LICHESS_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: LICHESS_SCOPES,
    code_challenge_method: "S256",
    code_challenge: challenge,
    state
  });

  const fromApp = String(req.query.app || "").trim();
  if (fromApp) {
    params.set("state", `${state}.${fromApp}`);
  }
  res.redirect(`https://lichess.org/oauth?${params.toString()}`);
});

app.get("/oauth/lichess/callback", async (req, res) => {
  try {
    cleanupExpiredState();
    const code = String(req.query.code || "").trim();
    const rawState = String(req.query.state || "").trim();
    const state = rawState.includes(".") ? rawState.split(".")[0] : rawState;
    if (!code || !state) {
      res
        .status(400)
        .send(
          callbackPage({
            success: false,
            title: "OAuth callback missing code/state",
            details: "Lichess did not return required query values."
          })
        );
      return;
    }

    const stored = stateStore.get(state);
    stateStore.delete(state);
    if (!stored?.verifier) {
      res
        .status(400)
        .send(
          callbackPage({
            success: false,
            title: "Invalid or expired OAuth state",
            details: "Please start login again from the app."
          })
        );
      return;
    }

    const redirectUri = `${PUBLIC_BASE_URL}/oauth/lichess/callback`;
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: LICHESS_CLIENT_ID,
      code_verifier: stored.verifier
    });
    if (LICHESS_CLIENT_SECRET) {
      body.set("client_secret", LICHESS_CLIENT_SECRET);
    }

    const tokenRes = await fetch("https://lichess.org/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body
    });
    const tokenJson = await tokenRes.json().catch(() => ({}));
    if (!tokenRes.ok || !tokenJson?.access_token) {
      res
        .status(400)
        .send(
          callbackPage({
            success: false,
            title: "Token exchange failed",
            details: `HTTP ${tokenRes.status}: ${JSON.stringify(tokenJson).slice(0, 700)}`
          })
        );
      return;
    }

    const accessToken = String(tokenJson.access_token);
    const accountRes = await fetch("https://lichess.org/api/account", {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" }
    });
    const account = await accountRes.json().catch(() => null);

    res.send(
      callbackPage({
        success: true,
        title: "Lichess connected",
        details: "Token generated successfully.",
        token: accessToken,
        account
      })
    );
  } catch (err) {
    res
      .status(500)
      .send(
        callbackPage({
          success: false,
          title: "OAuth callback error",
          details: String(err?.message || err)
        })
      );
  }
});

app.listen(PORT, HOST, () => {
  console.log(`[offline-lichess-backend] listening on ${PUBLIC_BASE_URL}`);
  console.log(`[offline-lichess-backend] health: ${PUBLIC_BASE_URL}/health`);
  console.log(
    `[offline-lichess-backend] oauth start: ${PUBLIC_BASE_URL}/oauth/lichess/start`
  );
});
