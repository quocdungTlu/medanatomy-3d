import { useState } from 'react'
import { content, groupsOrdered } from '../content'
import { useAppStore } from '../store/useAppStore'
import { readHistory } from '../lib/localHistory'

/** Hộp chọn chủ đề và số câu trước khi bắt đầu Quiz. */
export function QuizSetup({ onClose }: { onClose: () => void }) {
  const [tags, setTags] = useState<string[]>([])
  const [count, setCount] = useState(10)
  const history = readHistory().slice(0, 5)

  const available = tags.length ? content.questions.filter((q) => q.tags.some((t) => tags.includes(t))) : content.questions
  const toggle = (id: string) => setTags((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]))
  const start = () => {
    useAppStore.getState().startQuiz({ count: Math.min(count, available.length), tags: tags.length ? tags : undefined })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center" onClick={onClose} role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl border border-line bg-panel p-5" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-3 text-lg font-semibold">Kiểm tra chạy trạm</h2>

        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Chủ đề</p>
        <div className="mb-4 flex flex-wrap gap-1.5">
          <Chip active={tags.length === 0} onClick={() => setTags([])}>Tất cả</Chip>
          {groupsOrdered.map((g) => (
            <Chip key={g.id} active={tags.includes(g.id)} onClick={() => toggle(g.id)}>
              {g.nameVi}
            </Chip>
          ))}
        </div>

        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Số câu</p>
        <div className="mb-4 flex gap-1.5">
          {[5, 10, 20].map((n) => (
            <Chip key={n} active={count === n} onClick={() => setCount(n)} disabled={n > available.length}>
              {n}
            </Chip>
          ))}
          <span className="self-center text-xs text-slate-500">có {available.length} câu</span>
        </div>

        {history.length > 0 && (
          <div className="mb-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Gần đây</p>
            <ul className="space-y-0.5 text-sm text-slate-300">
              {history.map((h, i) => (
                <li key={i} className="flex justify-between">
                  <span>{new Date(h.at).toLocaleDateString('vi-VN')} · {h.tags.length ? h.tags.map((t) => groupsOrdered.find((g) => g.id === t)?.nameVi ?? t).join(', ') : 'Tất cả'}</span>
                  <span className="font-medium text-sky-300">{h.correct}/{h.total}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-2">
          <button className="btn-primary flex-1" onClick={start} disabled={available.length === 0}>
            Bắt đầu
          </button>
          <button className="btn-ghost" onClick={onClose}>
            Hủy
          </button>
        </div>
      </div>
    </div>
  )
}

function Chip({ active, onClick, disabled, children }: { active: boolean; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`min-h-9 rounded-full border px-3 text-sm disabled:opacity-40 ${active ? 'border-sky-400 bg-sky-500/20 text-sky-100' : 'border-line bg-ink text-slate-300'}`}
    >
      {children}
    </button>
  )
}
