import { useEffect, useState } from 'react'
import { LoadingOverlay, Scene, type ModelSource } from './scene/Scene'
import { Toolbar } from './components/Toolbar'
import { StructureList } from './components/StructureList'
import { InfoPanel } from './components/InfoPanel'
import { QuizPanel } from './components/QuizPanel'
import { About } from './components/About'
import { QuizSetup } from './components/QuizSetup'
import { Onboarding } from './components/Onboarding'
import { hasOnboarded } from './lib/localHistory'
import { useAppStore } from './store/useAppStore'
import { content } from './content'

export default function App() {
  const [source, setSource] = useState<ModelSource | 'checking'>('checking')
  const mode = useAppStore((s) => s.mode)
  const contextLost = useAppStore((s) => s.contextLost)
  const [setupOpen, setSetupOpen] = useState(false)
  const [onboarding, setOnboarding] = useState(() => !hasOnboarded())

  // Có file .glb thật thì dùng, không thì dùng model placeholder để phát triển
  useEffect(() => {
    let alive = true
    fetch(content.modelUrl, { method: 'HEAD' })
      .then((r) => alive && setSource(r.ok && isGlb(r) ? 'glb' : 'placeholder'))
      .catch(() => alive && setSource('placeholder'))
    return () => {
      alive = false
    }
  }, [])

  if (!supportsWebGL()) return <Unsupported />

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div>
          <h1 className="text-base font-semibold tracking-tight">MedAnatomy 3D</h1>
          <p className="text-xs text-slate-400">
            {content.systemNameVi}
            {source === 'placeholder' && <span className="ml-2 rounded bg-amber-500/20 px-1.5 py-0.5 text-amber-300">model tạm</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <About />
          {mode === 'explore' && (
            <button className="btn-primary" onClick={() => setSetupOpen(true)}>
              Bắt đầu kiểm tra
            </button>
          )}
        </div>
      </header>

      <main className="relative flex-1">
        {source === 'checking' ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">Đang chuẩn bị…</div>
        ) : (
          <>
            <Scene source={source} />
            <LoadingOverlay />
          </>
        )}
        {contextLost && <ContextLost />}
      </main>

      {mode === 'explore' ? (
        <>
          <Toolbar />
          <StructureList />
          <InfoPanel />
        </>
      ) : (
        <QuizPanel />
      )}
      {setupOpen && <QuizSetup onClose={() => setSetupOpen(false)} />}
      {onboarding && source !== 'checking' && <Onboarding onDone={() => setOnboarding(false)} />}
    </div>
  )
}

function isGlb(r: Response) {
  const t = r.headers.get('content-type') ?? ''
  // Vercel/Vite dev trả về text/html cho file không tồn tại (SPA fallback)
  return !t.includes('text/html')
}

function supportsWebGL(): boolean {
  try {
    const c = document.createElement('canvas')
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

function Unsupported() {
  return (
    <div className="flex h-full items-center justify-center p-6 text-center text-slate-300">
      <div>
        <p className="mb-2 text-lg font-semibold">Thiết bị chưa hỗ trợ 3D</p>
        <p className="text-sm text-slate-400">Hãy thử trình duyệt Chrome hoặc Safari phiên bản mới hơn.</p>
      </div>
    </div>
  )
}

function ContextLost() {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-ink/90 p-6 text-center">
      <div>
        <p className="mb-2 font-semibold">Mô hình 3D bị gián đoạn</p>
        <p className="mb-4 text-sm text-slate-400">Thiết bị tạm hết bộ nhớ đồ họa. Tải lại trang để tiếp tục.</p>
        <button className="btn-primary" onClick={() => location.reload()}>
          Tải lại
        </button>
      </div>
    </div>
  )
}
