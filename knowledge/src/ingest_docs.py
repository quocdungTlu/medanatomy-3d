"""
Chuyển giáo trình / tài liệu (PDF, DOCX) thành Markdown và chunk theo tiêu đề để làm cơ sở tri thức.

Tái sử dụng cách làm từ repo Day08 (quocdungTlu/Day08_RAG_pipeline_cohort2_2A202600601,
src/task3_convert_markdown.py + task4_chunking_indexing.py): markitdown → Markdown, RecursiveCharacterTextSplitter
theo heading, bỏ phần embedding/Chroma (thêm sau MVP khi làm AI trợ giảng).

Dùng:
    # đặt file vào knowledge/data/landing/ (ví dụ giáo trình Giải phẫu – chương Tim, PDF)
    python -m src.ingest_docs
    # → knowledge/data/standardized/<ten>.md và knowledge/data/chunks/<ten>.jsonl

Lưu ý bản quyền: giáo trình thương mại chỉ dùng nội bộ để soạn/duyệt nội dung và trích dẫn trang; không đưa
nguyên văn vào app. Mỗi chunk giữ metadata {source, page_hint, heading} để cố vấn trích dẫn "sách X, tr. Y".
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LANDING = ROOT / "data" / "landing"
STANDARDIZED = ROOT / "data" / "standardized"
CHUNKS = ROOT / "data" / "chunks"
CHUNK_SIZE, CHUNK_OVERLAP = 900, 120


def to_markdown(path: Path) -> str:
    from markitdown import MarkItDown  # import muộn để script chạy được khi chỉ cần chunk lại

    md = MarkItDown().convert(str(path)).text_content
    md = md.replace("\r\n", "\n")
    md = re.sub(r"\n{3,}", "\n\n", md)
    return md.strip()


def split_by_headings(md: str) -> list[dict]:
    """Chia theo heading Markdown (#, ##, ###); giữ đường dẫn heading làm metadata."""
    sections: list[dict] = []
    stack: list[str] = []
    buf: list[str] = []
    cur_heading = ""

    def flush() -> None:
        text = "\n".join(buf).strip()
        if text:
            sections.append({"heading": " > ".join(stack) or cur_heading, "content": text})
        buf.clear()

    for line in md.splitlines():
        m = re.match(r"^(#{1,3})\s+(.*)", line)
        if m:
            flush()
            level = len(m.group(1))
            stack[:] = stack[: level - 1] + [m.group(2).strip()]
            cur_heading = m.group(2).strip()
        else:
            buf.append(line)
    flush()
    return sections


def chunk_sections(sections: list[dict], source: str) -> list[dict]:
    from langchain_text_splitters import RecursiveCharacterTextSplitter

    splitter = RecursiveCharacterTextSplitter(chunk_size=CHUNK_SIZE, chunk_overlap=CHUNK_OVERLAP, separators=["\n\n", "\n", ". ", " "])
    out: list[dict] = []
    for si, sec in enumerate(sections):
        for ci, part in enumerate(splitter.split_text(sec["content"])):
            page = re.search(r"(?:Trang|Page|tr\.)\s*(\d+)", part)
            out.append({
                "id": f"{source}#s{si}c{ci}",
                "content": part,
                "metadata": {"source": source, "heading": sec["heading"], "section_index": si, "chunk_index": ci, "page_hint": page.group(1) if page else None},
            })
    return out


def main() -> None:
    STANDARDIZED.mkdir(parents=True, exist_ok=True)
    CHUNKS.mkdir(parents=True, exist_ok=True)
    files = [p for p in LANDING.glob("*") if p.suffix.lower() in {".pdf", ".docx", ".md", ".txt"}]
    if not files:
        print(f"Không có file trong {LANDING}. Đặt PDF/DOCX vào đó rồi chạy lại.")
        return
    for f in files:
        md = f.read_text(encoding="utf-8") if f.suffix.lower() in {".md", ".txt"} else to_markdown(f)
        (STANDARDIZED / f"{f.stem}.md").write_text(md, encoding="utf-8")
        chunks = chunk_sections(split_by_headings(md), f.stem)
        with (CHUNKS / f"{f.stem}.jsonl").open("w", encoding="utf-8") as fh:
            for c in chunks:
                fh.write(json.dumps(c, ensure_ascii=False) + "\n")
        print(f"✓ {f.name}: {len(md):,} ký tự → {len(chunks)} chunk")


if __name__ == "__main__":
    main()
