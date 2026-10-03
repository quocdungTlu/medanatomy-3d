# knowledge/ — thu thập nguồn và cơ sở tri thức

Thư mục Python độc lập với app, tái sử dụng code từ hai repo của Quốc:

| Script | Tái sử dụng từ | Việc |
| --- | --- | --- |
| `src/collect_refs.py` | Day-10 `src/ingestion/crossref.py` | Tìm bài báo khoa học trên Crossref theo `queries.json` (69 truy vấn / 35 cấu trúc), xếp theo số trích dẫn, cache, polite pool |
| `src/build_sources.py` | — | Xác minh DOI đã chọn trong `selected.json`, ghi vào `content/sources.json` và `references` của cấu trúc |
| `src/ingest_docs.py` | Day08 `task3_convert_markdown.py`, `task4_chunking_indexing.py` | PDF/DOCX giáo trình → Markdown → chunk theo heading (cho cố vấn trích dẫn trang; nền cho AI trợ giảng sau MVP) |

```bash
cd knowledge
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

python -m src.collect_refs --mailto you@example.com   # ~70 request, ~2 phút
# xem data/candidates/*.json, chép DOI muốn dùng vào selected.json
python -m src.build_sources you@example.com
cd .. && npm run content:validate

# giáo trình: đặt PDF vào knowledge/data/landing/ rồi
python -m src.ingest_docs
```

## Nguyên tắc nguồn
- `license: open` (public domain, CC BY, CC BY-SA): được chuyển thể văn bản, phải ghi công. Hiện: Gray 1918, Wikipedia, Z-Anatomy.
- `license: cite` (NC/ND, bản quyền, bài báo): chỉ trích dẫn — viết lại bằng lời mình, dẫn nguồn. Hiện: TA2, OpenStax (CC BY-NC-SA), các bài báo.
- Giáo trình Việt Nam (Bộ Y tế, ĐH Y Hà Nội, ĐH Y Dược TP.HCM): bản quyền → chỉ ghi "sách, trang" trong cột `source`, không sao chép.
- Mỗi DOI phải xác minh qua Crossref trước khi vào `sources.json` (ngày 3/10 đã bắt được 1 DOI nhớ nhầm).

`data/` nằm trong .gitignore trừ `candidates/` để người duyệt xem được.
