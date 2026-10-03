import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** null khi chưa cấu hình: app vẫn chạy, chỉ không đăng nhập / lưu điểm được. */
export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null

export interface QuizSessionRow {
  system: string
  score: number
  total: number
  duration_s: number
  answers: unknown
}

export async function saveQuizSession(row: QuizSessionRow): Promise<void> {
  if (!supabase) return
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return
  await supabase.from('quiz_sessions').insert({ ...row, user_id: auth.user.id })
}

export async function reportContent(structureId: string, message: string): Promise<boolean> {
  if (!supabase) return false
  const { data: auth } = await supabase.auth.getUser()
  const { error } = await supabase
    .from('content_reports')
    .insert({ structure_id: structureId, message, user_id: auth.user?.id ?? null })
  return !error
}

/** Lịch sử quiz của người dùng đã đăng nhập, mới nhất trước. Rỗng nếu chưa đăng nhập hoặc chưa cấu hình. */
export async function fetchRemoteHistory(limit = 5): Promise<{ at: string; system: string; tags: string[]; correct: number; total: number; durationMs: number }[]> {
  if (!supabase) return []
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return []
  const { data } = await supabase
    .from('quiz_sessions')
    .select('created_at, system, score, total, duration_s, answers')
    .order('created_at', { ascending: false })
    .limit(limit)
  return (data ?? []).map((r) => ({ at: r.created_at, system: r.system, tags: [], correct: r.score, total: r.total, durationMs: r.duration_s * 1000 }))
}
