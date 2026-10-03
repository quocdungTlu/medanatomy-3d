import { create } from 'zustand'
import type { QuizSession } from '../quiz/engine'
import { answer as quizAnswer, startSession, type QuizOptions } from '../quiz/engine'
import { content } from '../content'
import { track } from '../lib/analytics'

export type Mode = 'explore' | 'quiz'

interface AppState {
  mode: Mode
  hoveredId: string | null
  selectedId: string | null
  /** Nhóm bị ẩn */
  hiddenGroups: Set<string>
  /** Chỉ hiển thị một cấu trúc */
  isolatedId: string | null
  /** Làm mờ các lớp ngoài để nhìn vào trong */
  xray: boolean
  /** Lớp cao nhất đang hiển thị rõ (xray): cấu trúc có layer < ngưỡng sẽ mờ */
  xrayLayer: number
  listOpen: boolean
  infoOpen: boolean
  quiz: QuizSession | null
  /** Phản hồi câu vừa trả lời để hiện UI 1–2 giây */
  lastAnswer: { correct: boolean; correctId: string; chosenId: string } | null
  /** Tăng để báo CameraRig reset về vị trí ban đầu */
  resetViewNonce: number
  /** WebGL context bị mất (thiết bị yếu, khóa màn hình) */
  contextLost: boolean

  setHovered: (id: string | null) => void
  select: (id: string | null) => void
  toggleGroup: (groupId: string) => void
  isolate: (id: string | null) => void
  toggleXray: () => void
  setXrayLayer: (layer: number) => void
  setListOpen: (open: boolean) => void
  setInfoOpen: (open: boolean) => void
  resetView: () => void
  showAll: () => void
  setContextLost: (lost: boolean) => void

  startQuiz: (opts?: QuizOptions) => void
  answerQuiz: (chosenId: string) => void
  exitQuiz: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  mode: 'explore',
  hoveredId: null,
  selectedId: null,
  hiddenGroups: new Set(),
  isolatedId: null,
  xray: false,
  xrayLayer: 2,
  listOpen: false,
  infoOpen: false,
  quiz: null,
  lastAnswer: null,
  resetViewNonce: 0,
  contextLost: false,

  setHovered: (id) => set({ hoveredId: id }),

  select: (id) => {
    const { mode, quiz, lastAnswer } = get()
    if (mode === 'quiz') {
      // Trong quiz, click vào cấu trúc = trả lời câu dạng "click"; câu dạng "name" chọn bằng nút
      const q = quiz?.questions[quiz.index]
      if (id && q?.type === 'click' && !lastAnswer) get().answerQuiz(id)
      return
    }
    set({ selectedId: id, infoOpen: Boolean(id) })
    if (id) track('select_structure', { id })
  },

  toggleGroup: (groupId) =>
    set((s) => {
      const next = new Set(s.hiddenGroups)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      track('toggle_group', { group: groupId, hidden: next.has(groupId) })
      return { hiddenGroups: next }
    }),

  isolate: (id) => set({ isolatedId: id }),
  toggleXray: () => set((s) => ({ xray: !s.xray })),
  setXrayLayer: (layer) => set({ xrayLayer: layer }),
  setListOpen: (open) => set({ listOpen: open }),
  setInfoOpen: (open) => set({ infoOpen: open }),
  resetView: () => set((s) => ({ selectedId: null, infoOpen: false, resetViewNonce: s.resetViewNonce + 1 })),
  showAll: () => set({ hiddenGroups: new Set(), isolatedId: null, xray: false }),
  setContextLost: (lost) => set({ contextLost: lost }),

  startQuiz: (opts) => {
    const quiz = startSession(content.questions, opts)
    track('quiz_start', { count: quiz.questions.length, tags: opts?.tags })
    set({ mode: 'quiz', quiz, selectedId: null, infoOpen: false, listOpen: false, lastAnswer: null, isolatedId: null })
  },

  answerQuiz: (chosenId) => {
    const { quiz, lastAnswer } = get()
    if (!quiz || quiz.finishedAt || lastAnswer) return
    const next = quizAnswer(quiz, chosenId)
    if (!next) return
    const last = next.answers[next.answers.length - 1]
    track('quiz_answer', { questionId: last.questionId, correct: last.correct, timeMs: last.timeMs })
    set({ quiz: next, lastAnswer: { correct: last.correct, correctId: last.correctId, chosenId: last.chosenId } })
    if (next.finishedAt) {
      const correct = next.answers.filter((a) => a.correct).length
      track('quiz_finish', { correct, total: next.questions.length, durationMs: next.finishedAt - next.startedAt })
    }
    // Xóa phản hồi sau 1.2 giây để sang câu tiếp theo
    window.setTimeout(() => {
      if (get().quiz === next) set({ lastAnswer: null })
    }, 1200)
  },

  exitQuiz: () => set({ mode: 'explore', quiz: null, lastAnswer: null }),
}))
