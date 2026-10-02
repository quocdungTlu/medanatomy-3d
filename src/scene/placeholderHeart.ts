import * as THREE from 'three'

/**
 * Mô hình tim sơ đồ hóa, dựng bằng hình khối cơ bản.
 * Chỉ dùng để phát triển và test tương tác khi chưa có file .glb thật.
 * Tên mesh trùng với `meshNames` trong content/cardiovascular.json.
 */
export function buildPlaceholderHeart(): THREE.Group {
  const g = new THREE.Group()
  g.name = 'PlaceholderHeart'

  const mat = (color: string, roughness = 0.55) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.05 })

  const add = (name: string, geom: THREE.BufferGeometry, color: string, pos: [number, number, number], scale?: [number, number, number], rot?: [number, number, number]) => {
    const m = new THREE.Mesh(geom, mat(color))
    m.name = name
    m.position.set(...pos)
    if (scale) m.scale.set(...scale)
    if (rot) m.rotation.set(...rot)
    m.castShadow = m.receiveShadow = true
    g.add(m)
    return m
  }

  // Buồng tim
  add('Heart_RightAtrium', new THREE.SphereGeometry(0.5, 40, 32), '#c96a6a', [0.62, 0.45, 0.15])
  add('Heart_LeftAtrium', new THREE.SphereGeometry(0.5, 40, 32), '#b85c5c', [-0.6, 0.5, -0.3])
  add('Heart_RightVentricle', new THREE.SphereGeometry(0.6, 48, 40), '#a93d3d', [0.4, -0.45, 0.35], [0.95, 1.15, 0.85])
  add('Heart_LeftVentricle', new THREE.SphereGeometry(0.62, 48, 40), '#9b2f2f', [-0.42, -0.6, -0.05], [1.05, 1.35, 0.95])

  // Van tim (vòng) ở ranh giới buồng
  const ring = () => new THREE.TorusGeometry(0.22, 0.055, 16, 48)
  add('Heart_TricuspidValve', ring(), '#f1e0b0', [0.55, 0.0, 0.3], undefined, [Math.PI / 2, 0, 0])
  add('Heart_MitralValve', ring(), '#f1e0b0', [-0.52, -0.02, -0.15], undefined, [Math.PI / 2, 0, 0])
  add('Heart_PulmonaryValve', new THREE.TorusGeometry(0.17, 0.05, 16, 40), '#f1e0b0', [0.25, 0.3, 0.55], undefined, [Math.PI / 2, 0, 0])
  add('Heart_AorticValve', new THREE.TorusGeometry(0.17, 0.05, 16, 40), '#f1e0b0', [-0.12, 0.25, 0.1], undefined, [Math.PI / 2, 0, 0])

  // Động mạch chủ: ống theo đường cong vòng cung
  const aortaCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.12, 0.3, 0.1),
    new THREE.Vector3(-0.05, 0.9, 0.05),
    new THREE.Vector3(0.1, 1.35, -0.15),
    new THREE.Vector3(-0.3, 1.5, -0.45),
    new THREE.Vector3(-0.55, 1.1, -0.65),
    new THREE.Vector3(-0.5, 0.0, -0.8),
    new THREE.Vector3(-0.45, -1.1, -0.85),
  ])
  add('Vessel_Aorta', new THREE.TubeGeometry(aortaCurve, 64, 0.17, 20, false), '#d84848', [0, 0, 0])

  // Thân động mạch phổi
  const ptCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.25, 0.35, 0.55),
    new THREE.Vector3(0.1, 0.8, 0.45),
    new THREE.Vector3(-0.15, 1.05, 0.2),
  ])
  add('Vessel_PulmonaryTrunk', new THREE.TubeGeometry(ptCurve, 32, 0.15, 20, false), '#5c6fc9', [0, 0, 0])

  // Tĩnh mạch chủ trên / dưới
  add('Vessel_SVC', new THREE.CylinderGeometry(0.15, 0.15, 0.9, 24), '#4d5fb3', [0.68, 1.2, 0.05])
  add('Vessel_IVC', new THREE.CylinderGeometry(0.17, 0.17, 0.8, 24), '#4d5fb3', [0.62, -0.1, 0.0], undefined, [0, 0, 0.1])

  // Mạch vành (ống mảnh bám mặt tim)
  const lca = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.1, 0.35, 0.3),
    new THREE.Vector3(-0.05, 0.05, 0.6),
    new THREE.Vector3(-0.15, -0.5, 0.75),
    new THREE.Vector3(-0.3, -1.1, 0.6),
  ])
  add('Coronary_Left', new THREE.TubeGeometry(lca, 40, 0.035, 12, false), '#8c1d1d', [0, 0, 0])
  const rca = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.05, 0.35, 0.35),
    new THREE.Vector3(0.6, 0.1, 0.7),
    new THREE.Vector3(0.95, -0.4, 0.5),
    new THREE.Vector3(0.8, -0.9, 0.1),
  ])
  add('Coronary_Right', new THREE.TubeGeometry(rca, 40, 0.035, 12, false), '#8c1d1d', [0, 0, 0])

  return g
}
