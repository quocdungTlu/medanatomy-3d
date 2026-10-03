"""
Thu thập bài báo từ OpenAlex (miễn phí, không cần key) — bổ sung cho Crossref: có số trích dẫn,
trạng thái open access và concept y khoa để lọc. Cùng định dạng đầu ra với collect_refs
(data/candidates/<structure_id>.json) nên rank_refs.py gộp được hai nguồn.

    python -m src.collect_openalex --mailto you@example.com
"""
from __future__ import annotations

import argparse
import json
import re
import time
from pathlib import Path

import requests

API = "https://api.openalex.org/works"
ROOT = Path(__file__).resolve().parents[1]
QUERIES = ROOT / "queries.json"
OUT_DIR = ROOT / "data" / "openalex"
FIELDS = "id,doi,title,publication_year,cited_by_count,type,primary_location,authorships,open_access,abstract_inverted_index"


def abstract_of(inv: dict | None, limit: int = 1500) -> str:
    """OpenAlex trả abstract dạng inverted index → ghép lại thành văn bản."""
    if not inv:
        return ""
    words: list[tuple[int, str]] = [(p, w) for w, ps in inv.items() for p in ps]
    return " ".join(w for _, w in sorted(words))[:limit]


def parse(w: dict) -> dict | None:
    doi = re.sub(r"^https?://doi.org/", "", (w.get("doi") or "")).lower()
    if not doi or not w.get("title"):
        return None
    auths = [a.get("author", {}).get("display_name", "") for a in w.get("authorships") or []]
    src = ((w.get("primary_location") or {}).get("source") or {})
    return {
        "doi": doi, "title": w["title"], "journal": src.get("display_name") or "",
        "year": w.get("publication_year"), "authors": [a for a in auths if a],
        "cited_by": int(w.get("cited_by_count") or 0), "abstract": abstract_of(w.get("abstract_inverted_index")),
        "url": f"https://doi.org/{doi}", "type": w.get("type") or "",
        "oa_status": (w.get("open_access") or {}).get("oa_status", ""),
        "origin": "openalex",
    }


def search(q: str, mailto: str, per_page: int = 10, from_year: int = 1990) -> list[dict]:
    params = {
        "search": q,
        "filter": f"type:article,has_doi:true,has_abstract:true,from_publication_date:{from_year}-01-01",
        "sort": "relevance_score:desc", "per-page": per_page, "select": FIELDS, "mailto": mailto,
    }
    for attempt in range(5):
        r = requests.get(API, params=params, timeout=30)
        if r.status_code in (429, 503):
            time.sleep(2 ** attempt)
            continue
        r.raise_for_status()
        time.sleep(0.2)
        return [p for p in (parse(w) for w in r.json().get("results", [])) if p]
    raise RuntimeError("OpenAlex không phản hồi")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--mailto", required=True)
    ap.add_argument("--per-page", type=int, default=10)
    args = ap.parse_args()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for sid, qs in json.loads(QUERIES.read_text(encoding="utf-8")).items():
        seen: dict[str, dict] = {}
        for q in qs:
            print(f"[{sid}] {q}")
            for ref in search(q, args.mailto, args.per_page):
                if ref["doi"] not in seen or ref["cited_by"] > seen[ref["doi"]]["cited_by"]:
                    seen[ref["doi"]] = ref
        out = sorted(seen.values(), key=lambda r: r["cited_by"], reverse=True)
        (OUT_DIR / f"{sid}.json").write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"  → {len(out)} ứng viên")


if __name__ == "__main__":
    main()
