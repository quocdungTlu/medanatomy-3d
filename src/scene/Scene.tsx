import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { CameraControls, useGLTF, useProgress } from '@react-three/drei'
import * as THREE from 'three'
import { ModelRoot } from './ModelRoot'
import { buildPlaceholderHeart } from './placeholderHeart'
import { useAppStore } from '../store/useAppStore'
import { boundingBoxOf } from './registry'
import { content } from '../content'

export type ModelSource = 'glb' | 'placeholder'

const DEFAULT_POS = new THREE.Vector3(0, 0.4, 5.2)
const DEFAULT_TARGET = new THREE.Vector3(0, 0.1, 0)

export function Scene({ source }: { source: ModelSource }) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: DEFAULT_POS.toArray(), fov: 42, near: 0.1, far: 50 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault()
          useAppStore.getState().setContextLost(true)
        })
      }}
      onPointerMissed={() => {
        const s = useAppStore.getState()
        if (s.mode === 'explore') s.select(null)
      }}
      className="touch-none"
    >
      <color attach="background" args={['#0b1120']} />
      <Lights />
      {/* Fallback để null: loader là overlay DOM (LoadingOverlay) vì <Html> trong fallback lỗi với React 19 */}
      <Suspense fallback={null}>
        {source === 'glb' ? <GlbModel url={content.modelUrl} /> : <PlaceholderModel />}
      </Suspense>
      <CameraRig />
    </Canvas>
  )
}

function Lights() {
  return (
    <>
      {/* Không dùng <Environment preset> vì nó tải HDR từ CDN ngoài; ánh sáng 3 điểm + hemisphere là đủ */}
      <hemisphereLight args={['#dbe4ff', '#3a2a2a', 0.6]} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[4, 6, 5]} intensity={1.6} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-5, 2, -4]} intensity={0.6} color="#9fb4ff" />
      <directionalLight position={[0, -4, 3]} intensity={0.3} />
    </>
  )
}

function GlbModel({ url }: { url: string }) {
  // Decoder Draco đóng gói trong app (public/draco), không phụ thuộc CDN bên ngoài
  const { scene } = useGLTF(url, '/draco/')
  const root = useMemo(() => {
    const s = scene
    // Đưa model về tâm và chuẩn hóa kích thước ~3 đơn vị
    const box = new THREE.Box3().setFromObject(s)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const k = 3 / Math.max(size.x, size.y, size.z)
    s.position.sub(center).multiplyScalar(k)
    s.scale.setScalar(k)
    return s
  }, [scene])
  return <ModelRoot root={root} />
}

function PlaceholderModel() {
  const root = useMemo(() => buildPlaceholderHeart(), [])
  return <ModelRoot root={root} />
}

/** Overlay tiến trình tải, đặt NGOÀI Canvas. useProgress đọc từ LoadingManager của three nên dùng được ở đây. */
export function LoadingOverlay() {
  const { active, progress, errors } = useProgress()
  if (errors.length) {
    return (
      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-6 text-center">
        <p className="rounded-xl bg-rose-500/15 px-4 py-2 text-sm text-rose-300">Không tải được mô hình. Kiểm tra kết nối rồi tải lại trang.</p>
      </div>
    )
  }
  if (!active) return null
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
      <div className="w-56 text-center text-slate-200">
        <div className="mb-2 text-sm">Đang tải mô hình… {Math.round(progress)}%</div>
        <div className="h-1.5 w-full overflow-hidden rounded bg-slate-700">
          <div className="h-full bg-sky-400 transition-[width]" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  )
}

/** Camera: xoay/zoom tự do, bay tới cấu trúc được chọn, reset khi cần. */
function CameraRig() {
  const ref = useRef<CameraControls>(null)
  const selectedId = useAppStore((s) => s.selectedId)
  const resetNonce = useAppStore((s) => s.resetViewNonce)
  const size = useThree((s) => s.size)

  useEffect(() => {
    const c = ref.current
    if (!c) return
    if (!selectedId) return
    const box = boundingBoxOf(selectedId)
    if (!box) return
    // Padding theo kích thước cấu trúc; trên mobile đẩy cấu trúc lên nửa trên vì bottom sheet che nửa dưới
    const dim = box.getSize(new THREE.Vector3()).length()
    const mobile = size.width < 640
    c.fitToBox(box, true, {
      paddingTop: dim * (mobile ? 0.25 : 0.3),
      paddingBottom: dim * (mobile ? 1.6 : 0.3),
      paddingLeft: dim * 0.3,
      paddingRight: dim * 0.3,
    })
  }, [selectedId, size.width])

  useEffect(() => {
    ref.current?.setLookAt(DEFAULT_POS.x, DEFAULT_POS.y, DEFAULT_POS.z, DEFAULT_TARGET.x, DEFAULT_TARGET.y, DEFAULT_TARGET.z, true)
  }, [resetNonce])

  return (
    <CameraControls
      ref={ref}
      makeDefault
      minDistance={1.2}
      maxDistance={12}
      smoothTime={0.35}
      dollySpeed={0.6}
      truckSpeed={1}
    />
  )
}
