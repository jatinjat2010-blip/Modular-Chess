import base64
import importlib.util
import json
import os
import re
import subprocess
import sys
import sysconfig
import tempfile
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
VENDORED_CHESSCOG_ROOT = BASE_DIR / "vendor" / "chesscog"

if VENDORED_CHESSCOG_ROOT.exists():
    sys.path.insert(0, str(VENDORED_CHESSCOG_ROOT))

PIECE_TOKENS = set([".", "K", "Q", "R", "B", "N", "P", "k", "q", "r", "b", "n", "p"])


def respond(request_id, **payload):
    data = {"id": request_id, **payload}
    sys.stdout.write(json.dumps(data) + "\n")
    sys.stdout.flush()


def chesscog_installed():
    if importlib.util.find_spec("chesscog") is None:
        return False
    try:
        __import__("chesscog")
        return True
    except Exception:
        return False


def python_supported():
    major = sys.version_info.major
    minor = sys.version_info.minor
    return major == 3 and 8 <= minor < 11


def backend_status():
    installed = chesscog_installed()
    supported = python_supported()
    message = "Vision backend ready."
    if not supported:
        message = "chesscog requires Python 3.8, 3.9, or 3.10. Current Python is unsupported."
    elif not installed:
        message = "Install chesscog in this Python environment."
    return {
        "ok": True,
        "running": True,
        "python": sys.executable,
        "pythonVersion": sys.version.split()[0],
        "pythonSupported": supported,
        "chesscogInstalled": installed,
        "usingVendoredChesscog": VENDORED_CHESSCOG_ROOT.exists(),
        "ready": supported and installed,
        "message": message
    }


def site_packages_dir():
    purelib = sysconfig.get_paths().get("purelib")
    if purelib:
        return Path(purelib)
    return Path(sys.prefix) / "Lib" / "site-packages"


def runtime_env():
    env = os.environ.copy()
    existing_pythonpath = env.get("PYTHONPATH", "")
    pythonpath_parts = [str(VENDORED_CHESSCOG_ROOT)]
    if existing_pythonpath:
        pythonpath_parts.append(existing_pythonpath)
    env["PYTHONPATH"] = os.pathsep.join(pythonpath_parts)
    env["CONFIG_DIR"] = str(VENDORED_CHESSCOG_ROOT / "config")
    env["RUNS_DIR"] = str(VENDORED_CHESSCOG_ROOT / "runs")
    env["RESULTS_DIR"] = str(VENDORED_CHESSCOG_ROOT / "results")
    env["DATA_DIR"] = str(VENDORED_CHESSCOG_ROOT / "data")
    env["MODELS_DIR"] = str(site_packages_dir() / "models")
    return env


def board_lines_from_output(text):
    lines = []
    for raw in str(text or "").splitlines():
      line = raw.strip()
      if not line:
          continue
      parts = line.split()
      if len(parts) != 8:
          continue
      if all(token in PIECE_TOKENS for token in parts):
          lines.append(parts)
    return lines[-8:] if len(lines) >= 8 else []


def board_to_fen(board_lines):
    rows = []
    for row in board_lines:
        empty = 0
        out = []
        for token in row:
            if token == ".":
                empty += 1
            else:
                if empty:
                    out.append(str(empty))
                    empty = 0
                out.append(token)
        if empty:
            out.append(str(empty))
        rows.append("".join(out))
    return "/".join(rows)


def write_temp_data_url(data_url):
    match = re.match(r"^data:image/([a-zA-Z0-9.+-]+);base64,(.+)$", str(data_url or ""), re.DOTALL)
    if not match:
        raise RuntimeError("Invalid image data.")
    ext = match.group(1).lower().replace("jpeg", "jpg")
    blob = base64.b64decode(match.group(2))
    fd, path = tempfile.mkstemp(prefix="offline_chess_vision_", suffix=f".{ext}")
    with os.fdopen(fd, "wb") as handle:
        handle.write(blob)
    return path


def run_chesscog(image_path, white_bottom=True):
    if not python_supported():
        raise RuntimeError("chesscog requires Python 3.8, 3.9, or 3.10.")
    if not chesscog_installed():
        raise RuntimeError("chesscog is not installed in the selected Python environment.")
    image = Path(str(image_path or "")).expanduser()
    if not image.exists():
        raise RuntimeError("Image file not found.")
    cmd = [sys.executable, "-m", "chesscog.recognition.recognition", str(image)]
    if white_bottom:
        cmd.append("--white")
    proc = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        timeout=120,
        check=False,
        cwd=str(VENDORED_CHESSCOG_ROOT),
        env=runtime_env()
    )
    stdout = proc.stdout or ""
    stderr = proc.stderr or ""
    board_lines = board_lines_from_output(stdout)
    if proc.returncode != 0 and not board_lines:
        err_text = (stderr or stdout or "chesscog failed.").strip()
        if "Input contains NaN, infinity" in err_text or "detect_corners.py" in err_text:
            raise RuntimeError(
                "Board localization failed. This model expects a photographed over-the-board position and may fail on flat digital screenshots or boards without clear camera perspective."
            )
        raise RuntimeError(err_text)
    if not board_lines:
        raise RuntimeError("Could not parse a board position from chesscog output.")
    return {
        "fenPlacement": board_to_fen(board_lines),
        "confidence": None,
        "warnings": [] if proc.returncode == 0 else ["chesscog returned a non-zero status but board output was parsed."]
    }


def handle_recognize(payload):
    temp_path = None
    try:
        image_path = payload.get("imagePath")
        if not image_path:
            data_url = payload.get("imageDataUrl")
            if data_url:
                temp_path = write_temp_data_url(data_url)
                image_path = temp_path
        if not image_path:
            raise RuntimeError("Missing image input.")
        white_bottom = bool(payload.get("whiteBottom", True))
        res = run_chesscog(image_path, white_bottom=white_bottom)
        return {
            "ok": True,
            "fenPlacement": res["fenPlacement"],
            "sideToMove": "w",
            "castling": "-",
            "ep": "-",
            "halfmove": 0,
            "fullmove": 1,
            "confidence": res.get("confidence"),
            "warnings": res.get("warnings", [])
        }
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
            except OSError:
                pass


def main():
    for raw in sys.stdin:
        line = str(raw or "").strip()
        if not line:
            continue
        req = {}
        req_id = None
        try:
            req = json.loads(line)
            req_id = req.get("id")
            cmd = req.get("cmd")
            payload = req.get("payload") or {}
            if cmd == "status":
                respond(req_id, **backend_status())
            elif cmd == "recognize":
                respond(req_id, **handle_recognize(payload))
            elif cmd == "stop":
                respond(req_id, ok=True, running=False)
                break
            else:
                respond(req_id, ok=False, error=f"Unknown command: {cmd}")
        except Exception as err:
            respond(req_id, ok=False, error=str(err))


if __name__ == "__main__":
    main()
