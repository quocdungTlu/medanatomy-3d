/**
 * So khớp tên mesh trong file .glb với meshNames trong JSON nội dung.
 * Dùng: npm run model:check -- public/models/heart.glb content/cardiovascular.json
 */
import { readFileSync } from 'node:fs'
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import draco3d from 'draco3dgltf'
import { ContentSchema } from '../src/content/schema'

const [glbPath = 'public/models/heart.glb', jsonPath = 'content/cardiovascular.json'] = process.argv.slice(2)

const content = ContentSchema.parse(JSON.parse(readFileSync(jsonPath, 'utf8')))
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
})
const doc = await io.read(glbPath)

const modelNames = new Set<string>()
let triangles = 0
for (const node of doc.getRoot().listNodes()) {
  const mesh = node.getMesh()
  if (!mesh) continue
  modelNames.add(node.getName())
  modelNames.add(mesh.getName())
  for (const prim of mesh.listPrimitives()) {
    const idx = prim.getIndices()
    const pos = prim.getAttribute('POSITION')
    triangles += Math.floor((idx ? idx.getCount() : pos?.getCount() ?? 0) / 3)
  }
}
modelNames.delete('')

const wanted = new Set(content.structures.flatMap((s) => s.meshNames))
const missing = [...wanted].filter((n) => !modelNames.has(n))
const unmapped = [...modelNames].filter((n) => !wanted.has(n))

console.log(`Model: ${modelNames.size} mesh/node có tên, ~${triangles.toLocaleString('vi-VN')} tam giác`)
console.log(`Nội dung: ${wanted.size} mesh cần có`)
if (missing.length) {
  console.error(`✗ Thiếu trong model (${missing.length}):`)
  for (const m of missing) console.error('   ' + m)
}
if (unmapped.length) {
  console.warn(`⚠ Có trong model nhưng chưa có nội dung (${unmapped.length}):`)
  for (const m of unmapped) console.warn('   ' + m)
}
if (triangles > 300_000) console.warn('⚠ Vượt ngân sách 300k tam giác, cân nhắc decimate')
process.exit(missing.length ? 1 : 0)
