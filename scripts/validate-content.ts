/**
 * Kiểm tra toàn bộ file nội dung trong content/ theo schema và tham chiếu chéo.
 * Chạy trước build; lỗi → exit 1. Cấu trúc chưa duyệt chỉ cảnh báo.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ContentSchema, SourcesFileSchema, validateReferences, validateReferencesExist } from '../src/content/schema'

const dir = join(process.cwd(), 'content')
let failed = false
const sourcesParsed = SourcesFileSchema.safeParse(JSON.parse(readFileSync(join(dir, 'sources.json'), 'utf8')))
if (!sourcesParsed.success) { console.error('✗ sources.json sai schema'); for (const i of sourcesParsed.error.issues) console.error(`   ${i.path.join('.')}: ${i.message}`); process.exit(1) }
console.log(`✓ sources.json: ${sourcesParsed.data.sources.length} nguồn`)

for (const file of readdirSync(dir).filter((f) => f.endsWith('.json') && f !== 'sources.json')) {
  const raw = JSON.parse(readFileSync(join(dir, file), 'utf8'))
  const parsed = ContentSchema.safeParse(raw)
  if (!parsed.success) {
    failed = true
    console.error(`✗ ${file}: sai schema`)
    for (const i of parsed.error.issues) console.error(`   ${i.path.join('.')}: ${i.message}`)
    continue
  }
  const errors = [...validateReferences(parsed.data), ...validateReferencesExist(parsed.data, sourcesParsed.data.sources)]
  if (errors.length) {
    failed = true
    console.error(`✗ ${file}: lỗi tham chiếu`)
    for (const e of errors) console.error(`   ${e}`)
    continue
  }
  const c = parsed.data
  const unreviewed = c.structures.filter((s) => !s.reviewedBy || !s.reviewedAt)
  console.log(`✓ ${file}: ${c.structures.length} cấu trúc, ${c.questions.length} câu hỏi, ${c.groups.length} nhóm`)
  if (unreviewed.length) console.warn(`   ⚠ ${unreviewed.length} cấu trúc chưa có cố vấn duyệt`)
}

process.exit(failed ? 1 : 0)
