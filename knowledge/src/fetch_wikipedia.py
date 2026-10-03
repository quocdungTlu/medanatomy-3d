"""
Lấy phần mở đầu Wikipedia (CC BY-SA) cho từng cấu trúc kèm revision id để ghi công đúng phiên bản.
Chỉ làm TÀI LIỆU THAM KHẢO cho người soạn nội dung (viết lại bằng lời mình, ghi nguồn) — không chép nguyên văn vào app.

    python -m src.fetch_wikipedia
Kết quả: data/wikipedia/<structure_id>.json {title, revid, url, extract, fetched_at}
"""
from __future__ import annotations

import json
import time
from datetime import datetime, timezone
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT.parent / "content" / "cardiovascular.json"
OUT = ROOT / "data" / "wikipedia"
API = "https://en.wikipedia.org/w/api.php"


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for s in json.loads(CONTENT.read_text(encoding="utf-8"))["structures"]:
        title = s.get("nameEn") or s["nameLatin"]
        r = requests.get(API, params={
            "action": "query", "format": "json", "redirects": 1, "titles": title,
            "prop": "extracts|revisions", "exintro": 1, "explaintext": 1, "rvprop": "ids",
        }, headers={"User-Agent": "MedAnatomy3D/0.1 (lqdung1375@gmail.com)"}, timeout=30)
        r.raise_for_status()
        page = next(iter(r.json()["query"]["pages"].values()))
        if "missing" in page:
            print(f"✗ {s['id']}: không có trang '{title}'")
            continue
        rec = {
            "structure_id": s["id"], "title": page["title"], "revid": page["revisions"][0]["revid"],
            "url": f"https://en.wikipedia.org/wiki/{page['title'].replace(' ', '_')}",
            "extract": page.get("extract", ""), "license": "CC BY-SA 4.0",
            "fetched_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        }
        (OUT / f"{s['id']}.json").write_text(json.dumps(rec, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"✓ {s['id']} ← {page['title']} (rev {rec['revid']})")
        time.sleep(0.3)


if __name__ == "__main__":
    main()
