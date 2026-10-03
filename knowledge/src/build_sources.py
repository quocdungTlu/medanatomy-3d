"""
Gộp ứng viên đã chọn vào content/sources.json và gắn references cho cấu trúc.

Quy trình: sau `collect_refs`, mở knowledge/data/candidates/<id>.json, chép DOI muốn dùng vào
knowledge/selected.json dạng {"<structure_id>": ["10.xxxx/...", ...]}. Chạy script này: mỗi DOI được
xác minh lại qua Crossref, thêm vào sources.json (id = <first_author><year><slug>) và nối vào references.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

from .collect_refs import verify

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parent
SELECTED = ROOT / "selected.json"
SOURCES = REPO / "content" / "sources.json"
CONTENT = REPO / "content" / "cardiovascular.json"


def slug(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", s.lower())[:12]


def main(mailto: str = "lqdung1375@gmail.com") -> None:
    selected = json.loads(SELECTED.read_text(encoding="utf-8"))
    sources = json.loads(SOURCES.read_text(encoding="utf-8"))
    content = json.loads(CONTENT.read_text(encoding="utf-8"))
    by_doi = {s["doi"].lower(): s["id"] for s in sources["sources"] if s.get("doi")}
    by_struct = {s["id"]: s for s in content["structures"]}
    for sid, dois in selected.items():
        for doi in dois:
            doi = doi.lower()
            if doi not in by_doi:
                ref = verify(doi, mailto)
                if not ref:
                    print("✗ không xác minh được", doi); continue
                rid = f"{slug(ref.first_author)}{ref.year or ''}{slug(ref.title)[:8]}"
                sources["sources"].append({
                    "id": rid, "kind": "article", "title": ref.title, "authors": ref.authors[:3] + (["et al."] if len(ref.authors) > 3 else []),
                    "journal": ref.journal, "year": ref.year, "doi": ref.doi, "url": f"https://doi.org/{ref.doi}", "license": "cite", "citedBy": ref.cited_by,
                })
                by_doi[doi] = rid
                print("+", rid, "|", ref.title)
            refs = by_struct[sid].setdefault("references", [])
            if by_doi[doi] not in refs:
                refs.append(by_doi[doi])
    SOURCES.write_text(json.dumps(sources, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    CONTENT.write_text(json.dumps(content, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("✓ đã ghi sources.json và cardiovascular.json — chạy `npm run content:validate`")


if __name__ == "__main__":
    import sys
    main(*(sys.argv[1:2]))
