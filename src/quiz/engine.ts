import type { Question, Structure } from '../content/schema'

export interface QuizAnswer {
  questionId: string
  /** id cấu trúc người dùng chọn (click) hoặc id đáp án chọn (name) */
  chosenId: string
  correctId: string
  correct: boolean
  timeMs: number
}

export interface QuizSession {
  questions: Question[]
  /** Chủ đề đã lọc, để "Làm lại" cùng chủ đề và lưu lịch sử */
  tags?: string[]
  index: number
  answers: QuizAnswer[]
  startedAt: number
  finishedAt?: number
}

export interface QuizOptions {
  count?: number
  tags?: string[]
  /** Hàm random có thể thay để test ổn định */
  rng?: () => number
}

/** Fisher–Yates, không mutate mảng gốc */
export function shuffle<T>(arr: T[], rng: () => number = Math.random): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** Chọn câu hỏi: lọc theo tag, trộn, lấy `count` câu, không lặp. */
export function pickQuestions(pool: Question[], opts: QuizOptions = {}): Question[] {
  const { count = 10, tags, rng = Math.random } = opts
  const filtered = tags?.length ? pool.filter((q) => q.tags.some((t) => tags.includes(t))) : pool
  return shuffle(filtered, rng).slice(0, Math.min(count, filtered.length))
}

export function startSession(pool: Question[], opts: QuizOptions = {}, now = Date.now()): QuizSession {
  const questions = pickQuestions(pool, opts)
  if (questions.length === 0) throw new Error('Không có câu hỏi phù hợp')
  return { questions, tags: opts.tags, index: 0, answers: [], startedAt: now }
}

export function currentQuestion(s: QuizSession): Question | undefined {
  return s.questions[s.index]
}

export function correctIdOf(q: Question): string {
  return q.type === 'click' ? q.answerStructureId : q.targetStructureId
}

/** Các lựa chọn cho câu dạng `name`, đã trộn. */
export function nameOptions(
  q: Extract<Question, { type: 'name' }>,
  byId: Record<string, Structure>,
  rng: () => number = Math.random,
): Structure[] {
  const ids = [q.targetStructureId, ...q.distractorIds]
  return shuffle(ids, rng).map((id) => byId[id]).filter(Boolean)
}

/** Ghi nhận đáp án, trả về session mới (immutable). Trả về null nếu đã trả lời hết. */
export function answer(s: QuizSession, chosenId: string, now = Date.now()): QuizSession | null {
  const q = currentQuestion(s)
  if (!q || s.finishedAt) return null
  const correctId = correctIdOf(q)
  const prevTime = s.answers.length ? s.startedAt + s.answers.reduce((a, b) => a + b.timeMs, 0) : s.startedAt
  const entry: QuizAnswer = {
    questionId: q.id,
    chosenId,
    correctId,
    correct: chosenId === correctId,
    timeMs: Math.max(0, now - prevTime),
  }
  const answers = [...s.answers, entry]
  const index = s.index + 1
  const finished = index >= s.questions.length
  return { ...s, answers, index, finishedAt: finished ? now : undefined }
}

export function score(s: QuizSession): { correct: number; total: number; percent: number; durationMs: number } {
  const correct = s.answers.filter((a) => a.correct).length
  const total = s.questions.length
  const end = s.finishedAt ?? Date.now()
  return { correct, total, percent: total ? Math.round((correct / total) * 100) : 0, durationMs: end - s.startedAt }
}

export function wrongAnswers(s: QuizSession): QuizAnswer[] {
  return s.answers.filter((a) => !a.correct)
}
