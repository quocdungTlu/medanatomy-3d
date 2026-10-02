import { useAppStore } from '../store/useAppStore'
import { groupsOrdered } from '../content'

/** Thanh công cụ nổi: danh sách, xuyên thấu, nhóm, reset. Trên mobile nằm dưới cùng. */
export function Toolbar() {
  const xray = useAppStore((s) => s.xray)
  const hiddenGroups = useAppStore((s) => s.hiddenGroups)
  const isolatedId = useAppStore((s) => s.isolatedId)
  const listOpen = useAppStore((s) => s.listOpen)
  const infoOpen = useAppStore((s) => s.infoOpen)
  const { toggleXray, toggleGroup, setListOpen, resetView, showAll } = useAppStore.getState()

  const anyHidden = hiddenGroups.size > 0 || isolatedId !== null || xray

  return (
    <div
      className={`pointer-events-none absolute right-0 bottom-0 z-20 flex flex-col gap-2 px-3 safe-bottom transition-[left] ${listOpen ? 'left-0 sm:left-80' : 'left-0'} ${infoOpen ? 'hidden sm:flex sm:right-96' : ''}`}
    >
      <div className="pointer-events-auto flex flex-wrap gap-1.5">
        {groupsOrdered.map((g) => {
          const hidden = hiddenGroups.has(g.id)
          return (
            <button
              key={g.id}
              onClick={() => toggleGroup(g.id)}
              className={`min-h-9 rounded-full border px-3 text-xs ${
                hidden ? 'border-line bg-panel/60 text-slate-500 line-through' : 'border-sky-500/50 bg-sky-500/15 text-sky-200'
              }`}
              aria-pressed={!hidden}
            >
              {g.nameVi}
            </button>
          )
        })}
      </div>
      <div className="pointer-events-auto flex items-center gap-2">
        <button className="btn-ghost flex-1 sm:flex-none" onClick={() => setListOpen(!listOpen)} aria-expanded={listOpen}>
          ☰ Cấu trúc
        </button>
        <button className={`btn-ghost ${xray ? 'ring-2 ring-sky-400' : ''}`} onClick={toggleXray} aria-pressed={xray}>
          Xuyên thấu
        </button>
        {anyHidden && (
          <button className="btn-ghost" onClick={showAll}>
            Hiện tất cả
          </button>
        )}
        <button className="btn-icon btn-ghost" onClick={resetView} aria-label="Đặt lại góc nhìn" title="Đặt lại góc nhìn">
          ⟲
        </button>
      </div>
    </div>
  )
}
