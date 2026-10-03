import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { identify, track } from '../lib/analytics'

/** Nút đăng nhập/đăng xuất; chỉ hiện khi đã cấu hình Supabase. */
export function AuthButton() {
  const [user, setUser] = useState<User | null>(null)
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
      if (session?.user) identify(session.user.id)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  if (!supabase) return null

  if (user) {
    return (
      <button className="btn-ghost max-w-40 truncate text-xs" onClick={() => supabase!.auth.signOut()} title={user.email ?? ''}>
        {user.email?.split('@')[0] ?? 'Tài khoản'} · Thoát
      </button>
    )
  }

  return (
    <>
      <button className="btn-ghost text-xs" onClick={() => setOpen(true)}>Đăng nhập</button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center" onClick={() => setOpen(false)} role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-2xl border border-line bg-panel p-5" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-1 text-lg font-semibold">Đăng nhập để lưu điểm</h2>
            <p className="mb-4 text-sm text-slate-400">Không bắt buộc. Điểm vẫn lưu trên máy này khi chưa đăng nhập.</p>
            <button
              className="btn-ghost mb-3 w-full"
              onClick={() => { track('login_start', { provider: 'google' }); supabase!.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin } }) }}
            >
              Tiếp tục với Google
            </button>
            {sent ? (
              <p className="text-sm text-emerald-400">Đã gửi link đăng nhập tới {email}. Kiểm tra hộp thư nhé.</p>
            ) : (
              <form
                className="flex gap-2"
                onSubmit={async (e) => {
                  e.preventDefault()
                  track('login_start', { provider: 'email' })
                  const { error } = await supabase!.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin } })
                  if (!error) setSent(true)
                }}
              >
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@truong.edu.vn"
                  className="min-h-11 flex-1 rounded-xl border border-line bg-ink px-3 text-sm outline-none focus:border-sky-400" />
                <button type="submit" className="btn-primary">Gửi link</button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
