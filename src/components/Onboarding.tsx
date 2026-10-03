import { useState } from 'react'
import { setOnboarded } from '../lib/localHistory'
import { track } from '../lib/analytics'

const STEPS = [
  { title: 'Xoay và phóng to', body: 'Kéo một ngón để xoay, hai ngón để phóng to. Trên máy tính dùng chuột và con lăn.' },
  { title: 'Chạm để xem thông tin', body: 'Chạm vào bất kỳ cấu trúc nào để xem tên Việt, Latin, chức năng và liên hệ lâm sàng. Hoặc mở danh sách ☰ để tìm theo tên.' },
  { title: 'Luyện thi chạy trạm', body: 'Bấm "Bắt đầu kiểm tra": app yêu cầu bạn chạm đúng cấu trúc hoặc chọn tên của phần được tô sáng. Dùng Xuyên thấu để thấy van tim bên trong.' },
]

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0)
  const finish = () => {
    setOnboarded()
    track('onboarding_done', { steps: i + 1 })
    onDone()
  }
  const s = STEPS[i]
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-panel p-5">
        <div className="mb-3 flex gap-1">
          {STEPS.map((_, k) => <span key={k} className={`h-1 flex-1 rounded ${k <= i ? 'bg-sky-400' : 'bg-slate-700'}`} />)}
        </div>
        <h2 className="text-lg font-semibold">{s.title}</h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-300">{s.body}</p>
        <div className="mt-4 flex gap-2">
          {i < STEPS.length - 1 ? (
            <>
              <button className="btn-primary flex-1" onClick={() => setI(i + 1)}>Tiếp</button>
              <button className="btn-ghost" onClick={finish}>Bỏ qua</button>
            </>
          ) : (
            <button className="btn-primary flex-1" onClick={finish}>Bắt đầu học</button>
          )}
        </div>
      </div>
    </div>
  )
}
