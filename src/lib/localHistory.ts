/** Lịch sử Quiz lưu cục bộ (localStorage) để không bắt buộc đăng nhập ở MVP. */
export interface LocalQuizRecord {
  at: string
  system: string
  tags: string[]
  correct: number
  total: number
  durationMs: number
}

const KEY = 'medanatomy.quizHistory.v1'
const MAX = 50

export function readHistory(): LocalQuizRecord[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as LocalQuizRecord[]) : []
  } catch {
    return []
  }
}

export function appendHistory(r: LocalQuizRecord) {
  try {
    const list = [r, ...readHistory()].slice(0, MAX)
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    /* private mode hoặc hết dung lượng: bỏ qua */
  }
}

export function bestScore(system: string): LocalQuizRecord | null {
  const list = readHistory().filter((r) => r.system === system)
  if (!list.length) return null
  return list.reduce((a, b) => (b.correct / b.total > a.correct / a.total ? b : a))
}

const ONBOARD_KEY = 'medanatomy.onboarded.v1'
export function hasOnboarded(): boolean {
  try { return localStorage.getItem(ONBOARD_KEY) === '1' } catch { return true }
}
export function setOnboarded() {
  try { localStorage.setItem(ONBOARD_KEY, '1') } catch { /* ignore */ }
}
