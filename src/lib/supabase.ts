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
