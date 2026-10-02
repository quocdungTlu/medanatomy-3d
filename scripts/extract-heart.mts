/**
 * Cắt vùng tim từ file cardiovascular.glb (Z-Anatomy, qua nqwrc/3d-anatomy),
 * giảm polygon về ngân sách và nén Draco.
 *
 * Dùng: npm run model:extract -- <cardiovascular.glb> [public/models/heart.glb] [maxTriangles]
 *
 * Kết quả giữ nguyên tên mesh gốc (tiếng Anh, theo Z-Anatomy) để map sang
 * `meshNames` trong content/cardiovascular.json.
 */
import { NodeIO, type Document } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, draco, prune, simplify, weld } from '@gltf-transform/functions'
import { MeshoptSimplifier } from 'meshoptimizer'
import draco3d from 'draco3dgltf'
import { statSync } from 'node:fs'

const [input, output = 'public/models/heart.glb', maxTriArg = '250000'] = process.argv.slice(2)
if (!input) {
  console.error('Thiếu đường dẫn file cardiovascular.glb')
  process.exit(1)
}
const MAX_TRI = Number(maxTriArg)

/** Danh sách mesh giữ lại (tên gốc Z-Anatomy). Thêm/bớt tại đây. */
export const HEART_MESHES = [
  // Buồng tim
  'Left atrium', 'Right atrium', 'Left ventricle', 'Right ventricle',
  // Cơ nhú
  'Inferior papillary muscle of left ventricle',
  'Anterior papillary muscle of right ventricle', 'Inferior papillary muscle of right ventricle', 'Septal papillary muscle of right ventricle',
  // Lá van
  'Inferior leaflet of right atrioventricular valve', 'Septal leaflet of right atrioventricular valve',
  'Posterior leaflet of left atrioventricular valve',
  'Left coronary leaflet', 'Right coronary leaflet', 'Non-coronary leaflet',
  'Anterior semilunar leaflet of pulmonary valve', 'Left semilunar leaflet of pulmonary valve', 'Right semilunar leaflet of pulmonary valve',
  // Động mạch lớn
  'Ascending aorta', 'Aortic arch', 'Thoracic aorta',
  'Brachiocephalic trunk', 'Left common carotid artery', 'Left subclavian artery', 'Right common carotid artery', 'Right subclavian artery',
  'Pulmonary trunk', 'Bifurcation of pulmonary trunk', 'Left pulmonary artery', 'Right pulmonary artery',
  // Tĩnh mạch lớn
  'Superior vena cava', 'Inferior vena cava (thoracic part)', 'Left brachiocephalic vein', 'Right brachiocephalic vein',
  'Left superior pulmonary vein', 'Left inferior pulmonary vein', 'Right superior pulmonary vein', 'Right inferior pulmonary vein',
  // Mạch vành
  'Left coronary artery', 'Anterior interventricular artery', 'Septal branches of anterior interventricular artery', 'Circumflex artery of heart',
  'Right coronary artery', 'Right inferolateral branch of right coronary artery',
  'Coronary sinus', 'Great cardiac vein', 'Middle cardiac vein', 'Inferior vein of left ventricle', "Inferior vein of left ventricle (//Posterior '')",
]

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
})
const doc: Document = await io.read(input)
const root = doc.getRoot()

const keep = new Set(HEART_MESHES)
const found = new Set<string>()
for (const node of root.listNodes()) {
  const name = node.getName()
  if (node.getMesh() && keep.has(name)) {
    found.add(name)
    // Làm sạch extras của Blender, chỉ giữ za_name
    const extras = node.getExtras() as Record<string, unknown>
    node.setExtras({ za_name: extras?.za_name ?? name })
  } else if (node.getMesh()) {
    node.dispose()
  }
}
const missing = HEART_MESHES.filter((n) => !found.has(n))
if (missing.length) console.warn('⚠ Không tìm thấy trong model:', missing)

await doc.transform(prune(), dedup(), weld())
const before = countTriangles(doc)
console.log(`Giữ ${found.size} mesh, ${before.toLocaleString('vi-VN')} tam giác trước khi giảm`)

if (before > MAX_TRI) {
  const ratio = Math.max(0.05, MAX_TRI / before)
  await doc.transform(simplify({ simplifier: MeshoptSimplifier, ratio, error: 0.001 }))
  console.log(`Giảm với ratio ${ratio.toFixed(2)} → ${countTriangles(doc).toLocaleString('vi-VN')} tam giác`)
}

await doc.transform(draco({ method: 'edgebreaker', quantizePosition: 14, quantizeNormal: 10 }))
await io.write(output, doc)
console.log(`✓ ${output}: ${(statSync(output).size / 1024 / 1024).toFixed(2)} MB, ${countTriangles(doc).toLocaleString('vi-VN')} tam giác`)

function countTriangles(d: Document) {
  let t = 0
  for (const mesh of d.getRoot().listMeshes())
    for (const p of mesh.listPrimitives()) {
      const idx = p.getIndices()
      const pos = p.getAttribute('POSITION')
      t += Math.floor((idx ? idx.getCount() : (pos?.getCount() ?? 0)) / 3)
    }
  return t
}
