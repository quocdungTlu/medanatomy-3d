import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import { useAppStore } from '../store/useAppStore'
import { structureIdByMesh, structuresById } from '../content'
import { registerMeshes, unmappedMeshNames } from './registry'

const HOVER = new THREE.Color('#ffd166')
const SELECT = new THREE.Color('#38bdf8')
const CORRECT = new THREE.Color('#22c55e')
const WRONG = new THREE.Color('#ef4444')

interface MeshInfo {
  mesh: THREE.Mesh
  structureId: string
  material: THREE.MeshStandardMaterial
  baseColor: THREE.Color
}

/**
 * Gắn hành vi chọn/highlight/ẩn/xuyên thấu lên mọi mesh có tên nằm trong JSON nội dung.
 * Dùng chung cho model .glb thật và model placeholder.
 */
export function ModelRoot({ root }: { root: THREE.Object3D }) {
  const infos = useMemo(() => prepare(root), [root])
  const lastHover = useRef<string | null>(null)

  useEffect(() => {
    const byId = new Map<string, THREE.Mesh[]>()
    for (const i of infos) byId.set(i.structureId, [...(byId.get(i.structureId) ?? []), i.mesh])
    registerMeshes(byId)
    if (unmappedMeshNames.size && import.meta.env.DEV) {
      console.warn('[model] mesh không có trong nội dung:', [...unmappedMeshNames])
    }
  }, [infos])

  // Áp style mỗi khi state đổi
  useEffect(() => {
    const apply = () => {
      const s = useAppStore.getState()
      const q = s.mode === 'quiz' ? s.quiz?.questions[s.quiz.index] : undefined
      const highlightId = q?.type === 'name' ? q.targetStructureId : s.selectedId
      for (const i of infos) {
        const st = structuresById[i.structureId]
        const hidden = s.hiddenGroups.has(st.group) || (s.isolatedId !== null && s.isolatedId !== i.structureId)
        i.mesh.visible = !hidden
        if (hidden) continue

        const faded = s.xray && st.layer < s.xrayLayer && i.structureId !== highlightId
        i.material.transparent = faded
        i.material.opacity = faded ? 0.18 : 1
        i.material.depthWrite = !faded

        i.material.color.copy(i.baseColor)
        i.material.emissive.set(0x000000)
        i.material.emissiveIntensity = 1
        if (s.lastAnswer && i.structureId === s.lastAnswer.correctId) {
          i.material.emissive.copy(s.lastAnswer.correct ? CORRECT : WRONG)
          i.material.emissiveIntensity = 0.6
        } else if (i.structureId === highlightId) {
          i.material.emissive.copy(SELECT)
          i.material.emissiveIntensity = 0.45
        } else if (i.structureId === s.hoveredId) {
          i.material.emissive.copy(HOVER)
          i.material.emissiveIntensity = 0.3
        }
      }
    }
    apply()
    return useAppStore.subscribe(apply)
  }, [infos])

  const idOf = (e: ThreeEvent<PointerEvent | MouseEvent>) => {
    // Lấy mesh gần nhất có tên trong nội dung (đi ngược lên cha nếu cần)
    let o: THREE.Object3D | null = e.object
    while (o) {
      const id = structureIdByMesh[o.name]
      if (id) return id
      o = o.parent
    }
    return null
  }

  return (
    <primitive
      object={root}
      onPointerMove={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation()
        const id = idOf(e)
        if (id !== lastHover.current) {
          lastHover.current = id
          useAppStore.getState().setHovered(id)
          document.body.style.cursor = id ? 'pointer' : 'auto'
        }
      }}
      onPointerOut={() => {
        lastHover.current = null
        useAppStore.getState().setHovered(null)
        document.body.style.cursor = 'auto'
      }}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation()
        const id = idOf(e)
        if (id) useAppStore.getState().select(id)
      }}
    />
  )
}

function prepare(root: THREE.Object3D): MeshInfo[] {
  const out: MeshInfo[] = []
  unmappedMeshNames.clear()
  root.traverse((o) => {
    if (!(o as THREE.Mesh).isMesh) return
    const mesh = o as THREE.Mesh
    const structureId = structureIdByMesh[mesh.name] ?? structureIdByMesh[mesh.parent?.name ?? '']
    if (!structureId) {
      unmappedMeshNames.add(mesh.name)
      return
    }
    // Clone material để mỗi mesh đổi màu độc lập, giữ màu gốc để khôi phục
    const src = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material
    let material: THREE.MeshStandardMaterial
    if (src instanceof THREE.MeshStandardMaterial) material = src.clone()
    else material = new THREE.MeshStandardMaterial({ color: (src as THREE.MeshBasicMaterial)?.color ?? '#b56565', roughness: 0.6 })
    mesh.material = material
    out.push({ mesh, structureId, material, baseColor: material.color.clone() })
  })
  return out
}
