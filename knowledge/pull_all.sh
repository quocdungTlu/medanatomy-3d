#!/usr/bin/env bash
# Chạy toàn bộ Phase 1 trên máy có internet đầy đủ: bash pull_all.sh you@example.com
set -euo pipefail
MAIL="${1:?cần email cho polite pool}"
cd "$(dirname "$0")"
python -m src.collect_refs --mailto "$MAIL"
python -m src.collect_openalex --mailto "$MAIL"
python -m src.fetch_wikipedia
python -m src.rank_refs --top 3
echo "Xong. Mở data/shortlist.md, chọn DOI vào selected.json rồi: python -m src.build_sources $MAIL"
