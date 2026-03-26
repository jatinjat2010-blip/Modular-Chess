import argparse
import csv
import io
import json
from pathlib import Path
from urllib.request import urlopen

try:
    import zstandard as zstd
except Exception as exc:
    raise SystemExit(
        "Missing Python package 'zstandard'. Install it with: python -m pip install zstandard"
    ) from exc


SOURCE_URL = "https://database.lichess.org/lichess_db_puzzle.csv.zst"


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True)
    parser.add_argument("--limit", type=int, default=1000)
    return parser.parse_args()


def build_pack(limit: int):
    request = urlopen(SOURCE_URL)
    dctx = zstd.ZstdDecompressor()
    reader = dctx.stream_reader(request)
    text_stream = io.TextIOWrapper(reader, encoding="utf-8", newline="")
    csv_reader = csv.DictReader(text_stream)

    puzzles = []
    for row in csv_reader:
        if len(puzzles) >= limit:
            break
        moves = [token.strip() for token in str(row.get("Moves", "")).split() if token.strip()]
        if not moves:
            continue
        puzzles.append(
            {
                "id": str(row.get("PuzzleId", "")).strip(),
                "fen": str(row.get("FEN", "")).strip(),
                "moves": moves,
                "rating": int(float(row.get("Rating", 0) or 0)),
                "ratingDeviation": int(float(row.get("RatingDeviation", 0) or 0)),
                "popularity": int(float(row.get("Popularity", 0) or 0)),
                "plays": int(float(row.get("NbPlays", 0) or 0)),
                "themes": [token for token in str(row.get("Themes", "")).split() if token],
                "openingTags": [token for token in str(row.get("OpeningTags", "")).split() if token],
                "gameUrl": str(row.get("GameUrl", "")).strip(),
            }
        )

    return {
        "meta": {
            "source": SOURCE_URL,
            "label": f"Lichess local pack ({len(puzzles)})",
            "count": len(puzzles),
        },
        "puzzles": puzzles,
    }


def main():
    args = parse_args()
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    payload = build_pack(max(1, int(args.limit)))
    output_path.write_text(json.dumps(payload, ensure_ascii=True), encoding="utf-8")
    print(f"Wrote {payload['meta']['count']} puzzles to {output_path}")


if __name__ == "__main__":
    main()
