import type { QuizSession } from '../quiz/engine'
import { score } from '../quiz/engine'

/** Vẽ ảnh kết quả 1080×1350 (tỷ lệ 4:5 cho Facebook/Instagram) bằng canvas, trả về Blob PNG. */
export async function renderResultImage(quiz: QuizSession, systemName: string, appUrl: string): Promise<Blob> {
  const W = 1080, H = 1350
  const c = document.createElement('canvas')
  c.width = W; c.height = H
  const ctx = c.getContext('2d')!
  const sc = score(quiz)

  const g = ctx.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0, '#0f172a'); g.addColorStop(1, '#1e1b4b')
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)

  // Hình tim đơn giản (không phải logo bên thứ ba)
  ctx.fillStyle = '#dc4848'
  ctx.beginPath()
  const cx = W / 2, cy = 420, k = 11
  for (let i = 0; i <= 200; i++) {
    const t = (i / 200) * Math.PI * 2
    const x = 16 * Math.sin(t) ** 3
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)
    ctx.lineTo(cx + x * k, cy - y * k)
  }
  ctx.closePath(); ctx.fill()

  ctx.textAlign = 'center'
  ctx.fillStyle = '#e2e8f0'
  ctx.font = '600 44px system-ui, -apple-system, Segoe UI, Roboto, sans-serif'
  ctx.fillText('MedAnatomy 3D', W / 2, 140)
  ctx.fillStyle = '#94a3b8'; ctx.font = '400 34px system-ui, sans-serif'
  ctx.fillText(`Thi chạy trạm · ${systemName}`, W / 2, 195)

  ctx.fillStyle = '#38bdf8'; ctx.font = '800 220px system-ui, sans-serif'
  ctx.fillText(`${sc.correct}/${sc.total}`, W / 2, 820)
  ctx.fillStyle = '#e2e8f0'; ctx.font = '500 52px system-ui, sans-serif'
  ctx.fillText(`${sc.percent}% · ${Math.floor(sc.durationMs / 60000)}:${String(Math.floor(sc.durationMs / 1000) % 60).padStart(2, '0')}`, W / 2, 910)

  ctx.fillStyle = '#94a3b8'; ctx.font = '400 36px system-ui, sans-serif'
  ctx.fillText(sc.percent >= 80 ? 'Chuẩn giải phẫu rồi đó!' : sc.percent >= 50 ? 'Ổn, ôn thêm chút nữa.' : 'Mở app xem lại 3D nhé.', W / 2, 1010)

  ctx.fillStyle = '#1e293b'; roundRect(ctx, 140, 1140, W - 280, 90, 24); ctx.fill()
  ctx.fillStyle = '#e2e8f0'; ctx.font = '500 36px system-ui, sans-serif'
  ctx.fillText(appUrl.replace(/^https?:\/\//, ''), W / 2, 1198)

  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('toBlob'))), 'image/png'))
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath()
}

/** Web Share API nếu có (mobile), không thì tải file về. */
export async function shareOrDownload(blob: Blob, text: string) {
  const file = new File([blob], 'medanatomy-ket-qua.png', { type: 'image/png' })
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try { await nav.share({ files: [file], text }); return 'shared' } catch { /* người dùng hủy */ }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = file.name; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
  return 'downloaded'
}
