import { z } from 'zod'

export const StructureSchema = z.object({
  id: z.string().regex(/^[a-z0-9_]+$/, 'id chỉ gồm chữ thường, số, gạch dưới'),
  meshNames: z.array(z.string().min(1)).min(1, 'Mỗi cấu trúc cần ít nhất 1 mesh'),
  nameVi: z.string().min(1),
  nameLatin: z.string().min(1),
  nameEn: z.string().optional(),
  group: z.string().min(1),
  layer: z.number().int().min(0).max(5),
  description: z.string().min(1),
  function: z.string().min(1),
  clinical: z.string().optional(),
  imageUrl: z.string().optional(),
  source: z.string().optional(),
  mnemonic: z.string().optional(),
  cameraTarget: z.tuple([z.number(), z.number(), z.number()]).optional(),
  /** Người duyệt chuyên môn. Thiếu = chưa duyệt, build sẽ cảnh báo. */
  reviewedBy: z.string().optional(),
  reviewedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

export const GroupSchema = z.object({
  id: z.string().min(1),
  nameVi: z.string().min(1),
  order: z.number().int(),
})

export const QuestionSchema = z.discriminatedUnion('type', [
  z.object({
    id: z.string().min(1),
    type: z.literal('click'),
    prompt: z.string().min(1),
    answerStructureId: z.string().min(1),
    difficulty: z.number().int().min(1).max(3).default(1),
    tags: z.array(z.string()).default([]),
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal('name'),
    /** Cấu trúc được highlight trên 3D */
    targetStructureId: z.string().min(1),
    /** 3 đáp án nhiễu, là id cấu trúc khác */
    distractorIds: z.array(z.string().min(1)).length(3),
    difficulty: z.number().int().min(1).max(3).default(1),
    tags: z.array(z.string()).default([]),
  }),
])

export const ContentSchema = z.object({
  system: z.string().min(1),
  systemNameVi: z.string().min(1),
  version: z.string().min(1),
  modelUrl: z.string().min(1),
  /** Dòng ghi công bắt buộc theo license của model, hiển thị trong app */
  modelAttribution: z.array(z.string()).default([]),
  groups: z.array(GroupSchema).min(1),
  structures: z.array(StructureSchema).min(1),
  questions: z.array(QuestionSchema),
})

export type Structure = z.infer<typeof StructureSchema>
export type Group = z.infer<typeof GroupSchema>
export type Question = z.infer<typeof QuestionSchema>
export type ClickQuestion = Extract<Question, { type: 'click' }>
export type NameQuestion = Extract<Question, { type: 'name' }>
export type Content = z.infer<typeof ContentSchema>

/** Kiểm tra tham chiếu chéo mà schema không bắt được. Trả về danh sách lỗi. */
export function validateReferences(content: Content): string[] {
  const errors: string[] = []
  const ids = new Set<string>()
  const groupIds = new Set(content.groups.map((g) => g.id))
  const meshOwners = new Map<string, string>()

  for (const s of content.structures) {
    if (ids.has(s.id)) errors.push(`Trùng id cấu trúc: ${s.id}`)
    ids.add(s.id)
    if (!groupIds.has(s.group)) errors.push(`Cấu trúc ${s.id} dùng group không tồn tại: ${s.group}`)
    for (const m of s.meshNames) {
      const owner = meshOwners.get(m)
      if (owner && owner !== s.id) errors.push(`Mesh ${m} được gán cho cả ${owner} và ${s.id}`)
      meshOwners.set(m, s.id)
    }
  }

  const qids = new Set<string>()
  for (const q of content.questions) {
    if (qids.has(q.id)) errors.push(`Trùng id câu hỏi: ${q.id}`)
    qids.add(q.id)
    if (q.type === 'click') {
      if (!ids.has(q.answerStructureId)) errors.push(`Câu ${q.id}: đáp án ${q.answerStructureId} không tồn tại`)
    } else {
      if (!ids.has(q.targetStructureId)) errors.push(`Câu ${q.id}: cấu trúc ${q.targetStructureId} không tồn tại`)
      for (const d of q.distractorIds) {
        if (!ids.has(d)) errors.push(`Câu ${q.id}: đáp án nhiễu ${d} không tồn tại`)
        if (d === q.targetStructureId) errors.push(`Câu ${q.id}: đáp án nhiễu trùng đáp án đúng`)
      }
      if (new Set(q.distractorIds).size !== 3) errors.push(`Câu ${q.id}: đáp án nhiễu bị trùng nhau`)
    }
  }
  return errors
}
