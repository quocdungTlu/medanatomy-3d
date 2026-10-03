/** Tiến độ học: tập cấu trúc đã mở bảng thông tin, lưu localStorage. */
const KEY = 'medanatomy.viewed.v1'
const listeners = new Set<() => void>()

export function readViewed(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]') as string[]) } catch { return new Set() }
}
export function markViewed(id: string) {
  const s = readViewed()
  if (s.has(id)) return
  s.add(id)
  try { localStorage.setItem(KEY, JSON.stringify([...s])) } catch { /* ignore */ }
  listeners.forEach((l) => l())
}
export function subscribeViewed(l: () => void) {
  listeners.add(l)
  return () => { listeners.delete(l) }
}
