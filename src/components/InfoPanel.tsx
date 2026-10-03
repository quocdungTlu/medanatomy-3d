import { useEffect, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { isReviewed, structuresById } from '../content'
import { reportContent, supabase } from '../lib/supabase'
import { track } from '../lib/analytics'
import { markViewed } from '../lib/progress'
import { useEscape } from '../lib/useEscape'

/** Bảng thông tin cấu trúc đang chọn. Mobile: bottom sheet; desktop: panel phải. */
export function InfoPanel() {
  const selectedId = useAppStore((s) => s.selectedId)
  const open = useAppStore((s) => s.infoOpen)
  const isolatedId = useAppStore((s) => s.isolatedId)
  const s = selectedId ? structuresById[selectedId] : undefined
  useEffect(() => { if (open && selectedId) markViewed(selectedId) }, [open, selectedId])
  useEscape(() => { if (useAppStore.getState().infoOpen) useAppStore.getState().select(null) })
  if (!open || !s) return null
  const { select, isolate } = useAppStore.getState()

  return (
    <aside
      className="absolute inset-x-0 bottom-0 z-30 max-h-[50%] overflow-y-auto rounded-t-2xl border-t border-line bg-panel/95 p-4 backdrop-blur safe-bottom sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-96 sm:rounded-none sm:border-l sm:border-t-0"
      aria-label="Thông tin cấu trúc"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold leading-tight">{s.nameVi}</h2>
          <p className="text-sm italic text-slate-400">{s.nameLatin}</p>
          {s.nameEn && <p className="text-xs text-slate-500">{s.nameEn}</p>}
        </div>
        <button className="btn-icon btn-ghost" onClick={() => select(null)} aria-label="Đóng">
          ✕
        </button>
      </div>

      {!isReviewed(s) && (
        <p className="mb-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          Nội dung nháp, chưa qua cố vấn chuyên môn duyệt.
        </p>
      )}

      {s.imageUrl && <img src={s.imageUrl} alt={s.nameVi} className="mb-3 w-full rounded-lg" loading="lazy" />}

      <Section title="Giải phẫu">{s.description}</Section>
      <Section title="Chức năng">{s.function}</Section>
      {s.clinical && <Section title="Liên hệ lâm sàng">{s.clinical}</Section>}
      {s.mnemonic && <Section title="Mẹo nhớ">{s.mnemonic}</Section>}
      {s.source && <p className="mt-2 text-xs text-slate-500">Nguồn: {s.source}</p>}
      {s.reviewedBy && (
        <p className="text-xs text-slate-500">
          Duyệt bởi {s.reviewedBy} · {s.reviewedAt}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button className="btn-ghost" onClick={() => isolate(isolatedId === s.id ? null : s.id)}>
          {isolatedId === s.id ? 'Hiện tất cả' : 'Chỉ hiện phần này'}
        </button>
        <ReportButton structureId={s.id} />
      </div>
    </aside>
  )
}

function Section({ title, children }: { title: string; children: string }) {
  return (
    <section className="mb-3">
      <h3 className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      <p className="text-sm leading-relaxed text-slate-200">{children}</p>
    </section>
  )
}

function ReportButton({ structureId }: { structureId: string }) {
  const [state, setState] = useState<'idle' | 'open' | 'sent' | 'fail'>('idle')
  const [msg, setMsg] = useState('')

  if (state === 'sent') return <span className="self-center text-xs text-emerald-400">Cảm ơn bạn đã báo!</span>
  if (state === 'open' || state === 'fail') {
    return (
      <form
        className="flex w-full flex-col gap-2"
        onSubmit={async (e) => {
          e.preventDefault()
          track('content_report', { structureId })
          const ok = await reportContent(structureId, msg.trim())
          setState(ok ? 'sent' : 'fail')
        }}
      >
        <textarea
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          required
          minLength={5}
          rows={3}
          placeholder="Chỗ nào sai hoặc cần sửa?"
          className="rounded-xl border border-line bg-ink p-2 text-sm outline-none focus:border-sky-400"
        />
        {state === 'fail' && (
          <p className="text-xs text-rose-400">
            {supabase ? 'Gửi không thành công, thử lại sau.' : 'Chưa cấu hình máy chủ, hãy gửi góp ý qua email.'}
          </p>
        )}
        <div className="flex gap-2">
          <button type="submit" className="btn-primary">
            Gửi
          </button>
          <button type="button" className="btn-ghost" onClick={() => setState('idle')}>
            Hủy
          </button>
        </div>
      </form>
    )
  }
  return (
    <button className="btn-ghost" onClick={() => setState('open')}>
      Báo sai
    </button>
  )
}
