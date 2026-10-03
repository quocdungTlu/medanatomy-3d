"""
Thu thập tài liệu tham khảo cho từng cấu trúc giải phẫu từ Crossref (bài báo khoa học).

Tái sử dụng cách gọi API + parse từ repo Day-10 (quocdungTlu/2A202600601_Day-10-Data-Pipeline-Data-Observability,
src/ingestion/crossref.py), bỏ phần embedding/observability không cần ở đây.

Dùng:
    cd knowledge
    pip install -r requirements.txt
    python -m src.collect_refs --mailto you@example.com            # thu thập theo knowledge/queries.json
    python -m src.collect_refs --verify 10.1056/NEJM199809033391003  # xác minh 1 DOI

Kết quả: knowledge/data/candidates/<structure_id>.json (ứng viên để người duyệt chọn),
sau khi chọn thì chạy `python -m src.build_sources` để ghi vào content/sources.json.
"""
from __future__ import annotations

import argparse
import html
import json
import re
import time
from dataclasses import asdict, dataclass
from pathlib import Path

import requests

CROSSREF_API_URL = "https://api.crossref.org/works"
ROOT = Path(__file__).resolve().parents[1]
QUERIES = ROOT / "queries.json"
OUT_DIR = ROOT / "data" / "candidates"
CACHE_DIR = ROOT / "data" / "cache"


@dataclass(frozen=True)
class Ref:
    doi: str
    title: str
    journal: str
    year: int | None
    first_author: str
    authors: list[str]
    cited_by: int
    abstract: str
    url: str
    type: str


def _strip_html(text: str) -> str:
    cleaned = re.sub(r"<[^>]+>", "", text or "")
    return re.sub(r"\s+", " ", html.unescape(cleaned)).strip()


def _year(item: dict) -> int | None:
    for key in ("published-print", "published-online", "issued", "created"):
        parts = (item.get(key) or {}).get("date-parts") or [[]]
        if parts and parts[0]:
            return int(parts[0][0])
    return None


def parse_item(item: dict) -> Ref | None:
    doi = (item.get("DOI") or "").strip().lower()
    titles = item.get("title") or []
    if not doi or not titles:
        return None
    authors = []
    for a in item.get("author") or []:
        name = " ".join(filter(None, [a.get("given", ""), a.get("family", "")])).strip()
        if name:
            authors.append(name)
    first = (item.get("author") or [{}])[0].get("family", "") if item.get("author") else ""
    return Ref(
        doi=doi,
        title=_strip_html(titles[0]),
        journal=_strip_html((item.get("container-title") or [""])[0]),
        year=_year(item),
        first_author=first,
        authors=authors,
        cited_by=int(item.get("is-referenced-by-count") or 0),
        abstract=_strip_html(item.get("abstract", ""))[:1500],
        url=item.get("URL") or f"https://doi.org/{doi}",
        type=item.get("type", ""),
    )


def _get(url: str, params: dict, mailto: str) -> dict:
    """GET với polite pool (mailto), retry khi 429/503, cache theo URL+params."""
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    key = re.sub(r"[^a-zA-Z0-9]+", "_", url + json.dumps(params, sort_keys=True))[:180]
    cache = CACHE_DIR / f"{key}.json"
    if cache.exists():
        return json.loads(cache.read_text(encoding="utf-8"))
    headers = {"User-Agent": f"MedAnatomy3D-refs/0.1 (mailto:{mailto})"}
    for attempt in range(5):
        r = requests.get(url, params={**params, "mailto": mailto}, headers=headers, timeout=30)
        if r.status_code in (429, 503):
            wait = 2 ** attempt
            print(f"  rate-limited {r.status_code}, chờ {wait}s")
            time.sleep(wait)
            continue
        r.raise_for_status()
        payload = r.json()
        cache.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
        time.sleep(1.0)  # lịch sự với API
        return payload
    raise RuntimeError("Crossref không phản hồi sau 5 lần")


def search(query: str, mailto: str, rows: int = 10, from_year: int = 1990) -> list[Ref]:
    params = {
        "query.bibliographic": query,
        "filter": f"type:journal-article,from-pub-date:{from_year},has-abstract:true",
        "rows": rows,
        "select": "DOI,title,container-title,author,issued,published-print,published-online,created,is-referenced-by-count,abstract,URL,type",
        "sort": "relevance",
    }
    payload = _get(CROSSREF_API_URL, params, mailto)
    refs = [parse_item(i) for i in payload.get("message", {}).get("items", [])]
    return [r for r in refs if r]


def verify(doi: str, mailto: str) -> Ref | None:
    payload = _get(f"{CROSSREF_API_URL}/{doi}", {}, mailto)
    return parse_item(payload.get("message", {}))


def collect(mailto: str, rows: int) -> None:
    queries = json.loads(QUERIES.read_text(encoding="utf-8"))
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for structure_id, qs in queries.items():
        seen: dict[str, Ref] = {}
        for q in qs:
            print(f"[{structure_id}] {q}")
            for ref in search(q, mailto, rows=rows):
                if ref.doi not in seen or ref.cited_by > seen[ref.doi].cited_by:
                    seen[ref.doi] = ref
        ranked = sorted(seen.values(), key=lambda r: r.cited_by, reverse=True)
        out = OUT_DIR / f"{structure_id}.json"
        out.write_text(json.dumps([asdict(r) for r in ranked], ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"  → {len(ranked)} ứng viên → {out.relative_to(ROOT)}")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--mailto", required=True, help="Email cho Crossref polite pool")
    ap.add_argument("--rows", type=int, default=10)
    ap.add_argument("--verify", help="Xác minh một DOI và in metadata")
    args = ap.parse_args()
    if args.verify:
        ref = verify(args.verify, args.mailto)
        print(json.dumps(asdict(ref) if ref else None, ensure_ascii=False, indent=2))
        return
    collect(args.mailto, args.rows)


if __name__ == "__main__":
    main()
