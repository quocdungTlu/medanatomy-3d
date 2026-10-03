import raw from '../../content/cardiovascular.json'
import rawSources from '../../content/sources.json'
import { ContentSchema, SourcesFileSchema, validateReferences, validateReferencesExist, type Content, type Source, type Structure } from './schema'

const parsed = ContentSchema.safeParse(raw)
if (!parsed.success) {
  // Nội dung sai schema là lỗi lập trình, không phải lỗi người dùng: fail sớm.
  throw new Error('Nội dung không hợp lệ: ' + JSON.stringify(parsed.error.issues, null, 2))
}
const refErrors = validateReferences(parsed.data)
if (refErrors.length) throw new Error('Nội dung lỗi tham chiếu:\n' + refErrors.join('\n'))

export const content: Content = parsed.data

const parsedSources = SourcesFileSchema.safeParse(rawSources)
if (!parsedSources.success) throw new Error('sources.json không hợp lệ: ' + JSON.stringify(parsedSources.error.issues, null, 2))
export const sources: Source[] = parsedSources.data.sources
export const sourcesById: Record<string, Source> = Object.fromEntries(sources.map((s) => [s.id, s]))
const srcErrors = validateReferencesExist(content, sources)
if (srcErrors.length) throw new Error('Lỗi tham chiếu nguồn:\n' + srcErrors.join('\n'))

export const structuresById: Record<string, Structure> = Object.fromEntries(
  content.structures.map((s) => [s.id, s]),
)

/** Tên mesh trong .glb → id cấu trúc. Dùng cho raycast. */
export const structureIdByMesh: Record<string, string> = Object.fromEntries(
  content.structures.flatMap((s) => s.meshNames.map((m) => [m, s.id])),
)

export const groupsOrdered = [...content.groups].sort((a, b) => a.order - b.order)

export function structuresInGroup(groupId: string): Structure[] {
  return content.structures.filter((s) => s.group === groupId)
}

export function isReviewed(s: Structure): boolean {
  return Boolean(s.reviewedBy && s.reviewedAt)
}

/** Tìm theo tên Việt / Latin / Anh, không phân biệt dấu. */
export function searchStructures(query: string): Structure[] {
  const q = normalize(query)
  if (!q) return content.structures
  return content.structures.filter((s) =>
    [s.nameVi, s.nameLatin, s.nameEn ?? ''].some((n) => normalize(n).includes(q)),
  )
}

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim()
}
