import { useEffect, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { structuresById } from '../content'

/** Nhãn tên cấu trúc đi theo con trỏ khi hover (desktop). Trên cảm ứng không có hover nên không hiện. */
export function HoverLabel() {
  const hoveredId = useAppStore((s) => s.hoveredId)
  const mode = useAppStore((s) => s.mode)
  const quiz = useAppStore((s) => s.quiz)
  const [pos, setPos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const onMove = (e: PointerEvent) => { if (e.pointerType === 'mouse') setPos({ x: e.clientX, y: e.clientY }) }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  // Trong quiz dạng click không lộ tên (đó là câu hỏi)
  const q = quiz?.questions[quiz.index]
  if (!hoveredId || (mode === 'quiz' && q?.type === 'click')) return null
  const s = structuresById[hoveredId]
  if (!s) return null
  return (
    <div className="pointer-events-none fixed z-40 rounded-lg border border-line bg-panel/90 px-2.5 py-1.5 text-xs shadow-lg backdrop-blur"
      style={{ left: pos.x + 14, top: pos.y + 14 }}>
      <span className="font-medium text-slate-100">{s.nameVi}</span>
      <span className="ml-1.5 italic text-slate-400">{s.nameLatin}</span>
    </div>
  )
}
