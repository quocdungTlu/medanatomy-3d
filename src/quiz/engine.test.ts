import { describe, it, expect } from 'vitest'
import { answer, correctIdOf, nameOptions, pickQuestions, score, shuffle, startSession, wrongAnswers } from './engine'
import { content, structuresById } from '../content'
import { validateReferences } from '../content/schema'
import type { Question } from '../content/schema'

// rng tất định để test ổn định
const seeded = (seed = 1) => () => {
  seed = (seed * 16807) % 2147483647
  return (seed - 1) / 2147483646
}

describe('nội dung', () => {
  it('không có lỗi tham chiếu', () => {
    expect(validateReferences(content)).toEqual([])
  })
  it('mọi câu hỏi trỏ tới cấu trúc tồn tại', () => {
    for (const q of content.questions) expect(structuresById[correctIdOf(q)]).toBeDefined()
  })
})

describe('shuffle', () => {
  it('giữ nguyên phần tử, không mutate', () => {
    const a = [1, 2, 3, 4, 5]
    const b = shuffle(a, seeded())
    expect(a).toEqual([1, 2, 3, 4, 5])
    expect([...b].sort()).toEqual([1, 2, 3, 4, 5])
  })
})

describe('pickQuestions', () => {
  it('lấy đúng số câu, không lặp', () => {
    const qs = pickQuestions(content.questions, { count: 5, rng: seeded() })
    expect(qs).toHaveLength(5)
    expect(new Set(qs.map((q) => q.id)).size).toBe(5)
  })
  it('lọc theo tag', () => {
    const qs = pickQuestions(content.questions, { tags: ['valves'], rng: seeded() })
    expect(qs.length).toBeGreaterThan(0)
    for (const q of qs) expect(q.tags).toContain('valves')
  })
  it('không vượt quá số câu có sẵn', () => {
    expect(pickQuestions(content.questions, { count: 999 })).toHaveLength(content.questions.length)
  })
})

describe('phiên quiz', () => {
  const pool: Question[] = [
    { id: 'a', type: 'click', prompt: 'A', answerStructureId: 'mitral_valve', difficulty: 1, tags: [] },
    { id: 'b', type: 'click', prompt: 'B', answerStructureId: 'aorta', difficulty: 1, tags: [] },
  ]

  it('chấm đúng/sai và kết thúc khi hết câu', () => {
    let s = startSession(pool, { count: 2, rng: seeded() }, 1000)
    const first = s.questions[0]
    s = answer(s, correctIdOf(first), 1500)!
    expect(s.answers[0].correct).toBe(true)
    expect(s.answers[0].timeMs).toBe(500)
    expect(s.finishedAt).toBeUndefined()
    s = answer(s, 'wrong_id', 2500)!
    expect(s.answers[1].correct).toBe(false)
    expect(s.answers[1].timeMs).toBe(1000)
    expect(s.finishedAt).toBe(2500)
    expect(score(s)).toEqual({ correct: 1, total: 2, percent: 50, durationMs: 1500 })
    expect(wrongAnswers(s)).toHaveLength(1)
    expect(answer(s, 'x')).toBeNull()
  })

  it('ném lỗi khi không có câu hỏi', () => {
    expect(() => startSession([], {})).toThrow()
  })
})

describe('nameOptions', () => {
  it('trả về 4 lựa chọn gồm đáp án đúng', () => {
    const q = content.questions.find((q) => q.type === 'name')!
    if (q.type !== 'name') return
    const opts = nameOptions(q, structuresById, seeded())
    expect(opts).toHaveLength(4)
    expect(opts.map((o) => o.id)).toContain(q.targetStructureId)
  })
})
