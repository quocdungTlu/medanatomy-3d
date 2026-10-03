import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
const OUT = process.env.OUT ?? 'e2e/out'; mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] })
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
await ctx.addInitScript(() => localStorage.setItem('medanatomy.onboarded.v1', '1'))
const page = await ctx.newPage()
const errs = []; page.on('pageerror', (e) => errs.push(e.message))
await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' }); await page.waitForTimeout(5000)
// Quiz 5 câu chỉ nhóm "Van tim" (câu dạng name có nút để bấm; câu click thì chạm giữa màn hình)
await page.getByRole('button', { name: /Bắt đầu kiểm tra/ }).click()
await page.getByRole('button', { name: '5', exact: true }).click()
await page.getByRole('button', { name: 'Bắt đầu', exact: true }).click()
for (let i = 0; i < 5; i++) {
  await page.waitForTimeout(400)
  const opts = page.locator('aside button.btn-ghost')
  if (await opts.count() >= 4) await opts.first().click()
  else await page.touchscreen.tap(195, 300)
  await page.waitForTimeout(1500)
}
await page.waitForTimeout(500)
await page.screenshot({ path: `${OUT}/mobile-6-result.png` })
console.log('result text:', (await page.locator('aside').last().innerText()).replace(/\n+/g, ' | ').slice(0, 200))
const dl = page.waitForEvent('download', { timeout: 8000 }).catch(() => null)
await page.getByRole('button', { name: 'Chia sẻ' }).click()
const d = await dl
if (d) { await d.saveAs(`${OUT}/share.png`); console.log('download ok') } else console.log('no download (share API?)')
console.log('errors:', errs)
await browser.close()
