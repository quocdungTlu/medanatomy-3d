/**
 * Xuất nội dung sang CSV để cố vấn duyệt trong Google Sheets / Excel.
 * Dùng: npm run content:export            → content/review/cardiovascular.structures.csv + .questions.csv
 * Mỗi dòng có cột `status` (Nháp / Chờ duyệt / Đã duyệt / Cần sửa), `reviewer`, `reviewedAt`, `note`.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { ContentSchema } from '../src/content/schema'

const file = process.argv[2] ?? 'content/cardiovascular.json'
const content = ContentSchema.parse(JSON.parse(readFileSync(file, 'utf8')))
const outDir = 'content/review'
mkdirSync(outDir, { recursive: true })
const base = join(outDir, content.system)

const csv = (rows: (string | number | undefined)[][]) =>
  '﻿' + rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n') + '\r\n'

const byId = Object.fromEntries(content.structures.map((s) => [s.id, s]))

writeFileSync(
  base + '.structures.csv',
  csv([
    ['id', 'group', 'nameVi', 'nameLatin', 'nameLatinTA2', 'nameEn', 'description', 'function', 'clinical', 'mnemonic', 'source', 'references', 'status', 'reviewer', 'reviewedAt', 'note'],
    ...content.structures.map((s) => [
      s.id, s.group, s.nameVi, s.nameLatin, s.nameLatinTA2, s.nameEn, s.description, s.function, s.clinical, s.mnemonic, s.source, s.references.join(' '),
      s.reviewedBy ? 'Đã duyệt' : 'Chờ duyệt', s.reviewedBy, s.reviewedAt, '',
    ]),
  ]),
)

writeFileSync(
  base + '.questions.csv',
  csv([
    ['id', 'type', 'prompt', 'answer (nameVi)', 'answerId', 'distractors (nameVi)', 'difficulty', 'tags', 'status', 'note'],
    ...content.questions.map((q) =>
      q.type === 'click'
        ? [q.id, 'click', q.prompt, byId[q.answerStructureId]?.nameVi, q.answerStructureId, '', q.difficulty, q.tags.join(' '), 'Chờ duyệt', '']
        : [q.id, 'name', 'Cấu trúc được tô sáng là gì?', byId[q.targetStructureId]?.nameVi, q.targetStructureId,
           q.distractorIds.map((d) => byId[d]?.nameVi).join(' | '), q.difficulty, q.tags.join(' '), 'Chờ duyệt', ''],
    ),
  ]),
)
console.log(`✓ ${base}.structures.csv (${content.structures.length} dòng), ${base}.questions.csv (${content.questions.length} dòng)`)
