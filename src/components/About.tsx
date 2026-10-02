import { useState } from 'react'
import { content } from '../content'

/** Nút ⓘ mở hộp Giới thiệu: disclaimer y khoa và ghi công model (bắt buộc theo license). */
export function About() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button className="btn-icon btn-ghost" onClick={() => setOpen(true)} aria-label="Giới thiệu và nguồn mô hình" title="Giới thiệu">
        ⓘ
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center" onClick={() => setOpen(false)} role="dialog" aria-modal="true">
          <div className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-2xl border border-line bg-panel p-5 text-sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-2 text-lg font-semibold">MedAnatomy 3D</h2>
            <p className="mb-3 text-slate-300">
              Công cụ học giải phẫu cho sinh viên. Nội dung chỉ mang tính học tập, không thay thế giáo trình chính thức và không dùng để chẩn
              đoán hay điều trị.
            </p>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Nguồn mô hình 3D</p>
            <ul className="mb-3 space-y-1 text-slate-300">
              {content.modelAttribution.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
            <p className="mb-4 text-xs text-slate-500">
              Mô hình được chỉnh sửa và phân phối lại theo cùng license CC-BY-SA. Phiên bản nội dung {content.version}.
            </p>
            <button className="btn-primary w-full" onClick={() => setOpen(false)}>
              Đóng
            </button>
          </div>
        </div>
      )}
    </>
  )
}
