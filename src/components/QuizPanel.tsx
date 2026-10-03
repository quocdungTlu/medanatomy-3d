import { useEffect, useMemo, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { content, structuresById } from '../content'
import { currentQuestion, nameOptions, score, wrongAnswers } from '../quiz/engine'
import { saveQuizSession } from '../lib/supabase'
import { appendHistory } from '../lib/localHistory'
import { renderResultImage, shareOrDownload } from '../lib/shareImage'
import { track } from '../lib/analytics'
import type { NameQuestion } from '../content/schema'

/** Panel quiz: câu hỏi, tiến độ, phản hồi đúng/sai, màn kết quả. */
export function QuizPanel() {
  const quiz = useAppStore((s) => s.quiz)
  const lastAnswer = useAppStore((s) => s.lastAnswer)
  const { exitQuiz, answerQuiz, startQuiz } = useAppStore.getState()
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!quiz || quiz.finishedAt) return
    const t = setInterval(() => setElapsed(Date.now() - quiz.startedAt), 500)
    return () => clearInterval(t)
  }, [quiz])

  // Lưu điểm khi xong (nếu đã đăng nhập và cấu hình Supabase)
  useEffect(() => {
    if (!quiz?.finishedAt) return
    const sc = score(quiz)
    appendHistory({ at: new Date(quiz.finishedAt).toISOString(), system: content.system, tags: quiz.tags ?? [], correct: sc.correct, total: sc.total, durationMs: sc.durationMs })
    void saveQuizSession({
      system: content.system,
      score: sc.correct,
      total: sc.total,
      duration_s: Math.round(sc.durationMs / 1000),
      answers: quiz.answers,
    })
  }, [quiz])

  if (!quiz) return null

  if (quiz.finishedAt) {
    const sc = score(quiz)
    const wrong = wrongAnswers(quiz)
    return (
      <aside className="absolute inset-x-0 bottom-0 z-30 max-h-[75%] overflow-y-auto rounded-t-2xl border-t border-line bg-panel/95 p-4 backdrop-blur safe-bottom sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-96 sm:rounded-none">
        <h2 className="text-lg font-semibold">Kết quả</h2>
        <p className="mt-1 text-3xl font-bold text-sky-300">
          {sc.correct}/{sc.total} <span className="text-base font-normal text-slate-400">· {sc.percent}%</span>
        </p>
        <p className="text-sm text-slate-400">Thời gian: {fmt(sc.durationMs)}</p>
        {wrong.length > 0 && (
          <section className="mt-4">
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Câu sai ({wrong.length})</h3>
            <ul className="space-y-1">
              {wrong.map((a) => (
                <li key={a.questionId} className="flex items-center justify-between rounded-lg bg-ink/60 px-3 py-2 text-sm">
                  <span>
                    <span className="text-slate-400">Đúng: </span>
                    {structuresById[a.correctId]?.nameVi}
                    <span className="block text-xs text-rose-400">Bạn chọn: {structuresById[a.chosenId]?.nameVi ?? '—'}</span>
                  </span>
                  <button
                    className="btn-ghost min-h-9 px-2 text-xs"
                    onClick={() => {
                      exitQuiz()
                      useAppStore.getState().select(a.correctId)
                    }}
                  >
                    Xem 3D
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
        <div className="mt-4 flex gap-2">
          <button className="btn-primary" onClick={() => startQuiz({ count: quiz.questions.length, tags: quiz.tags })}>
            Làm lại
          </button>
          <button
            className="btn-ghost"
            onClick={async () => {
              const blob = await renderResultImage(quiz, content.systemNameVi, location.origin)
              const how = await shareOrDownload(blob, `Mình được ${sc.correct}/${sc.total} thi chạy trạm ${content.systemNameVi} trên MedAnatomy 3D`)
              track('share_result', { how, correct: sc.correct, total: sc.total })
            }}
          >
            Chia sẻ
          </button>
          <button className="btn-ghost" onClick={exitQuiz}>
            Về
          </button>
        </div>
      </aside>
    )
  }

  const q = currentQuestion(quiz)
  if (!q) return null

  return (
    <aside className="absolute inset-x-0 bottom-0 z-30 rounded-t-2xl border-t border-line bg-panel/95 p-4 backdrop-blur safe-bottom sm:inset-x-auto sm:left-1/2 sm:bottom-6 sm:w-[28rem] sm:-translate-x-1/2 sm:rounded-2xl sm:border">
      <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
        <span>
          Câu {quiz.index + 1}/{quiz.questions.length}
        </span>
        <span>{fmt(elapsed)}</span>
        <button className="min-h-9 px-2 text-slate-400 hover:text-slate-200" onClick={exitQuiz}>
          Thoát
        </button>
      </div>
      <div className="mb-2 h-1 overflow-hidden rounded bg-slate-700">
        <div className="h-full bg-sky-400 transition-[width]" style={{ width: `${(quiz.index / quiz.questions.length) * 100}%` }} />
      </div>

      {lastAnswer ? (
        <p className={`py-3 text-center text-lg font-semibold ${lastAnswer.correct ? 'text-emerald-400' : 'text-rose-400'}`}>
          {lastAnswer.correct ? 'Chính xác!' : `Sai. Đáp án: ${structuresById[lastAnswer.correctId]?.nameVi}`}
        </p>
      ) : q.type === 'click' ? (
        <p className="py-3 text-center text-lg font-semibold">{q.prompt}</p>
      ) : (
        <NameChoices key={q.id} question={q} onPick={answerQuiz} />
      )}
    </aside>
  )
}

function NameChoices({ question, onPick }: { question: NameQuestion; onPick: (id: string) => void }) {
  const options = useMemo(() => nameOptions(question, structuresById), [question])
  return (
    <div>
      <p className="mb-3 text-center text-base font-semibold">Cấu trúc được tô sáng là gì?</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {options.map((o) => (
          <button key={o.id} className="btn-ghost justify-start text-left" onClick={() => onPick(o.id)}>
            {o.nameVi}
          </button>
        ))}
      </div>
    </div>
  )
}

function fmt(ms: number) {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
