import * as THREE from 'three'

/** id cấu trúc → các mesh thuộc nó. Dùng cho camera bay tới cấu trúc. */
const registry = new Map<string, THREE.Mesh[]>()

export function registerMeshes(map: Map<string, THREE.Mesh[]>) {
  registry.clear()
  for (const [id, meshes] of map) registry.set(id, meshes)
}

export function meshesOf(structureId: string): THREE.Mesh[] {
  return registry.get(structureId) ?? []
}

export function boundingBoxOf(structureId: string): THREE.Box3 | null {
  const meshes = meshesOf(structureId)
  if (!meshes.length) return null
  const box = new THREE.Box3()
  for (const m of meshes) box.expandByObject(m)
  return box.isEmpty() ? null : box
}

/** Tên mesh có trong model nhưng không có trong JSON nội dung (để cảnh báo). */
export const unmappedMeshNames = new Set<string>()

/**
 * Tên gốc của object trong model. GLTFLoader "làm sạch" node.name (khoảng trắng → _, bỏ / ( ) .),
 * nên ưu tiên userData.za_name (extras giữ nguyên từ Z-Anatomy), sau đó mới tới name.
 */
export function sourceNameOf(o: THREE.Object3D): string {
  const za = (o.userData as { za_name?: unknown })?.za_name
  return typeof za === 'string' && za ? za : o.name
}
