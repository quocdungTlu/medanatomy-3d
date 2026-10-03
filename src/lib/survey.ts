import { supabase } from './supabase'
import { track } from './analytics'

const DONE_KEY = 'medanatomy.survey.price.v1'

export function surveyDone(): boolean {
  try { return localStorage.getItem(DONE_KEY) === '1' } catch { return true }
}

/** Gửi câu trả lời khảo sát: PostHog luôn nhận; Supabase nhận nếu cấu hình (cho phép ẩn danh). */
export async function submitSurvey(answers: Record<string, string>) {
  try { localStorage.setItem(DONE_KEY, '1') } catch { /* ignore */ }
  track('survey_submit', answers)
  if (!supabase) return
  const { data } = await supabase.auth.getUser()
  const rows = Object.entries(answers).map(([question_key, answer]) => ({ question_key, answer, user_id: data.user?.id ?? null }))
  await supabase.from('survey_responses').insert(rows)
}
