import { useState } from 'react'
import { useEscape } from '../lib/useEscape'
import { submitSurvey } from '../lib/survey'
import { groupsOrdered } from '../content'

const PRICES = ['Không trả', '19.000đ', '29.000đ', '49.000đ', '79.000đ+']
const SYSTEMS = ['Hệ xương', 'Hệ cơ', 'Hệ thần kinh', 'Hệ tiêu hóa', 'Hệ hô hấp', 'Hệ tiết niệu – sinh dục']

/** Khảo sát 3 câu, hiện một lần sau khi hoàn thành quiz thứ 3. */
export function Survey({ onClose }: { onClose: () => void }) {
  const [price, setPrice] = useState<string | null>(null)
  const [next, setNext] = useState<string | null>(null)
  const [year, setYear] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  useEscape(onClose)

  const submit = async () => {
    await submitSurvey({ price_per_month: price ?? '', next_system: next ?? '', year: year ?? '', current_system: groupsOrdered.length ? 'cardiovascular' : '' })
    setSent(true)
    setTimeout(onClose, 1500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl border border-line bg-panel p-5">
        {sent ? (
          <p className="py-6 text-center text-emerald-400">Cảm ơn bạn! Phản hồi giúp app tốt hơn.</p>
        ) : (
          <>
            <h2 className="text-lg font-semibold">3 câu hỏi nhanh</h2>
            <p className="mb-4 text-sm text-slate-400">Bạn đã làm 3 bài kiểm tra. Cho mình xin 20 giây ý kiến nhé.</p>

            <Q label="Bạn đang học năm mấy?">
              {['Y1', 'Y2', 'Y3', 'Y4+', 'Ngành khác'].map((o) => <Chip key={o} active={year === o} onClick={() => setYear(o)}>{o}</Chip>)}
            </Q>
            <Q label="Nếu app có đủ các hệ cơ quan, bạn sẵn sàng trả bao nhiêu mỗi tháng?">
              {PRICES.map((o) => <Chip key={o} active={price === o} onClick={() => setPrice(o)}>{o}</Chip>)}
            </Q>
            <Q label="Hệ cơ quan nào bạn muốn có tiếp theo?">
              {SYSTEMS.map((o) => <Chip key={o} active={next === o} onClick={() => setNext(o)}>{o}</Chip>)}
            </Q>

            <div className="mt-4 flex gap-2">
              <button className="btn-primary flex-1" onClick={submit} disabled={!price}>Gửi</button>
              <button className="btn-ghost" onClick={() => { void submitSurvey({ skipped: '1' }); onClose() }}>Để sau</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Q({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <p className="mb-1.5 text-sm font-medium">{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  )
}
function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} aria-pressed={active}
      className={`min-h-9 rounded-full border px-3 text-sm ${active ? 'border-sky-400 bg-sky-500/20 text-sky-100' : 'border-line bg-ink text-slate-300'}`}>
      {children}
    </button>
  )
}
