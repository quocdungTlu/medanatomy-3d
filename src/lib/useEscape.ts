import { useEffect } from 'react'

/** Gọi onClose khi bấm Esc. Dùng cho mọi hộp thoại. */
export function useEscape(onClose: () => void) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])
}
