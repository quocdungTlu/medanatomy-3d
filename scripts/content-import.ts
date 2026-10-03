/**
 * Nhập lại CSV cấu trúc đã duyệt vào JSON nội dung.
 * Dùng: npm run content:import -- content/review/cardiovascular.structures.csv [content/cardiovascular.json]
 * Chỉ dòng có status = "Đã duyệt" và reviewer không rỗng mới được ghi reviewedBy/reviewedAt;
 * các cột văn bản (nameVi, nameLatin, description, ...) được cập nhật cho mọi dòng để cố vấn sửa trực tiếp trên Sheets.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { ContentSchema, validateReferences } from '../src/content/schema'

const [csvPath, jsonPath = 'content/cardiovascular.json'] = process.argv.slice(2)
if (!csvPath) { console.error('Thiếu đường dẫn CSV'); process.exit(1) }

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = [], cell = '', q = false
  const s = text.replace(/^﻿/, '')
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (q) {
      if (c === '"' && s[i + 1] === '"') { cell += '"'; i++ }
      else if (c === '"') q = false
      else cell += c
    } else if (c === '"') q = true
    else if (c === ',') { row.push(cell); cell = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i++
      row.push(cell); rows.push(row); row = []; cell = ''
    } else cell += c
  }
  if (cell || row.length) { row.push(cell); rows.push(row) }
  return rows.filter((r) => r.some((x) => x !== ''))
}

const [header, ...rows] = parseCsv(readFileSync(csvPath, 'utf8'))
const col = (r: string[], name: string) => r[header.indexOf(name)]?.trim() ?? ''
const content = ContentSchema.parse(JSON.parse(readFileSync(jsonPath, 'utf8')))
const byId = new Map(content.structures.map((s) => [s.id, s]))
const today = new Date().toISOString().slice(0, 10)
let approved = 0, updated = 0, unknown = 0

for (const r of rows) {
  const s = byId.get(col(r, 'id'))
  if (!s) { unknown++; console.warn('⚠ id không có trong JSON:', col(r, 'id')); continue }
  const text = (k: 'nameVi' | 'nameLatin' | 'nameEn' | 'description' | 'function' | 'clinical' | 'mnemonic' | 'source') => {
    const v = col(r, k)
    if (v && v !== (s[k] ?? '')) { (s as Record<string, unknown>)[k] = v; updated++ }
  }
  ;(['nameVi', 'nameLatin', 'nameEn', 'description', 'function', 'clinical', 'mnemonic', 'source'] as const).forEach(text)
  if (col(r, 'status') === 'Đã duyệt' && col(r, 'reviewer')) {
    s.reviewedBy = col(r, 'reviewer')
    s.reviewedAt = /^\d{4}-\d{2}-\d{2}$/.test(col(r, 'reviewedAt')) ? col(r, 'reviewedAt') : today
    if (s.source?.startsWith('BẢN NHÁP')) delete s.source
    approved++
  }
}

const errors = validateReferences(content)
if (errors.length) { console.error(errors.join('\n')); process.exit(1) }
writeFileSync(jsonPath, JSON.stringify(content, null, 2) + '\n')
console.log(`✓ ${approved} cấu trúc đã duyệt, ${updated} trường cập nhật, ${unknown} id lạ → ${jsonPath}`)
