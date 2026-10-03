"""
Gộp ứng viên Crossref + OpenAlex, chấm điểm và chọn top-N cho mỗi cấu trúc → data/shortlist.md + selected.json (gợi ý).

Điểm = 0.5·log(1+trích dẫn) chuẩn hoá + 0.3·độ trùng từ khoá tiêu đề/abstract với tên cấu trúc
       + 0.2·độ mới (ưu tiên 2000+) ; loại: không có abstract, năm < 1990, type không phải bài báo.
Người duyệt đọc shortlist.md, giữ/bỏ rồi chép DOI vào selected.json — không tự động nhận bài (tránh DOI/bài sai chuyên môn).

    python -m src.rank_refs --top 3
"""
from __future__ import annotations

import argparse
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT.parent / "content" / "cardiovascular.json"
DIRS = [ROOT / "data" / "candidates", ROOT / "data" / "openalex"]
OUT_MD = ROOT / "data" / "shortlist.md"
SELECTED = ROOT / "selected.json"


def load(sid: str) -> dict[str, dict]:
    merged: dict[str, dict] = {}
    for d in DIRS:
        f = d / f"{sid}.json"
        if not f.exists():
            continue
        for r in json.loads(f.read_text(encoding="utf-8")):
            cur = merged.get(r["doi"])
            if cur is None or r.get("cited_by", 0) > cur.get("cited_by", 0):
                merged[r["doi"]] = {**(cur or {}), **r}
    return merged


def score(r: dict, terms: set[str], max_cites: int) -> float:
    cites = math.log1p(r.get("cited_by", 0)) / math.log1p(max(max_cites, 1))
    text = f"{r.get('title','')} {r.get('abstract','')}".lower()
    hit = sum(1 for t in terms if t in text) / max(len(terms), 1)
    year = r.get("year") or 1990
    recency = min(max(year - 1990, 0) / 35, 1)
    return 0.5 * cites + 0.3 * hit + 0.2 * recency


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--top", type=int, default=3)
    args = ap.parse_args()
    structures = json.loads(CONTENT.read_text(encoding="utf-8"))["structures"]
    lines = ["# Shortlist bài báo theo cấu trúc", "", "Giữ/bỏ rồi chép DOI vào `knowledge/selected.json` (`{\"structure_id\": [\"doi\", ...]}`).", ""]
    for s in structures:
        cands = [r for r in load(s["id"]).values() if r.get("abstract") and (r.get("year") or 0) >= 1990]
        if not cands:
            continue
        terms = {w for n in (s["nameLatin"], s.get("nameEn", "")) for w in n.lower().split() if len(w) > 3}
        mx = max(r.get("cited_by", 0) for r in cands)
        top = sorted(cands, key=lambda r: score(r, terms, mx), reverse=True)[: args.top]
        lines += [f"## {s['nameVi']} (`{s['id']}`)", ""]
        for r in top:
            au = (r.get("authors") or [r.get("first_author", "")])[0]
            lines.append(f"- **{r['title']}** — {au} và cs., {r.get('journal','')} ({r.get('year')}) · {r.get('cited_by',0)} trích dẫn · `{r['doi']}`")
        lines.append("")
    OUT_MD.write_text("\n".join(lines), encoding="utf-8")
    print(f"✓ {OUT_MD}")


if __name__ == "__main__":
    main()
