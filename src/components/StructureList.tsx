import { useEffect, useMemo, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { content, groupsOrdered, isReviewed, searchStructures } from '../content'
import { readViewed, subscribeViewed } from '../lib/progress'

/** Danh sách cấu trúc theo nhóm, tìm kiếm không dấu. Desktop: cột trái; mobile: bottom sheet. */
export function StructureList() {
  const open = useAppStore((s) => s.listOpen)
  const selectedId = useAppStore((s) => s.selectedId)
  const isolatedId = useAppStore((s) => s.isolatedId)
  const [q, setQ] = useState('')
  const [viewed, setViewed] = useState(() => readViewed())
  useEffect(() => subscribeViewed(() => setViewed(readViewed())), [])

  const results = useMemo(() => searchStructures(q), [q])
  const grouped = useMemo(
    () => groupsOrdered.map((g) => ({ group: g, items: results.filter((s) => s.group === g.id) })).filter((x) => x.items.length),
    [results],
  )

  if (!open) return null
  const { select, setListOpen, isolate } = useAppStore.getState()

  return (
    <aside
      className="absolute inset-x-0 bottom-0 z-30 flex max-h-[70%] flex-col rounded-t-2xl border-t border-line bg-panel/95 backdrop-blur sm:inset-y-0 sm:left-0 sm:right-auto sm:max-h-none sm:w-80 sm:rounded-none sm:border-r sm:border-t-0"
      aria-label="Danh sách cấu trúc"
    >
      <div className="flex items-center gap-2 p-3">
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm: van hai lá, aorta…"
          className="min-h-11 flex-1 rounded-xl border border-line bg-ink px-3 text-sm outline-none focus:border-sky-400"
          aria-label="Tìm cấu trúc"
        />
        <button className="btn-icon btn-ghost" onClick={() => setListOpen(false)} aria-label="Đóng">
          ✕
        </button>
      </div>
      <div className="px-3 pb-2">
        <div className="mb-1 flex justify-between text-[11px] text-slate-500">
          <span>Đã xem {viewed.size}/{content.structures.length} cấu trúc</span>
          <span>{Math.round((viewed.size / content.structures.length) * 100)}%</span>
        </div>
        <div className="h-1 overflow-hidden rounded bg-slate-800"><div className="h-full bg-emerald-400" style={{ width: `${(viewed.size / content.structures.length) * 100}%` }} /></div>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-4 safe-bottom">
        {grouped.length === 0 && <p className="px-2 py-6 text-center text-sm text-slate-500">Không tìm thấy</p>}
        {grouped.map(({ group, items }) => (
          <section key={group.id} className="mb-3">
            <h3 className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{group.nameVi}</h3>
            <ul>
              {items.map((s) => {
                const active = s.id === selectedId
                return (
                  <li key={s.id} className="flex items-center">
                    <button
                      onClick={() => {
                        select(s.id)
                        if (window.innerWidth < 640) setListOpen(false)
                      }}
                      className={`flex min-h-11 flex-1 flex-col items-start rounded-lg px-2 py-1.5 text-left hover:bg-slate-800 ${active ? 'bg-sky-500/15 text-sky-200' : ''}`}
                      aria-current={active ? 'true' : undefined}
                    >
                      <span className="text-sm">
                        {viewed.has(s.id) && <span className="mr-1 text-emerald-400" aria-label="Đã xem">✓</span>}
                        {s.nameVi}
                        {!isReviewed(s) && <span className="ml-1.5 text-[10px] text-amber-400">nháp</span>}
                      </span>
                      <span className="text-xs italic text-slate-500">{s.nameLatin}</span>
                    </button>
                    <button
                      onClick={() => isolate(isolatedId === s.id ? null : s.id)}
                      className={`btn-icon min-h-9 min-w-9 text-xs ${isolatedId === s.id ? 'text-sky-300' : 'text-slate-500'}`}
                      aria-label={isolatedId === s.id ? 'Bỏ cô lập' : 'Cô lập cấu trúc này'}
                      title="Chỉ hiện cấu trúc này"
                    >
                      ◎
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </aside>
  )
}
